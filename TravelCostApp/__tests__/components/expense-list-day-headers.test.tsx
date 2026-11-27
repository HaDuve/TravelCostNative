import * as React from "react";
import { AppState } from "react-native";
import { act, fireEvent } from "@testing-library/react-native";

const mockNavigate = jest.fn();
const mockFocusListeners = new Set<() => void>();
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    popToTop: jest.fn(),
    addListener: (event: string, listener: () => void) => {
      if (event === "focus") mockFocusListeners.add(listener);
      return () => mockFocusListeners.delete(listener);
    },
  }),
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

function renderList(
  expenses: ReturnType<typeof makeExpense>[],
  periodName: string,
) {
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
    },
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

  it("shows no time on a Ranged expense day, which only carries the time it was created at", () => {
    const hotel = makeExpense({
      id: "e-hotel",
      description: "hotel",
      date: at(11, 27, 20, 0),
      startDate: at(11, 26, 20, 0),
      endDate: at(11, 28, 20, 0),
      rangeId: "r1",
    });
    const screen = renderList([hotel, ...weekExpenses()], "week");

    expect(screen.getByText("hotel")).toBeTruthy();
    expect(screen.queryByText("20:00")).toBeNull();
    expect(screen.getByText("13:00")).toBeTruthy();
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

  it("splits today into time-of-day headers in the day period, rows showing only the time", () => {
    const screen = renderList(
      [
        expenseOn("e-snack", "onigiri", at(11, 27, 14, 30)),
        expenseOn("e-coffee", "coffee", at(11, 27, 9, 5)),
      ],
      "day",
    );

    const headers = screen.getAllByRole("header").map((h) => h.props.children);
    expect(headers).toEqual(["Just now", "This morning"]);
    expect(screen.getByText("09:05")).toBeTruthy();
  });

  it("puts a day header above each day in the month period", () => {
    const screen = renderList(weekExpenses(), "month");

    const headers = screen.getAllByRole("header").map((h) => h.props.children);
    expect(headers).toEqual(["Today", "Yesterday", "Monday 23.11"]);
    expect(screen.getByText("20:15")).toBeTruthy();
  });

  it.each(["year", "total"])(
    "puts month headers in the %s period and keeps the short date on rows",
    (periodName) => {
      const screen = renderList(
        [...weekExpenses(), expenseOn("e-flight", "flight", at(10, 30, 7, 0))],
        periodName,
      );

      const headers = screen
        .getAllByRole("header")
        .map((h) => h.props.children);
      expect(headers).toEqual(["This month", "October 2026"]);
      expect(screen.queryByText("20:15")).toBeNull();
      expect(screen.getAllByText(/Nov/).length).toBeGreaterThan(0);
    },
  );

  it("moves Just now into its time-of-day group when the app comes back after more than an hour", () => {
    const appStateListeners: ((state: string) => void)[] = [];
    const appStateSpy = jest
      .spyOn(AppState, "addEventListener")
      .mockImplementation((_event, listener) => {
        appStateListeners.push(listener as (state: string) => void);
        return { remove: jest.fn() } as never;
      });
    try {
      const screen = renderList(
        [expenseOn("e-snack", "onigiri", at(11, 27, 14, 30))],
        "day",
      );
      expect(screen.getByRole("header").props.children).toBe("Just now");

      // backgrounded until 16:10, then brought back
      jest.setSystemTime(at(11, 27, 16, 10));
      act(() => {
        appStateListeners.forEach((listener) => listener("background"));
      });
      expect(screen.getByRole("header").props.children).toBe("Just now");
      act(() => {
        appStateListeners.forEach((listener) => listener("active"));
      });

      expect(screen.getByRole("header").props.children).toBe("This afternoon");
    } finally {
      appStateSpy.mockRestore();
    }
  });

  it("refreshes the labels when the screen regains focus", () => {
    const screen = renderList(
      [expenseOn("e-snack", "onigiri", at(11, 27, 14, 30))],
      "day",
    );
    expect(screen.getByRole("header").props.children).toBe("Just now");

    jest.setSystemTime(at(11, 27, 16, 10));
    act(() => {
      mockFocusListeners.forEach((listener) => listener());
    });

    expect(screen.getByRole("header").props.children).toBe("This afternoon");
  });

  it("renders headers in cheap-render mode for a week longer than the render threshold", () => {
    const count = MAX_EXPENSES_RENDER + 10;
    const expenses = Array.from({ length: count }, (_, i) =>
      // newest first: today from 14:59 backwards, one minute apart
      expenseOn(`e${i}`, `expense ${i}`, at(11, 27, 14, 59 - i)),
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

  it("renders month headers and short dates in cheap-render mode for a long year", () => {
    const count = MAX_EXPENSES_RENDER + 10;
    const expenses = Array.from({ length: count }, (_, i) =>
      // newest first: one Expense a day going back from today
      expenseOn(`e${i}`, `expense ${i}`, new Date(2026, 10, 27 - i, 12, 0)),
    );

    const screen = renderList(expenses, "year");

    const headers = screen.getAllByRole("header").map((h) => h.props.children);
    expect(headers[0]).toBe("This month");
    expect(screen.queryByText("12:00")).toBeNull();
    fireEvent.press(screen.getByText("expense 1"));
    expect(mockNavigate).toHaveBeenCalledWith("ManageExpense", {
      expenseId: "e1",
    });
  });
});
