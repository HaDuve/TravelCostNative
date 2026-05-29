import type { ExpenseFieldValidity } from "./expense-form-submit";

export type ExpenseFormInputField = {
  value: string;
  isValid: boolean;
};

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
