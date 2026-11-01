import * as React from "react";
import { AppState } from "react-native";
import { act, fireEvent, waitFor } from "@testing-library/react-native";

const mockRequestCheckAndFetch = jest.fn();
const mockApplyReload = jest.fn();
let mockUpdateReady = false;
let mockIsCritical = false;

jest.mock("../../store/critical-ota-context", () => ({
  useCriticalOta: () => ({
    updateReady: mockUpdateReady,
    isCritical: mockIsCritical,
    noteUpdateReady: jest.fn(),
    requestCheckAndFetch: (...args: unknown[]) =>
      mockRequestCheckAndFetch(...args),
    applyReload: (...args: unknown[]) => mockApplyReload(...args),
  }),
}));

import CriticalUpdateHost from "../../components/UI/CriticalUpdateHost";
import { renderWithAppProviders } from "../fixtures/app-providers";
import { i18n } from "../../i18n/i18n";

describe("CriticalUpdateHost", () => {
  let appStateSpy: jest.SpyInstance;

  beforeEach(() => {
    mockRequestCheckAndFetch.mockReset();
    mockApplyReload.mockReset();
    mockRequestCheckAndFetch.mockResolvedValue({
      available: false,
      updateReady: false,
      isCritical: false,
    });
    mockUpdateReady = false;
    mockIsCritical = false;
    appStateSpy = jest
      .spyOn(AppState, "addEventListener")
      .mockReturnValue({ remove: jest.fn() } as never);
  });

  afterEach(() => {
    appStateSpy.mockRestore();
  });

  it("checks for updates on mount without showing an overlay when none is ready", async () => {
    const screen = renderWithAppProviders(
      <CriticalUpdateHost focusedRouteName="RecentExpenses" />,
      { wrapNavigation: false }
    );

    await waitFor(() => {
      expect(mockRequestCheckAndFetch).toHaveBeenCalled();
    });
    expect(
      screen.queryByText(i18n.t("criticalUpdateOverlayTitle"))
    ).toBeNull();
  });

  it("shows the overlay on a safe tab when a critical update is ready", async () => {
    mockUpdateReady = true;
    mockIsCritical = true;

    const screen = renderWithAppProviders(
      <CriticalUpdateHost focusedRouteName="Overview" />,
      { wrapNavigation: false }
    );

    expect(
      await screen.findByText(i18n.t("criticalUpdateOverlayTitle"))
    ).toBeTruthy();

    fireEvent.press(
      screen.getByRole("button", {
        name: i18n.t("criticalUpdateOverlayReload"),
      })
    );
    expect(mockApplyReload).toHaveBeenCalledTimes(1);
  });

  it("defers the overlay while Manage Expense is focused", async () => {
    mockUpdateReady = true;
    mockIsCritical = true;

    const screen = renderWithAppProviders(
      <CriticalUpdateHost focusedRouteName="ManageExpense" />,
      { wrapNavigation: false }
    );

    await waitFor(() => {
      expect(mockRequestCheckAndFetch).toHaveBeenCalled();
    });
    expect(
      screen.queryByText(i18n.t("criticalUpdateOverlayTitle"))
    ).toBeNull();
  });

  it("shows the overlay after leaving a form for a safe tab", async () => {
    mockUpdateReady = true;
    mockIsCritical = true;

    const screen = renderWithAppProviders(
      <CriticalUpdateHost focusedRouteName="ManageExpense" />,
      { wrapNavigation: false }
    );

    expect(
      screen.queryByText(i18n.t("criticalUpdateOverlayTitle"))
    ).toBeNull();

    screen.rerender(<CriticalUpdateHost focusedRouteName="Overview" />);

    expect(
      await screen.findByText(i18n.t("criticalUpdateOverlayTitle"))
    ).toBeTruthy();
  });

  it("checks again when returning to the foreground", async () => {
    renderWithAppProviders(
      <CriticalUpdateHost focusedRouteName="RecentExpenses" />,
      { wrapNavigation: false }
    );

    await waitFor(() => {
      expect(mockRequestCheckAndFetch).toHaveBeenCalledTimes(1);
    });

    const listener = appStateSpy.mock.calls[0][1];
    await act(async () => {
      listener("active");
    });

    await waitFor(() => {
      expect(mockRequestCheckAndFetch).toHaveBeenCalledTimes(2);
    });
  });
});
