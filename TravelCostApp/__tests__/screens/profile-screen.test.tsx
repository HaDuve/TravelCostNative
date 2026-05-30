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

jest.mock("rn-tourguide", () => {
  const { View } = require("react-native");
  return {
    TourGuideZone: ({
      children,
      style,
      zone,
    }: {
      children: React.ReactNode;
      style?: object;
      zone?: number;
    }) => (
      <View testID={`tour-guide-zone-${zone}`} style={style}>
        {children}
      </View>
    ),
    useTourGuideController: () => ({
      canStart: false,
      start: jest.fn(),
      eventEmitter: { on: jest.fn(), off: jest.fn() },
    }),
  };
});

jest.mock("../../util/vexo-tracking", () => ({
  trackEvent: jest.fn(),
}));

jest.mock("../../components/FeedbackForm/FeedbackForm", () => () => null);

import ProfileScreen from "../../screens/ProfileScreen";
import { renderWithAppProviders } from "../fixtures/app-providers";
import { assertNoNestedVerticalFlatLists } from "../../test-utils/scroll-composition";
import { waitFor } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

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

  it("renders trip history travellers in a full-width wrap container", async () => {
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
      expect(screen.getByTestId("trip-list-wrapper")).toBeTruthy();
    });

    const tripContainer = screen.getByTestId("profile-trip-container");
    const listWrapper = screen.getByTestId("trip-list-wrapper");
    const listZone = screen.getByTestId("tour-guide-zone-6");
    const containerFlat = StyleSheet.flatten(
      tripContainer.props.style
    ) as Record<string, unknown>;
    const wrapperFlat = StyleSheet.flatten(
      listWrapper.props.style
    ) as Record<string, unknown>;
    const zoneFlat = StyleSheet.flatten(listZone.props.style) as Record<
      string,
      unknown
    >;

    expect(containerFlat.flex).toBe(1);
    expect(zoneFlat.flex).toBe(1);
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
