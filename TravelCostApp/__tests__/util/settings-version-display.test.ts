import {
  buildVersionDisplayLines,
  formatPublishTime,
} from "../../util/settings-version-display";
import { EasUpdateInfo } from "../../util/easUpdateInfo";

describe("formatPublishTime", () => {
  it("returns an em dash when the timestamp is missing", () => {
    expect(formatPublishTime(null)).toBe("—");
  });

  it("formats ISO timestamps for display", () => {
    expect(formatPublishTime("2026-05-20T10:00:00.000Z")).toMatch(/May 20, 2026/);
  });
});

describe("buildVersionDisplayLines", () => {
  const runningInfo: EasUpdateInfo = {
    updatesEnabled: true,
    runningUpdateId: "running-id",
    runningUpdateCreatedAt: "2026-05-20T10:00:00.000Z",
    newerUpdateId: null,
    newerUpdateCreatedAt: null,
    newerUpdateAvailable: false,
  };

  it("builds the current version line from running update info", () => {
    const lines = buildVersionDisplayLines(runningInfo);

    expect(lines.updatesDisabled).toBe(false);
    expect(lines.currentLine).toMatch(/Current version created at:/);
    expect(lines.currentLine).toMatch(/May 20, 2026/);
    expect(lines.latestLine).toBeNull();
  });

  it("includes the latest version line when a newer bundle is available", () => {
    const lines = buildVersionDisplayLines({
      ...runningInfo,
      newerUpdateId: "newer-id",
      newerUpdateCreatedAt: "2026-05-21T15:30:00.000Z",
      newerUpdateAvailable: true,
    });

    expect(lines.latestLine).toMatch(/Latest version available at:/);
    expect(lines.latestLine).toMatch(/May 21, 2026/);
  });

  it("shows a placeholder created-at when info is still loading", () => {
    const lines = buildVersionDisplayLines(null);

    expect(lines.currentLine).toBe("Current version created at: —");
    expect(lines.latestLine).toBeNull();
    expect(lines.updatesDisabled).toBe(false);
  });

  it("returns only the disabled flag when updates are disabled", () => {
    const lines = buildVersionDisplayLines({
      ...runningInfo,
      updatesEnabled: false,
      runningUpdateId: null,
      runningUpdateCreatedAt: null,
    });

    expect(lines.updatesDisabled).toBe(true);
    expect(lines.currentLine).toBeNull();
    expect(lines.latestLine).toBeNull();
  });
});
