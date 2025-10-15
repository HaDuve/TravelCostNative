---
task: h-fix-ranged-expenses-soft-delete-issues
branch: fix/ranged-expenses-soft-delete-issues
status: in_progress
created: 2024-12-19
modules:
  [expenses-context, http, expense, ManageExpense, ExpensesList, offline-queue]
---

# Fix Ranged Expenses Issues After Soft Delete Implementation

## Problem/Goal

After implementing soft delete for expenses, ranged expenses have two critical issues:

1. **Cannot delete ranged expenses consistently** - The soft delete implementation breaks ranged expense deletion because:
   - `deleteAllExpensesByRangedId()` and `ExpensesList.deleteAllExpenses()` still use the old `type: "delete"` queue items
   - These functions call `deleteExpenseOnlineOffline()` which now does soft delete (PATCH with `isDeleted: true`)
   - But the local context `deleteExpense()` immediately removes the expense from state
   - This creates inconsistency between local state and server state

2. **Changing dates creates new ranged expenses instead of modifying existing ones** - The `editRangedData()` function has a logic flaw:
   - When dates change, it calls `createRangedData()` to create new expenses
   - Then calls `deleteAllExpensesByRangedId()` to delete old ones
   - But the order is wrong - it should delete first, then create
   - This causes both old and new ranged expenses to exist temporarily

## Success Criteria

- [ ] Fix ranged expense deletion to work consistently with soft delete
- [ ] Fix ranged expense date modification to properly replace existing expenses
- [ ] Ensure all ranged expense operations maintain data consistency
- [ ] Test both online and offline scenarios for ranged expenses
- [ ] Verify that soft delete works correctly for individual ranged expense entries
- [ ] Ensure no duplicate ranged expenses are created during date changes

## Context Files

### Core Ranged Expense Logic

- @screens/ManageExpense.tsx:382-477 # editRangedData function
- @util/expense.ts:94-129 # deleteAllExpensesByRangedId function
- @components/ExpensesOutput/ExpensesList.tsx:173-211 # deleteAllExpenses function

### Soft Delete Implementation

- @util/http.tsx:473-489 # deleteExpense function (now uses PATCH)
- @store/expenses-context.tsx:232-235 # MERGE case filters deleted expenses
- @util/offline-queue.ts:275-280 # delete processing in offline queue

### Ranged Expense Creation

- @screens/ManageExpense.tsx:278-365 # createRangedData function

## User Notes

- The soft delete implementation is correct for individual expenses
- The issue is that ranged expense deletion logic wasn't updated to work with soft delete
- Need to maintain the same user experience - deleting a ranged expense should delete all related entries
- Date modification should replace the entire ranged expense, not create duplicates

## Work Log

<!-- Updated as work progresses -->

- [2024-12-19] Created task to fix ranged expenses issues after soft delete implementation
- [2024-12-19] **ANALYSIS COMPLETE**: Identified root causes:
  - Ranged expense deletion uses old hard delete logic instead of soft delete
  - Date modification has incorrect order of operations (create before delete)
  - Local state management conflicts with soft delete server operations
- [2024-12-19] **TASK STARTED**: Beginning implementation of fixes for ranged expenses soft delete issues
- [2024-12-19] **FIX 1 COMPLETE**: Fixed ranged expense deletion to work with soft delete:
  - Updated `deleteAllExpensesByRangedId()` to call server first, then local state
  - Updated `ExpensesList.deleteAllExpenses()` to call server first, then local state
  - This ensures consistency between server soft delete and local state management
- [2024-12-19] **FIX 2 COMPLETE**: Fixed rangeId filtering issue with soft delete:
  - Added `!expense.isDeleted` filter to both deletion functions
  - Prevents trying to delete already soft-deleted expenses
  - Fixes the core issue where soft-deleted expenses retain their rangeId
- [2024-12-19] **FIX 3 COMPLETE**: Fixed ranged expense date modification order:
  - Reversed order in `editRangedData()`: delete old expenses BEFORE creating new ones
  - Prevents race condition where only 1 of 3 old expenses gets deleted
  - Ensures clean state transition from old range to new range
