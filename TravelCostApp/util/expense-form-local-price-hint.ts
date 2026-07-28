import { i18n } from "../i18n/i18n";

type ExpenseFormLocalPriceHintParams = {
  product: string;
  country: string;
  price?: string;
  currency?: string;
};

/** Contextual ActionRow hint for the expense form "Get local price" row. */
export function expenseFormLocalPriceHint({
  product,
  country,
  price,
  currency,
}: ExpenseFormLocalPriceHintParams): string {
  const trimmedProduct = product.trim();
  if (price && price !== "" && !Number.isNaN(Number(price))) {
    return i18n.t("getLocalPriceExpenseDealHint", {
      price,
      currency: currency ?? "",
      product: trimmedProduct,
      country,
    });
  }
  return i18n.t("getLocalPriceExpenseHint", {
    product: trimmedProduct,
    country,
  });
}
