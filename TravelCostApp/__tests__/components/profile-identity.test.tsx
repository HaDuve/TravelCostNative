import * as React from "react";

jest.mock("../../util/vexo-tracking", () => ({
  trackEvent: jest.fn(),
}));

import ProfileIdentity from "../../components/ManageProfile/ProfileIdentity";
import { renderWithAppProviders } from "../fixtures/app-providers";

describe("Profile identity", () => {
  it("shows the signed-in User name", () => {
    const navigation = { navigate: jest.fn() };
    const screen = renderWithAppProviders(
      <ProfileIdentity navigation={navigation as any} />,
      {
        wrapNavigation: false,
        user: {
          userName: "Alice",
          freshlyCreated: false,
        },
      }
    );

    expect(screen.getByText("Alice")).toBeTruthy();
    expect(screen.getByTestId("profile-identity")).toBeTruthy();
  });
});
