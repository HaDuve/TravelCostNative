//Localization
import * as Localization from "expo-localization";
import { getCurrencySymbol } from "./currencySymbol";

export function formatExpenseWithCurrency(
  amount: number | string,
  currency?: string,
  options?: Intl.NumberFormatOptions
): string {
  if (typeof amount === "string") amount = Number(amount);
  if (isNaN(amount)) {
    console.warn("calling formatExpenseWithCurrency without a number");
    return "";
  }

  if (!currency) {
    // console.log("calling formatExpenseWithCurrency without a currency");
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

export function truncateNumber(
  num: number,
  border?: number,
  asNumber?: boolean,
  digits = 0
) {
  if (asNumber) {
    if (isNaN(num)) return 0;
    if (num > border) return Number(num.toFixed(digits));
    return num;
  }
  if (isNaN(num)) return "";
  if (num > border) return num.toFixed(digits);
  return num.toFixed(0);
}
