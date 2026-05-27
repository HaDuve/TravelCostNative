import * as React from "react";

jest.mock("../../util/currencyExchange", () => ({
  getRate: jest.fn(async () => 1),
}));

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(async () => {}),
  ImpactFeedbackStyle: { Light: "Light" },
}));

import ExpensesSummary from "../../components/ExpensesOutput/ExpensesSummary";
import { makeExpense } from "../fixtures/expense";
import { renderWithAppProviders } from "../fixtures/app-providers";

describe("ExpensesSummary", () => {
  it("shows the period expense total in Trip currency", () => {
    const expenses = [makeExpense({ calcAmount: 75, amount: 75 })];

    const screen = renderWithAppProviders(
      <ExpensesSummary expenses={expenses} periodName="month" />,
      {
        wrapNavigation: false,
        expenses: {
          expenses,
          getRecentExpenses: () => expenses,
        },
      }
    );

    expect(screen.getByText(/75/)).toBeTruthy();
  });
});
