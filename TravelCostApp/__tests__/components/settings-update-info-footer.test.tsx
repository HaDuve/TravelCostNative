import * as React from "react";

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

const mockGetEasUpdateInfo = getEasUpdateInfo as jest.MockedFunction<
  typeof getEasUpdateInfo
>;

describe("SettingsUpdateInfoFooter", () => {
  beforeEach(() => {
    mockGetEasUpdateInfo.mockReset();
  });

  it("shows the running OTA update id and publish time", async () => {
    mockGetEasUpdateInfo.mockResolvedValue({
      updatesEnabled: true,
      runningUpdateId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      runningUpdateCreatedAt: "2026-05-20T10:00:00.000Z",
      newerUpdateId: null,
      newerUpdateCreatedAt: null,
      newerUpdateAvailable: false,
    });

    const screen = renderWithAppProviders(
      <SettingsUpdateInfoFooter />,
      {
        wrapNavigation: false,
        network: { isConnected: true, strongConnection: true },
      }
    );

    expect(
      await screen.findByText(/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/)
    ).toBeTruthy();
    expect(screen.getByText(/Version ID/i)).toBeTruthy();
    expect(screen.getByText(/Version created at/i)).toBeTruthy();
    expect(screen.queryByText(/Newer version ID/i)).toBeNull();
  });

  it("shows newer OTA id and publish time when a newer bundle is available", async () => {
    mockGetEasUpdateInfo.mockResolvedValue({
      updatesEnabled: true,
      runningUpdateId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      runningUpdateCreatedAt: "2026-05-20T10:00:00.000Z",
      newerUpdateId: "11111111-2222-3333-4444-555555555555",
      newerUpdateCreatedAt: "2026-05-21T15:30:00.000Z",
      newerUpdateAvailable: true,
    });

    const screen = renderWithAppProviders(
      <SettingsUpdateInfoFooter />,
      {
        wrapNavigation: false,
        network: { isConnected: true, strongConnection: true },
      }
    );

    expect(
      await screen.findByText(/11111111-2222-3333-4444-555555555555/)
    ).toBeTruthy();
    expect(screen.getByText(/Newer version ID/i)).toBeTruthy();
  });

  it("shows an explicit message when expo-updates is disabled on this build", async () => {
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

    expect(await screen.findByText(/Updates disabled/i)).toBeTruthy();
    expect(screen.queryByText(/Version ID/i)).toBeNull();
    expect(screen.queryByText(/Newer version ID/i)).toBeNull();
  });
});
