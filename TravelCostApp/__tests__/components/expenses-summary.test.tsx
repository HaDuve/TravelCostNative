import * as React from "react";

jest.mock("../../util/currencyExchange", () => ({
  getRate: jest.fn(async () => 1),
}));

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(async () => {}),
  ImpactFeedbackStyle: { Light: "Light" },
}));

import { StyleSheet } from "react-native";

import ExpensesSummary from "../../components/ExpensesOutput/ExpensesSummary";
import { shadowRegressionStyles } from "../../styles/shadow-regression-styles";
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

  it("uses dropdown-matching shadow chrome on the budget summary pressable", () => {
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

    const pressable = screen.getByTestId("expenses-summary-pressable");
    const flat = StyleSheet.flatten(pressable.props.style) as Record<
      string,
      unknown
    >;
    const dropdownChrome = StyleSheet.flatten(
      shadowRegressionStyles.expensesSummaryContainer
    ) as Record<string, unknown>;

    expect(flat.borderWidth).toBe(dropdownChrome.borderWidth);
    expect(flat.shadowColor).toBe(dropdownChrome.shadowColor);
    expect(flat.flex).toBe(dropdownChrome.flex);
    expect(flat.maxWidth).toBe(dropdownChrome.maxWidth);
    expect(flat.alignItems).toBe("center");
    expect(flat.paddingTop).toBeUndefined();
  });
});
