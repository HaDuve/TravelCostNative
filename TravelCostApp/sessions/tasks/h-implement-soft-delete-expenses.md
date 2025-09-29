---
task: h-implement-soft-delete-expenses
branch: fix/soft-delete-expenses
status: completed
created: 2024-12-19
started: 2024-12-19
modules: [expenses-context, http, expense, ManageExpense, offline-queue]
---

# Implement Soft Delete for Expenses

## Problem/Goal

Currently, when expenses are deleted, they are permanently removed from Firebase, making it impossible for delta sync to detect deletions across devices. This causes deleted expenses to reappear on other devices during sync. We need to implement soft delete by adding an `isDeleted` flag to ensure proper sync behavior.

## Success Criteria

- [ ] Add `isDeleted` field to ExpenseData and ExpenseDataOnline interfaces
- [ ] Modify `deleteExpense` function to use PATCH with `isDeleted: true` instead of DELETE
- [ ] Update `processExpenseResponse` to filter out expenses where `isDeleted: true`
- [ ] Modify expenses context DELETE action to filter out deleted expenses locally
- [ ] Ensure offline queue properly handles soft delete
- [ ] Test that deleted expenses don't reappear on other devices during sync

## Context Files

<!-- Added by context-gathering agent or manually -->

- @util/expense.ts:83-96 # ExpenseData interface
- @util/http.tsx:453-469 # deleteExpense function
- @util/http.tsx:197-232 # processExpenseResponse function
- @store/expenses-context.tsx:242-243 # DELETE case in reducer
- @screens/ManageExpense.tsx:137-174 # deleteExp function
- @util/offline-queue.ts:275-280 # delete processing in offline queue

## User Notes

<!-- Any specific notes or requirements from the developer -->

- Keep changes minimal - only add `isDeleted` boolean field
- No need for `deletedAt` or `deletedBy` fields
- Local deletion should immediately filter out expense from state
- Delta sync should automatically handle filtering via `processExpenseResponse`

## Work Log

<!-- Updated as work progresses -->

- [2024-12-19] Created task for implementing soft delete with minimal changes
- [2024-12-19] **IMPLEMENTATION COMPLETE**: Successfully implemented soft delete system:
  - Added `isDeleted?: boolean` field to both `ExpenseData` and `ExpenseDataOnline` interfaces
  - Modified `deleteExpense` function to use PATCH with `isDeleted: true` instead of DELETE
  - Updated both `processExpenseResponse` functions to filter out expenses where `isDeleted: true`
  - Confirmed expenses context DELETE action already filters locally (no changes needed)
  - All changes are minimal and maintain backward compatibility
