import * as React from "react";
import { Dimensions } from "react-native";

jest.mock("@react-navigation/native", () => {
  const actual = jest.requireActual("@react-navigation/native");
  return {
    ...actual,
    useFocusEffect: jest.fn(),
    useNavigation: () => ({ navigate: jest.fn(), pop: jest.fn() }),
  };
});
jest.mock("expo-notifications", () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(async () => ({ status: "granted" })),
  requestPermissionsAsync: jest.fn(async () => ({ status: "granted" })),
  getExpoPushTokenAsync: jest.fn(async () => ({ data: "token" })),
  setNotificationChannelAsync: jest.fn(),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  removeNotificationSubscription: jest.fn(),
}));

jest.mock("expo-device", () => ({ isDevice: false }));

jest.mock("expo-constants", () => ({
  expoConfig: { extra: { eas: { projectId: "test" } } },
}));

jest.mock("react-native-purchases", () => ({
  setAttributes: jest.fn(async () => {}),
  setEmail: jest.fn(async () => {}),
  setDisplayName: jest.fn(async () => {}),
}));

jest.mock("../../util/http", () => ({
  storeExpoPushTokenInTrip: jest.fn(async () => {}),
}));

jest.mock("../../components/Premium/PremiumConstants", () => ({
  setAttributesAsync: jest.fn(async () => {}),
}));

jest.mock("../../util/vexo-tracking", () => ({
  trackEvent: jest.fn(),
}));

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(async () => {}),
  ImpactFeedbackStyle: { Light: "Light" },
}));

import ProfileScreen from "../../screens/ProfileScreen";
import LayoutContextProvider from "../../store/layout-context";
import { renderWithAppProviders } from "../fixtures/app-providers";

function renderProfileAt(width: number, height: number) {
  jest.spyOn(Dimensions, "get").mockReturnValue({
    width,
    height,
    scale: 3,
    fontScale: 1,
  });

  return renderWithAppProviders(
    <LayoutContextProvider>
      <ProfileScreen navigation={{ navigate: jest.fn() } as any} />
    </LayoutContextProvider>,
    {
      wrapNavigation: false,
      user: {
        userName: "Alice",
        tripHistory: ["t1"],
        updateTripHistory: jest.fn(async () => {}),
        loadUserNameFromStorage: jest.fn(),
      },
    }
  );
}

describe("Profile tablet layout", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("lays out profile action rows in a 50/50 grid on wide viewports", () => {
    const screen = renderProfileAt(1024, 768);

    expect(screen.getByTestId("profile-action-grid")).toBeTruthy();
    expect(screen.getAllByTestId("responsive-grid-column")).toHaveLength(2);
    expect(screen.getByTestId("profile-feedback")).toBeTruthy();
    expect(screen.getByTestId("my-budgets-add-another")).toBeTruthy();
    expect(screen.getByTestId("my-budgets-join")).toBeTruthy();
  });

  it("keeps profile actions in a single column on phones", () => {
    const screen = renderProfileAt(390, 844);

    expect(screen.queryByTestId("responsive-grid-column")).toBeNull();
    expect(screen.getByTestId("profile-feedback")).toBeTruthy();
  });
});
