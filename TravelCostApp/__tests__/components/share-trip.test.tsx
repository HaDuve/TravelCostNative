import * as React from "react";

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(async () => {}),
  ImpactFeedbackStyle: { Light: "Light" },
}));

import ShareTripButton from "../../components/ProfileOutput/ShareTrip";
import { renderWithAppProviders } from "../fixtures/app-providers";
import { i18n } from "../../i18n/i18n";

describe("ShareTrip invite action row", () => {
  it("shows the budget invite description once, not again as the row hint", () => {
    const navigation = { goBack: jest.fn() };
    const route = { params: { tripId: "t1" } };
    const description = i18n.t("shareTripDescription");

    const screen = renderWithAppProviders(
      <ShareTripButton navigation={navigation as any} route={route as any} />
    );

    expect(screen.getAllByText(description)).toHaveLength(1);
    expect(screen.getByTestId("share-trip-invite")).toBeTruthy();
  });
});
