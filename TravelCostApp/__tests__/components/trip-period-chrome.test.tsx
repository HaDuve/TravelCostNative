import * as React from "react";
import { Dimensions, StyleSheet } from "react-native";

jest.mock("react-native-dropdown-picker", () => {
  const React = require("react");
  const { View } = require("react-native");
  return function MockDropDownPicker(props: { containerStyle?: object }) {
    return <View testID="mock-dropdown-picker" style={props.containerStyle} />;
  };
});

import TripPeriodChrome from "../../components/layout/TripPeriodChrome";
import LayoutContextProvider from "../../store/layout-context";
import { makeExpense } from "../fixtures/expense";
import { renderWithAppProviders } from "../fixtures/app-providers";
import { layoutFor } from "../../util/layout";

const monthExpenses = [
  makeExpense({ id: "e1", calcAmount: 75, amount: 75 }),
];

function flattenStyle(screen: { getByTestId: (id: string) => any }, testID: string) {
  return StyleSheet.flatten(
    screen.getByTestId(testID).props.style
  ) as Record<string, unknown>;
}

function renderTripPeriodChrome(width: number, height: number) {
  jest.spyOn(Dimensions, "get").mockReturnValue({
    width,
    height,
    scale: 2,
    fontScale: 1,
  });

  return renderWithAppProviders(
    <LayoutContextProvider>
      <TripPeriodChrome
        tripLabel="Japan 2026 - Aug 2026"
        periodValue="month"
        periodItems={[{ label: "Month", value: "month" }]}
        periodOpen={false}
        onPeriodOpenChange={jest.fn()}
        onPeriodValueChange={jest.fn()}
        onPeriodItemsChange={jest.fn()}
        expenses={monthExpenses}
      />
    </LayoutContextProvider>,
    { wrapNavigation: false }
  );
}

describe("TripPeriodChrome", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("keeps trip date header spacing non-overlapping on wide layouts", () => {
    const layout = layoutFor({ width: 1194, height: 834 });
    const screen = renderTripPeriodChrome(1194, 834);
    const dateHeader = flattenStyle(screen, "period-date-header");

    expect(dateHeader.marginBottom).toBe(layout.space(1));
    expect(Number(dateHeader.marginBottom)).toBeGreaterThanOrEqual(0);
  });

  it("uses layout spacing tokens for the period header row on wide", () => {
    const wideLayout = layoutFor({ width: 1194, height: 834 });
    const wide = flattenStyle(renderTripPeriodChrome(1194, 834), "period-header-row");

    expect(wide.gap).toBe(wideLayout.space(3));
    expect(wide.marginTop).toBe(wideLayout.space(4));
    expect(wide.paddingHorizontal).toBe(wideLayout.space(3));
  });

  it("keeps trip date header spacing non-overlapping on medium tablet landscape", () => {
    const layout = layoutFor({ width: 736, height: 414 });
    const screen = renderTripPeriodChrome(736, 414);
    const dateHeader = flattenStyle(screen, "period-date-header");

    expect(dateHeader.marginBottom).toBe(layout.space(1));
    expect(Number(dateHeader.marginBottom)).toBeGreaterThanOrEqual(0);
  });
});
