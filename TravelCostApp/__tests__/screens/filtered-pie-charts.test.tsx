import * as React from "react";
import { Text } from "react-native";
import { fireEvent } from "@testing-library/react-native";

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(async () => {}),
  ImpactFeedbackStyle: { Light: "Light" },
}));

// Stub the heavy chart contents so this test isolates the navigation-arrow
// behavior of the FilteredPieCharts screen (each chart is its own unit).
jest.mock(
  "../../components/ExpensesOutput/ExpenseStatistics/ExpenseCategories",
  () => () => null
);
jest.mock(
  "../../components/ExpensesOutput/ExpenseStatistics/ExpenseTravellers",
  () => () => null
);
jest.mock(
  "../../components/ExpensesOutput/ExpenseStatistics/ExpenseCountries",
  () => () => null
);
jest.mock(
  "../../components/ExpensesOutput/ExpenseStatistics/ExpenseCurrencies",
  () => () => null
);
jest.mock("../../screens/FilteredExpenses", () => () => null);

import FilteredPieCharts from "../../screens/FilteredPieCharts";
import { renderWithAppProviders } from "../fixtures/app-providers";
import { makeExpense } from "../fixtures/expense";
import { i18n } from "../../i18n/i18n";

const CATEGORIES = i18n.t("categories");
const TRAVELLERS = i18n.t("travellers");
const COUNTRIES = i18n.t("countries");
const CURRENCIES = i18n.t("currencies");
const EXPENSES = i18n.t("expenses");

function renderScreen(routeOverrides: Record<string, unknown> = {}) {
  const navigation = { navigate: jest.fn(), pop: jest.fn() };
  const route = {
    params: {
      expenses: [makeExpense({ id: "e1" })],
      dayString: "May 2026",
      noList: false,
      ...routeOverrides,
    },
  };
  const screen = renderWithAppProviders(
    <FilteredPieCharts navigation={navigation as any} route={route as any} />
  );
  return { screen, navigation };
}

// The currently shown chart is identified by its title. Matched with a tight
// regex because the title <Text> is padded with surrounding spaces.
function expectActiveTitle(screen: ReturnType<typeof renderScreen>["screen"], title: string) {
  expect(screen.getByText(new RegExp(`^\\s*${title}\\s*$`))).toBeTruthy();
}

describe("FilteredPieCharts navigation arrows", () => {
  it("always renders both navigation arrows above the chart", () => {
    const { screen } = renderScreen();

    expect(screen.getByTestId("icon-chevron-back-outline")).toBeTruthy();
    expect(screen.getByTestId("icon-chevron-forward-outline")).toBeTruthy();
  });

  it("advances through the charts and wraps around when pressing forward", () => {
    const { screen } = renderScreen();

    expectActiveTitle(screen, CATEGORIES);

    const forward = () =>
      fireEvent.press(screen.getByTestId("icon-chevron-forward-outline"));

    forward();
    expectActiveTitle(screen, TRAVELLERS);
    forward();
    expectActiveTitle(screen, COUNTRIES);
    forward();
    expectActiveTitle(screen, CURRENCIES);
    forward();
    expectActiveTitle(screen, EXPENSES);
    forward();
    expectActiveTitle(screen, CATEGORIES);
  });

  it("steps backward and wraps to the last chart when pressing previous", () => {
    const { screen } = renderScreen();

    expectActiveTitle(screen, CATEGORIES);

    fireEvent.press(screen.getByTestId("icon-chevron-back-outline"));
    expectActiveTitle(screen, EXPENSES);
  });

  it("excludes the expenses list and stops cycling at currencies when noList is set", () => {
    const { screen } = renderScreen({ noList: true });

    fireEvent.press(screen.getByTestId("icon-chevron-back-outline"));
    expectActiveTitle(screen, CURRENCIES);
  });
});
