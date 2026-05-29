import { act, renderHook } from "@testing-library/react-native";

import { useExpenseFormInputs } from "../../hooks/useExpenseFormInputs";
import { validateExpenseData } from "../../util/expense-form-submit";
import type { ExpenseFormInputsState } from "../../util/expense-form-inputs";
import { makeExpense } from "../fixtures/expense";

function makeInitialInputs(): ExpenseFormInputsState {
  return {
    amount: { value: "10", isValid: true },
    date: { value: "2026-01-15", isValid: true },
    description: { value: "coffee", isValid: true },
    category: { value: "food", isValid: true },
    country: { value: "US", isValid: true },
    currency: { value: "EUR", isValid: true },
    whoPaid: { value: "alice", isValid: true },
  };
}

describe("useExpenseFormInputs", () => {
  it("updates a field via inputChangedHandler and resets validity", () => {
    const onInputChange = jest.fn();
    const { result } = renderHook(() =>
      useExpenseFormInputs({
        initialInputs: makeInitialInputs(),
        onInputChange,
      })
    );

    act(() => {
      result.current.inputChangedHandler("description", "lunch");
    });

    expect(result.current.inputs.description).toEqual({
      value: "lunch",
      isValid: true,
    });
    expect(onInputChange).toHaveBeenCalledWith("description", "lunch");
  });

  it("derives amountValue from amount input and temp amount", () => {
    const { result } = renderHook(() =>
      useExpenseFormInputs({ initialInputs: makeInitialInputs() })
    );

    act(() => {
      result.current.setTempAmount("5");
    });

    expect(result.current.amountValue).toBe(15);
  });

  it("applies field validity flags from validateExpenseData", () => {
    const { fieldValidity } = validateExpenseData(
      makeExpense({ amount: 0, description: "   " })
    );
    const { result } = renderHook(() =>
      useExpenseFormInputs({ initialInputs: makeInitialInputs() })
    );

    act(() => {
      result.current.applyFieldValidity(fieldValidity);
    });

    expect(result.current.inputs.amount.isValid).toBe(false);
    expect(result.current.inputs.description.isValid).toBe(false);
    expect(result.current.inputs.amount.value).toBe("10");
  });
});
