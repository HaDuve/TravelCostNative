import * as Updates from "expo-updates";

export type EasUpdateInfo = {
  runningUpdateId: string | null;
  runningUpdateCreatedAt: string | null;
  newerUpdateId: string | null;
  newerUpdateCreatedAt: string | null;
  newerUpdateAvailable: boolean;
};

type GetEasUpdateInfoOptions = {
  checkForNewer?: boolean;
};

export async function getEasUpdateInfo(
  options: GetEasUpdateInfoOptions = {}
): Promise<EasUpdateInfo> {
  const { checkForNewer = true } = options;

  const info: EasUpdateInfo = {
    runningUpdateId: Updates.isEnabled ? Updates.updateId : null,
    runningUpdateCreatedAt: Updates.isEnabled
      ? (Updates.createdAt?.toISOString() ?? null)
      : null,
    newerUpdateId: null,
    newerUpdateCreatedAt: null,
    newerUpdateAvailable: false,
  };

  if (!Updates.isEnabled || !checkForNewer) {
    return info;
  }

  try {
    const check = await Updates.checkForUpdateAsync();
    if (check.isAvailable && check.manifest) {
      const manifest = check.manifest as { id?: string; createdAt?: string };
      info.newerUpdateAvailable = true;
      info.newerUpdateId = manifest.id ?? null;
      info.newerUpdateCreatedAt = manifest.createdAt
        ? new Date(manifest.createdAt).toISOString()
        : null;
    }
  } catch {
    // Leave newer fields empty; footer still shows running update.
  }

  return info;
}
