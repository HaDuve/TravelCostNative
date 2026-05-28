const mockCheckForUpdateAsync = jest.fn();

jest.mock("expo-updates", () => ({
  get isEnabled() {
    return mockIsEnabled;
  },
  get updateId() {
    return mockUpdateId;
  },
  get createdAt() {
    return mockCreatedAt;
  },
  checkForUpdateAsync: (...args: unknown[]) => mockCheckForUpdateAsync(...args),
}));

let mockIsEnabled = true;
let mockUpdateId: string | null = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
let mockCreatedAt: Date | null = new Date("2026-05-20T10:00:00.000Z");

import { getEasUpdateInfo } from "../../util/easUpdateInfo";

describe("getEasUpdateInfo", () => {
  beforeEach(() => {
    mockIsEnabled = true;
    mockUpdateId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
    mockCreatedAt = new Date("2026-05-20T10:00:00.000Z");
    mockCheckForUpdateAsync.mockReset();
  });

  it("exposes the running OTA update id and publish time when expo-updates is enabled", async () => {
    const info = await getEasUpdateInfo({ checkForNewer: false });

    expect(info.runningUpdateId).toBe(
      "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
    );
    expect(info.runningUpdateCreatedAt).toBe("2026-05-20T10:00:00.000Z");
    expect(info.newerUpdateAvailable).toBe(false);
    expect(mockCheckForUpdateAsync).not.toHaveBeenCalled();
  });

  it("exposes newer OTA id and publish time when the server has a newer bundle", async () => {
    mockCheckForUpdateAsync.mockResolvedValue({
      isAvailable: true,
      manifest: {
        id: "11111111-2222-3333-4444-555555555555",
        createdAt: "2026-05-21T15:30:00.000Z",
      },
    });

    const info = await getEasUpdateInfo({ checkForNewer: true });

    expect(info.updatesEnabled).toBe(true);
    expect(info.newerUpdateAvailable).toBe(true);
    expect(info.newerUpdateId).toBe("11111111-2222-3333-4444-555555555555");
    expect(info.newerUpdateCreatedAt).toBe("2026-05-21T15:30:00.000Z");
    expect(mockCheckForUpdateAsync).toHaveBeenCalled();
  });

  it("does not claim newer update is available when the newer manifest has no displayable fields", async () => {
    mockCheckForUpdateAsync.mockResolvedValue({
      isAvailable: true,
      manifest: {},
    });

    const info = await getEasUpdateInfo({ checkForNewer: true });

    expect(info.newerUpdateAvailable).toBe(false);
    expect(info.newerUpdateId).toBeNull();
    expect(info.newerUpdateCreatedAt).toBeNull();
  });

  it("leaves update fields empty and skips server check when expo-updates is disabled", async () => {
    mockIsEnabled = false;
    mockUpdateId = "should-not-appear";
    mockCreatedAt = new Date("2026-05-20T10:00:00.000Z");

    const info = await getEasUpdateInfo({ checkForNewer: true });

    expect(info.updatesEnabled).toBe(false);
    expect(info.runningUpdateId).toBeNull();
    expect(info.runningUpdateCreatedAt).toBeNull();
    expect(info.newerUpdateAvailable).toBe(false);
    expect(mockCheckForUpdateAsync).not.toHaveBeenCalled();
  });
});
