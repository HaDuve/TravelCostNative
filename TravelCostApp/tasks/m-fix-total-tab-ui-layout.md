# Task: Fix Total Tab UI Layout

## Priority: Medium

## Type: Fix

## Branch: fix/total-tab-ui-layout

## Description

Fix UI breaking in "total" tab by removing the "needsMoreSpace" logic. The layout should be auto-handled by fontsize now, so the manual space management is no longer needed and is causing UI issues.

## Success Criteria

- Remove needsMoreSpace logic from total tab
- UI layout is properly handled by fontsize automatically
- No more UI breaking issues in the total tab
- Layout remains responsive and functional
- Clean up any related unused code

## Technical Requirements

- Find and remove needsMoreSpace logic
- Ensure layout is handled by fontsize automatically
- Test that total tab displays correctly
- Remove any related conditional styling or logic
- Maintain existing functionality

## Files to Investigate

- Total tab related components
- Overview screen components
- Any components with needsMoreSpace logic
- Chart or display components in total view

## Implementation Notes

- Look for needsMoreSpace variable or logic
- Check total tab/overview screen components
- May be related to chart sizing or text display
- Should be a simple removal of manual space management

## Status

- [ ] Context gathering
- [ ] Implementation
- [ ] Testing
- [ ] Documentation
