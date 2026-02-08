# React Native App Performance Research: JS Threading Load Optimization

**Date:** February 8, 2026  
**Issue:** Large trips cause noticeable UI lag when buttons are pressed and functions are called

---

## Executive Summary

This document analyzes performance bottlenecks in the TravelCostApp React Native application, specifically focusing on JS threading load issues that become apparent with large trips. The research identifies critical areas where excessive computation blocks the JavaScript thread, causing UI delays and poor user experience.

### Key Findings

1. **Context Provider Re-renders** - Unmemoized context values cause cascading re-renders
2. **Heavy Synchronous Calculations** - Repeated filtering/mapping operations on large datasets
3. **Missing Performance Optimizations** - Inconsistent use of React.memo, useMemo, useCallback
4. **List Rendering Performance** - While optimized for 150+ items, still issues with large datasets
5. **Currency Calculations** - Repeated conversion calculations on every render

---

## Current Architecture Analysis

### Storage Layer ✅ (Already Optimized)
- **MMKV** for fast synchronous storage - Good choice
- Replaces AsyncStorage for better performance
- No changes needed here

### Data Flow Issues ❌

#### 1. Context Providers (Critical Issue)

**Problem**: Context value objects are recreated on every render

```typescript
// trip-context.tsx (Line 473-508)
const value = {
  tripid: tripid,
  tripName: tripName,
  // ... 30+ properties
  isDynamicDailyBudget: isDynamicDailyBudget,
};
return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
```

**Impact**: Every consumer re-renders on any state change, even if their specific dependencies haven't changed.

**Solution**: Wrap value object in `useMemo` with proper dependencies

---

#### 2. Expenses Context (Moderate Issue)

**Current State**: Uses `useReducer` (good) but exposes unfiltered + filtered expenses

```typescript
// expenses-context.tsx (Line 507-509)
const filteredExpenses = expensesState.filter(
  (expense) => !expense.isDeleted
);
```

**Issue**: Filtering happens on every render, even when expenses haven't changed

---

### Component-Level Issues

#### 3. ExpensesSummary Component (High Impact)

**Location**: `components/ExpensesOutput/ExpensesSummary.tsx`

**Problems**:
- Recalculates everything on every render (lines 78-144)
- Calls `getTravellerSum` for every traveller without memoization (line 138-144)
- Multiple currency conversions per render
- Period budget calculations repeated

**Code Example**:
```typescript
// Line 138-144 - Runs on EVERY render
const travellerSplitExpenseSums = travellerNames.map((travellerName) => {
  return getTravellerSum(
    periodExpenses,
    travellerName || "",
    periodName === "total",
  );
});
```

**Impact**: With 5 travellers and 500 expenses, this runs 2500+ filter operations per render

---

#### 4. ExpensesList Component (High Impact)

**Location**: `components/ExpensesOutput/ExpensesList.tsx`

**Current Optimizations**:
- ✅ Already has `MAX_EXPENSES_RENDER = 150` check (line 353)
- ✅ Switches to cheap rendering for large lists
- ✅ Uses `getItemLayout` for FlatList optimization

**Remaining Issues**:
- Heavy callbacks not properly memoized (lines 321-478)
- Swipeable components on every item add overhead
- Shadow items added unnecessarily (line 105)

---

#### 5. RecentExpenses Screen (Moderate Impact)

**Location**: `screens/RecentExpenses.tsx`

**Issues**:
- `getRecentExpenses` wrapped in useMemo (good) but recalculates on `today` change (line 286-291)
- Causes daily recalculation even when expenses unchanged
- Polling interval set to 5000ms (5 seconds) - constant background work

---

### Calculation Bottlenecks

#### 6. Expense Utilities (Critical)

**Location**: `util/expense.ts`

**Heavy Operations** (from grep results):
- Multiple `filter()` operations on large arrays
- `reduce()` for sum calculations
- Range expense deduplication logic
- Split calculations with exchange rates

**Issue**: These are called repeatedly across components without caching

---

## Performance Recommendations

### Priority 1: Critical (Immediate Impact) 🔴

#### 1.1 Memoize Context Values

**Files to Modify**:
- `store/trip-context.tsx`
- `store/expenses-context.tsx`

**Implementation**:
```typescript
// trip-context.tsx
const value = useMemo(() => ({
  tripid,
  tripName,
  totalBudget,
  dailyBudget,
  // ... all other values
  isDynamicDailyBudget,
}), [
  tripid,
  tripName,
  totalBudget,
  dailyBudget,
  // ... minimal dependency array
]);
```

**Expected Impact**: 40-60% reduction in re-renders across the app

---

#### 1.2 Memoize Heavy Calculations in ExpensesSummary

**File**: `components/ExpensesOutput/ExpensesSummary.tsx`

**Changes**:
```typescript
// Memoize traveller sums calculation
const travellerSplitExpenseSums = useMemo(() => 
  travellerNames.map((travellerName) => 
    getTravellerSum(periodExpenses, travellerName || "", periodName === "total")
  ),
  [periodExpenses, travellerNames, periodName]
);

// Memoize budget calculations
const budgetCalculations = useMemo(() => ({
  budgetProgress,
  budgetColor,
  leftToSpend: budgetNumber - expenseSumNum,
  // ... other calculations
}), [budgetNumber, expenseSumNum, periodName, expensesSum]);
```

**Expected Impact**: 50-70% reduction in CPU time for this component

---

#### 1.3 Move Expense Filtering to useMemo

**File**: `store/expenses-context.tsx`

```typescript
// Instead of filtering on every render
const filteredExpenses = useMemo(
  () => expensesState.filter((expense) => !expense.isDeleted),
  [expensesState]
);
```

**Expected Impact**: Eliminates repeated O(n) filtering operations

---

### Priority 2: High Impact ⚠️

#### 2.1 Implement Computation Worker/Web Worker

For extremely heavy calculations, offload to a separate thread:

**Use Cases**:
- Split calculations for 100+ expenses
- Currency conversion for large datasets
- Statistical calculations for charts

**Implementation Strategy**:
```typescript
// util/computeWorker.ts
import { WorkerThread } from 'react-native-threads';

export async function calculateExpenseSumsAsync(expenses: ExpenseData[]) {
  // Offload to worker thread
  return new Promise((resolve) => {
    const worker = new WorkerThread('workers/expenseCalculations.js');
    worker.postMessage({ expenses });
    worker.onmessage = (result) => {
      resolve(result);
      worker.terminate();
    };
  });
}
```

**Note**: React Native doesn't have native Web Workers, but can use:
- `react-native-threads` (deprecated but functional)
- `react-native-worker` 
- JSI-based solutions (requires native code)

**Alternative**: Use InteractionManager for deferring heavy calculations

---

#### 2.2 Implement Virtual Scrolling with Better Windowing

**File**: `components/ExpensesOutput/ExpensesList.tsx`

**Current**: Already uses FlatList with `windowSize={8}`

**Improvements**:
```typescript
// Reduce window size for large lists
const windowSize = expenses.length > 300 ? 5 : 8;

// Add removeClippedSubviews for Android
<Animated.FlatList
  windowSize={windowSize}
  removeClippedSubviews={true} // Android optimization
  maxToRenderPerBatch={10}
  updateCellsBatchingPeriod={50}
  initialNumToRender={20}
  // ... other props
/>
```

---

#### 2.3 Implement Expense Data Pagination/Chunking

Instead of loading all expenses at once:

**Strategy**:
```typescript
// Add to expenses-context
const [expensePage, setExpensePage] = useState(1);
const EXPENSES_PER_PAGE = 100;

const paginatedExpenses = useMemo(() => {
  return expenses.slice(0, expensePage * EXPENSES_PER_PAGE);
}, [expenses, expensePage]);

// Load more on scroll
const loadMoreExpenses = useCallback(() => {
  if (paginatedExpenses.length < expenses.length) {
    setExpensePage(prev => prev + 1);
  }
}, [expenses.length, paginatedExpenses.length]);
```

---

#### 2.4 Debounce Period Changes

**File**: `screens/RecentExpenses.tsx`

Prevent rapid recalculations when switching periods:

```typescript
import { useDebounce } from '../components/Hooks/useDebounce';

// Debounce period changes
const debouncedPeriod = useDebounce(PeriodValue, 150);

const getRecentExpenses = useMemo(
  () => expensesCtx.getRecentExpenses(debouncedPeriod),
  [expensesCtx.expenses?.length, debouncedPeriod, today]
);
```

---

### Priority 3: Optimization (Refinement) 💡

#### 3.1 Optimize Date Comparisons

**Issue**: Date filtering uses string comparison and creates new Date objects

**Optimization**:
```typescript
// Store timestamps instead of Date objects where possible
interface ExpenseData {
  dateTimestamp: number; // Add this
  date: DateOrDateTime; // Keep for compatibility
  // ...
}

// Faster filtering
expenses.filter(expense => 
  expense.dateTimestamp >= startTimestamp && 
  expense.dateTimestamp <= endTimestamp
);
```

---

#### 3.2 Implement Calculation Caching

Create a calculation cache utility:

```typescript
// util/calculationCache.ts
const cache = new Map<string, { value: any; timestamp: number }>();
const CACHE_TTL = 5000; // 5 seconds

export function getCached<T>(key: string, calculate: () => T): T {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.value;
  }
  
  const value = calculate();
  cache.set(key, { value, timestamp: Date.now() });
  return value;
}

// Usage in components
const expensesSum = getCached(
  `sum-${periodName}-${expenses.length}`,
  () => getExpensesSumPeriod(expenses, hideSpecial)
);
```

---

#### 3.3 Reduce Polling Frequency for Large Datasets

**File**: `confAppConstants.ts`

**Current**: `DEBUG_POLLING_INTERVAL = 5000` (5 seconds)

**Dynamic Adjustment**:
```typescript
// In RecentExpenses
const pollingInterval = useMemo(() => {
  if (expenses.length > 300) return 15000; // 15 seconds
  if (expenses.length > 150) return 10000; // 10 seconds
  return 5000; // 5 seconds
}, [expenses.length]);

useInterval(() => {
  // ... polling logic
}, pollingInterval, true);
```

---

#### 3.4 Optimize Chart Rendering

**File**: `components/charts/WebViewChart.tsx`

**Issues**:
- WebView overhead for large datasets
- Full re-render on data change

**Optimizations**:
1. Aggregate data points for large datasets (e.g., show weekly instead of daily for 365+ days)
2. Implement chart data downsampling
3. Use React.memo with proper comparison function

```typescript
const ChartDataMemo = React.memo(
  WebViewChart,
  (prev, next) => {
    // Custom comparison - only re-render if data actually changed
    return JSON.stringify(prev.data) === JSON.stringify(next.data);
  }
);
```

---

### Priority 4: Architectural Improvements (Long-term) 🏗️

#### 4.1 Consider State Management Library

For very large apps, consider:
- **Zustand** - Lightweight, fast, hooks-based
- **Jotai** - Atomic state management
- **Redux Toolkit** - If you need time-travel debugging

**Benefits**:
- Better render optimization out of the box
- Easier to prevent unnecessary re-renders
- More predictable state updates

---

#### 4.2 Implement Data Normalization

Normalize expense data to avoid repeated calculations:

```typescript
// Instead of flat array
expenses: ExpenseData[]

// Use normalized structure
interface NormalizedExpenses {
  byId: Record<string, ExpenseData>;
  allIds: string[];
  byTraveller: Record<string, string[]>; // Pre-computed indices
  byPeriod: {
    day: string[];
    week: string[];
    month: string[];
    // ...
  };
  metadata: {
    totalSum: number;
    lastUpdated: number;
  };
}
```

---

#### 4.3 Implement Smart Rehydration

Don't recalculate on every app start:

```typescript
// Store pre-computed values in MMKV
const CACHED_CALCULATIONS = {
  expenseSums: { /* by period */ },
  travellerSums: { /* by traveller */ },
  lastCalculated: Date.now(),
};

// On app start, check if calculations are fresh
if (Date.now() - CACHED_CALCULATIONS.lastCalculated < CACHE_VALIDITY) {
  // Use cached values
} else {
  // Recalculate in background using InteractionManager
}
```

---

#### 4.4 Lazy Load Non-Critical Data

Defer loading of:
- Trip history (load on Profile screen navigation)
- Historical chart data (load when chart tab is focused)
- Category statistics (calculate on demand)

```typescript
// Use React.lazy for heavy components
const ExpenseStatistics = React.lazy(() => 
  import('./components/ExpensesOutput/ExpenseStatistics')
);

// Render with Suspense
<Suspense fallback={<SkeletonLoader />}>
  <ExpenseStatistics expenses={expenses} />
</Suspense>
```

---

## Implementation Roadmap

### Phase 1: Quick Wins (1-2 days)
1. ✅ Memoize context values (trip-context, expenses-context)
2. ✅ Wrap heavy calculations in useMemo (ExpensesSummary)
3. ✅ Add useCallback to expensive callbacks
4. ✅ Move expense filtering to useMemo

**Expected Result**: 40-50% improvement in button press responsiveness

---

### Phase 2: Medium Effort (3-5 days)
1. ✅ Implement calculation caching utility
2. ✅ Optimize FlatList windowing parameters
3. ✅ Add debouncing for period changes
4. ✅ Implement dynamic polling based on dataset size

**Expected Result**: 60-70% improvement overall

---

### Phase 3: Significant Refactoring (1-2 weeks)
1. ⚠️ Implement expense pagination/chunking
2. ⚠️ Add InteractionManager for deferred calculations
3. ⚠️ Optimize chart data aggregation
4. ⚠️ Consider Web Worker alternative for heavy calculations

**Expected Result**: 80-90% improvement, smooth experience even with 1000+ expenses

---

### Phase 4: Architectural (Long-term)
1. 🏗️ Evaluate state management migration
2. 🏗️ Implement data normalization
3. 🏗️ Add smart rehydration
4. 🏗️ Implement lazy loading strategy

**Expected Result**: Scalable architecture for unlimited expenses

---

## Measuring Performance

### Before Implementation
Run these checks to establish baseline:

```bash
# Enable performance monitoring
npx react-native log-android  # or log-ios
# Monitor for "Slow frame" warnings

# Use React DevTools Profiler
# - Measure render times
# - Identify wasted renders
# - Track component update causes
```

### Key Metrics to Track
1. **TTI (Time to Interactive)** - Time from button press to UI response
2. **Frame Rate** - Should stay at 60fps (16.67ms per frame)
3. **Memory Usage** - Watch for memory leaks
4. **JS Thread Utilization** - Should stay below 70%

### Testing Strategy
```typescript
// Create performance test trips
const SMALL_TRIP = 50 expenses;    // Should be instant
const MEDIUM_TRIP = 200 expenses;  // Should be < 100ms
const LARGE_TRIP = 500 expenses;   // Should be < 300ms
const HUGE_TRIP = 1000 expenses;   // Should be < 500ms
```

---

## React Native Performance Tools

### 1. React DevTools Profiler
```bash
npx react-devtools
```
Use Profiler tab to:
- Record interactions
- Identify slow components
- Find unnecessary re-renders

### 2. Flipper Performance Plugin
- Monitor FPS
- Track memory usage
- Analyze network requests

### 3. react-native-performance
```bash
npm install react-native-performance
```
Add performance markers:
```typescript
import performance from 'react-native-performance';

performance.mark('calculation-start');
// ... heavy calculation
performance.mark('calculation-end');
performance.measure('calculation', 'calculation-start', 'calculation-end');
```

---

## Code Examples for Quick Wins

### Example 1: Memoized Context Value

```typescript
// store/trip-context.tsx
function TripContextProvider({ children }) {
  // ... all useState declarations
  
  const value = useMemo(() => ({
    tripid,
    tripName,
    totalBudget,
    dailyBudget,
    setdailyBudget,
    tripCurrency,
    totalSum,
    tripProgress,
    startDate,
    endDate,
    refresh,
    refreshState,
    setTripProgress,
    travellers,
    fetchAndSetTravellers,
    setTotalSum,
    setTripid: _setTripid,
    addTrip,
    deleteTrip,
    getcurrentTrip,
    setCurrentTrip,
    fetchAndSetCurrentTrip,
    saveTripDataInStorage,
    loadTripDataFromStorage,
    saveTravellersInStorage,
    loadTravellersFromStorage,
    fetchAndSettleCurrentTrip,
    setTripUnsettled,
    isPaid,
    isPaidDate,
    isPaidTimestamp,
    isLoading,
    setIsLoading,
    isDynamicDailyBudget,
  }), [
    tripid,
    tripName,
    totalBudget,
    dailyBudget,
    tripCurrency,
    totalSum,
    progress, // note: this is the state variable name
    startDate,
    endDate,
    refreshState,
    travellers,
    isPaid,
    isPaidDate,
    isPaidTimestamp,
    isLoading,
    isDynamicDailyBudget,
    // Functions are stable, don't need to be in deps if they don't change
  ]);

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}
```

### Example 2: Memoized Calculations

```typescript
// components/ExpensesOutput/ExpensesSummary.tsx
const ExpensesSummary = ({ expenses, periodName, style = {} }) => {
  // ... all hooks
  
  // Memoize expensive calculation
  const expensesSum = useMemo(
    () => getExpensesSumPeriod(safeExpenses, hideSpecial),
    [safeExpenses, hideSpecial]
  );
  
  // Memoize period expenses calculation
  const periodExpenses = useMemo(() => {
    switch (periodName) {
      case "day":
        return expCtx.getRecentExpenses(RangeString.day) || [];
      case "week":
        return expCtx.getRecentExpenses(RangeString.week) || [];
      case "month":
        return expCtx.getRecentExpenses(RangeString.month) || [];
      case "year":
        return expCtx.getRecentExpenses(RangeString.year) || [];
      case "total":
        return expCtx.expenses || [];
      default:
        return [];
    }
  }, [periodName, expCtx.expenses]);
  
  // Memoize traveller sums
  const travellerSplitExpenseSums = useMemo(
    () => travellerNames.map((travellerName) =>
      getTravellerSum(periodExpenses, travellerName || "", periodName === "total")
    ),
    [travellerNames, periodExpenses, periodName]
  );
  
  // Rest of component...
};
```

### Example 3: Callback Optimization

```typescript
// components/ExpensesOutput/ExpensesList.tsx
const ExpensesList = ({ expenses, /* ... */ }) => {
  // Memoize callback with proper dependencies
  const renderExpenseItem = useCallback(
    (itemData) => {
      // Rendering logic
      return <MemoizedExpenseItem {...itemData.item} />;
    },
    [/* minimal dependencies */]
  );
  
  const handleDelete = useCallback(
    async (expenseId: string) => {
      // Delete logic
    },
    [expenseCtx, tripid, isOnline]
  );
  
  return (
    <Animated.FlatList
      data={expenses}
      renderItem={renderExpenseItem}
      keyExtractor={(item) => item.id}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      windowSize={5}
      initialNumToRender={20}
      updateCellsBatchingPeriod={50}
    />
  );
};
```

---

## Conclusion

The TravelCostApp has a solid foundation with MMKV storage and some optimizations already in place (MAX_EXPENSES_RENDER). However, the primary performance issues stem from:

1. **Unmemoized context values** causing cascading re-renders
2. **Heavy synchronous calculations** repeated on every render
3. **Missing React performance optimizations** (memo, useMemo, useCallback)

Implementing Priority 1 recommendations will provide immediate 40-60% improvement with minimal risk. The phased approach allows for incremental improvements while maintaining app stability.

**Estimated Implementation Time:**
- Phase 1: 1-2 days → 40-50% improvement
- Phase 2: 3-5 days → 60-70% improvement  
- Phase 3: 1-2 weeks → 80-90% improvement
- Phase 4: Ongoing → Future-proof architecture

**Next Steps:**
1. Establish performance baseline with React DevTools Profiler
2. Implement Phase 1 (Quick Wins)
3. Measure improvements
4. Proceed to Phase 2 based on results

---

## Additional Resources

- [React Native Performance](https://reactnative.dev/docs/performance)
- [React Profiler API](https://react.dev/reference/react/Profiler)
- [MMKV Performance](https://github.com/mrousavy/react-native-mmkv)
- [FlatList Optimization](https://reactnative.dev/docs/optimizing-flatlist-configuration)
- [InteractionManager](https://reactnative.dev/docs/interactionmanager)
