import * as React from "react";
import { waitFor } from "@testing-library/react-native";

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(async () => {}),
  ImpactFeedbackStyle: { Light: "Light" },
}));

jest.mock("../../store/mmkv", () => ({
  getMMKVString: jest.fn(() => new Date().toISOString()),
  getMMKVObject: jest.fn(() => [
    { tripid: "t1", tripname: "Japan 2026", selected: true },
  ]),
  setMMKVObject: jest.fn(),
  setMMKVString: jest.fn(),
  MMKV_KEYS: {
    ALL_TRIPS_AS_OBJECT: "allTripsAsObject",
    ALL_TRIPS_AS_OBJECT_CACHE_ISO_DATE: "allTripsAsObjectCacheIsoDate",
  },
}));

jest.mock("../../util/http", () => ({
  fetchTripName: jest.fn(async () => "Japan 2026"),
}));

import TripSummaryScreen from "../../screens/TripSummaryScreen";
import { renderWithAppProviders } from "../fixtures/app-providers";
import { i18n } from "../../i18n/i18n";
import { assertNoNestedVerticalFlatLists } from "../../test-utils/scroll-composition";
import { assertSolidBackgroundForShadow } from "../../util/shadow-styles";
import { shadowRegressionStyles } from "../../styles/shadow-regression-styles";
import { StyleSheet } from "react-native";

describe("TripSummaryScreen", () => {
  // The whole screen used to be wrapped in a one-shot reanimated `entering`
  // animation; on a modal screen that animation can be dropped during the
  // transition, leaving the content stuck at opacity 0. The content must
  // render regardless of any entering animation.
  it("renders the My Trips section without depending on an entering animation", async () => {
    const navigation = { navigate: jest.fn(), pop: jest.fn(), goBack: jest.fn() };

    const screen = renderWithAppProviders(
      <TripSummaryScreen navigation={navigation as any} />,
      {
        user: {
          userName: "Alice",
          freshlyCreated: false,
          tripHistory: ["t1"],
        },
      }
    );

    await waitFor(() => {
      expect(screen.getByText(i18n.t("myTrips"))).toBeTruthy();
    });
  });

  it("does not nest vertical FlatList inside ScrollView", async () => {
    const navigation = { navigate: jest.fn(), pop: jest.fn(), goBack: jest.fn() };

    const screen = renderWithAppProviders(
      <TripSummaryScreen navigation={navigation as any} />,
      {
        user: {
          userName: "Alice",
          freshlyCreated: false,
          tripHistory: ["t1"],
        },
      }
    );

    await waitFor(() => {
      expect(screen.getByText("Japan 2026")).toBeTruthy();
    });

    assertNoNestedVerticalFlatLists(screen.root);
  });

  it("co-locates shadow and backgroundColor on trip list items", async () => {
    const navigation = { navigate: jest.fn(), pop: jest.fn(), goBack: jest.fn() };

    const screen = renderWithAppProviders(
      <TripSummaryScreen navigation={navigation as any} />,
      {
        user: {
          userName: "Alice",
          freshlyCreated: false,
          tripHistory: ["t1"],
        },
      }
    );

    await waitFor(() => {
      expect(screen.getByText("Japan 2026")).toBeTruthy();
    });

    assertSolidBackgroundForShadow(
      StyleSheet.flatten(shadowRegressionStyles.tripSummaryTripItem)
    );
    assertSolidBackgroundForShadow(
      StyleSheet.flatten(shadowRegressionStyles.tripSummaryTripItemSelected)
    );
  });
});
