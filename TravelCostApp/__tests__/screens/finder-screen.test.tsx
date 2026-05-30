import * as React from "react";
import { ScrollView } from "react-native";
import { act, waitFor } from "@testing-library/react-native";

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
  const { Text } = require("react-native");
  return () => <Text testID="mock-autocomplete" />;
});

jest.mock("../../components/UI/DatePickerContainer", () => () => null);
jest.mock("../../components/UI/DatePickerModal", () => () => null);

import FinderScreen from "../../screens/FinderScreen";
import { renderWithAppProviders } from "../fixtures/app-providers";

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
});
