//Localization
import * as Localization from "expo-localization";
import { getCurrencySymbol } from "./currencySymbol";

export function formatExpenseWithCurrency(
  amount: number,
  currency?: string,
  options?: Intl.NumberFormatOptions
): string {
  if (isNaN(amount)) {
    console.log("calling formatExpenseWithCurrency without a number");
    return "";
  }

  if (!currency) {
    console.log("calling formatExpenseWithCurrency without a currency");
    return amount.toFixed(2);
  }
  const locale = Localization.locale;

  const fractionOptions: Intl.NumberFormatOptions = {
    style: "currency",
    currency: currency,
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
    ...options,
  };
  const formatOptions: Intl.NumberFormatOptions = {
    style: "currency",
    currency: currency,
    currencyDisplay: "narrowSymbol",
    // maximumFractionDigits: 0,
    minimumFractionDigits: 2,
    ...options,
  };

  if (amount % 1 == 0) {
    try {
      return new Intl.NumberFormat(locale, fractionOptions)
        .format(amount)
        .replace(currency, getCurrencySymbol(currency));
    } catch (error) {
      return amount.toFixed(2) + " " + getCurrencySymbol(currency);
    }
  } else {
    try {
      return new Intl.NumberFormat(locale, formatOptions)
        .format(amount)
        .replace(currency, getCurrencySymbol(currency));
    } catch (error) {
      return amount.toFixed(0) + " " + getCurrencySymbol(currency);
    }
  }
}

export function truncateString(str: string, n: number) {
  if (!str || str.length < 1 || n < 1) return "";
  return str.length > n ? str.slice(0, n - 1) + "..." : str;
}
