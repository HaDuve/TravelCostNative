---
task: h5-implement-split-calculation-priority
branch: feature/split-calculation-priority
status: pending
created: 2025-09-12
modules: [expense-splitting, manage-expense, split-algorithm]
---

# Implement Split Calculation Priority

## Problem/Goal
Improve the calculation of expense splits by implementing a priority-based algorithm. Instead of using .00 values to determine calculation order, implement an implicit priority system where each user input update sets the priority of that split to the highest value, keeping the last edited value accurate and redistributing remaining costs intelligently.

## Success Criteria
- [ ] Implement priority stack system for split edits (0-index for most recent)
- [ ] Last edited split value is always preserved exactly
- [ ] Remaining costs are distributed to unedited values first
- [ ] If all values edited, distribute to previously edited values
- [ ] Opening/creating expense resets the edit order
- [ ] Algorithm works in manageExpense screen splitlist logic
- [ ] Manual testing confirms accurate split calculations

## Context Manifest

### How Split Calculation Currently Works: Expense Form Split Logic

When a user creates or edits an expense in the ManageExpense screen, the split calculation system operates through several interconnected components in a complex dance of user interaction and algorithmic distribution. Understanding this system is critical because the new priority-based algorithm must integrate seamlessly with the existing flow.

The process begins when a user enters an expense amount in the ExpenseForm component (`components/ManageExpense/ExpenseForm.tsx:1157-1169`). This triggers the `inputChangedHandler` which calls `autoExpenseLinearSplitAdjust` (`lines 524-552`). This function is crucial because it automatically recalculates splits whenever the amount changes, but currently it uses the linear redistribution approach via `recalcSplitsLinearly` from `util/split.ts:16-69`.

The `recalcSplitsLinearly` function calculates a total amount from existing splits, determines the "rest" that needs distribution, then applies an adjustment factor proportionally to all splits. This means if a user has manually set specific amounts, those amounts get proportionally scaled up or down to match the new total - completely overriding user intent.

For manual split editing in "EXACT" mode, when a user touches an individual split input field (`ExpenseForm.tsx:1728-1741`), it calls `inputSplitListHandler` (`lines 629-637`). This function updates the specific split value and validates the entire split list, but currently has no concept of edit priority or preservation of the last-edited value. Every time the total amount changes or recalculation occurs, this carefully entered value gets overwritten.

The current recalculation logic in `recalcSplitsForExact` (`util/split.ts:71-124`) attempts to be "smart" about distribution:
- First, it looks for splits that equal the norm amount (total divided by number of travelers)
- If found, it distributes the remainder among those "normal" splits
- Otherwise, it looks for splits with decimal values and distributes among those
- As a fallback, it distributes equally among all splits

This logic completely ignores user intent. When a user deliberately sets a split to $23.50 because that's what they actually owe, the system treats this as just another value to be adjusted.

The validation system (`validateSplitList` in `util/split.ts:196-228`) ensures all split amounts sum to the total expense amount, which is mathematically correct but doesn't preserve the user's explicit input choices.

State management for splits occurs through React hooks in ExpenseForm:
- `splitList` state holds the current split values (`line 212`)
- `splitListValid` tracks whether splits sum correctly (`line 215`)
- When invalid, a recalculation button appears (`lines 894-939`) allowing manual fixes

The architectural problem is that the system treats all split values as equally malleable. There's no distinction between a value that was explicitly set by user input versus one that was calculated or derived. When `autoExpenseLinearSplitAdjust` runs (triggered by amount changes), it has no knowledge of which values the user intentionally set.

### For New Priority-Based Implementation: What Needs to Connect

Since we're implementing a priority stack system where each user input sets that split to highest priority (0-index), we need to fundamentally change how the split calculation and state management works while maintaining compatibility with the existing UI flow.

The new system will need to track edit history alongside the split amounts. Each split in the `splitList` will need additional metadata indicating when it was last edited and its current priority level. When `inputSplitListHandler` is called, instead of just updating the amount, it needs to:
1. Set that split's priority to 0 (highest)
2. Increment all other splits' priorities by 1
3. Trigger a new priority-aware recalculation

The `autoExpenseLinearSplitAdjust` function will need replacement with a priority-aware version that:
- Preserves all splits with recent edits (low priority numbers)
- Distributes remaining amounts to unedited splits first
- Only adjusts previously-edited splits if no unedited splits remain
- Maintains the last-edited value exactly as entered

Opening/creating an expense needs to reset the edit order, which means clearing any priority metadata and treating all splits as equally adjustable until the user starts making explicit edits.

The existing recalculation UI (the "Re-Calculate" button) will need to understand the priority system - it should still work but respect the priority ordering when distributing amounts.

Integration points that must be maintained:
- The `submitHandler` (`lines 714-824`) expects the current `splitList` structure
- Validation via `validateSplitList` must continue working
- The FlatList rendering splits (`lines 1609-1765`) should continue displaying normally
- The `handleRecalculationSplits` function (`lines 876-892`) needs priority-aware logic

### Technical Reference Details

#### Current Split Data Structure
```typescript
interface Split {
  userName: string;
  amount: number;
  whoPaid?: string;
  rate?: number;
}
```

#### Proposed Enhanced Split Structure
```typescript
interface Split {
  userName: string;
  amount: number;
  whoPaid?: string;
  rate?: number;
  editPriority?: number; // 0 = most recent edit, higher = older edits
  isUserEdited?: boolean; // true if user explicitly set this value
}
```

#### Key Functions to Modify

**In `util/split.ts`:**
- `recalcSplitsForExact` -> `recalcSplitsWithPriority` (new function)
- `recalcSplitsLinearly` -> enhance or replace with priority-aware version

**In `components/ManageExpense/ExpenseForm.tsx`:**
- `inputSplitListHandler` (lines 629-637) -> add priority management
- `autoExpenseLinearSplitAdjust` (lines 524-552) -> replace with priority logic
- `handleRecalculationSplits` (lines 876-892) -> make priority-aware

#### State Management Requirements

New state needed in ExpenseForm component:
```javascript
const [editOrder, setEditOrder] = useState([]); // tracks editing sequence
```

Or integrate priority directly into split objects and manage through existing `splitList` state.

#### Algorithm Logic Flow

1. **User edits split value** -> `inputSplitListHandler` called
2. **Set edit priority** -> Mark this split as priority 0, increment others
3. **Trigger recalculation** -> New priority-aware function calculates remainder
4. **Distribute remainder** -> First to unedited splits, then to lowest priority edited splits
5. **Preserve last edit** -> Never modify the priority 0 split amount
6. **Validate and update** -> Run existing validation and update UI

#### File Locations

- Implementation goes here: `/Users/hiono/Freelance/2022/TravelCostNative/TravelCostApp/util/split.ts`
- Component integration: `/Users/hiono/Freelance/2022/TravelCostNative/TravelCostApp/components/ManageExpense/ExpenseForm.tsx`
- Type definitions: `/Users/hiono/Freelance/2022/TravelCostNative/TravelCostApp/util/expense.ts`
- Tests should go: `/Users/hiono/Freelance/2022/TravelCostNative/TravelCostApp/__tests__/split-priority.test.ts` (if test directory exists)

## Context Files
<!-- Added by context-gathering agent or manually -->

## User Notes
FEATURE: improve calculation of splits by improving the algorithm. Instead of going with .00 values etc to figure out order, set an implicit order via user input, to each update to a split sets the priority of that split to the highest value (0index in a stack) and reorders the rest. Resulting in a calculation that always keeps the last edited value and splits remaining costs on (1. any unedited values or 2. if none unedited any previously edited values. Opening/creating the expense resets this edit-order)

Split algorithm issues: In manageExpense screen at splitlist logic

## Work Log
<!-- Updated as work progresses -->