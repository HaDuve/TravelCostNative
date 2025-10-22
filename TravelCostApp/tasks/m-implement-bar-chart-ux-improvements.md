---
task: m-implement-bar-chart-ux-improvements
branch: feature/bar-chart-ux-improvements
status: in-progress
created: 2025-01-27
started: 2025-01-27
modules: [components/charts, components/ExpensesOutput, components/ExpensesOverview]
---

# UX: Improve Bar Chart Handling

## Problem/Goal
Improve the user experience of bar chart interactions by consolidating modifying buttons, redesigning add/remove controls, removing longpress functionality, adding budget lines, and implementing dynamic bar widths.

## Success Criteria
- [ ] Put all modifying buttons into one accordion view with a settings cog icon
- [ ] Change all "add/remove days" buttons into a nice panel with layout: "More/Less-Text: (-|+|resetIcon)"
- [ ] Remove the longpress functions of the "add-days/weeks/months/years-button" and cleanup respective code
- [ ] Add a smooth line in the correct gray color to show the daily/weekly/monthly/yearly budget
- [ ] Set the width of the bars dynamic respective on the number of bars and the width of the chart (so there is always a small margin between the bars)

## Context Files
<!-- Added by context-gathering agent or manually -->
- components/ExpensesOutput/ExpenseStatistics/ExpenseGraph.tsx - Main component with modifying buttons and longpress handlers
- components/ExpensesOverview/ExpenseChart.tsx - Chart component wrapper
- components/charts/chartHelpers.ts - Chart configuration and data processing
- components/charts/controller.tsx - Chart controller with data processing logic
- components/charts/WebViewChart.tsx - WebView chart implementation

## User Notes
<!-- Any specific notes or requirements from the developer -->
- User prefers single components instead of using forwardRefs and prefers hooks and functions over classes
- Need to maintain existing functionality while improving UX
- Budget line should be visible and properly styled
- Dynamic bar width should ensure proper spacing

## Work Log
<!-- Updated as work progresses -->
- [2025-01-27] Created task for bar chart UX improvements
- [2025-01-27] Started work on analyzing current implementation
- [2025-01-27] Identified ExpenseGraph.tsx as main component with modifying buttons
- [2025-01-27] Found longpress handlers in renderItem functions for day/week/month/year cases
- [2025-01-27] Located FlatButton components for "showMore" functionality
- [2025-01-27] Created Accordion component with settings cog icon for collapsible UI
- [2025-01-27] Created PeriodControlPanel component with More/Less layout and reset functionality
- [2025-01-27] Updated chartHelpers.ts to support budget lines and dynamic bar widths
- [2025-01-27] Modified ExpenseChart.tsx to pass budget and chart width to chart data creation
- [2025-01-27] Removed all longpress functionality from ExpenseGraph.tsx renderItem functions
- [2025-01-27] Replaced FlatButton components with new Accordion and PeriodControlPanel components
- [2025-01-27] Cleaned up unused variables and imports
- [2025-01-27] Fixed all linting errors
- [2025-01-27] All bar chart UX improvements completed successfully
