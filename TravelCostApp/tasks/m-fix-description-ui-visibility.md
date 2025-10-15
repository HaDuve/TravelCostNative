# Task: Move Description Field to Less Options Area

## Priority: Medium

## Type: Fix

## Branch: fix/description-ui-visibility

## Description

Put description field into the "less options" area of manage Expense screen. It's important enough to show for quick creation of expenses, so it should be visible by default rather than hidden in the advanced options.

## Success Criteria

- Description field is visible in the main form area (not hidden behind "show more options")
- Description field remains easily accessible for quick expense creation
- UI layout remains clean and functional
- No breaking changes to existing functionality

## Technical Requirements

- Move description field from advanced options to main form area
- Ensure proper styling and layout
- Maintain existing functionality and validation
- Keep the field accessible for both new and editing flows

## Files to Investigate

- ExpenseForm.tsx - main form component
- UI layout and styling
- Advanced options toggle logic

## Implementation Notes

- Currently description is in the advanced options section (hideAdvanced logic)
- Need to move it to the main form area above the advanced options
- Should be visible by default for better UX
- Maintain existing autocomplete functionality

## Status

- [ ] Context gathering
- [ ] Implementation
- [ ] Testing
- [ ] Documentation
