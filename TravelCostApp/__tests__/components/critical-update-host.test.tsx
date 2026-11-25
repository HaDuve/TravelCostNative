import * as React from "react";
import { AppState } from "react-native";
import { act, waitFor } from "@testing-library/react-native";

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
    mockApplyReload.mockResolvedValue(undefined);
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

  it("checks for updates on mount and does not reload when none is ready", async () => {
    renderWithAppProviders(
      <CriticalUpdateHost focusedRouteName="RecentExpenses" />,
      { wrapNavigation: false }
    );
    await waitFor(() => {
      expect(mockRequestCheckAndFetch).toHaveBeenCalled();
    });
    expect(mockApplyReload).not.toHaveBeenCalled();
  });

  it("reloads without interaction when a critical update is ready", async () => {
    mockUpdateReady = true;
    mockIsCritical = true;
    const screen = renderWithAppProviders(
      <CriticalUpdateHost focusedRouteName="Overview" />,
      { wrapNavigation: false }
    );
    await waitFor(() => {
      expect(mockApplyReload).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByText(i18n.t("criticalUpdateApplying"))).toBeTruthy();
  });

  it("never reloads on its own for a non-critical update", async () => {
    mockUpdateReady = true;
    mockIsCritical = false;
    renderWithAppProviders(<CriticalUpdateHost focusedRouteName="Overview" />, {
      wrapNavigation: false,
    });
    await waitFor(() => {
      expect(mockRequestCheckAndFetch).toHaveBeenCalled();
    });
    expect(mockApplyReload).not.toHaveBeenCalled();
  });

  it("defers the reload while Manage Expense is focused", async () => {
    mockUpdateReady = true;
    mockIsCritical = true;
    renderWithAppProviders(
      <CriticalUpdateHost focusedRouteName="ManageExpense" />,
      { wrapNavigation: false }
    );
    await waitFor(() => {
      expect(mockRequestCheckAndFetch).toHaveBeenCalled();
    });
    expect(mockApplyReload).not.toHaveBeenCalled();
  });

  it("reloads once after leaving the form, and only once", async () => {
    mockUpdateReady = true;
    mockIsCritical = true;
    const screen = renderWithAppProviders(
      <CriticalUpdateHost focusedRouteName="ManageExpense" />,
      { wrapNavigation: false }
    );
    expect(mockApplyReload).not.toHaveBeenCalled();

    screen.rerender(<CriticalUpdateHost focusedRouteName="Overview" />);
    await waitFor(() => {
      expect(mockApplyReload).toHaveBeenCalledTimes(1);
    });
    screen.rerender(<CriticalUpdateHost focusedRouteName="Settings" />);
    expect(mockApplyReload).toHaveBeenCalledTimes(1);
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
