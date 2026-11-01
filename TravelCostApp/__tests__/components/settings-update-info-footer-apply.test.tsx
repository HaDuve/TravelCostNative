import * as React from "react";
import { fireEvent, waitFor } from "@testing-library/react-native";

jest.mock("@react-navigation/native", () => {
  const React = require("react");
  const actual = jest.requireActual("@react-navigation/native");
  return {
    ...actual,
    useFocusEffect: (callback: () => void | (() => void)) => {
      React.useEffect(() => {
        const cleanup = callback();
        return typeof cleanup === "function" ? cleanup : undefined;
      }, [callback]);
    },
  };
});

const mockRequestCheckAndFetch = jest.fn();
const mockApplyReload = jest.fn();
const mockCriticalOta = {
  updateReady: false,
  isCritical: false,
  noteUpdateReady: jest.fn(),
  requestCheckAndFetch: (...args: unknown[]) =>
    mockRequestCheckAndFetch(...args),
  applyReload: (...args: unknown[]) => mockApplyReload(...args),
};

jest.mock("../../util/easUpdateInfo", () => ({
  getEasUpdateInfo: jest.fn(),
}));

jest.mock("../../store/critical-ota-context", () => ({
  useCriticalOta: () => mockCriticalOta,
}));

jest.mock("react-native-toast-message", () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

import Toast from "react-native-toast-message";
import { getEasUpdateInfo } from "../../util/easUpdateInfo";
import SettingsUpdateInfoFooter from "../../components/Settings/SettingsUpdateInfoFooter";
import { renderWithAppProviders } from "../fixtures/app-providers";
import { i18n } from "../../i18n/i18n";

const mockGetEasUpdateInfo = getEasUpdateInfo as jest.MockedFunction<
  typeof getEasUpdateInfo
>;
const mockToastShow = Toast.show as jest.MockedFunction<typeof Toast.show>;

function expandVersionFooter(screen: ReturnType<typeof renderWithAppProviders>) {
  fireEvent.press(
    screen.getByRole("button", { name: i18n.t("settingsVersionHeader") })
  );
}

describe("SettingsUpdateInfoFooter apply CTA", () => {
  beforeEach(() => {
    mockGetEasUpdateInfo.mockReset();
    mockRequestCheckAndFetch.mockReset();
    mockApplyReload.mockReset();
    mockToastShow.mockReset();
    mockCriticalOta.updateReady = false;
    mockCriticalOta.isCritical = false;
  });

  it("reloads from shared pending state when Host already fetched a non-critical update", async () => {
    mockCriticalOta.updateReady = true;
    mockCriticalOta.isCritical = false;
    mockGetEasUpdateInfo.mockResolvedValue({
      updatesEnabled: true,
      runningUpdateId: "running-id",
      runningUpdateCreatedAt: "2026-05-20T10:00:00.000Z",
      newerUpdateId: null,
      newerUpdateCreatedAt: null,
      newerUpdateAvailable: false,
    });

    const screen = renderWithAppProviders(<SettingsUpdateInfoFooter />, {
      wrapNavigation: false,
      network: { isConnected: true, strongConnection: true },
    });

    await screen.findByText(i18n.t("settingsVersionHeader"));
    expandVersionFooter(screen);

    fireEvent.press(
      await screen.findByRole("button", {
        name: i18n.t("settingsApplyUpdate"),
      })
    );

    await waitFor(() => {
      expect(mockApplyReload).toHaveBeenCalledTimes(1);
    });
    expect(mockRequestCheckAndFetch).not.toHaveBeenCalled();
  });

  it("shows the apply CTA from shared pending state even when getEasUpdateInfo finds no newer", async () => {
    mockCriticalOta.updateReady = true;
    mockCriticalOta.isCritical = false;
    mockGetEasUpdateInfo.mockResolvedValue({
      updatesEnabled: true,
      runningUpdateId: "running-id",
      runningUpdateCreatedAt: "2026-05-20T10:00:00.000Z",
      newerUpdateId: null,
      newerUpdateCreatedAt: null,
      newerUpdateAvailable: false,
    });

    const screen = renderWithAppProviders(<SettingsUpdateInfoFooter />, {
      wrapNavigation: false,
      network: { isConnected: true, strongConnection: true },
    });

    await screen.findByText(i18n.t("settingsVersionHeader"));
    expandVersionFooter(screen);

    expect(
      screen.getByRole("button", { name: i18n.t("settingsApplyUpdate") })
    ).toBeTruthy();
  });

  it("uses requestCheckAndFetch then reload for a newer non-critical update", async () => {
    mockGetEasUpdateInfo.mockResolvedValue({
      updatesEnabled: true,
      runningUpdateId: "running-id",
      runningUpdateCreatedAt: "2026-05-20T10:00:00.000Z",
      newerUpdateId: "newer-id",
      newerUpdateCreatedAt: "2026-05-21T15:30:00.000Z",
      newerUpdateAvailable: true,
    });
    mockRequestCheckAndFetch.mockResolvedValue({
      available: true,
      updateReady: true,
      isCritical: false,
    });

    const screen = renderWithAppProviders(<SettingsUpdateInfoFooter />, {
      wrapNavigation: false,
      network: { isConnected: true, strongConnection: true },
    });

    await screen.findByText(i18n.t("settingsVersionHeader"));
    expandVersionFooter(screen);

    fireEvent.press(
      await screen.findByRole("button", {
        name: i18n.t("settingsApplyUpdate"),
      })
    );

    await waitFor(() => {
      expect(mockRequestCheckAndFetch).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(mockApplyReload).toHaveBeenCalledTimes(1);
    });
    expect(screen.queryByTestId("critical-update-overlay")).toBeNull();
  });

  it("does not reload immediately when the shared flow reports a critical update", async () => {
    mockGetEasUpdateInfo.mockResolvedValue({
      updatesEnabled: true,
      runningUpdateId: "running-id",
      runningUpdateCreatedAt: "2026-05-20T10:00:00.000Z",
      newerUpdateId: "newer-id",
      newerUpdateCreatedAt: "2026-05-21T15:30:00.000Z",
      newerUpdateAvailable: true,
    });
    mockRequestCheckAndFetch.mockResolvedValue({
      available: true,
      updateReady: true,
      isCritical: true,
    });

    const screen = renderWithAppProviders(<SettingsUpdateInfoFooter />, {
      wrapNavigation: false,
      network: { isConnected: true, strongConnection: true },
    });

    await screen.findByText(i18n.t("settingsVersionHeader"));
    expandVersionFooter(screen);
    fireEvent.press(
      await screen.findByRole("button", {
        name: i18n.t("settingsApplyUpdate"),
      })
    );

    await waitFor(() => {
      expect(mockRequestCheckAndFetch).toHaveBeenCalledTimes(1);
    });
    expect(mockApplyReload).not.toHaveBeenCalled();
  });

  it("does not show the apply CTA when nothing is pending or newer", async () => {
    mockGetEasUpdateInfo.mockResolvedValue({
      updatesEnabled: true,
      runningUpdateId: "running-id",
      runningUpdateCreatedAt: "2026-05-20T10:00:00.000Z",
      newerUpdateId: null,
      newerUpdateCreatedAt: null,
      newerUpdateAvailable: false,
    });

    const screen = renderWithAppProviders(<SettingsUpdateInfoFooter />, {
      wrapNavigation: false,
      network: { isConnected: true, strongConnection: true },
    });

    await screen.findByText(i18n.t("settingsVersionHeader"));
    expandVersionFooter(screen);

    expect(
      screen.queryByRole("button", { name: i18n.t("settingsApplyUpdate") })
    ).toBeNull();
  });

  it("surfaces apply failures with a toast and leaves the app usable", async () => {
    mockGetEasUpdateInfo.mockResolvedValue({
      updatesEnabled: true,
      runningUpdateId: "running-id",
      runningUpdateCreatedAt: "2026-05-20T10:00:00.000Z",
      newerUpdateId: "newer-id",
      newerUpdateCreatedAt: "2026-05-21T15:30:00.000Z",
      newerUpdateAvailable: true,
    });
    mockRequestCheckAndFetch.mockRejectedValue(new Error("offline"));

    const screen = renderWithAppProviders(<SettingsUpdateInfoFooter />, {
      wrapNavigation: false,
      network: { isConnected: true, strongConnection: true },
    });

    await screen.findByText(i18n.t("settingsVersionHeader"));
    expandVersionFooter(screen);
    fireEvent.press(
      await screen.findByRole("button", {
        name: i18n.t("settingsApplyUpdate"),
      })
    );

    await waitFor(() => {
      expect(mockToastShow).toHaveBeenCalled();
    });
    expect(mockApplyReload).not.toHaveBeenCalled();
  });
});
