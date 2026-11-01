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

const mockCheckAndFetchOtaUpdate = jest.fn();
const mockReload = jest.fn();

jest.mock("../../util/easUpdateInfo", () => ({
  getEasUpdateInfo: jest.fn(),
}));

jest.mock("../../util/check-and-fetch-ota-update", () => ({
  checkAndFetchOtaUpdate: (...args: unknown[]) =>
    mockCheckAndFetchOtaUpdate(...args),
}));

jest.mock("../../util/ota-apply-client", () => ({
  createExpoOtaApplyClient: () => ({
    isEnabled: true,
    checkForUpdate: jest.fn(),
    fetchUpdate: jest.fn(),
    fetchChangelog: jest.fn(),
    reload: (...args: unknown[]) => mockReload(...args),
  }),
}));

import { getEasUpdateInfo } from "../../util/easUpdateInfo";
import SettingsUpdateInfoFooter from "../../components/Settings/SettingsUpdateInfoFooter";
import { renderWithAppProviders } from "../fixtures/app-providers";
import { i18n } from "../../i18n/i18n";

const mockGetEasUpdateInfo = getEasUpdateInfo as jest.MockedFunction<
  typeof getEasUpdateInfo
>;

function expandVersionFooter(screen: ReturnType<typeof renderWithAppProviders>) {
  fireEvent.press(
    screen.getByRole("button", { name: i18n.t("settingsVersionHeader") })
  );
}

describe("SettingsUpdateInfoFooter apply CTA", () => {
  beforeEach(() => {
    mockGetEasUpdateInfo.mockReset();
    mockCheckAndFetchOtaUpdate.mockReset();
    mockReload.mockReset();
  });

  it("uses the shared check → fetch → reload path for a newer non-critical update", async () => {
    mockGetEasUpdateInfo.mockResolvedValue({
      updatesEnabled: true,
      runningUpdateId: "running-id",
      runningUpdateCreatedAt: "2026-05-20T10:00:00.000Z",
      newerUpdateId: "newer-id",
      newerUpdateCreatedAt: "2026-05-21T15:30:00.000Z",
      newerUpdateAvailable: true,
    });
    mockCheckAndFetchOtaUpdate.mockResolvedValue({
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
      expect(mockCheckAndFetchOtaUpdate).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(mockReload).toHaveBeenCalledTimes(1);
    });
  });

  it("does not hard-block when the shared flow reports a non-critical update", async () => {
    mockGetEasUpdateInfo.mockResolvedValue({
      updatesEnabled: true,
      runningUpdateId: "running-id",
      runningUpdateCreatedAt: "2026-05-20T10:00:00.000Z",
      newerUpdateId: "newer-id",
      newerUpdateCreatedAt: "2026-05-21T15:30:00.000Z",
      newerUpdateAvailable: true,
    });
    mockCheckAndFetchOtaUpdate.mockResolvedValue({
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
      expect(mockReload).toHaveBeenCalled();
    });
    expect(screen.queryByTestId("critical-update-overlay")).toBeNull();
  });

  it("does not show the apply CTA when no newer update is available", async () => {
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
});
