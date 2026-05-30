import * as React from "react";
import { ScrollView, StyleSheet } from "react-native";
import { act, fireEvent, waitFor } from "@testing-library/react-native";

jest.mock("@react-navigation/native", () => {
  const actual = jest.requireActual("@react-navigation/native");
  return {
    ...actual,
    useNavigation: () => ({ navigate: jest.fn() }),
    useFocusEffect: (callback: () => void) => callback(),
  };
});

jest.mock("../../util/vexo-tracking", () => ({
  trackEvent: jest.fn(),
}));

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(async () => {}),
  ImpactFeedbackStyle: { Light: "Light" },
}));

jest.mock("../../store/async-storage", () => ({
  asyncStoreGetItem: jest.fn(async () => null),
  asyncStoreGetObject: jest.fn(async () => null),
  asyncStoreSetItem: jest.fn(async () => {}),
  asyncStoreSetObject: jest.fn(async () => {}),
}));

jest.mock("react-native-toast-message/lib/src/Toast", () => ({
  Toast: { show: jest.fn(), hide: jest.fn() },
}));

jest.mock("../../components/UI/Autocomplete", () => {
  const React = require("react");
  const { View } = require("react-native");
  return function MockAutocomplete(props: { containerStyle?: object }) {
    return <View testID="mock-autocomplete" style={props.containerStyle} />;
  };
});

jest.mock("../../components/UI/DatePickerContainer", () => {
  const React = require("react");
  const { View } = require("react-native");
  return function MockDatePickerContainer(props: { containerStyle?: object }) {
    return <View testID="mock-date-picker" style={props.containerStyle} />;
  };
});
jest.mock("../../components/UI/DatePickerModal", () => () => null);

import FinderScreen from "../../screens/FinderScreen";
import {
  FINDER_FILTER_CONTENT_WIDTH,
  finderFilterRowStyles,
} from "../../styles/finder-filter-row-styles";
import { renderWithAppProviders } from "../fixtures/app-providers";

function flattenStyle(screen: { getByTestId: (id: string) => any }, testID: string) {
  return StyleSheet.flatten(screen.getByTestId(testID).props.style) as Record<
    string,
    unknown
  >;
}

describe("Finder screen", () => {
  it("shows the Finder title and empty-results state", async () => {
    const screen = renderWithAppProviders(<FinderScreen />, {
      wrapNavigation: false,
      expenses: { expenses: [] },
    });

    await waitFor(() => {
      expect(screen.getByText("Finder")).toBeTruthy();
      expect(screen.getByText("No Results")).toBeTruthy();
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  });

  it("delivers taps to controls while the keyboard is open", () => {
    const screen = renderWithAppProviders(<FinderScreen />, {
      wrapNavigation: false,
      expenses: { expenses: [] },
    });

    const scrollView = screen.UNSAFE_getByType(ScrollView);
    expect(scrollView.props.keyboardShouldPersistTaps).toBe("handled");
  });

  it("reserves a clear column on both Finder filter rows when filters are inactive", async () => {
    const screen = renderWithAppProviders(<FinderScreen />, {
      wrapNavigation: false,
      expenses: { expenses: [] },
    });

    await waitFor(() => {
      expect(screen.getByText("Finder")).toBeTruthy();
    });

    expect(screen.getByTestId("finder-search-filter-clear-slot")).toBeTruthy();
    expect(screen.getByTestId("finder-date-filter-clear-slot")).toBeTruthy();
  });

  it("gives search and date filter content the same fixed width", async () => {
    const screen = renderWithAppProviders(<FinderScreen />, {
      wrapNavigation: false,
      expenses: { expenses: [] },
    });

    await waitFor(() => {
      expect(screen.getByText("Finder")).toBeTruthy();
    });

    const searchContent = flattenStyle(screen, "finder-search-filter-content");
    const dateContent = flattenStyle(screen, "finder-date-filter-content");

    expect(searchContent.width).toBe(FINDER_FILTER_CONTENT_WIDTH);
    expect(dateContent.width).toBe(FINDER_FILTER_CONTENT_WIDTH);
    expect(searchContent.width).toBe(
      finderFilterRowStyles.filterContentColumn.width
    );
  });

  it("vertically centers filter row checkbox and clear with content", async () => {
    const screen = renderWithAppProviders(<FinderScreen />, {
      wrapNavigation: false,
      expenses: { expenses: [] },
    });

    await waitFor(() => {
      expect(screen.getByText("Finder")).toBeTruthy();
    });

    expect(flattenStyle(screen, "finder-search-filter").alignItems).toBe(
      "center"
    );
    expect(flattenStyle(screen, "finder-date-filter").alignItems).toBe(
      "center"
    );
    expect(
      flattenStyle(screen, "finder-search-filter-checkbox").marginTop
    ).toBeUndefined();
    expect(
      flattenStyle(screen, "finder-date-filter-checkbox").marginTop
    ).toBeUndefined();
  });

  it("keeps the search clear column width when the filter becomes active", async () => {
    const screen = renderWithAppProviders(<FinderScreen />, {
      wrapNavigation: false,
      expenses: { expenses: [] },
    });

    await waitFor(() => {
      expect(screen.getByText("Finder")).toBeTruthy();
    });

    const widthBefore = flattenStyle(
      screen,
      "finder-search-filter-clear-slot"
    ).width;

    fireEvent.press(screen.getAllByRole("checkbox")[0]);

    const widthAfter = flattenStyle(
      screen,
      "finder-search-filter-clear-slot"
    ).width;
    expect(widthAfter).toBe(widthBefore);
    expect(widthAfter).toBe(finderFilterRowStyles.clearColumn.width);
  });
});
