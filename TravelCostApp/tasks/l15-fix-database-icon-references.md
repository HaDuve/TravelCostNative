---
task: m-fix-database-icon-references
branch: fix/database-icon-references
status: pending
created: 2025-09-03
modules: [firebase, database, categories, icons]
---

# Fix Database Icon References After Icon Name Changes

## Problem/Goal
After fixing missing icons (m-fix-missing-icons), custom categories and stored data in Firebase will still reference old/incorrect icon names. This creates a data consistency issue where users with custom categories will see wrong icons or default "?" symbols.

### Real Examples of the Issue:
Based on actual changes made in fix/missing-icons branch:

- User created custom category "Medical Expenses" with stored icon reference `"ios-medkit-outline"` 
- After icon fix, the app expects `"medical-outline"`
- Database still contains `"ios-medkit-outline"` → user sees "?" default icon

- User created custom category "Travel Planning" with stored icon reference `"ios-earth"`
- After icon fix, the app expects `"globe-outline"` 
- Database still contains `"ios-earth"` → user sees "?" default icon

- User created custom category "Shopping" with stored icon reference `"ios-cart-outline"`
- After icon fix, the app expects `"cart-outline"`
- Database still contains `"ios-cart-outline"` → user sees "?" default icon

### Migration Pattern Required:
1. **General pattern**: Remove "ios-" prefix from all stored icon names
   - `"ios-wallet-outline"` → `"wallet-outline"`
   - `"ios-cash-outline"` → `"cash-outline"`
   - `"ios-calculator-outline"` → `"calculator-outline"`
   - etc. (80+ icons affected)

2. **Special mappings**: Handle specific name changes beyond prefix removal
   - `"ios-medkit-outline"` → `"medical-outline"` (not just prefix removal)
   - `"ios-earth"` → `"globe-outline"` (not just prefix removal)

## Success Criteria
- [ ] Research Firebase database structure and identify all tables/collections with icon references
- [ ] Create complete mapping of old icon names to new icon names from fix/missing-icons changes
- [ ] Research and document methods to update Firebase database from CLI/Claude Code
- [ ] Create migration script to update existing icon references with both general and special mappings
- [ ] Test migration on development/staging environment first
- [ ] Verify custom categories display correct icons after migration
- [ ] Document rollback procedure in case of migration issues
- [ ] Execute migration on production database
- [ ] Verify no users see "?" icons for previously working custom categories

## Context Files
<!-- Added by context-gathering agent or manually -->
- fix/missing-icons branch commit 4fbf7fe - shows exact icon name changes made
- Need to research: Firebase database schema for category storage
- Need to research: Firebase CLI tools and admin SDK for batch updates
- Need to research: Claude Code's Firebase operation capabilities

## User Notes
This task is a direct followup to m-fix-missing-icons and cannot be completed until that task is merged. The database migration approach should be reversible and tested thoroughly before production deployment.

Key research areas:
- Firebase Admin SDK for batch updates
- Firebase CLI commands for data migration  
- Claude Code's ability to execute Firebase operations
- Backup/restore procedures for safety
- Complete list of affected icon names (80+ icons in ManageCategoryScreen.tsx)

## Work Log
<!-- Updated as work progresses -->
- [2025-09-03] Created followup task for database icon reference fixes with real examples from missing-icons branch