---
task: h-fix-expenseform-input-delay
branch: cursor/expenseform-input-delay-c7ab
status: in-progress
created: 2026-01-28
started: 2026-01-28
modules: [components]
---

# Fix ExpenseForm input delay

## Problem/Goal
ExpenseForm inputs occasionally lag ~1s before characters appear. Improve input
responsiveness while keeping autosave, auto-category, and autocomplete behavior.

## Success Criteria
- [ ] Typing in amount/description updates immediately (no ~1s lag).
- [ ] Draft autosave still persists after brief pause.
- [ ] Autocomplete suggestions and auto-category still function.

## Context Files
- @components/ManageExpense/ExpenseForm.tsx
- @components/UI/Autocomplete.tsx

## User Notes
- "Performance: Expenseform has terrible performance, sometimes 1 sec delay until input is seen - analyse and fix consisely"

## Work Log
- [2026-01-28] Started task, reviewed ExpenseForm input handling and autosave.
- [2026-01-28] Debounced autosave/auto-category, memoized suggestions.
