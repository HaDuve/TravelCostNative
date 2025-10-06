---
task: m-refactor-expense-form-architecture
branch: feature/refactor-expense-form-architecture
status: pending
created: 2025-01-14
modules: [components/ManageExpense/ExpenseForm]
---

# ExpenseForm Architecture Refactor (Senior React Native Engineer Task)

## Problem/Goal

The ExpenseForm component has grown to over 2100 lines and contains multiple complex responsibilities:

- Modal flow state management with timing issues
- Form validation logic scattered throughout
- Mixed UI rendering and business logic
- Complex useEffect dependencies
- Single massive component handling multiple concerns

Refactor for better maintainability, testability, and code organization following React best practices.

## Success Criteria

- [ ] Extract modal flow logic into custom hook (`useModalFlow` or similar)
- [ ] Extract form validation logic into separate utility functions
- [ ] Break down ExpenseForm into focused sub-components (5-8 smaller components)
- [ ] Optimize and clean up useEffect dependencies
- [ ] Maintain all existing functionality and UX flows
- [ ] Improve code testability and separation of concerns
- [ ] Document new architecture and component boundaries

## Context Files

<!-- To be added by context-gathering agent -->

- @components/ManageExpense/ExpenseForm.tsx # Main component to refactor
- @util/split.ts # Split calculation utilities
- @constants/styles.ts # Styling dependencies

## User Notes

This is a comprehensive architectural refactoring focused on:

**Key Refactoring Areas:**

1. **Modal Flow Hook** - Extract the state machine pattern we just implemented
2. **Validation Utilities** - Move scattered validation logic to pure functions
3. **Component Decomposition** - Split 2100+ line component into logical pieces
4. **Effect Optimization** - Clean up dependency arrays and timing issues

Priority is code quality and maintainability while preserving all existing functionality.

This follows the protocol's single-file approach since it's focused on one component with clear goals. Recommend running context-gathering agent after creation to build comprehensive understanding of current architecture.

## Work Log

<!-- Updated as work progresses -->

- [2025-01-14] Task created, architectural refactoring scope defined
