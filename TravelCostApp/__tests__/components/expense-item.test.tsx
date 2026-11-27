import * as React from "react";
import { StyleSheet } from "react-native";

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(async () => {}),
  ImpactFeedbackStyle: { Light: "Light" },
}));

jest.mock("../../util/vexo-tracking", () => ({
  trackEvent: jest.fn(),
}));

jest.mock("../../components/ExpensesOutput/ExpenseCountryFlag", () => {
  const { View } = require("react-native");
  return function MockExpenseCountryFlag({ containerStyle }: { containerStyle?: unknown }) {
    return <View testID="expense-item-country-flag" style={containerStyle} />;
  };
});

import ExpenseItem from "../../components/ExpensesOutput/ExpenseItem";
import { makeExpense } from "../fixtures/expense";
import { renderWithAppProviders } from "../fixtures/app-providers";
import { assertSolidBackgroundForShadow, styleHasShadow } from "../../util/shadow-styles";

describe("ExpenseItem", () => {
  const expense = makeExpense({
    country: "Japan",
    whoPaid: "Alice",
    splitList: [
      { userName: "Alice", amount: 50 },
      { userName: "Bob", amount: 50 },
    ],
  });

  it("does not apply shadow to the country flag container", () => {
    const screen = renderWithAppProviders(<ExpenseItem {...expense} />, {
      wrapNavigation: false,
      settings: {
        settings: {
          showFlags: true,
          showWhoPaid: true,
        },
      },
    });

    const flag = screen.getByTestId("expense-item-country-flag");
    expect(
      styleHasShadow(
        StyleSheet.flatten(flag.props.style) as Record<string, unknown>
      )
    ).toBe(false);
  });

  it("co-locates shadow and backgroundColor on traveller avatars", () => {
    const screen = renderWithAppProviders(<ExpenseItem {...expense} />, {
      wrapNavigation: false,
      settings: {
        settings: {
          showFlags: false,
          showWhoPaid: true,
        },
      },
    });

    const avatars = screen.getAllByTestId("expense-item-traveller-avatar");
    expect(avatars.length).toBeGreaterThan(0);

    avatars.forEach((avatar) => {
      assertSolidBackgroundForShadow(
        StyleSheet.flatten(avatar.props.style) as Record<string, unknown>
      );
    });
  });

  describe("date line", () => {
    beforeEach(() => {
      jest.useFakeTimers();
      // Friday 27 November 2026, local time (TZ=Europe/Berlin in jest)
      jest.setSystemTime(new Date(2026, 10, 27, 15, 0));
    });
    afterEach(() => {
      jest.useRealTimers();
    });

    function renderOn(date: Date, extraProps: Record<string, unknown> = {}) {
      const dated = makeExpense({ date, startDate: date, endDate: date });
      return renderWithAppProviders(
        <ExpenseItem {...dated} {...extraProps} />,
        { wrapNavigation: false }
      );
    }

    it("shows only the time under a day header, without repeating the date", () => {
      const screen = renderOn(new Date(2026, 10, 23, 14, 32), {
        underDayHeader: true,
      });

      expect(screen.getByText("14:32")).toBeTruthy();
      expect(screen.queryByText(/Nov/)).toBeNull();
    });

    it("shows only the time for today's Expense under a day header", () => {
      const screen = renderOn(new Date(2026, 10, 27, 9, 5), {
        underDayHeader: true,
      });

      expect(screen.getByText("09:05")).toBeTruthy();
    });

    it("keeps the date when there is no day header", () => {
      const screen = renderOn(new Date(2026, 10, 23, 14, 32));

      expect(screen.queryByText("14:32")).toBeNull();
      expect(screen.getByText(/Nov/)).toBeTruthy();
    });

    it("drops the time line of a Ranged expense day under a day header and centers the description", () => {
      const screen = renderOn(new Date(2026, 10, 27, 20, 0), {
        rangeId: "r1",
        underDayHeader: true,
      });

      expect(screen.queryByTestId("expense-item-date")).toBeNull();
      const column = StyleSheet.flatten(
        screen.getByTestId("expense-item-description-column").props.style,
      );
      expect(column.justifyContent).toBe("center");
    });

    it("keeps the description at the top when a time line sits under it", () => {
      const screen = renderOn(new Date(2026, 10, 27, 9, 5), {
        underDayHeader: true,
      });

      expect(screen.getByTestId("expense-item-date")).toBeTruthy();
      const column = StyleSheet.flatten(
        screen.getByTestId("expense-item-description-column").props.style,
      );
      expect(column.justifyContent).toBe("flex-start");
    });

    it("shows the short date, not the creation time, for a Ranged expense day dated today without a header", () => {
      // a Ranged expense created at 20:00 carries 20:00 on every day
      const screen = renderOn(new Date(2026, 10, 27, 20, 0), {
        rangeId: "r1",
      });

      expect(screen.queryByText(/20:00/)).toBeNull();
      expect(screen.getByText(/Nov/)).toBeTruthy();
    });
  });
});
