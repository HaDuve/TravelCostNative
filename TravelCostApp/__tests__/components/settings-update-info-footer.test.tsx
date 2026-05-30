import * as React from "react";
import { fireEvent } from "@testing-library/react-native";

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

jest.mock("../../util/easUpdateInfo", () => ({
  getEasUpdateInfo: jest.fn(),
}));

import { getEasUpdateInfo } from "../../util/easUpdateInfo";
import SettingsUpdateInfoFooter from "../../components/Settings/SettingsUpdateInfoFooter";
import { renderWithAppProviders } from "../fixtures/app-providers";
import { i18n } from "../../i18n/i18n";

const mockGetEasUpdateInfo = getEasUpdateInfo as jest.MockedFunction<
  typeof getEasUpdateInfo
>;

function expandVersionFooter(screen: ReturnType<typeof renderWithAppProviders>) {
  fireEvent.press(screen.getByText(i18n.t("settingsVersionHeader")));
}

describe("SettingsUpdateInfoFooter", () => {
  beforeEach(() => {
    mockGetEasUpdateInfo.mockReset();
  });

  it("shows only the Version header when collapsed", async () => {
    mockGetEasUpdateInfo.mockResolvedValue({
      updatesEnabled: true,
      runningUpdateId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      runningUpdateCreatedAt: "2026-05-20T10:00:00.000Z",
      newerUpdateId: null,
      newerUpdateCreatedAt: null,
      newerUpdateAvailable: false,
    });

    const screen = renderWithAppProviders(<SettingsUpdateInfoFooter />, {
      wrapNavigation: false,
      network: { isConnected: true, strongConnection: true },
    });

    expect(await screen.findByText(i18n.t("settingsVersionHeader"))).toBeTruthy();
    expect(screen.getByTestId("icon-chevron-down")).toBeTruthy();
    expect(
      screen.queryByText(
        /aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee|Current version created at/i
      )
    ).toBeNull();
  });

  it("shows the current version created-at line when expanded", async () => {
    mockGetEasUpdateInfo.mockResolvedValue({
      updatesEnabled: true,
      runningUpdateId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
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

    expect(screen.getByText(/Current version created at:/i)).toBeTruthy();
    expect(
      screen.queryByText(/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/)
    ).toBeNull();
    expect(screen.getByTestId("icon-chevron-up")).toBeTruthy();
  });

  it("shows the latest version line only when a newer bundle is available", async () => {
    mockGetEasUpdateInfo.mockResolvedValue({
      updatesEnabled: true,
      runningUpdateId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      runningUpdateCreatedAt: "2026-05-20T10:00:00.000Z",
      newerUpdateId: "11111111-2222-3333-4444-555555555555",
      newerUpdateCreatedAt: "2026-05-21T15:30:00.000Z",
      newerUpdateAvailable: true,
    });

    const screen = renderWithAppProviders(<SettingsUpdateInfoFooter />, {
      wrapNavigation: false,
      network: { isConnected: true, strongConnection: true },
    });

    await screen.findByText(i18n.t("settingsVersionHeader"));
    expandVersionFooter(screen);

    expect(screen.getByText(/Latest version available at:/i)).toBeTruthy();
    expect(
      screen.queryByText(/11111111-2222-3333-4444-555555555555/)
    ).toBeNull();
  });

  it("does not show the latest version line when no newer bundle is available", async () => {
    mockGetEasUpdateInfo.mockResolvedValue({
      updatesEnabled: true,
      runningUpdateId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
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

    expect(screen.queryByText(/Latest version available at:/i)).toBeNull();
  });

  it("shows updates-disabled copy inside the expandable area", async () => {
    mockGetEasUpdateInfo.mockResolvedValue({
      updatesEnabled: false,
      runningUpdateId: null,
      runningUpdateCreatedAt: null,
      newerUpdateId: null,
      newerUpdateCreatedAt: null,
      newerUpdateAvailable: false,
    });

    const screen = renderWithAppProviders(<SettingsUpdateInfoFooter />, {
      wrapNavigation: false,
      network: { isConnected: true, strongConnection: true },
    });

    expect(await screen.findByText(i18n.t("settingsVersionHeader"))).toBeTruthy();
    expect(screen.queryByText(/Updates disabled/i)).toBeNull();

    expandVersionFooter(screen);

    expect(screen.getByText(/Updates disabled/i)).toBeTruthy();
    expect(screen.queryByText(/Current version created at:/i)).toBeNull();
  });
});
