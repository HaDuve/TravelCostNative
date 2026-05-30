import * as React from "react";

jest.mock("../../util/currencyExchange", () => ({
  getRate: jest.fn(async () => 1),
}));

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(async () => {}),
  ImpactFeedbackStyle: { Light: "Light" },
}));

const mockToastShow = jest.fn();
jest.mock("react-native-toast-message", () => ({
  __esModule: true,
  default: {
    show: (...args: unknown[]) => mockToastShow(...args),
    hide: jest.fn(),
  },
}));

import { fireEvent } from "@testing-library/react-native";
import { Modal, StyleSheet } from "react-native";

import { i18n } from "../../i18n/i18n";
import ExpensesSummary from "../../components/ExpensesOutput/ExpensesSummary";
import { shadowRegressionStyles } from "../../styles/shadow-regression-styles";
import { makeExpense } from "../fixtures/expense";
import { renderWithAppProviders } from "../fixtures/app-providers";

describe("ExpensesSummary", () => {
  beforeEach(() => {
    mockToastShow.mockClear();
  });

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

  it("opens the budget overview modal on press and dismisses via close", () => {
    const expenses = [makeExpense({ calcAmount: 75, amount: 75 })];

    const screen = renderWithAppProviders(
      <ExpensesSummary expenses={expenses} periodName="month" />,
      {
        wrapNavigation: false,
        expenses: {
          expenses,
          getRecentExpenses: () => expenses,
        },
      },
    );

    expect(screen.queryByText(i18n.t("overview"))).toBeNull();

    fireEvent.press(screen.getByTestId("expenses-summary-pressable"));

    expect(screen.getByText(i18n.t("overview"))).toBeTruthy();

    fireEvent.press(screen.getByTestId("budget-overview-close"));

    expect(screen.queryByText(i18n.t("overview"))).toBeNull();
  });

  it("shows per-traveller budget bars in the overview modal", () => {
    const expenses = [makeExpense({ calcAmount: 75, amount: 75 })];

    const screen = renderWithAppProviders(
      <ExpensesSummary expenses={expenses} periodName="month" />,
      {
        wrapNavigation: false,
        expenses: {
          expenses,
          getRecentExpenses: () => expenses,
        },
      },
    );

    fireEvent.press(screen.getByTestId("expenses-summary-pressable"));

    expect(
      screen.getByText(new RegExp(i18n.t("budgetPerTraveller"))),
    ).toBeTruthy();
    expect(screen.getByText("Alice")).toBeTruthy();
    expect(screen.getByText("Bob")).toBeTruthy();
    expect(
      mockToastShow.mock.calls.some(
        (call) => (call[0] as { type?: string }).type === "budgetOverview",
      ),
    ).toBe(false);
  });

  it("dismisses the budget overview modal when the backdrop is pressed", () => {
    const expenses = [makeExpense({ calcAmount: 75, amount: 75 })];

    const screen = renderWithAppProviders(
      <ExpensesSummary expenses={expenses} periodName="month" />,
      {
        wrapNavigation: false,
        expenses: {
          expenses,
          getRecentExpenses: () => expenses,
        },
      },
    );

    fireEvent.press(screen.getByTestId("expenses-summary-pressable"));
    fireEvent.press(screen.getByTestId("budget-overview-backdrop"));

    expect(screen.queryByText(i18n.t("overview"))).toBeNull();
  });

  it("shows overview without per-traveller list for a single traveller", () => {
    const expenses = [makeExpense({ calcAmount: 50, amount: 50 })];

    const screen = renderWithAppProviders(
      <ExpensesSummary expenses={expenses} periodName="month" />,
      {
        wrapNavigation: false,
        trip: { travellers: ["Alice"] },
        expenses: {
          expenses,
          getRecentExpenses: () => expenses,
        },
      },
    );

    fireEvent.press(screen.getByTestId("expenses-summary-pressable"));

    expect(screen.getByText(i18n.t("overview"))).toBeTruthy();
    expect(
      screen.queryByText(new RegExp(i18n.t("budgetPerTraveller"))),
    ).toBeNull();
  });

  it("shows an error toast instead of the modal when the period budget is unlimited", () => {
    const expenses = [makeExpense({ calcAmount: 50, amount: 50 })];

    const screen = renderWithAppProviders(
      <ExpensesSummary expenses={expenses} periodName="total" />,
      {
        wrapNavigation: false,
        trip: { totalBudget: "", travellers: ["Alice"] },
        expenses: {
          expenses,
          getRecentExpenses: () => expenses,
        },
      },
    );

    fireEvent.press(screen.getByTestId("expenses-summary-pressable"));

    expect(screen.queryByText(i18n.t("overview"))).toBeNull();
    expect(mockToastShow).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "error",
        text1: i18n.t("noTotalBudget"),
        text2: i18n.t("infinityLeftToSpend"),
      }),
    );
  });

  it("dismisses the budget overview modal on Android back", () => {
    const expenses = [makeExpense({ calcAmount: 75, amount: 75 })];

    const screen = renderWithAppProviders(
      <ExpensesSummary expenses={expenses} periodName="month" />,
      {
        wrapNavigation: false,
        expenses: {
          expenses,
          getRecentExpenses: () => expenses,
        },
      },
    );

    fireEvent.press(screen.getByTestId("expenses-summary-pressable"));
    fireEvent(screen.UNSAFE_getByType(Modal), "requestClose");

    expect(screen.queryByText(i18n.t("overview"))).toBeNull();
  });
});
