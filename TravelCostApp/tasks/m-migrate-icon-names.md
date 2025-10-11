---
task: m-migrate-icon-names
branch: feature/migrate-icon-names
status: pending
created: 2025-10-11
modules: [components/ExpensesOutput, components/ManageTrip, scripts]
---

# Migrate Icon Names to Ionicons v6+ Format

## Problem/Goal
Need to update remaining icon names to match Ionicons v6+ naming convention and create a migration script for automated updates. This builds on the previous icon fixes from task m-fix-missing-icons.md.

## Success Criteria
1. All icon names follow Ionicons v6+ convention:
   - Remove `ios-` prefixes
   - Remove `md-` prefixes
   - Maintain `-outline` suffixes where appropriate
2. Icons display correctly on both iOS and Android
3. Migration script successfully updates icon names with:
   - Dry run capability
   - Progress tracking
   - Error handling
   - Batch processing
   - Selective file targeting

## Context Files
- components/ExpensesOutput/ExpensesList.tsx
- components/ManageTrip/TripForm.tsx
- scripts/migrate-server-timestamps.js (reference for script structure)

## User Notes
- Previous task m-fix-missing-icons.md identified root cause as Ionicons v6+ removing `ios-` prefixed icon names
- Need to maintain consistent icon naming across the codebase
- Migration script should follow same security and safety patterns as migrate-server-timestamps.js

## Implementation Plan
1. Update ExpensesList.tsx icons:
   - `ios-trash-outline` → `trash-outline`
   - `ios-checkmark-circle` → `checkmark-circle`
   - `md-arrow-undo-outline` → `arrow-undo-outline`

2. Update TripForm.tsx icons:
   - `ios-git-compare-outline` → `git-compare-outline` (2 instances)

3. Create migration script:
   - Base on migrate-server-timestamps.js structure
   - Add icon name mapping
   - Add file scanning and safe replacement
   - Add progress tracking
   - Add dry run mode
   - Add error handling

## Dependencies
- Previous task: m-fix-missing-icons.md
- Reference: migrate-server-timestamps.js

## Work Log

### 2025-10-11
Initial task creation and planning
