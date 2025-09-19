---
task: m-fix-default-expense-values
branch: fix/default-expense-values
status: pending
created: 2025-09-12
modules: [expense-management, default-values, data-persistence]
---

# Fix Default Expense Values

## Problem/Goal
Fix default values for new expenses to be based on the most current expense of the trip rather than safeasync values. This will provide more relevant and contextual defaults for users.

## Success Criteria
- [ ] Identify current default value implementation using safeasync
- [ ] Implement logic to use most recent expense data for defaults
- [ ] Ensure category, amount patterns, and other relevant fields use trip-specific defaults
- [ ] Handle edge cases (no previous expenses, deleted expenses)
- [ ] Test that defaults are contextually relevant to the current trip
- [ ] Verify backwards compatibility and no data corruption
- [ ] Performance testing to ensure no slowdowns

## Context Manifest

### How Default Values Currently Work: Expense Creation System

When a user creates a new expense, the system currently uses various fallback mechanisms that don't prioritize the most recent trip-specific expense data. The expense creation flow begins at the ExpenseForm component (`components/ManageExpense/ExpenseForm.tsx:119-2037`), which is the heart of all expense input and defaults.

The current default value system works through multiple layers:

**Initial State Setup (Lines 152-195):**
The ExpenseForm initializes with defaults from several sources in this priority order:
1. `editingValues` (when editing an existing expense)
2. `userCtx.lastCurrency` and `userCtx.lastCountry` from secure storage
3. `tripCtx.tripCurrency` as ultimate fallback
4. Hard-coded empty strings for most fields

**User Context Defaults (store/user-context.tsx:111-127):**
The user context loads `lastCurrency` and `lastCountry` from SecureStore using `secureStoreGetItem("lastCurrency")` and `secureStoreGetItem("lastCountry")`. These values are global across all trips and represent the user's most recently used currency/country from any trip, not necessarily the current trip.

**Validation Fallback System (ExpenseForm.tsx:939-955):**
When validation fails, the `addDefaultValues()` function kicks in with basic fallbacks:
- Description defaults to the category name via `getCatString(arg)`
- Country defaults to `userCtx.lastCountry`  
- Currency defaults to `userCtx.lastCurrency`
- WhoPaid defaults to `userCtx.userName`

**Problem: No Trip-Specific Context**
The current system never looks at existing expenses within the current trip to derive contextually relevant defaults. It relies on:
1. Global user preferences (lastCurrency/lastCountry across all trips)
2. Trip-level settings (tripCurrency)
3. Static fallbacks

This means if a user is on a trip to Japan but their last expense was from a previous trip to Germany, they'll get EUR currency defaults instead of JPY, even if they've already created several JPY expenses on the current trip.

### For New Feature Implementation: Trip-Specific Recent Expense Defaults

Since we need to implement logic that uses the most recent expense from the current trip, we'll need to integrate with the existing expense retrieval and context systems.

**ExpensesContext Integration (store/expenses-context.tsx:80-158):**
The ExpensesContext already provides access to all expenses for the current trip through `expensesCtx.expenses`. This array is:
- Sorted by date (newest first) in the reducer (lines 166-172)
- Filtered and validated in RecentExpensesUtil.ts (line 33)
- Cached in MMKV storage for offline access

**Recent Expense Retrieval Pattern:**
The system already has patterns for finding recent expenses:
- `expensesCtx.getDailyExpenses(0)` gets today's expenses
- `expensesCtx.expenses[0]` would be the most recent expense (due to date sorting)
- Expenses are already filtered by trip (tripid) in the HTTP layer

**Integration Points for New Logic:**

1. **ExpenseForm Initialization (lines 152-195)**: We need to modify the initial state setup to check for recent expenses BEFORE falling back to user context defaults.

2. **Default Value Resolution (lines 939-955)**: The `addDefaultValues()` function should be enhanced to:
   - First check for the most recent expense in the current trip
   - Use those values for currency, country, category patterns
   - Fall back to existing user context logic only if no trip expenses exist

3. **Context Loading (lines 363-432)**: The expense form already has complex state restoration logic for category picking. We need similar logic for trip-based defaults.

**Data Flow for New Implementation:**
1. User navigates to create new expense
2. ExpenseForm initializes and checks `expensesCtx.expenses[0]` (most recent)
3. If recent expense exists and is from current trip, use its:
   - Currency (recent expense's currency)
   - Country (recent expense's country) 
   - Amount patterns (for smart suggestions)
   - Category tendencies (if implementing category suggestions)
4. If no recent expenses exist, fall back to current userCtx logic
5. Validation and submission follow existing patterns

**Edge Cases to Handle:**
- No previous expenses in trip (first expense) - use existing fallback
- Recent expense has invalid/missing data - skip to next recent or fallback
- Recent expense from different trip user (in shared trips) - still use geographical data
- Offline mode - ensure MMKV cached expenses are used

### Technical Reference Details

#### Component Interfaces & Signatures

**ExpenseForm Props:**
```typescript
interface ExpenseFormProps {
  defaultValues?: ExpenseData;
  isEditing: boolean;
  pickedCat?: string;
  // ... other props
}
```

**ExpenseData Structure:**
```typescript
interface ExpenseData {
  currency: string;
  country?: string;
  amount: number;
  category: string;
  description: string;
  date: DateOrDateTime;
  // ... other fields
}
```

**ExpensesContext Methods:**
```typescript
expenses: Array<ExpenseData>; // Already sorted by date desc
getRecentExpenses(rangestring: RangeString): Array<ExpenseData>;
getDailyExpenses(daysBack: number): Array<ExpenseData>;
```

#### Data Structures

**Current Storage Patterns:**
- Trip expenses: `expensesCtx.expenses` (in memory, sorted by date)
- User defaults: SecureStore keys "lastCurrency", "lastCountry"  
- Expense cache: MMKV key "expenses"

**Recent Expense Access:**
- Most recent: `expensesCtx.expenses[0]` (due to date sorting)
- Today's expenses: `expensesCtx.getDailyExpenses(0)`
- Recent valid expense: First expense with valid currency and country fields

#### Configuration Requirements

No additional environment variables or config files needed. The implementation will use:
- Existing ExpensesContext infrastructure
- Current MMKV storage patterns
- Existing validation and fallback mechanisms

#### File Locations

**Implementation goes here:**
- `/components/ManageExpense/ExpenseForm.tsx` - Main form logic modification
- Potentially `/store/expenses-context.tsx` - If we need a helper method

**Related configuration:**
- `/store/user-context.tsx` - Contains current fallback logic
- `/store/mmkv.tsx` - Storage utilities

**Tests should go:**
- `/__tests__/components/ManageExpense/` - Component tests
- `/__tests__/util/` - Utility function tests

## Context Files
<!-- Added by context-gathering agent or manually -->

## User Notes
FIX: default values should be depending on most current expense of the trip, not on safeasync values

## Work Log
<!-- Updated as work progresses -->