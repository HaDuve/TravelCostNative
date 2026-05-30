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
});
