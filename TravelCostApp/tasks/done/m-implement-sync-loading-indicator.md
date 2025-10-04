---
task: m-implement-sync-loading-indicator
branch: feature/implement-sync-loading-indicator
status: completed
created: 2024-12-19
started: 2024-12-19
modules:
  [
    components/UI,
    screens,
    util/http,
    store/expenses-context,
    components/ExpensesOutput,
  ]
---

# Implement Sync Loading Indicator for Expense APIs

## Problem/Goal

Currently, when the app calls sync/fetch expense APIs (like `fetchExpenses`, `fetchExpensesWithUIDs`, `getAllExpenses`), there's no visual feedback to users that data synchronization is happening. This creates a poor user experience where users might think the app is frozen or unresponsive during sync operations.

## Success Criteria

- [ ] Add sync loading indicator that appears during all expense sync/fetch operations
- [ ] Loading indicator should be visible in RecentExpenses screen during data fetching
- [ ] Loading indicator should show during pull-to-refresh operations
- [ ] Loading indicator should appear during initial app load when fetching expenses
- [ ] Loading indicator should be consistent with existing app design (using LoadingOverlay or similar)
- [ ] Loading indicator should be dismissible or auto-hide when sync completes
- [ ] Loading indicator should work for both online and offline sync operations

## Context Files

<!-- Added by context-gathering agent or manually -->

- @util/http.tsx:183-276 # fetchExpensesWithUIDs function
- @util/http.tsx:278-357 # fetchExpenses function
- @util/delta-sync.ts:68-109 # fetchExpensesDelta function
- @components/ExpensesOutput/RecentExpensesUtil.ts:21-53 # fetchAndSetExpenses function
- @screens/RecentExpenses.tsx:78-153 # getExpenses function and loading state management
- @components/UI/LoadingOverlay.tsx # Existing loading component
- @components/UI/LoadingBarOverlay.tsx # Existing progress loading component
- @store/expenses-context.tsx # Expenses context for state management

## User Notes

<!-- Any specific notes or requirements from the developer -->

- Should leverage existing LoadingOverlay component for consistency
- Loading indicator should be non-blocking (users can still navigate)
- Consider using toast notifications for sync status updates
- Should handle both delta sync and full sync operations
- Loading state should be managed through context or props, not local state

## Work Log

<!-- Updated as work progresses -->

- [2024-12-19] Created task, identified sync/fetch APIs and existing loading components
- [2024-12-19] Extended ExpensesContext with sync loading state (isSyncing, syncProgress)
- [2024-12-19] Created SyncLoadingIndicator component with progress bar support
- [2024-12-19] Updated HTTP functions with clean SyncProgressCallback interface
- [2024-12-19] Integrated sync loading indicator in RecentExpenses screen
- [2024-12-19] Updated fetchAndSetExpenses to use sync progress callbacks
- [2024-12-19] Redesigned as bottom toast style for less intrusive UX
- [2024-12-19] Replaced with mini sync indicator in top right corner (spinner + progress ring)
- [2024-12-19] Added smooth 1% step animation for progress ring
- [2024-12-19] Simplified to basic loading indicator (removed progress tracking)
- [2024-12-19] Fixed layout disruption by ensuring container always reserves space
- [2024-12-19] Optimized sizing to match trip name/date text line height
- [2024-12-19] Added proper spacing and positioning for non-intrusive UX
