import * as React from "react";
import { Dimensions, StyleSheet } from "react-native";

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

import ExpenseListRow from "../../components/ExpensesOutput/ExpenseListRow";
import LayoutContextProvider from "../../store/layout-context";
import { makeExpense } from "../fixtures/expense";
import { renderWithAppProviders } from "../fixtures/app-providers";
import { dynamicScale } from "../../util/scalingUtil";

const expense = makeExpense({
  country: "Japan",
  whoPaid: "Alice",
  splitList: [
    { userName: "Alice", amount: 50 },
    { userName: "Bob", amount: 50 },
  ],
});

function flattenRow(screen: { getByTestId: (id: string) => any }) {
  return StyleSheet.flatten(
    screen.getByTestId("expense-list-row-shell").props.style
  ) as Record<string, unknown>;
}

function renderExpenseListRow(
  layoutVariant: "ledger" | "templatePicker",
  width: number,
  height: number
) {
  jest.spyOn(Dimensions, "get").mockReturnValue({
    width,
    height,
    scale: 2,
    fontScale: 1,
  });

  return renderWithAppProviders(
    <LayoutContextProvider>
      <ExpenseListRow
        {...expense}
        layoutVariant={layoutVariant}
        onPress={jest.fn()}
      />
    </LayoutContextProvider>,
    {
      wrapNavigation: false,
      settings: {
        settings: {
          showFlags: true,
          showWhoPaid: true,
        },
      },
    }
  );
}

describe("ExpenseListRow layout", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("groups wide ledger columns without the landscape height hack", () => {
    const screen = renderExpenseListRow("ledger", 1194, 834);
    const row = flattenRow(screen);

    expect(row.height).toBeUndefined();
    expect(row.justifyContent).toBe("flex-start");
    expect(row.minHeight).not.toBe(dynamicScale(100, true));
  });

  it("keeps template picker and ledger rows on the same grouped shell on wide", () => {
    const ledger = flattenRow(renderExpenseListRow("ledger", 1194, 834));
    const templatePicker = flattenRow(
      renderExpenseListRow("templatePicker", 1194, 834)
    );

    expect(ledger.justifyContent).toBe("flex-start");
    expect(templatePicker.justifyContent).toBe("flex-start");
    expect(ledger.height).toBeUndefined();
    expect(templatePicker.height).toBeUndefined();
  });
});
