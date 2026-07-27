import type { ExpenseFieldValidity } from "./expense-form-submit";
import { countryToAlpha2 } from "country-to-iso";
import i18nIsoCountries from "i18n-iso-countries";

export type ExpenseFormInputField = {
  value: string;
  isValid: boolean;
};

export type DefaultNewExpenseLocaleInput = {
  lastCurrency: string;
  tripCurrency: string;
  mostRecentExpenseCurrency?: string;
};

/** Default expense currency for a new expense (latest-used wins over trip habits). */
export function resolveDefaultNewExpenseCurrency(
  input: DefaultNewExpenseLocaleInput
): string {
  if (input.lastCurrency?.trim()) {
    return input.lastCurrency;
  }
  if (input.mostRecentExpenseCurrency?.trim()) {
    return input.mostRecentExpenseCurrency;
  }
  return input.tripCurrency;
}

export type DefaultNewExpenseCountryInput = {
  lastCountry: string;
  mostRecentExpenseCountry?: string;
};

/** Default expense country for a new expense (latest-used wins over trip habits). */
export function resolveDefaultNewExpenseCountry(
  input: DefaultNewExpenseCountryInput
): string {
  if (input.lastCountry?.trim()) {
    return input.lastCountry;
  }
  return input.mostRecentExpenseCountry?.trim() ?? "";
}

export function countriesRepresentSamePlace(a: string, b: string): boolean {
  const normalize = (value: string): string => {
    const trimmed = value?.trim() ?? "";
    if (!trimmed) return "";
    if (trimmed.length === 2) {
      return trimmed.toUpperCase();
    }
    const alpha2 = countryToAlpha2(trimmed);
    return alpha2?.toUpperCase() ?? trimmed.toLowerCase();
  };

  return normalize(a) === normalize(b);
}

/** English label used by CountryPicker for a stored country code or name. */
export function countryLabelForPicker(country: string): string {
  const trimmed = country?.trim() ?? "";
  if (!trimmed) return "";
  if (trimmed.length === 2) {
    return i18nIsoCountries.getName(trimmed.toUpperCase(), "en") ?? trimmed;
  }
  return trimmed;
}

export type LoadedLastCountrySyncInput = {
  isEditing: boolean;
  lastCountry: string;
  currentCountry: string;
  mostRecentExpenseCountry?: string;
};

/** Country to apply after secure-storage lastCountry loads on a still-default form. */
export function resolveLoadedLastCountryIfStale(
  input: LoadedLastCountrySyncInput
): string | null {
  if (input.isEditing || !input.lastCountry?.trim()) {
    return null;
  }

  const preferred = resolveDefaultNewExpenseCountry({
    lastCountry: input.lastCountry,
    mostRecentExpenseCountry: input.mostRecentExpenseCountry,
  });
  const beforeLastCountryLoaded = resolveDefaultNewExpenseCountry({
    lastCountry: "",
    mostRecentExpenseCountry: input.mostRecentExpenseCountry,
  });

  if (
    countriesRepresentSamePlace(input.currentCountry, beforeLastCountryLoaded) &&
    !countriesRepresentSamePlace(preferred, input.currentCountry)
  ) {
    return preferred;
  }

  return null;
}

export type LoadedLastCurrencySyncInput = {
  isEditing: boolean;
  lastCurrency: string;
  currentCurrency: string;
  tripCurrency: string;
  mostRecentExpenseCurrency?: string;
};

/** Currency to apply after secure-storage lastCurrency loads on a still-default form. */
export function resolveLoadedLastCurrencyIfStale(
  input: LoadedLastCurrencySyncInput
): string | null {
  if (input.isEditing || !input.lastCurrency?.trim()) {
    return null;
  }

  const preferred = resolveDefaultNewExpenseCurrency({
    lastCurrency: input.lastCurrency,
    tripCurrency: input.tripCurrency,
    mostRecentExpenseCurrency: input.mostRecentExpenseCurrency,
  });
  const beforeLastCurrencyLoaded = resolveDefaultNewExpenseCurrency({
    lastCurrency: "",
    tripCurrency: input.tripCurrency,
    mostRecentExpenseCurrency: input.mostRecentExpenseCurrency,
  });

  if (
    input.currentCurrency === beforeLastCurrencyLoaded &&
    preferred !== input.currentCurrency
  ) {
    return preferred;
  }

  return null;
}

export type ExpenseFormInputsState = {
  amount: ExpenseFormInputField;
  date: ExpenseFormInputField;
  description: ExpenseFormInputField;
  category: ExpenseFormInputField;
  country: ExpenseFormInputField;
  currency: ExpenseFormInputField;
  whoPaid: ExpenseFormInputField;
};

/** Quick-sum amount: main field + keypad temp, matching ExpenseForm derivation. */
export function resolveAmountValue(
  inputsAmount: string,
  tempAmount: string
): string | number {
  const hasTempAndInput = !!(inputsAmount && tempAmount);
  if (hasTempAndInput) {
    return +inputsAmount + +tempAmount;
  }
  return inputsAmount.length > 0 ? inputsAmount : tempAmount;
}

export function applyFieldValidityToInputs(
  inputs: ExpenseFormInputsState,
  fieldValidity: ExpenseFieldValidity
): ExpenseFormInputsState {
  return {
    amount: { value: inputs.amount.value, isValid: fieldValidity.amount },
    date: { value: inputs.date.value, isValid: fieldValidity.date },
    description: {
      value: inputs.description.value,
      isValid: fieldValidity.description,
    },
    category: {
      value: inputs.category.value,
      isValid: fieldValidity.category,
    },
    country: { value: inputs.country.value, isValid: fieldValidity.country },
    currency: {
      value: inputs.currency.value,
      isValid: fieldValidity.currency,
    },
    whoPaid: { value: inputs.whoPaid.value, isValid: fieldValidity.whoPaid },
  };
}
