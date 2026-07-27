import type { ExpenseData } from "./expense";
import { normalizeCountryKey } from "./expense-form-inputs";

const MAX_RECENT_PICKER_ITEMS = 5;

export function normalizePickerCurrencyKey(currency: string): string {
  return currency?.trim().toUpperCase() ?? "";
}

export type PickerDropdownItem = {
  label: string;
  value: string;
  disabled?: boolean;
};

export function buildPinnedPickerDropdownItems<T extends PickerDropdownItem>(
  recentItems: Array<T | null | undefined>,
  allItems: T[]
): Array<T | PickerDropdownItem> {
  const pinned = recentItems.filter((item): item is T => item != null);
  if (pinned.length === 0) {
    return allItems;
  }

  const separator: PickerDropdownItem = {
    label: "────────────────────────",
    value: "__separator__",
    disabled: true,
  };

  return allItems.length > 0
    ? [...pinned, separator, ...allItems]
    : [...pinned];
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
    normalizeCountryKey
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
