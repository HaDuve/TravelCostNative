import {
  vexo,
  customEvent,
  identifyDevice,
  enableTracking,
} from "vexo-analytics";
import * as Device from "expo-device";
import { DEVELOPER_MODE } from "../confAppConstants";
import safeLogError from "./error";
import { VexoEventName } from "./vexo-constants";
import { secureStoreGetItem } from "../store/secure-storage";

import { i18n } from "../i18n/i18n";

let vexoInitialized = false;
let vexoEnabled = false;

export interface VexoUserContext {
  userId?: string;
  tripId?: string;
  locale?: string;
  buildProfile?: string;
}

const isProduction = !__DEV__;

export const shouldEnableVexo =
  isProduction && Device.isDevice && !DEVELOPER_MODE;

export async function initializeVexo(apiKey: string): Promise<boolean> {
  try {
    if (vexoInitialized) {
      return vexoEnabled;
    }

    if (!shouldEnableVexo) {
      return false;
    }

    if (!apiKey || apiKey.length === 0) {
      safeLogError("Vexo API key not provided", "vexo-tracking.ts", 33);
      return false;
    }

    vexo(apiKey);
    await enableTracking();

    vexoInitialized = true;
    vexoEnabled = true;

    return true;
  } catch (error) {
    safeLogError(error, "vexo-tracking.ts", 44);
    vexoInitialized = true;
    vexoEnabled = false;
    return false;
  }
}

export async function identifyUser(
  userId: VexoUserContext["userId"]
): Promise<void> {
  if (!vexoEnabled) return;

  try {
    const deviceIdentifier = userId || Device.modelId || "unknown";
    await identifyDevice(deviceIdentifier);
  } catch (error) {
    safeLogError(error, "vexo-tracking.ts", 63);
  }
}

export async function trackEvent(
  eventName: VexoEventName,
  properties?: Record<string, any>
) {
  if (!vexoEnabled) return;

  try {
    // Fetch user data asynchronously
    const [userId, userName] = await Promise.all([
      secureStoreGetItem("uid").catch(() => ""),
      secureStoreGetItem("userName").catch(() => ""),
    ]);

    // Get user language from i18n.locale
    const userLanguage = i18n.locale || "en";

    // Merge userData into event properties
    const enrichedProperties = {
      ...(properties || {}),
      userData: {
        userId: userId || undefined,
        userName: userName || undefined,
        userLanguage: userLanguage,
      },
    };

    // Fire and forget - don't await to avoid blocking
    customEvent(eventName, enrichedProperties);
  } catch (error) {
    safeLogError(error, "vexo-tracking.ts", 76);
  }
}

export function getVexoStatus(): { initialized: boolean; enabled: boolean } {
  return {
    initialized: vexoInitialized,
    enabled: vexoEnabled,
  };
}
