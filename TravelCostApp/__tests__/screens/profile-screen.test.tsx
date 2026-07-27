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
  getTravellers: jest.fn(async () => [
    { uid: "u1", userName: "Alice" },
    { uid: "u2", userName: "Bob" },
  ]),
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

jest.mock("../../util/vexo-tracking", () => ({
  trackEvent: jest.fn(),
}));

jest.mock("../../components/FeedbackForm/FeedbackForm", () => () => null);

import ProfileScreen from "../../screens/ProfileScreen";
import { renderWithAppProviders } from "../fixtures/app-providers";
import { assertNoNestedVerticalFlatLists } from "../../test-utils/scroll-composition";
import { waitFor } from "@testing-library/react-native";
import { StyleSheet } from "react-native";
import { getTravellers } from "../../util/http";
import { trackEvent } from "../../util/vexo-tracking";
import { VexoEvents } from "../../util/vexo-constants";

function profileUserOverrides(
  overrides: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    userName: "Alice",
    freshlyCreated: false,
    tripHistory: [],
    loadUserNameFromStorage: jest.fn(),
    updateTripHistory: jest.fn(async () => {}),
    hasNewChanges: false,
    setHasNewChanges: jest.fn(),
    setUserName: jest.fn(async () => {}),
    setTripHistory: jest.fn(),
    ...overrides,
  };
}

describe("Profile screen", () => {
  beforeEach(() => {
    jest.mocked(trackEvent).mockClear();
  });

  afterEach(() => {
    jest.mocked(getTravellers).mockImplementation(async () => [
      { uid: "u1", userName: "Alice" },
      { uid: "u2", userName: "Bob" },
    ]);
  });

  it("renders Profile trip actions without starting a guided tour", async () => {
    const navigation = { navigate: jest.fn() };
    const screen = renderWithAppProviders(
      <ProfileScreen navigation={navigation as any} />,
      {
        auth: { uid: "u1", logout: jest.fn() },
        trip: { setCurrentTrip: jest.fn(async () => {}) },
        expenses: { setExpenses: jest.fn() },
        user: profileUserOverrides({ freshlyCreated: true }),
      }
    );

    expect(screen.getByText("Alice")).toBeTruthy();
    expect(screen.getByText("My Trips")).toBeTruthy();
    expect(screen.getByTestId("profile-trip-container")).toBeTruthy();

    await waitFor(() => {
      expect(trackEvent).not.toHaveBeenCalledWith(
        VexoEvents.ONBOARDING_TOUR_STARTED
      );
      expect(trackEvent).not.toHaveBeenCalledWith(
        VexoEvents.ONBOARDING_TOUR_SKIPPED
      );
      expect(navigation.navigate).not.toHaveBeenCalledWith("RecentExpenses");
      expect(navigation.navigate).not.toHaveBeenCalledWith("Overview");
    });
  });

  it("shows the signed-in User name and My Trips section", () => {
    const navigation = { navigate: jest.fn() };
    const screen = renderWithAppProviders(
      <ProfileScreen navigation={navigation as any} />,
      {
        auth: { uid: "u1", logout: jest.fn() },
        trip: { setCurrentTrip: jest.fn(async () => {}) },
        expenses: { setExpenses: jest.fn() },
        user: profileUserOverrides(),
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
        user: profileUserOverrides({ tripHistory: ["t1"] }),
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
        user: profileUserOverrides({ tripHistory: ["t1"] }),
      }
    );

    await waitFor(() => {
      expect(screen.getByTestId("trip-traveller-u1")).toBeTruthy();
      expect(screen.getByTestId("trip-traveller-u2")).toBeTruthy();
    });
  });

  it("keeps distinct Traveller chips when display names collide", async () => {
    jest.mocked(getTravellers).mockImplementation(async () => [
      { uid: "u1", userName: "Alice" },
      { uid: "u2", userName: "Alice" },
    ]);
    const navigation = { navigate: jest.fn() };
    const screen = renderWithAppProviders(
      <ProfileScreen navigation={navigation as any} />,
      {
        auth: { uid: "u1", logout: jest.fn() },
        trip: { setCurrentTrip: jest.fn(async () => {}), tripid: "t1" },
        expenses: { setExpenses: jest.fn(), getExpensesSum: () => 0 },
        user: profileUserOverrides({ tripHistory: ["t1"] }),
      }
    );

    await waitFor(() => {
      expect(screen.getByTestId("trip-traveller-u1")).toBeTruthy();
      expect(screen.getByTestId("trip-traveller-u2")).toBeTruthy();
    });
  });

  it("renders trip history travellers in a full-width wrap container", async () => {
    const navigation = { navigate: jest.fn() };
    const screen = renderWithAppProviders(
      <ProfileScreen navigation={navigation as any} />,
      {
        auth: { uid: "u1", logout: jest.fn() },
        trip: { setCurrentTrip: jest.fn(async () => {}), tripid: "t1" },
        expenses: { setExpenses: jest.fn(), getExpensesSum: () => 0 },
        user: profileUserOverrides({ tripHistory: ["t1"] }),
      }
    );

    await waitFor(() => {
      expect(screen.getByTestId("trip-traveller-u1")).toBeTruthy();
    });

    const listContent = screen.getByTestId("trip-travellers-wrap");
    expect(StyleSheet.flatten(listContent.props.style)).toMatchObject({
      flexDirection: "row",
      flexWrap: "wrap",
      width: "100%",
    });
  });

  it("allocates remaining profile height to the trip history list", async () => {
    const navigation = { navigate: jest.fn() };
    const screen = renderWithAppProviders(
      <ProfileScreen navigation={navigation as any} />,
      {
        auth: { uid: "u1", logout: jest.fn() },
        trip: { setCurrentTrip: jest.fn(async () => {}), tripid: "t1" },
        expenses: { setExpenses: jest.fn(), getExpensesSum: () => 0 },
        user: profileUserOverrides({ tripHistory: ["t1"] }),
      }
    );

    await waitFor(() => {
      expect(screen.getByTestId("trip-list-wrapper")).toBeTruthy();
    });

    const tripContainer = screen.getByTestId("profile-trip-container");
    const listWrapper = screen.getByTestId("trip-list-wrapper");
    const containerFlat = StyleSheet.flatten(
      tripContainer.props.style
    ) as Record<string, unknown>;
    const wrapperFlat = StyleSheet.flatten(
      listWrapper.props.style
    ) as Record<string, unknown>;

    expect(containerFlat.flex).toBe(1);
    expect(wrapperFlat.flex).toBe(1);
  });

  it("sizes trip history cards to content so Traveller chips are not clipped", async () => {
    const navigation = { navigate: jest.fn() };
    const screen = renderWithAppProviders(
      <ProfileScreen navigation={navigation as any} />,
      {
        auth: { uid: "u1", logout: jest.fn() },
        trip: { setCurrentTrip: jest.fn(async () => {}), tripid: "t1" },
        expenses: { setExpenses: jest.fn(), getExpensesSum: () => 0 },
        user: profileUserOverrides({ tripHistory: ["t1"] }),
      }
    );

    await waitFor(() => {
      expect(screen.getByTestId("trip-history-card-t1")).toBeTruthy();
    });

    const card = screen.getByTestId("trip-history-card-t1");
    const flat = StyleSheet.flatten(card.props.style) as Record<
      string,
      unknown
    >;
    expect(flat.flex).not.toBe(1);
  });

  it("keeps trip history cards in the visible layout region", async () => {
    const navigation = { navigate: jest.fn() };
    const screen = renderWithAppProviders(
      <ProfileScreen navigation={navigation as any} />,
      {
        auth: { uid: "u1", logout: jest.fn() },
        trip: { setCurrentTrip: jest.fn(async () => {}), tripid: "t1" },
        expenses: { setExpenses: jest.fn(), getExpensesSum: () => 0 },
        user: profileUserOverrides({ tripHistory: ["t1"] }),
      }
    );

    await waitFor(() => {
      expect(screen.getByTestId("trip-history-card-t1")).toBeTruthy();
    });

    const tripContainer = screen.getByTestId("profile-trip-container");
    const flat = StyleSheet.flatten(tripContainer.props.style) as Record<
      string,
      unknown
    >;
    expect(typeof flat.marginBottom !== "number" || flat.marginBottom >= 0).toBe(
      true
    );
  });
});
