import type { ExpenseData } from "./expense";
import { countryToAlpha2 } from "country-to-iso";

const MAX_RECENT_PICKER_ITEMS = 5;

export function normalizePickerCountryKey(country: string): string {
  const trimmed = country?.trim() ?? "";
  if (!trimmed) return "";
  if (trimmed.length === 2) {
    return trimmed.toUpperCase();
  }
  const alpha2 = countryToAlpha2(trimmed);
  return alpha2?.toUpperCase() ?? trimmed.toLowerCase();
}

export function normalizePickerCurrencyKey(currency: string): string {
  return currency?.trim().toUpperCase() ?? "";
}

function buildRecentPickerItems(
  expenses: ExpenseData[],
  lastUsed: string,
  getValue: (expense: ExpenseData) => string | undefined,
  normalizeKey: (value: string) => string
): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  const add = (raw: string) => {
    const trimmed = raw?.trim();
    if (!trimmed) return;
    const key = normalizeKey(trimmed);
    if (!key || seen.has(key)) return;
    seen.add(key);
    result.push(trimmed);
  };

  if (lastUsed?.trim()) {
    add(lastUsed);
  }

  const sortedExpenses = [...expenses]
    .filter((expense) => !expense.isDeleted)
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  for (const expense of sortedExpenses) {
    if (result.length >= MAX_RECENT_PICKER_ITEMS) break;
    const value = getValue(expense);
    if (value) add(value);
  }

  return result;
}

export function getRecentPickerCountries(
  expenses: ExpenseData[],
  lastCountry: string
): string[] {
  return buildRecentPickerItems(
    expenses,
    lastCountry,
    (expense) => expense.country,
    normalizePickerCountryKey
  );
}

export function getRecentPickerCurrencies(
  expenses: ExpenseData[],
  lastCurrency: string
): string[] {
  return buildRecentPickerItems(
    expenses,
    lastCurrency,
    (expense) => expense.currency,
    normalizePickerCurrencyKey
  );
}
