import { readEasUpdateMessageFromManifest } from "./eas-update-message-from-manifest";
import { resolveIsCriticalOta } from "./resolve-critical-ota";

export type OtaApplyClient = {
  isEnabled: boolean;
  checkForUpdate: () => Promise<{
    isAvailable: boolean;
    manifest?: unknown;
  }>;
  fetchUpdate: () => Promise<void>;
  fetchChangelog: () => Promise<string | null | undefined>;
  /** Optional; never called by checkAndFetchOtaUpdate — kept for shared client shape. */
  reload: () => Promise<unknown>;
};

export type OtaApplyResult = {
  available: boolean;
  updateReady: boolean;
  isCritical: boolean;
};

const IDLE: OtaApplyResult = {
  available: false,
  updateReady: false,
  isCritical: false,
};

/**
 * Shared OTA path: check → (resolve critical) → fetch.
 * Does not reload; callers show the critical overlay or an optional Settings reload.
 */
export async function checkAndFetchOtaUpdate(
  client: OtaApplyClient
): Promise<OtaApplyResult> {
  if (!client.isEnabled) {
    return IDLE;
  }

  let check: { isAvailable: boolean; manifest?: unknown };
  try {
    check = await client.checkForUpdate();
  } catch {
    return IDLE;
  }

  if (!check.isAvailable) {
    return IDLE;
  }

  const easMessage = readEasUpdateMessageFromManifest(check.manifest);
  let changelogSource: string | null | undefined = null;
  if (!easMessage) {
    try {
      changelogSource = await client.fetchChangelog();
    } catch {
      changelogSource = null;
    }
  }

  const isCritical = resolveIsCriticalOta({
    easMessage,
    changelogSource,
  });

  try {
    await client.fetchUpdate();
  } catch {
    return {
      available: true,
      updateReady: false,
      isCritical,
    };
  }

  return {
    available: true,
    updateReady: true,
    isCritical,
  };
}
