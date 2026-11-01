import * as React from "react";
import { fireEvent } from "@testing-library/react-native";

import CriticalUpdateOverlay from "../../components/UI/CriticalUpdateOverlay";
import { renderWithAppProviders } from "../fixtures/app-providers";
import { i18n } from "../../i18n/i18n";

describe("CriticalUpdateOverlay", () => {
  it("explains a required update and reloads from the primary action", () => {
    const onReload = jest.fn();

    const screen = renderWithAppProviders(
      <CriticalUpdateOverlay visible onReload={onReload} />,
      { wrapNavigation: false }
    );

    expect(
      screen.getByText(i18n.t("criticalUpdateOverlayTitle"))
    ).toBeTruthy();
    expect(
      screen.getByText(i18n.t("criticalUpdateOverlayBody"))
    ).toBeTruthy();

    fireEvent.press(
      screen.getByRole("button", {
        name: i18n.t("criticalUpdateOverlayReload"),
      })
    );

    expect(onReload).toHaveBeenCalledTimes(1);
  });

  it("has no dismiss control that returns to the app without reloading", () => {
    const onReload = jest.fn();

    const screen = renderWithAppProviders(
      <CriticalUpdateOverlay visible onReload={onReload} />,
      { wrapNavigation: false }
    );

    expect(screen.queryByRole("button", { name: /dismiss|close|later/i })).toBeNull();
    expect(screen.queryByTestId("critical-update-overlay-dismiss")).toBeNull();
  });

  it("renders nothing when not visible", () => {
    const screen = renderWithAppProviders(
      <CriticalUpdateOverlay visible={false} onReload={jest.fn()} />,
      { wrapNavigation: false }
    );

    expect(
      screen.queryByText(i18n.t("criticalUpdateOverlayTitle"))
    ).toBeNull();
  });
});
