import { checkAndFetchOtaUpdate } from "../../util/check-and-fetch-ota-update";

describe("checkAndFetchOtaUpdate", () => {
  it("checks then fetches a critical update without reloading", async () => {
    const reload = jest.fn();
    const fetchUpdate = jest.fn().mockResolvedValue(undefined);
    const result = await checkAndFetchOtaUpdate({
      isEnabled: true,
      checkForUpdate: async () => ({
        isAvailable: true,
        manifest: { id: "update-1" },
      }),
      fetchUpdate,
      fetchChangelog: async () => `Changelog

__Newest Changes:

1.3.005n!
- Fix excessive data usage

__Other Changes:
`,
      reload,
    });

    expect(fetchUpdate).toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();
    expect(result).toEqual({
      available: true,
      updateReady: true,
      isCritical: true,
    });
  });

  it("fetches a non-critical update without showing a hard-block result", async () => {
    const result = await checkAndFetchOtaUpdate({
      isEnabled: true,
      checkForUpdate: async () => ({
        isAvailable: true,
        manifest: {
          id: "update-2",
          metadata: { updateMessage: "1.3.005n: Ordinary fix" },
        },
      }),
      fetchUpdate: jest.fn().mockResolvedValue(undefined),
      fetchChangelog: async () => null,
      reload: jest.fn(),
    });

    expect(result).toEqual({
      available: true,
      updateReady: true,
      isCritical: false,
    });
  });

  it("returns no update when nothing is available", async () => {
    const fetchUpdate = jest.fn();
    const result = await checkAndFetchOtaUpdate({
      isEnabled: true,
      checkForUpdate: async () => ({ isAvailable: false }),
      fetchUpdate,
      fetchChangelog: async () => null,
      reload: jest.fn(),
    });

    expect(fetchUpdate).not.toHaveBeenCalled();
    expect(result).toEqual({
      available: false,
      updateReady: false,
      isCritical: false,
    });
  });

  it("leaves the app usable when check or fetch fails", async () => {
    await expect(
      checkAndFetchOtaUpdate({
        isEnabled: true,
        checkForUpdate: async () => {
          throw new Error("offline");
        },
        fetchUpdate: jest.fn(),
        fetchChangelog: async () => null,
        reload: jest.fn(),
      })
    ).resolves.toEqual({
      available: false,
      updateReady: false,
      isCritical: false,
    });

    await expect(
      checkAndFetchOtaUpdate({
        isEnabled: true,
        checkForUpdate: async () => ({
          isAvailable: true,
          manifest: { id: "update-3" },
        }),
        fetchUpdate: async () => {
          throw new Error("fetch failed");
        },
        fetchChangelog: async () => `Changelog

__Newest Changes:

1.3.005n!
- Fix

__Other Changes:
`,
        reload: jest.fn(),
      })
    ).resolves.toEqual({
      available: true,
      updateReady: false,
      isCritical: true,
    });
  });

  it("skips work when expo-updates is disabled", async () => {
    const checkForUpdate = jest.fn();
    const result = await checkAndFetchOtaUpdate({
      isEnabled: false,
      checkForUpdate,
      fetchUpdate: jest.fn(),
      fetchChangelog: async () => null,
      reload: jest.fn(),
    });

    expect(checkForUpdate).not.toHaveBeenCalled();
    expect(result).toEqual({
      available: false,
      updateReady: false,
      isCritical: false,
    });
  });

  it("uses the EAS message from the manifest when present", async () => {
    const fetchChangelog = jest.fn().mockResolvedValue(`Changelog

__Newest Changes:

1.3.005n!
- Critical on changelog

__Other Changes:
`);
    const result = await checkAndFetchOtaUpdate({
      isEnabled: true,
      checkForUpdate: async () => ({
        isAvailable: true,
        manifest: {
          id: "update-4",
          metadata: { updateMessage: "1.3.005n: Not critical on message" },
        },
      }),
      fetchUpdate: jest.fn().mockResolvedValue(undefined),
      fetchChangelog,
      reload: jest.fn(),
    });

    expect(fetchChangelog).not.toHaveBeenCalled();
    expect(result.isCritical).toBe(false);
  });
});
