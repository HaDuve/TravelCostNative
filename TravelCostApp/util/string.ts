import { i18n } from "../i18n/i18n";
import * as Localization from "expo-localization";

import { getCurrencySymbol } from "./currencySymbol";

export function formatExpenseWithCurrency(
  amount: number | string,
  currency?: string,
  options?: Intl.NumberFormatOptions,
  localeOverride?: string
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
    localeOverride ||
    (Localization.getLocales()[0] && Localization.getLocales()[0].languageTag
      ? Localization.getLocales()[0].languageTag
      : "en-US");

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

function formatCompactMantissa(
  absAmount: number,
  language: string
): { mantissa: string; suffix: string } | null {
  let scaleEntry =
    COMPACT_SCALES.find(({ threshold }) => absAmount >= threshold) ?? null;
  if (!scaleEntry) return null;

  let scale = scaleEntry.threshold;
  let rounded = Number((absAmount / scale).toFixed(1));

  // Carry to the next larger scale when rounding reaches 1000 (e.g. 999999 → 1 Mio.)
  const scaleIndex = COMPACT_SCALES.findIndex((s) => s.threshold === scale);
  if (rounded >= 1000 && scaleIndex > 0) {
    scaleEntry = COMPACT_SCALES[scaleIndex - 1];
    scale = scaleEntry.threshold;
    rounded = Number((absAmount / scale).toFixed(1));
  }

  const decimalSep = language === "en" ? "." : ",";
  const mantissa = Number.isInteger(rounded)
    ? String(rounded)
    : rounded.toFixed(1).replace(".", decimalSep);

  return {
    mantissa,
    suffix: scaleEntry.suffixes[language] ?? scaleEntry.suffixes.en,
  };
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
    return formatExpenseWithCurrency(amount, currency, undefined, locale);
  }

  const abs = Math.abs(amount);
  const language = languageFromLocale(locale);
  const compact = formatCompactMantissa(abs, language);
  if (!compact) {
    return formatExpenseWithCurrency(amount, currency, undefined, locale);
  }

  const sign = amount < 0 ? "-" : "";
  const body = `${sign}${compact.mantissa}${compact.suffix}`;
  const symbol = getCurrencySymbol(currency);

  return currencySymbolGoesFirst(locale, currency)
    ? `${symbol}${body}`
    : `${body}${symbol}`;
}
