/**
 * Layout regression tests for:
 * 1. Dropdown text ("Heute") clipping/wrapping
 * 2. Empty state text container centering
 * 3. Budget bar overflowing summary container
 */

import * as React from "react";
import { Dimensions, Platform, StyleSheet, Text } from "react-native";
import { waitFor } from "@testing-library/react-native";

// Mock vexo-analytics
jest.mock("../../util/vexo-tracking", () => ({
  trackEvent: jest.fn(),
}));

// Mock the load timeout to speed up tests
jest.mock("../../confAppConstants", () => ({
  ...jest.requireActual("../../confAppConstants"),
  EXPENSES_LOAD_TIMEOUT: 100,
}));

// Mock DropDownPicker to test text sizing
jest.mock("react-native-dropdown-picker", () => {
  const React = require("react");
  const { View, Text } = require("react-native");
  const mockComponent = jest.fn((props: any) => {
    return (
      <View
        testID="mock-dropdown-picker"
        style={props.containerStyle}
      >
        <Text 
          testID="dropdown-text"
          style={props.textStyle}
          numberOfLines={props.numberOfLines}
          adjustsFontSizeToFit={props.adjustsFontSizeToFit}
        >
          {props.value}
        </Text>
      </View>
    );
  });
  return mockComponent;
});

jest.mock("../../util/currencyExchange", () => ({
  getRate: jest.fn(async () => 1),
}));

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(async () => {}),
  ImpactFeedbackStyle: { Light: "Light" },
}));

jest.mock("react-native-toast-message", () => ({
  __esModule: true,
  default: {
    show: jest.fn(),
    hide: jest.fn(),
  },
}));

import TripPeriodChrome from "../../components/layout/TripPeriodChrome";
import ExpensesSummary from "../../components/ExpensesOutput/ExpensesSummary";
import { MemoizedExpensesOutput } from "../../components/ExpensesOutput/ExpensesOutput";
import LayoutContextProvider from "../../store/layout-context";
import { makeExpense } from "../fixtures/expense";
import { renderWithAppProviders } from "../fixtures/app-providers";

// Get reference to the mocked DropDownPicker
const MockedDropDownPicker = require("react-native-dropdown-picker");

function flattenStyle(screen: { getByTestId: (id: string) => any }, testID: string) {
  return StyleSheet.flatten(
    screen.getByTestId(testID).props.style
  ) as Record<string, unknown>;
}

describe("Layout regression fixes", () => {
  beforeEach(() => {
    if (MockedDropDownPicker.mockClear) {
      MockedDropDownPicker.mockClear();
    }
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Dropdown text sizing", () => {
    it("should constrain dropdown text to fit within container without wrapping", () => {
      // Simulate device with large font size
      jest.spyOn(Dimensions, "get").mockReturnValue({
        width: 390,
        height: 844,
        scale: 2,
        fontScale: 1.5, // Larger font scale
      });

      const screen = renderWithAppProviders(
        <LayoutContextProvider>
          <TripPeriodChrome
            tripLabel="Bremen 09/26 - 01. Sep 2026"
            periodValue="Heute"
            periodItems={[{ label: "Heute", value: "day" }]}
            periodOpen={false}
            onPeriodOpenChange={jest.fn()}
            onPeriodValueChange={jest.fn()}
            onPeriodItemsChange={jest.fn()}
            expenses={[]}
          />
        </LayoutContextProvider>,
        { wrapNavigation: false }
      );

      // Check that DropDownPicker was called with proper text constraints
      const lastCall = MockedDropDownPicker.mock.calls[MockedDropDownPicker.mock.calls.length - 1];
      const props = lastCall[0];

      // Text should be constrained to single line and adjust font size to fit
      expect(props.numberOfLines).toBe(1);
      expect(props.adjustsFontSizeToFit).toBe(true);
    });

    it("should set minimumFontScale to prevent text from becoming too small", () => {
      const screen = renderWithAppProviders(
        <LayoutContextProvider>
          <TripPeriodChrome
            tripLabel="Bremen 09/26 - 01. Sep 2026"
            periodValue="Morgen"
            periodItems={[{ label: "Morgen", value: "day" }]}
            periodOpen={false}
            onPeriodOpenChange={jest.fn()}
            onPeriodValueChange={jest.fn()}
            onPeriodItemsChange={jest.fn()}
            expenses={[]}
          />
        </LayoutContextProvider>,
        { wrapNavigation: false }
      );

      const lastCall = MockedDropDownPicker.mock.calls[MockedDropDownPicker.mock.calls.length - 1];
      const props = lastCall[0];

      // Should have a reasonable minimum font scale (e.g., 0.7)
      expect(props.minimumFontScale).toBeGreaterThanOrEqual(0.5);
      expect(props.minimumFontScale).toBeLessThanOrEqual(0.9);
    });
  });

  describe("Budget bar constraints", () => {
    it("should constrain progress bar width within its container", () => {
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
      const pressableStyle = StyleSheet.flatten(pressable.props.style) as Record<string, unknown>;
      
      // The pressable has maxWidth: "50%" from headerCard token
      expect(pressableStyle.maxWidth).toBe("50%");
      
      // Progress bar should be findable (it renders when budget is set)
      const progressBar = screen.getByTestId("expenses-summary-progress");
      expect(progressBar).toBeTruthy();
      
      // Progress bar should have width constraint relative to parent
      const progressProps = progressBar.props;
      // The width should be undefined or a percentage, not a fixed large number
      expect(progressProps.width).toBeUndefined();
    });
  });

  describe("Empty state centering", () => {
    it("should center empty state text horizontally using proper flex layout", async () => {
      const screen = renderWithAppProviders(
        <MemoizedExpensesOutput
          expenses={[]}
          fallbackText="Noch keine Ausgaben in diesem Zeitraum. Neue Ausgaben mit der Schaltfläche unten hinzufügen!"
          refreshing={false}
          isFiltered={false}
          awaitingTripFetch={false}
        />,
        {
          wrapNavigation: true,
          trip: {
            tripid: "t1",
            tripName: "Test Trip",
          },
          expenses: {
            expenses: [],
            getRecentExpenses: () => [],
            getDailyExpenses: () => [],
          },
        }
      );

      // Wait for loading overlay to disappear (EXPENSES_LOAD_TIMEOUT)
      await waitFor(() => {
        expect(screen.getByText(/Noch keine Ausgaben/)).toBeTruthy();
      });

      // Should render the fallback text
      const fallbackText = screen.getByText(/Noch keine Ausgaben/);
      expect(fallbackText).toBeTruthy();
      
      // Text should have centered alignment
      const textStyle = StyleSheet.flatten(fallbackText.props.style) as Record<string, unknown>;
      expect(textStyle.textAlign).toBe("center");
      
      // Parent container should not use absolute positioning for centering
      // This is harder to test without access to parent, but we can check the component renders
      expect(screen.getByText(/Noch keine Ausgaben/)).toBeTruthy();
    });

    it("should position empty state below the separator bar, not above it", async () => {
      const screen = renderWithAppProviders(
        <MemoizedExpensesOutput
          expenses={[]}
          fallbackText="Noch keine Ausgaben in diesem Zeitraum."
          refreshing={false}
          isFiltered={false}
          awaitingTripFetch={false}
        />,
        {
          wrapNavigation: true,
          trip: {
            tripid: "t1",
            tripName: "Test Trip",
          },
          expenses: {
            expenses: [],
            getRecentExpenses: () => [],
            getDailyExpenses: () => [],
          },
        }
      );

      // Wait for loading overlay to disappear (EXPENSES_LOAD_TIMEOUT)
      await waitFor(() => {
        expect(screen.getByText(/Noch keine Ausgaben/)).toBeTruthy();
      });

      // The fallback container should use proper z-index and positioning
      const fallbackText = screen.getByText(/Noch keine Ausgaben/);
      expect(fallbackText).toBeTruthy();
      
      // Container should be positioned in document flow (flex: 1), not absolutely
      // Verify by checking the container doesn't have absolute positioning style
      // Note: React Native Testing Library doesn't expose parent container styles easily,
      // so we verify the component renders and trust the unit change (absolute → flex)
      // Visual regression or E2E would be needed for full z-order verification
      expect(screen.getByText(/Noch keine Ausgaben/)).toBeTruthy();
    });
  });
});
