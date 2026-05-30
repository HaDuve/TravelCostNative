import * as React from "react";

jest.mock("@react-navigation/native", () => {
  const actual = jest.requireActual("@react-navigation/native");
  return {
    ...actual,
    useFocusEffect: jest.fn(),
  };
});

jest.mock("expo-notifications", () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(async () => ({ status: "denied" })),
  requestPermissionsAsync: jest.fn(async () => ({ status: "denied" })),
  getExpoPushTokenAsync: jest.fn(async () => ({ data: "token" })),
  setNotificationChannelAsync: jest.fn(async () => {}),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({
    remove: jest.fn(),
  })),
  removeNotificationSubscription: jest.fn(),
  AndroidImportance: { DEFAULT: 3 },
}));

jest.mock("expo-device", () => ({ isDevice: false }));

jest.mock("expo-constants", () => ({
  expoConfig: { extra: { eas: { projectId: "test" } } },
}));

jest.mock("../../store/secure-storage", () => ({
  secureStoreGetItem: jest.fn(async () => null),
}));

jest.mock("../../util/http", () => ({
  fetchChangelog: jest.fn(async () => null),
  storeExpoPushTokenInTrip: jest.fn(async () => {}),
  fetchTripName: jest.fn(async () => "Japan 2026"),
  getTravellers: jest.fn(async () => ["Alice", "Bob"]),
  getTripData: jest.fn(async () => ({
    dailyBudget: "100",
    totalBudget: "3000",
    tripCurrency: "EUR",
  })),
}));

jest.mock("../../store/mmkv", () => {
  const actual = jest.requireActual("../../store/mmkv-keys");
  return {
    getMMKVObject: jest.fn(() => null),
    setMMKVObject: jest.fn(),
    MMKV_KEYS: actual.MMKV_KEYS,
    MMKV_KEY_PATTERNS: actual.MMKV_KEY_PATTERNS,
  };
});

jest.mock("../../components/Premium/PremiumConstants", () => ({
  setAttributesAsync: jest.fn(async () => {}),
}));

jest.mock("rn-tourguide", () => ({
  TourGuideZone: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  useTourGuideController: () => ({
    canStart: false,
    start: jest.fn(),
    eventEmitter: { on: jest.fn(), off: jest.fn() },
  }),
}));

jest.mock("../../util/vexo-tracking", () => ({
  trackEvent: jest.fn(),
}));

jest.mock("../../components/FeedbackForm/FeedbackForm", () => () => null);

import ProfileScreen from "../../screens/ProfileScreen";
import { renderWithAppProviders } from "../fixtures/app-providers";
import { assertNoNestedVerticalFlatLists } from "../helpers/scroll-composition";
import { waitFor } from "@testing-library/react-native";

describe("Profile screen", () => {
  it("shows the signed-in User name and My Trips section", () => {
    const navigation = { navigate: jest.fn() };
    const screen = renderWithAppProviders(
      <ProfileScreen navigation={navigation as any} />,
      {
        auth: { uid: "u1", logout: jest.fn() },
        trip: { setCurrentTrip: jest.fn(async () => {}) },
        expenses: { setExpenses: jest.fn() },
        user: {
          userName: "Alice",
          freshlyCreated: false,
          tripHistory: [],
          loadUserNameFromStorage: jest.fn(),
          updateTripHistory: jest.fn(async () => {}),
          needsTour: false,
          setNeedsTour: jest.fn(),
          hasNewChanges: false,
          setHasNewChanges: jest.fn(),
          setUserName: jest.fn(async () => {}),
          setTripHistory: jest.fn(),
        },
      }
    );

    expect(screen.getByText("Alice")).toBeTruthy();
    expect(screen.getByText("My Trips")).toBeTruthy();
  });

  it("does not nest vertical FlatList inside ScrollView when trips are listed", async () => {
    const navigation = { navigate: jest.fn() };
    const screen = renderWithAppProviders(
      <ProfileScreen navigation={navigation as any} />,
      {
        auth: { uid: "u1", logout: jest.fn() },
        trip: { setCurrentTrip: jest.fn(async () => {}), tripid: "t1" },
        expenses: { setExpenses: jest.fn(), getExpensesSum: () => 0 },
        user: {
          userName: "Alice",
          freshlyCreated: false,
          tripHistory: ["t1"],
          loadUserNameFromStorage: jest.fn(),
          updateTripHistory: jest.fn(async () => {}),
          needsTour: false,
          setNeedsTour: jest.fn(),
          hasNewChanges: false,
          setHasNewChanges: jest.fn(),
          setUserName: jest.fn(async () => {}),
          setTripHistory: jest.fn(),
        },
      }
    );

    await waitFor(() => {
      expect(screen.getByText(/Japan 2026/)).toBeTruthy();
    });

    assertNoNestedVerticalFlatLists(screen.root);
  });

  it("shows Traveller chips on trip history cards", async () => {
    const navigation = { navigate: jest.fn() };
    const screen = renderWithAppProviders(
      <ProfileScreen navigation={navigation as any} />,
      {
        auth: { uid: "u1", logout: jest.fn() },
        trip: { setCurrentTrip: jest.fn(async () => {}), tripid: "t1" },
        expenses: { setExpenses: jest.fn(), getExpensesSum: () => 0 },
        user: {
          userName: "Alice",
          freshlyCreated: false,
          tripHistory: ["t1"],
          loadUserNameFromStorage: jest.fn(),
          updateTripHistory: jest.fn(async () => {}),
          needsTour: false,
          setNeedsTour: jest.fn(),
          hasNewChanges: false,
          setHasNewChanges: jest.fn(),
          setUserName: jest.fn(async () => {}),
          setTripHistory: jest.fn(),
        },
      }
    );

    await waitFor(() => {
      expect(screen.getByTestId("trip-traveller-Alice")).toBeTruthy();
      expect(screen.getByTestId("trip-traveller-Bob")).toBeTruthy();
    });
  });
});
