import type { ExpenseFieldValidity } from "./expense-form-submit";

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
