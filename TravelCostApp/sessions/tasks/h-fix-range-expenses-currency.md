---
task: h-fix-range-expenses-currency
branch: fix/range-expenses-currency
status: pending
created: 2025-09-18
modules: [components/ExpenseDetails, components/RangeCalculations, utils/currency]
---

# Fix Range Expenses Currency Conversion Issues in Shared Calculations

## Problem/Goal
Range expenses with currency conversion have issues in shared calculations. Problems occur in expense details split costs and in pressable sum top right header split daily range.

## Success Criteria
- [ ] Manual test range expenses with currency conversion
- [ ] Fix split costs calculation in expense details
- [ ] Fix pressable sum header split daily range calculation
- [ ] Analyze root cause of currency conversion issues
- [ ] Verify calculations match expected values

## Context Manifest

### How Range Expenses with Currency Conversion Currently Work

When a user creates a range expense (spanning multiple days), the system goes through a complex process that handles both currency conversion and expense splitting/sharing calculations:

**Range Expense Creation Flow (ManageExpense.tsx:275-362):**
The system first determines if an expense spans multiple days by comparing `startDate` and `endDate`. If they differ, it triggers `createRangedData()` which generates a unique `rangeId` and iterates through each day in the range. For each day, it creates a separate expense entry with the same data but different dates.

**Currency Conversion in Range Expenses (ManageExpense.tsx:482-502):**
Before creating range expenses, the system calculates `calcAmount` from the original amount using exchange rates. It fetches the rate between `tripCtx.tripCurrency` (base) and `expenseData.currency` (target) using `getRate()` from `util/currencyExchange.ts`. The calculated amount (`calcAmount = expenseData.amount / rate`) represents the expense value in the trip's base currency. Crucially, if the expense has split lists, each split gets the same exchange rate applied.

**Split Calculations with Currency (util/expense.ts:139-172):**
The `getTravellerSum()` function is where the core issue likely resides. When calculating expenses for a specific traveller, it handles two scenarios:
1. **Non-split expenses**: Uses either `calcAmount` or `amount` depending on whether currency conversion exists
2. **Split expenses**: This is where the complexity increases - it checks if conversion rate exists by comparing `expense.calcAmount !== expense.amount`, calculates the rate (`rate = expense.calcAmount / expense.amount`), then multiplies each split amount by this rate (`splitAmount = split.amount * rate`)

**The Problem Area - Split Amount Currency Conversion:**
The current logic assumes the split amounts are in the original expense currency and need conversion to the trip currency. However, in range expenses, the split amounts might already be processed or the rate calculation might be incorrectly applied multiple times or in the wrong direction.

**Expense Summary Calculations (ExpensesSummary.tsx:68-173):**
The "pressable sum header" refers to the budget summary component that displays total expenses and budget progress. This component calls `getExpensesSum(expenses, hideSpecial)` and `getTravellerSum(periodExpenses, traveller)` to calculate totals. The summary also handles currency conversion for display purposes using a separate rate fetched for the user's preferred currency vs trip currency.

**Range Expense Identification:**
Range expenses are identified by their `rangeId` field (util/expense.ts:42). All expenses belonging to the same range share this identifier. When displaying or calculating, the system must be careful not to double-count related expenses or misapply currency conversions.

### For Currency Conversion Issue Implementation

The problem likely occurs in one of these areas:

**Split Calculation Error (Most Likely):**
In `getTravellerSum()`, the rate calculation and application to split amounts may be incorrect for range expenses. The logic assumes split amounts are in the original currency, but range expenses might already have processed splits in the trip currency.

**Double Conversion Issue:**
Range expenses might be having their `calcAmount` calculated correctly during creation, but the split amounts might be getting double-converted when `getTravellerSum()` applies the rate again.

**Rate Direction Error:**
The rate might be applied in the wrong direction. The current logic uses `rate = expense.calcAmount / expense.amount` then `splitAmount = split.amount * rate`, but this assumes split amounts are in the original currency.

**Context Preservation in Range Creation:**
During range expense creation (`createRangedData()`), the split amounts and rates might not be preserved correctly across the multiple expense entries created for each day.

### Technical Reference Details

#### Key Function Signatures

```typescript
// Core calculation functions
export function getTravellerSum(expenses: ExpenseData[], traveller: string): number
export function getExpensesSum(expenses: ExpenseData[], hideSpecial = false): number
export async function getRate(base: string, target: string, forceNewRate = false): Promise<number>

// Range expense creation
const createRangedData = async (expenseData: ExpenseData) => Promise<void>
const editRangedData = async (expenseData: ExpenseData) => Promise<void>
```

#### Data Structures

```typescript
interface ExpenseData {
  amount: number;           // Original amount in expense currency
  calcAmount: number;       // Converted amount in trip currency
  currency: string;         // Expense currency
  splitList?: Split[];      // Array of split amounts
  rangeId?: string;         // Identifier for range expenses
  // ... other fields
}

interface Split {
  userName: string;
  amount: number;    // Split amount (currency context unclear)
  whoPaid?: string;
  rate?: number;     // Exchange rate applied to split
}
```

#### Configuration Requirements

- Trip currency set in TripContext
- User preferred currency in UserContext
- Exchange rates cached via MMKV storage
- Split type configuration (EQUAL, EXACT, SELF)

#### File Locations

- Currency conversion implementation: `util/currencyExchange.ts`
- Core calculation logic: `util/expense.ts:139-172` (getTravellerSum)
- Range expense creation: `screens/ManageExpense.tsx:275-362`
- Split calculation utilities: `util/split.ts:16-124`
- Summary display component: `components/ExpensesOutput/ExpensesSummary.tsx:68-173`
- Database/storage operations: `util/http.tsx` and MMKV storage

## Context Files
<!-- Added by context-gathering agent or manually -->

## User Notes
Manual test, analyze and fix issues in shared calculations for range expenses with currency conversion.

## Work Log
- [2025-09-18] Created task