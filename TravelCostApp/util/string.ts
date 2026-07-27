import { i18n } from "../i18n/i18n";
import * as Localization from "expo-localization";

import { getCurrencySymbol } from "./currencySymbol";

export function formatExpenseWithCurrency(
  amount: number | string,
  currency?: string,
  options?: Intl.NumberFormatOptions
): string {
  if (typeof amount === "string") amount = Number(amount);
  if (isNaN(amount)) {
    // safeLogError("calling formatExpenseWithCurrency with a NaN");
    return "";
  }

  if (!currency) {
    return amount.toFixed(2);
  }
  const locale =
    Localization.getLocales()[0] && Localization.getLocales()[0].languageTag
      ? Localization.getLocales()[0].languageTag
      : "en-US";

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

export function processTitleStringFilteredPiecharts(
  periodName: string,
  tripCurrency: string,
  itemData: {
    item: {
      sumCat: number;
    };
  }
) {
  // period name can be translated or not
  const nonTranslatedPeriodNames = ["day", "week", "month", "year", "all"];
  const dictionaryToTranslate = {
    day: "today",
    week: "thisWeek",
    month: "thisMonth",
    year: "thisYear",
    all: "totalLabel",
  };
  nonTranslatedPeriodNames.forEach((nonTranslatedString) => {
    if (periodName.includes(nonTranslatedString)) {
      periodName = periodName.replace(
        nonTranslatedString,
        i18n.t(dictionaryToTranslate[nonTranslatedString])
      );
    }
  });
  // to process the period name we must take out the last part of the string ending with "-"
  // take into consideration that some strings dont have a "-" at the end
  const lastDashIndex = periodName.lastIndexOf("-");
  const noIndexFound = lastDashIndex === -1;
  const periodNameProcessed = noIndexFound
    ? periodName + " - "
    : periodName.slice(0, lastDashIndex + 1) + " ";
  const newPeriodName =
    periodNameProcessed +
    formatExpenseWithCurrency(itemData.item.sumCat, tripCurrency);
  return newPeriodName;
}

export function truncateString(str: string, n: number) {
  if (!str || str?.length < 1 || n < 1) return "";
  return str?.length > n ? str.slice(0, n - 1) + "..." : str;
}

type CompactScale = { threshold: number; suffixes: Record<string, string> };

const COMPACT_SCALES: CompactScale[] = [
  {
    threshold: 1_000_000_000,
    suffixes: { en: "b", de: " Mrd.", fr: " Md", ru: " млрд" },
  },
  {
    threshold: 1_000_000,
    suffixes: { en: "m", de: " Mio.", fr: " M", ru: " млн" },
  },
  {
    threshold: 1_000,
    suffixes: { en: "k", de: "k", fr: "k", ru: "k" },
  },
];

function languageFromLocale(locale: string): string {
  return locale.slice(0, 2).toLowerCase();
}

function compactSuffix(language: string, absAmount: number): { scale: number; suffix: string } | null {
  for (const { threshold, suffixes } of COMPACT_SCALES) {
    if (absAmount >= threshold) {
      return {
        scale: threshold,
        suffix: suffixes[language] ?? suffixes.en,
      };
    }
  }
  return null;
}

function currencySymbolGoesFirst(locale: string, currency: string): boolean {
  try {
    const parts = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
    }).formatToParts(1);
    const currencyIndex = parts.findIndex((p) => p.type === "currency");
    const numberIndex = parts.findIndex(
      (p) => p.type === "integer" || p.type === "decimal"
    );
    return currencyIndex !== -1 && numberIndex !== -1 && currencyIndex < numberIndex;
  } catch {
    return languageFromLocale(locale) === "en";
  }
}

/**
 * Space-saving compact currency amount (k / Mio. / Mrd. etc.).
 * Used when the full formatExpenseWithCurrency string does not fit.
 */
export function formatCompactExpenseWithCurrency(
  amount: number | string,
  currency?: string,
  locale = "en"
): string {
  if (typeof amount === "string") amount = Number(amount);
  if (isNaN(amount)) {
    return "";
  }
  if (!currency) {
    return formatExpenseWithCurrency(amount, currency);
  }

  const abs = Math.abs(amount);
  const language = languageFromLocale(locale);
  const compact = compactSuffix(language, abs);
  if (!compact) {
    return formatExpenseWithCurrency(amount, currency);
  }

  const scaled = abs / compact.scale;
  const decimalSep =
    language === "en" ? "." : ",";
  const mantissa = Number.isInteger(scaled)
    ? String(scaled)
    : scaled.toFixed(1).replace(".", decimalSep);
  const sign = amount < 0 ? "-" : "";
  const body = `${sign}${mantissa}${compact.suffix}`;
  const symbol = getCurrencySymbol(currency);

  return currencySymbolGoesFirst(locale, currency)
    ? `${symbol}${body}`
    : `${body}${symbol}`;
}

/**
 * Truncates or limits a number to a specified border value,
 * with options for formatting.
 * @param num The number to truncate.
 * @param border The border value to truncate the number. Default is 1000.
 * @param asNumber Determines whether to return the result as a number (true) or string (false). Default is true.
 * @param digits The number of digits after the decimal point for the truncated number. Default is 0.
 * @returns The truncated number or string based on the provided parameters.
 */
export function truncateNumber(
  num: number | undefined,
  border = 1000,
  asNumber = true,
  digits = 0
) {
  if (num === undefined || num === null || isNaN(num)) {
    return asNumber ? 0 : "";
  }

  const isNumGreaterThanBorder = num > border;

  if (asNumber) {
    if (isNumGreaterThanBorder) {
      return Number(num.toFixed(digits));
    }
    return num;
  }

  if (isNumGreaterThanBorder) {
    return num.toFixed(digits);
  }

  return num.toFixed(0);
}
