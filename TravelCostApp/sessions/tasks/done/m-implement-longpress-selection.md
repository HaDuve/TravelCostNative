---
task: m-implement-longpress-selection
branch: feature/implement-longpress-selection
status: pending
created: 2025-09-18
modules: [components/ExpenseList, components/ExpenseItem]
---

# Add Longpress Multiple Selection for Expense Items

## Problem/Goal

Need to add longpress functionality that marks expense items for multiple select in the expense list, enabling batch operations on expenses.

## Success Criteria

- [ ] Implement longpress gesture detection on expense items
- [ ] Add visual indication for selected expense items
- [ ] Enable multiple selection mode when longpress is triggered
- [ ] Add batch operation capabilities (delete, edit, etc.)
- [ ] Test longpress behavior across different devices
- [ ] Ensure smooth UX for selection and deselection

## Context Manifest

### How This Currently Works: Expense List Multiple Selection System

The TravelCost app already has a sophisticated multiple selection system for expense items that's activated via longpress gestures. The system exists within the `ExpensesList.tsx` component and integrates with individual `ExpenseItem.tsx` components to provide batch operations on expenses.

**The Complete Selection Flow:**

When a user long presses on any expense item in the list, the gesture triggers the `onLongPress` handler in `ExpenseItem.tsx` at line 269. This handler first checks if the `setSelectable` function is available (passed down as a prop from ExpensesList), and if so, calls `setSelectable(true)` to activate selection mode for the entire list.

Once selection mode is activated, the `ExpensesList` component undergoes several visual and functional transformations:

**Selection Mode State Management (ExpensesList.tsx:104-105):**

- `selectable` boolean state controls whether the list is in selection mode
- `selected` string array tracks the IDs of currently selected expense items
- These states are managed through `useState` hooks and passed down to child components

**Visual Selection Indicators:**
When `selectable` is true, each expense item renders a selection checkbox overlay (`selectableJSX` at lines 386-414). The checkbox uses Ionicons with `ios-checkmark-circle` for selected items and `ellipse-outline` for unselected items. The checkbox is positioned absolutely at `top: -36, left: -46` to appear as an overlay on the expense item.

**Batch Operations Infrastructure:**
The selection system enables multiple batch operations accessible through a header toolbar that appears when selection mode is active:

1. **Select All/Deselect All** (lines 507-519): Toggles between selecting all non-shadow expenses and clearing selection
2. **Delete Selected** (lines 647-715): Batch deletion with confirmation dialog, handles both regular and ranged expenses
3. **Move to Trip** (lines 564-645): Moves selected expenses to different trips with progress toast
4. **Pie Chart Analysis** (lines 521-532): Navigates to filtered pie charts showing only selected expenses
5. **Edit Multiple** (lines 554-562): Single expense editing or batch editing (TODO: not fully implemented)

**Performance Optimizations:**
The list has two rendering modes. For lists with more than `MAX_EXPENSES_RENDER` items, it switches to a "fast" rendering mode (lines 352-384) that displays cheaper JSX without full functionality. In this mode, selection capability is commented out but the infrastructure exists (`{/* {selectable && cheapSelectableJSX} */}` at line 368).

**Gesture Integration with Swipe Actions:**
The expense items are wrapped in `Swipeable` components from react-native-gesture-handler that provide right-swipe delete functionality. The longpress gesture coexists with the swipe gestures through careful gesture precedence handling. Platform-specific implementations exist for iOS (right swipe only) and Android (left swipe for delete).

**Haptic Feedback Patterns:**
All selection interactions include haptic feedback using `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)` for consistent user experience. This includes selection/deselection, select all, and batch operation triggers.

**Data Persistence and Context Integration:**
Selected items are tracked by their expense IDs, and batch operations interact with the `ExpensesContext` for state management and the offline queue system for network synchronization. The system handles both online and offline scenarios gracefully.

### For New Feature Implementation: Enhanced Longpress Multiple Selection

Since the multiple selection system already exists and is fully functional, this task appears to be about **enhancing or fixing** the existing longpress selection rather than implementing it from scratch. The current system already provides:

✅ Longpress gesture detection on expense items (line 269 in ExpenseItem.tsx)
✅ Visual indication for selected items (checkbox overlays with icons)
✅ Multiple selection mode activation
✅ Batch operation capabilities (delete, move to trip, analytics)
✅ Cross-device compatibility through platform-specific rendering
✅ Smooth UX for selection and deselection with haptic feedback

**Potential Enhancement Areas:**

Based on the existing implementation, the task might involve:

1. **Fast Rendering Mode Integration**: The current "cheap" rendering mode for large lists disables selection functionality. Enhancement might involve enabling selection in this mode while maintaining performance.

2. **Selection Visual Improvements**: The current checkbox overlay could be enhanced with better animations, visual feedback, or positioning adjustments for different screen sizes and orientations.

3. **Batch Operations Completion**: The `handleEditMultipleExpenses` function has a TODO comment indicating that `ManageMultipleExpenses.tsx` is not fully implemented. This might be the focus area.

4. **Gesture Conflict Resolution**: If users are experiencing issues with longpress detection due to conflicts with swipe gestures or other touch handlers, refinements might be needed.

5. **Accessibility Improvements**: Adding proper accessibility labels, screen reader support, or alternative selection methods for users with disabilities.

**Most Likely Implementation Focus:**
Given that there's an existing `ManageMultipleExpenses.tsx` screen that's essentially empty (just a TODO comment), the task likely involves completing the batch editing functionality that would allow users to edit multiple selected expenses simultaneously.

### Technical Reference Details

#### Component Interfaces & Signatures

```typescript
// ExpensesList component props
interface ExpensesListProps {
  expenses: ExpenseData[];
  showSumForTravellerName?: string;
  isFiltered?: boolean;
  refreshControl?: object;
  refreshing?: boolean;
}

// ExpenseItem component props with selection
interface ExpenseItemProps extends ExpenseData {
  setSelectable?: (selectable: boolean) => void;
  showSumForTravellerName?: string;
  filtered?: boolean;
}

// Selection state management
const [selectable, setSelectable] = useState<boolean>(false);
const [selected, setSelected] = useState<string[]>([]);

// Key handler functions
const selectItem = (item: string) => void;
const selectAll = () => void;
const deleteSelected = () => void;
const handleEditMultipleExpenses = () => void; // TODO: implement
```

#### Data Structures

```typescript
interface ExpenseData {
  id: string;
  description: string;
  amount: number;
  date: DateOrDateTime;
  category: string;
  currency: string;
  whoPaid: string;
  calcAmount: number;
  splitList?: Split[];
  rangeId?: string;
  isSpecialExpense?: boolean;
  // ... other fields
}

// Selection-related state
type SelectionState = {
  selectable: boolean;
  selected: string[]; // Array of expense IDs
};
```

#### Gesture Configuration

```javascript
// Longpress activation in ExpenseItem.tsx
<Pressable
  onPress={navigateToExpense}
  onLongPress={() => {
    if (setSelectable === undefined) return;
    setSelectable(true);
  }}
  style={({ pressed }) => pressed && GlobalStyles.pressed}
>
```

#### Visual Selection Elements

```javascript
// Selection checkbox overlay
const selectableJSX = (
  <Animated.View
    entering={FadeInLeft}
    exiting={FadeOutLeft}
    style={{
      position: "absolute",
      top: -36,
      left: -46,
      zIndex: 1,
    }}
  >
    <IconButton
      icon={
        selected.includes(itemId) ? "ios-checkmark-circle" : "ellipse-outline"
      }
      color={selected.includes(itemId) ? textColor : gray700}
    />
  </Animated.View>
);
```

#### File Locations

- **Main list component**: `/components/ExpensesOutput/ExpensesList.tsx`
- **Individual items**: `/components/ExpensesOutput/ExpenseItem.tsx`
- **Batch editing screen**: `/screens/ManageMultipleExpenses.tsx` (currently empty - likely implementation target)
- **Selection utilities**: Integrated within ExpensesList component (lines 104-105, 498-715)
- **Gesture handling**: ExpenseItem.tsx lines 269-272
- **Visual indicators**: ExpensesList.tsx lines 386-414
- **Batch operations**: ExpensesList.tsx lines 507-715

## User Notes

Add longpress marks expense item für multiple select (in expenseList).

## Work Log

- [2025-09-18] Created task
