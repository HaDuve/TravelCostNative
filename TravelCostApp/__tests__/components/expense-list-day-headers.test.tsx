import * as React from "react";
import { act, fireEvent } from "@testing-library/react-native";

const mockNavigate = jest.fn();
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: mockNavigate, popToTop: jest.fn() }),
}));

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(async () => {}),
  ImpactFeedbackStyle: { Light: "Light" },
}));

jest.mock("../../util/vexo-tracking", () => ({
  trackEvent: jest.fn(),
}));

jest.mock("../../util/http", () => ({
  fetchTripName: jest.fn(async () => "Japan 2026"),
  touchAllTravelers: jest.fn(async () => {}),
}));

jest.mock("../../components/ExpensesOutput/ExpenseCountryFlag", () => {
  const { View } = require("react-native");
  return function MockExpenseCountryFlag() {
    return <View />;
  };
});

import ExpensesList from "../../components/ExpensesOutput/ExpensesList";
import { MAX_EXPENSES_RENDER } from "../../confAppConstants";
import { makeExpense } from "../fixtures/expense";
import { renderWithAppProviders } from "../fixtures/app-providers";

function at(month: number, day: number, hour: number, minute = 0): Date {
  return new Date(2026, month - 1, day, hour, minute);
}

function expenseOn(id: string, description: string, date: Date) {
  return makeExpense({ id, description, date, startDate: date, endDate: date });
}

function renderList(expenses: ReturnType<typeof makeExpense>[], periodName: string) {
  return renderWithAppProviders(
    <ExpensesList
      expenses={expenses}
      showSumForTravellerName=""
      isFiltered={false}
      refreshControl={undefined}
      refreshing={false}
    />,
    {
    wrapNavigation: false,
      user: { periodName, tripHistory: [] },
    }
  );
}

describe("ExpensesList day headers", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    jest.useFakeTimers();
    // Friday 27 November 2026, local time (TZ=Europe/Berlin in jest)
    jest.setSystemTime(at(11, 27, 15, 0));
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  const weekExpenses = () => [
    expenseOn("e-lunch", "ramen", at(11, 27, 13, 0)),
    expenseOn("e-dinner", "sushi", at(11, 26, 20, 15)),
    expenseOn("e-taxi", "taxi", at(11, 23, 8, 40)),
  ];

  it("announces Today, Yesterday and weekday captions as headers in the week period", () => {
    const screen = renderList(weekExpenses(), "week");

    const headers = screen.getAllByRole("header").map((h) => h.props.children);
    expect(headers).toEqual(["Today", "Yesterday", "Monday 23.11"]);
  });

  it("shows only the time on rows under a day header", () => {
    const screen = renderList(weekExpenses(), "week");

    expect(screen.getByText("20:15")).toBeTruthy();
    expect(screen.queryByText(/Nov/)).toBeNull();
  });

  it("opens the tapped Expense when headers sit between rows", () => {
    const screen = renderList(weekExpenses(), "week");

    fireEvent.press(screen.getByText("taxi"));

    expect(mockNavigate).toHaveBeenCalledWith("ManageExpense", {
      expenseId: "e-taxi",
    });
  });

  it("long-press selects the pressed Expense, not a neighbour", () => {
    const screen = renderList(weekExpenses(), "week");

    fireEvent(screen.getByText("sushi"), "longPress");

    expect(screen.getAllByTestId("icon-checkmark-circle")).toHaveLength(1);
    expect(screen.getAllByTestId("icon-ellipse-outline")).toHaveLength(2);
  });

  it("select-all selects every Expense and no header", () => {
    const screen = renderList(weekExpenses(), "week");
    fireEvent(screen.getByText("sushi"), "longPress");

    fireEvent.press(screen.getByTestId("icon-checkmark-done-outline"));
    act(() => {
      jest.runOnlyPendingTimers();
    });

    expect(screen.getAllByTestId("icon-checkmark-circle")).toHaveLength(3);
    expect(screen.queryAllByTestId("icon-ellipse-outline")).toHaveLength(0);
  });

  it.each(["day", "month", "year", "total"])(
    "keeps the %s period list without headers",
    (periodName) => {
      const screen = renderList(weekExpenses(), periodName);

      expect(screen.queryAllByRole("header")).toHaveLength(0);
      expect(screen.getByText("taxi")).toBeTruthy();
    }
  );

  it("renders headers in cheap-render mode for a week longer than the render threshold", () => {
    const count = MAX_EXPENSES_RENDER + 10;
    const expenses = Array.from({ length: count }, (_, i) =>
      // newest first: today from 14:59 backwards, one minute apart
      expenseOn(`e${i}`, `expense ${i}`, at(11, 27, 14, 59 - (i % 60)))
    );

    const screen = renderList(expenses, "week");

    const headers = screen.getAllByRole("header").map((h) => h.props.children);
    expect(headers[0]).toBe("Today");
    expect(screen.getByText("14:59")).toBeTruthy();
    fireEvent.press(screen.getByText("expense 1"));
    expect(mockNavigate).toHaveBeenCalledWith("ManageExpense", {
      expenseId: "e1",
    });
  });
});
