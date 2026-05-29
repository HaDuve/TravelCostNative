import { useCallback, useMemo, useState } from "react";

import {
  applyFieldValidityToInputs,
  resolveAmountValue,
  type ExpenseFormInputsState,
} from "../util/expense-form-inputs";
import type { ExpenseFieldValidity } from "../util/expense-form-submit";

export type UseExpenseFormInputsOptions = {
  initialInputs: ExpenseFormInputsState;
  onInputChange?: (inputIdentifier: string, enteredValue: string) => void;
};

export function useExpenseFormInputs({
  initialInputs,
  onInputChange,
}: UseExpenseFormInputsOptions) {
  const [inputs, setInputs] = useState(initialInputs);
  const [tempAmount, setTempAmount] = useState("");

  const amountValue = useMemo(
    () => resolveAmountValue(inputs.amount.value, tempAmount),
    [inputs.amount.value, tempAmount]
  );

  const inputChangedHandler = useCallback(
    (inputIdentifier: string, enteredValue: string) => {
      setInputs((curInputs) => ({
        ...curInputs,
        [inputIdentifier]: { value: enteredValue, isValid: true },
      }));
      onInputChange?.(inputIdentifier, enteredValue);
    },
    [onInputChange]
  );

  const applyFieldValidity = useCallback((fieldValidity: ExpenseFieldValidity) => {
    setInputs((curInputs) => applyFieldValidityToInputs(curInputs, fieldValidity));
  }, []);

  return {
    inputs,
    setInputs,
    tempAmount,
    setTempAmount,
    amountValue,
    inputChangedHandler,
    applyFieldValidity,
  };
}
