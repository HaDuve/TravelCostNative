import * as React from "react";
import { waitFor } from "@testing-library/react-native";

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(async () => {}),
  ImpactFeedbackStyle: { Light: "Light" },
}));

import TripSummaryScreen from "../../screens/TripSummaryScreen";
import { renderWithAppProviders } from "../fixtures/app-providers";
import { i18n } from "../../i18n/i18n";

describe("TripSummaryScreen", () => {
  // The whole screen used to be wrapped in a one-shot reanimated `entering`
  // animation; on a modal screen that animation can be dropped during the
  // transition, leaving the content stuck at opacity 0. The content must
  // render regardless of any entering animation.
  it("renders the My Trips section without depending on an entering animation", async () => {
    const navigation = { navigate: jest.fn(), pop: jest.fn(), goBack: jest.fn() };

    const screen = renderWithAppProviders(
      <TripSummaryScreen navigation={navigation as any} />,
      { user: { userName: "Alice", freshlyCreated: false } }
    );

    await waitFor(() => {
      expect(screen.getByText(i18n.t("myTrips"))).toBeTruthy();
    });
  });
});
