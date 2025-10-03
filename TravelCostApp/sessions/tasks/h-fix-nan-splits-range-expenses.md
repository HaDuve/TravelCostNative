---
task: h-fix-nan-splits-range-expenses
branch: fix/nan-splits-range-expenses
status: pending
created: 2025-01-27
modules:
  [
    util/expense.ts,
    screens/ManageExpense.tsx,
    components/ExpensesOutput/ExpensesSummary.tsx,
    util/split.ts,
  ]
---

# Fix NaN Splits and Range Expenses Calculation Issues

## Problem/Goal

Range expenses with currency conversion are generating NaN values in split calculations, causing crashes and incorrect totals. Additionally, range expenses are being counted only once per range instead of properly summing all days, leading to smaller weekly/monthly/yearly totals than expected.

## Success Criteria

- [ ] Eliminate all NaN values in split calculations at the source
- [ ] Fix range expenses to properly sum all days in weekly/monthly/yearly calculations
- [ ] Ensure currency conversion works correctly for range expenses
- [ ] Verify that range expenses are counted correctly in all summary views
- [ ] Add comprehensive validation to prevent future NaN issues
- [ ] Test edge cases: zero amounts, invalid currencies, missing rates

## Context Files

### Core Range Expense Creation Logic
- @screens/ManageExpense.tsx:275-362 - `createRangedData()` function that creates multiple expense entries for date ranges
- @screens/ManageExpense.tsx:482-502 - Currency conversion logic that stores rates in split objects
- @screens/ManageExpense.tsx:295-308 - Range expense amount division logic for split expenses

### Split Calculation and Currency Conversion
- @util/expense.ts:137-150 - `deduplicateRangeExpenses()` function that filters range expenses
- @util/expense.ts:169-207 - `getTravellerSum()` function with currency conversion logic
- @util/expense.ts:152-167 - `getExpensesSum()` function that uses deduplication
- @util/split.ts:285-372 - `calcOpenSplitsTable()` function with rate calculations

### Time Period Calculations
- @store/expenses-context.tsx:308-328 - `getRecentExpenses()` function for different time periods
- @store/expenses-context.tsx:372-389 - `getWeeklyExpenses()` function
- @store/expenses-context.tsx:352-371 - `getMonthlyExpenses()` function
- @store/expenses-context.tsx:329-351 - `getYearlyExpenses()` function
- @components/ExpensesOutput/ExpensesSummary.tsx:97-127 - Period-specific expense retrieval

### Data Structures and Interfaces
- @util/expense.ts:23-48 - `ExpenseData` interface with `rangeId` and `splitList` fields
- @util/expense.ts:87-92 - `Split` interface with `rate` field for currency conversion
- @store/expenses-context.tsx:13-19 - `RangeString` enum for time period calculations

### Problem Areas Identified
- @util/split.ts:337-344 - Rate calculation using `expense.amount / expense.calcAmount` (inverse of expected)
- @util/expense.ts:196-200 - Rate recalculation in `getTravellerSum()` instead of using stored `split.rate`
- @util/expense.ts:137-150 - Deduplication logic that may be incorrectly applied to time period calculations

## User Notes

The current fixes only address symptoms (NaN validation) but not the root cause. Need to investigate:

1. Why NaN values are generated in the first place during range expense creation
2. How range expenses should be calculated in different time periods
3. Whether the deduplication logic is correct for all use cases
4. Currency conversion rate consistency across range expense days

## Detailed Problem Analysis

### NaN Values Root Cause
**Issue**: Range expenses with currency conversion generate NaN values in split calculations
**Location**: `util/expense.ts:196-200` in `getTravellerSum()`
**Problem**: 
- Rate is recalculated using `expense.calcAmount / expense.amount` instead of using stored `split.rate`
- When range expenses are created, amounts are divided by `(days + 1)` but rates are not updated accordingly
- This creates inconsistency between stored rates and calculated rates, leading to NaN values

**Data Flow**:
1. `createRangedData()` stores rate in `split.rate` (ManageExpense.tsx:500)
2. Range amounts are divided by `(days + 1)` (ManageExpense.tsx:306)
3. `getTravellerSum()` recalculates rate instead of using stored rate
4. Mismatch causes NaN values

### Range Expenses Calculation Bug
**Issue**: Range expenses counted only once instead of summing all days in weekly/monthly/yearly calculations
**Location**: `util/expense.ts:137-150` in `deduplicateRangeExpenses()`
**Problem**:
- Deduplication logic filters out all but one expense per `rangeId`
- This is correct for total calculations but wrong for time period calculations
- Weekly/monthly/yearly summaries should sum all days of range expenses

**Expected Behavior**:
- Total calculations: Count each range once (current behavior is correct)
- Time period calculations: Sum all days that fall within the period (current behavior is wrong)

### Currency Conversion Inconsistencies
**Issue**: Multiple rate calculation methods that don't align
**Locations**:
- `util/split.ts:337` - Uses `expense.amount / expense.calcAmount` (inverse rate)
- `util/expense.ts:197` - Uses `expense.calcAmount / expense.amount` (correct rate)
- `screens/ManageExpense.tsx:485` - Stores rate from `getRate()` function

**Problem**: Different parts of the code use different rate calculation methods, causing inconsistencies

## Implementation Guidance

### Fix 1: Use Stored Rates Consistently
- Modify `getTravellerSum()` to use `split.rate` when available
- Only recalculate rate as fallback when stored rate is missing/invalid
- Ensure rate consistency across all calculation functions

### Fix 2: Context-Aware Deduplication
- Create separate functions for total vs time period calculations
- `getExpensesSumTotal()` - uses deduplication (current behavior)
- `getExpensesSumPeriod()` - sums all days within period (new behavior)
- Update `ExpensesSummary.tsx` to use appropriate function based on context

### Fix 3: Standardize Rate Calculations
- Audit all rate calculation locations
- Use consistent rate calculation method: `expense.calcAmount / expense.amount`
- Update `util/split.ts:337` to use correct rate direction
- Add validation to prevent division by zero

### Fix 4: Range Expense Amount Handling
- When dividing range amounts by days, update stored rates accordingly
- Or maintain original amounts and apply day division only during display
- Ensure currency conversion works correctly for both approaches

### Testing Strategy
- Test range expenses with different currencies
- Test weekly/monthly/yearly calculations with range expenses
- Test edge cases: zero amounts, missing rates, invalid currencies
- Verify totals match expected values

## Work Log

- [2025-01-27] Created task after previous fixes didn't resolve root cause
- [2025-01-27] Added comprehensive context analysis and implementation guidance
