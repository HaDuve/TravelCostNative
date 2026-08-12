import * as React from "react";
import { Dimensions, StyleSheet } from "react-native";

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: jest.fn(), pop: jest.fn() }),
}));

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(async () => {}),
  ImpactFeedbackStyle: { Light: "Light" },
}));

jest.mock("../../util/vexo-tracking", () => ({
  trackEvent: jest.fn(),
}));

import FilteredExpenses from "../../screens/FilteredExpenses";
import LayoutContextProvider from "../../store/layout-context";
import { makeExpense } from "../fixtures/expense";
import { renderWithAppProviders } from "../fixtures/app-providers";
import { toExpenseNavigationDtos } from "../../util/expense-navigation-dto";

const expenses = [
  makeExpense({ id: "e1", description: "Coffee", calcAmount: 5 }),
  makeExpense({ id: "e2", description: "Lunch", calcAmount: 12 }),
];

function renderFilteredExpensesAt(width: number, height: number) {
  jest.spyOn(Dimensions, "get").mockReturnValue({
    width,
    height,
    scale: 3,
    fontScale: 1,
  });

  return renderWithAppProviders(
    <LayoutContextProvider>
      <FilteredExpenses
        route={{
          params: {
            expenses: toExpenseNavigationDtos(expenses),
            dayString: "Today",
          },
        }}
      />
    </LayoutContextProvider>,
    {
      wrapNavigation: false,
      trip: { tripid: "t1", tripName: "Trip", tripCurrency: "EUR" },
      expenses: {
        expenses,
        getDailyExpenses: jest.fn(() => []),
      },
    }
  );
}

describe("Filtered modal tablet layout", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("wraps filtered expense lists in ModalFrame with a centered max width at 600px+", () => {
    const screen = renderFilteredExpensesAt(700, 900);
    const frame = StyleSheet.flatten(
      screen.getByTestId("filtered-expenses-modal-frame").props.style
    ) as Record<string, unknown>;

    expect(frame.maxWidth).toBe(600);
    expect(frame.alignSelf).toBe("center");
  });

  it("uses a two-column expense grid once the modal breakpoint is wide", () => {
    const screen = renderFilteredExpensesAt(700, 900);

    expect(screen.getByTestId("filtered-expenses-grid")).toBeTruthy();
    expect(screen.getAllByTestId("responsive-grid-column")).toHaveLength(2);
  });

  it("keeps filtered expenses in one column on narrow phones", () => {
    const screen = renderFilteredExpensesAt(390, 844);

    expect(screen.queryByTestId("filtered-expenses-grid")).toBeNull();
    expect(screen.queryAllByTestId("responsive-grid-column")).toHaveLength(0);
  });
});
