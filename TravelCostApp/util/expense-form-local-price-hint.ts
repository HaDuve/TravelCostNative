import { i18n } from "../i18n/i18n";
import { DuplicateOption } from "./expense";
import {
  divideAmountForRangedSplit,
  multiplyAmountForRangedDuplicate,
} from "./expense-form-range";

type ExpenseFormLocalPriceHintParams = {
  product: string;
  country: string;
  price?: string;
  currency?: string;
  inclusiveDayCount?: number;
  duplOrSplit?: DuplicateOption | number;
  alreadyDividedAmountByDays?: boolean;
};

function formatDealAmount(amount: number): string {
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
}

/** Per-day rate and span total for a ranged local-price deal prompt. */
export function resolveLocalPriceDealPerDayAndSum(input: {
  amount: number;
  inclusiveDayCount: number;
  duplOrSplit?: DuplicateOption | number;
  alreadyDividedAmountByDays?: boolean;
}): { perDay: number; sum: number } | null {
  if (input.inclusiveDayCount <= 1) return null;

  const mode = Number(input.duplOrSplit ?? DuplicateOption.null);
  if (
    mode !== DuplicateOption.duplicate &&
    mode !== DuplicateOption.split
  ) {
    return null;
  }

  const isUndividedSplit =
    mode === DuplicateOption.split && !input.alreadyDividedAmountByDays;

  if (isUndividedSplit) {
    return {
      perDay: Number(
        divideAmountForRangedSplit(
          input.amount,
          input.inclusiveDayCount
        ).toFixed(2)
      ),
      sum: input.amount,
    };
  }

  return {
    perDay: input.amount,
    sum: multiplyAmountForRangedDuplicate(
      input.amount,
      input.inclusiveDayCount
    ),
  };
}

type LocalPriceDealAmountPhraseParams = {
  price: string;
  currency: string;
  inclusiveDayCount?: number;
  duplOrSplit?: DuplicateOption | number;
  alreadyDividedAmountByDays?: boolean;
};

/** English amount clause for GPT prompts (and shared math with the UI hint). */
export function localPriceDealAmountPhrase({
  price,
  currency,
  inclusiveDayCount = 1,
  duplOrSplit = DuplicateOption.null,
  alreadyDividedAmountByDays = false,
}: LocalPriceDealAmountPhraseParams): string {
  const ranged = resolveLocalPriceDealPerDayAndSum({
    amount: Number(price),
    inclusiveDayCount,
    duplOrSplit,
    alreadyDividedAmountByDays,
  });
  if (ranged) {
    return `${formatDealAmount(ranged.perDay)} ${currency} over ${inclusiveDayCount} days (sum ${formatDealAmount(ranged.sum)} ${currency})`;
  }
  return `${price} ${currency}`;
}

/** Contextual ActionRow hint for the expense form "Get local price" row. */
export function expenseFormLocalPriceHint({
  product,
  country,
  price,
  currency,
  inclusiveDayCount = 1,
  duplOrSplit = DuplicateOption.null,
  alreadyDividedAmountByDays = false,
}: ExpenseFormLocalPriceHintParams): string {
  const trimmedProduct = product.trim();
  if (price && price !== "" && !Number.isNaN(Number(price))) {
    const currencyLabel = currency ?? "";
    const ranged = resolveLocalPriceDealPerDayAndSum({
      amount: Number(price),
      inclusiveDayCount,
      duplOrSplit,
      alreadyDividedAmountByDays,
    });
    if (ranged) {
      return i18n.t("getLocalPriceExpenseDealHintRanged", {
        price: formatDealAmount(ranged.perDay),
        currency: currencyLabel,
        days: inclusiveDayCount,
        sum: formatDealAmount(ranged.sum),
        product: trimmedProduct,
        country,
      });
    }
    return i18n.t("getLocalPriceExpenseDealHint", {
      price,
      currency: currencyLabel,
      product: trimmedProduct,
      country,
    });
  }
  return i18n.t("getLocalPriceExpenseHint", {
    product: trimmedProduct,
    country,
  });
}
