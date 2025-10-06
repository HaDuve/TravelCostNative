---
task: m-fix-missing-icons
branch: fix/missing-icons
status: pending
created: 2025-09-03
modules: [components/UI, screens/myTrips, screens/manageTrips, assets]
---

# Fix Missing Icons in MyTrips and ManageTrips

## Problem/Goal

Several icons are missing and showing as default "?" symbols since the last update. Need to identify missing icons and find suitable alternatives:

- myTrips screen icons
- manageTrips screen icons
- newTrip button (previously had globe symbol)
- reCalc button (previously had merge symbol)

## Success Criteria

- [x] Identify all missing icons showing as "?" in myTrips and manageTrips screens
- [x] Find suitable replacement icons for newTrip button (globe alternative)
- [x] Find suitable replacement icons for reCalc button (merge alternative)
- [x] Implement icon replacements ensuring consistent design language
- [x] Verify all icons display properly across iOS and Android
- [x] Test icon functionality and touch targets

## Context Files

<!-- Added by context-gathering agent or manually -->

## User Notes

Icons were working before the last update, so this might be related to:

- Icon library changes
- Asset path changes
- Icon name changes in dependencies

## Work Log

### 2025-09-03

#### Completed

- Identified root cause: Ionicons v6+ removed `ios-` prefixed icon names
- Updated ManageCategoryScreen.tsx icon import from `{ Ionicons }` to direct import
- Replaced all 86 icon names in ioniconsList array (removed `ios-` prefixes)
- Fixed newTrip button icon: `ios-earth` → `globe-outline` in ProfileScreen.tsx
- Cleaned up commented code and improved formatting
- Updated notification handler types and properties
- Committed fix with comprehensive icon updates
- User tested and confirmed all icons display correctly

#### Decisions

- Used modern Ionicons import syntax for updated files
- Maintained existing `list-outline` icon for summary/reCalc button
- Applied consistent `*-outline` naming convention throughout

#### Discovered

- Issue was caused by Ionicons library update breaking iOS-specific icon names
- Some files in codebase use mixed import patterns for Ionicons
- Code review identified potential remaining `ios-git-compare-outline` icons in other files
