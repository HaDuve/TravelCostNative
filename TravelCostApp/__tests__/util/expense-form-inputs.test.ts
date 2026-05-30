import {
  applyFieldValidityToInputs,
  resolveAmountValue,
  resolveDefaultNewExpenseCountry,
  resolveDefaultNewExpenseCurrency,
} from "../../util/expense-form-inputs";
import type { ExpenseFormInputsState } from "../../util/expense-form-inputs";

function makeInputs(
  overrides: Partial<{
    amount: string;
    date: string;
    description: string;
    category: string;
    country: string;
    currency: string;
    whoPaid: string;
  }> = {}
): ExpenseFormInputsState {
  return {
    amount: { value: overrides.amount ?? "", isValid: true },
    date: { value: overrides.date ?? "2026-01-15", isValid: true },
    description: { value: overrides.description ?? "", isValid: true },
    category: { value: overrides.category ?? "food", isValid: true },
    country: { value: overrides.country ?? "US", isValid: true },
    currency: { value: overrides.currency ?? "USD", isValid: true },
    whoPaid: { value: overrides.whoPaid ?? "alice", isValid: true },
  };
}

describe("resolveDefaultNewExpenseCurrency", () => {
  it("prefers the user's latest-used currency over trip home currency", () => {
    expect(
      resolveDefaultNewExpenseCurrency({
        lastCurrency: "USD",
        tripCurrency: "EUR",
      })
    ).toBe("USD");
  });

  it("prefers the user's latest-used currency over the most recent trip expense", () => {
    expect(
      resolveDefaultNewExpenseCurrency({
        lastCurrency: "USD",
        tripCurrency: "EUR",
        mostRecentExpenseCurrency: "EUR",
      })
    ).toBe("USD");
  });

  it("falls back to the most recent trip expense when no latest-used currency is set", () => {
    expect(
      resolveDefaultNewExpenseCurrency({
        lastCurrency: "",
        tripCurrency: "EUR",
        mostRecentExpenseCurrency: "GBP",
      })
    ).toBe("GBP");
  });

  it("falls back to trip home currency when nothing else is available", () => {
    expect(
      resolveDefaultNewExpenseCurrency({
        lastCurrency: "",
        tripCurrency: "EUR",
      })
    ).toBe("EUR");
  });
});

describe("resolveDefaultNewExpenseCountry", () => {
  it("prefers the user's latest-used country over trip expense defaults", () => {
    expect(
      resolveDefaultNewExpenseCountry({
        lastCountry: "US",
        mostRecentExpenseCountry: "DE",
      })
    ).toBe("US");
  });
});

describe("resolveAmountValue", () => {
  it("sums amount input and temp amount when both are set", () => {
    expect(resolveAmountValue("10", "5")).toBe(15);
  });

  it("uses amount input when temp amount is empty", () => {
    expect(resolveAmountValue("42", "")).toBe("42");
  });

  it("uses temp amount when amount input is empty", () => {
    expect(resolveAmountValue("", "7")).toBe("7");
  });

  it("returns empty string when both amount input and temp amount are empty", () => {
    expect(resolveAmountValue("", "")).toBe("");
  });
});

describe("applyFieldValidityToInputs", () => {
  it("updates isValid flags from field validity without changing values", () => {
    const inputs = makeInputs({
      amount: "0",
      description: "   ",
    });

    const next = applyFieldValidityToInputs(inputs, {
      amount: false,
      date: true,
      description: false,
      whoPaid: true,
      category: true,
      country: true,
      currency: true,
    });

    expect(next.amount).toEqual({ value: "0", isValid: false });
    expect(next.description).toEqual({ value: "   ", isValid: false });
    expect(next.date.value).toBe("2026-01-15");
    expect(next.date.isValid).toBe(true);
  });
});
