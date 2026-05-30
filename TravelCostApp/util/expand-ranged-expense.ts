import { DuplicateOption, type ExpenseData, type Split } from "./expense";
import { distributeRangedAmount } from "./expense-form-range";
export type ExpandRangedExpenseInput = {
  rangeId: string | null;
  dates: Date[];
};

type RangedExpenseSource = ExpenseData & {
  alreadyDividedAmountByDays?: boolean;
};

function distributeRangedExpenseAmounts(
  expenseData: RangedExpenseSource,
  dayCount: number
): Pick<ExpenseData, "amount" | "calcAmount" | "splitList"> {
  if (Number(expenseData.duplOrSplit) !== DuplicateOption.split) {
    return {
      amount: expenseData.amount,
      calcAmount: expenseData.calcAmount,
      splitList: expenseData.splitList?.map((split) => ({ ...split })),
    };
  }

  const rangedDistributeInput = {
    dayCount,
    mode: DuplicateOption.split,
    alreadyDivided: Boolean(expenseData.alreadyDividedAmountByDays),
  };

  const distribute = (total: number) =>
    distributeRangedAmount({ total, ...rangedDistributeInput });

  return {
    amount: distribute(expenseData.amount),
    calcAmount: distribute(expenseData.calcAmount),
    splitList: (expenseData.splitList ?? []).map((split: Split) => ({
      ...split,
      amount: distribute(split.amount),
    })),
  };
}

/** Expands one submitted **Ranged expense** into per-day **Expense** records to persist. */
export function expandRangedExpense(
  expenseData: RangedExpenseSource,
  input: ExpandRangedExpenseInput
): ExpenseData[] {
  const dayCount = input.dates.length;
  const { amount, calcAmount, splitList } = distributeRangedExpenseAmounts(
    expenseData,
    dayCount
  );
  const rangeId = dayCount === 1 ? null : input.rangeId ?? null;

  return input.dates.map((date) => ({
    ...expenseData,
    amount,
    calcAmount,
    splitList: splitList?.map((split) => ({ ...split })),
    date,
    rangeId,
  }));
}
