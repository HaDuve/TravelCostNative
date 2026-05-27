import * as React from "react";

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(async () => {}),
  ImpactFeedbackStyle: { Light: "Light" },
}));

jest.mock("react-native-dropdown-picker", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return function MockDropDownPicker() {
    return <Text testID="mock-dropdown-picker" />;
  };
});

jest.mock("rn-tourguide", () => ({
  TourGuideZone: ({ children }: any) => <>{children}</>,
}));

jest.mock("../../util/vexo-tracking", () => ({
  trackEvent: jest.fn(),
}));

jest.mock("react-native-toast-message/lib/src/Toast", () => ({
  Toast: { show: jest.fn(), hide: jest.fn() },
}));

jest.mock("../../components/UI/ToastComponent", () => ({
  showBanner: jest.fn(),
}));

import OverviewScreen from "../../screens/OverviewScreen";
import { renderWithAppProviders } from "../fixtures/app-providers";

describe("Overview screen", () => {
  it("shows the trip name in the header", () => {
    const navigation = { navigate: jest.fn() };
    const screen = renderWithAppProviders(
      <OverviewScreen navigation={navigation as any} />,
      {
        user: {
          needsTour: false,
          isShowingGraph: false,
          setIsShowingGraph: jest.fn(),
        },
        expenses: { expenses: [], getRecentExpenses: () => [] },
      }
    );

    expect(screen.getByText(/Japan 2026/)).toBeTruthy();
  });
});
