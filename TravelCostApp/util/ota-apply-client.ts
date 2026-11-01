import * as Updates from "expo-updates";

import { reloadApp } from "./appState";
import { fetchChangelog } from "./http";
import type { OtaApplyClient } from "./check-and-fetch-ota-update";

/** Production expo-updates + changelog client for the shared OTA apply path. */
export function createExpoOtaApplyClient(): OtaApplyClient {
  return {
    isEnabled: Updates.isEnabled,
    checkForUpdate: () => Updates.checkForUpdateAsync(),
    fetchUpdate: async () => {
      await Updates.fetchUpdateAsync();
    },
    fetchChangelog: async () => {
      const source = await fetchChangelog();
      return source ?? null;
    },
    reload: () => reloadApp(),
  };
}
