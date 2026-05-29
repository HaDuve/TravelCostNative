import { daysBetween } from "./date";
import { DuplicateOption } from "./expense";

export function countInclusiveDaysInRange(
  startDate: Date,
  endDate: Date
): number {
  if (!startDate || !endDate) return 1;
  return daysBetween(endDate, startDate) + 1;
}

export function multiplyAmountForRangedDuplicate(
  amount: number,
  inclusiveDayCount: number
): number {
  return amount * inclusiveDayCount;
}

export function divideAmountForRangedSplit(
  amount: number,
  inclusiveDayCount: number
): number {
  return amount / inclusiveDayCount;
}

export function resolveAlreadyDividedAmountByDays(
  isEditing: boolean,
  duplOrSplit: DuplicateOption | number,
  helperStateForDividing: boolean
): boolean {
  let alreadyDividedAmountByDays =
    isEditing && Number(duplOrSplit) === DuplicateOption.split;
  if (helperStateForDividing) alreadyDividedAmountByDays = false;
  return alreadyDividedAmountByDays;
}

export function formatRangedAmountFieldValue(amount: number): string {
  return amount.toFixed(2);
}

export type CollapseRangeToSingleDayInput = {
  amount: number;
  inclusiveDayCount: number;
  duplOrSplit: DuplicateOption | number;
  alreadyDividedAmountByDays: boolean;
};

export function resolveAmountWhenCollapsingRangeToSingleDay(
  input: CollapseRangeToSingleDayInput
): string | null {
  if (Number(input.duplOrSplit) !== DuplicateOption.split) return null;

  // Matches ExpenseForm's two sequential handlers: when both run, the divide
  // call wins because it uses the original amount, not the multiplied value.
  if (!input.alreadyDividedAmountByDays) {
    return formatRangedAmountFieldValue(
      divideAmountForRangedSplit(input.amount, input.inclusiveDayCount)
    );
  }
  return formatRangedAmountFieldValue(
    multiplyAmountForRangedDuplicate(input.amount, input.inclusiveDayCount)
  );
}

export type RangedPromptLabels = {
  duplString1: string;
  duplString2: string;
  duplString3: string;
  duplString4: string;
  splitString1: string;
  splitString2: string;
  splitString3: string;
  total: string;
};

export type RangedPromptInput = {
  amount: number;
  inclusiveDayCount: number;
  formatAmount: (amount: number) => string;
  labels: RangedPromptLabels;
};

export type RangedSplitPromptInput = RangedPromptInput & {
  alreadyDividedAmountByDays: boolean;
};

export function buildRangedDuplicatePromptString(
  input: RangedPromptInput
): string {
  const expenseString = input.formatAmount(input.amount);
  const expenseTimesDaysString = input.formatAmount(
    multiplyAmountForRangedDuplicate(input.amount, input.inclusiveDayCount)
  );
  const { labels } = input;
  return `${labels.duplString1} ${expenseString} ${labels.duplString2} ${input.inclusiveDayCount} ${labels.duplString3}. \n${labels.duplString4} ${expenseTimesDaysString} ${labels.total}`;
}

export function buildRangedSplitPromptString(
  input: RangedSplitPromptInput
): string {
  const expenseString = input.formatAmount(input.amount);
  const expenseTimesDaysString = input.formatAmount(
    multiplyAmountForRangedDuplicate(input.amount, input.inclusiveDayCount)
  );
  const expenseDividedByDaysString = input.formatAmount(
    divideAmountForRangedSplit(input.amount, input.inclusiveDayCount)
  );
  const { labels } = input;

  if (input.alreadyDividedAmountByDays) {
    return `${labels.splitString1} ${expenseTimesDaysString}\n${labels.splitString2} ${input.inclusiveDayCount} ${labels.splitString3} ${expenseString}`;
  }

  return `${labels.splitString1} ${expenseString}\n${labels.splitString2} ${input.inclusiveDayCount} ${labels.splitString3} ${expenseDividedByDaysString}`;
}

export function buildRangedDuplOrSplitPromptString(
  duplOrSplitNum: number,
  input: RangedSplitPromptInput
): string {
  if (duplOrSplitNum === DuplicateOption.duplicate) {
    return buildRangedDuplicatePromptString(input);
  }
  if (duplOrSplitNum === DuplicateOption.split) {
    return buildRangedSplitPromptString(input);
  }
  return "";
}
