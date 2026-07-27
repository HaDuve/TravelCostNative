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

  it("still shows summary when leftover gate flag is set on an Active trip", () => {
    const expenses = [makeExpense({ calcAmount: 40, amount: 40 })];

    const screen = renderWithAppProviders(
      <ExpensesSummary expenses={expenses} periodName="month" />,
      {
        wrapNavigation: false,
        user: { freshlyCreated: true },
        expenses: {
          expenses,
          getRecentExpenses: () => expenses,
        },
        trip: {
          tripid: "t-implicit",
          tripCurrency: "EUR",
          isImplicitDefault: true,
          travellers: ["Alice"],
        },
      }
    );

    expect(screen.getByTestId("expenses-summary-pressable")).toBeTruthy();
    expect(screen.getByText(/40/)).toBeTruthy();
  });

  it("hides progress when the Active trip is budget-free", () => {
    const expenses = [makeExpense({ calcAmount: 40, amount: 40 })];

    const screen = renderWithAppProviders(
      <ExpensesSummary expenses={expenses} periodName="month" />,
      {
        wrapNavigation: false,
        expenses: {
          expenses,
          getRecentExpenses: () => expenses,
        },
        trip: {
          tripid: "t-implicit",
          tripCurrency: "EUR",
          isImplicitDefault: true,
          dailyBudget: "0",
          totalBudget: "0",
          travellers: ["Alice"],
        },
      }
    );

    expect(screen.getByTestId("expenses-summary-pressable")).toBeTruthy();
    expect(screen.queryByTestId("expenses-summary-progress")).toBeNull();
  });

  it("hides total progress for daily-only trips", () => {
    const expenses = [makeExpense({ calcAmount: 40, amount: 40 })];

    const screen = renderWithAppProviders(
      <ExpensesSummary expenses={expenses} periodName="total" />,
      {
        wrapNavigation: false,
        expenses: {
          expenses,
          getRecentExpenses: () => expenses,
        },
        trip: {
          dailyBudget: "50",
          totalBudget: "0",
          travellers: ["Alice"],
        },
      }
    );

    expect(screen.getByTestId("expenses-summary-pressable")).toBeTruthy();
    expect(screen.queryByTestId("expenses-summary-progress")).toBeNull();
  });

  it("hides period progress for total-only trips", () => {
    const expenses = [makeExpense({ calcAmount: 40, amount: 40 })];

    const screen = renderWithAppProviders(
      <ExpensesSummary expenses={expenses} periodName="month" />,
      {
        wrapNavigation: false,
        expenses: {
          expenses,
          getRecentExpenses: () => expenses,
        },
        trip: {
          dailyBudget: "0",
          totalBudget: "2000",
          travellers: ["Alice"],
        },
      }
    );

    expect(screen.getByTestId("expenses-summary-pressable")).toBeTruthy();
    expect(screen.queryByTestId("expenses-summary-progress")).toBeNull();
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
        trip: { travellers: [{ uid: "u1", userName: "Alice" }] },
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

  it("hides total progress when total budget is unset (MAX sentinel)", () => {
    const expenses = [makeExpense({ calcAmount: 50, amount: 50 })];

    const screen = renderWithAppProviders(
      <ExpensesSummary expenses={expenses} periodName="total" />,
      {
        wrapNavigation: false,
        trip: {
          totalBudget: "3435973836",
          dailyBudget: "50",
          travellers: [{ uid: "u1", userName: "Alice" }],
        },
        expenses: {
          expenses,
          getRecentExpenses: () => expenses,
        },
      },
    );

    expect(screen.getByTestId("expenses-summary-pressable")).toBeTruthy();
    expect(screen.queryByTestId("expenses-summary-progress")).toBeNull();
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
