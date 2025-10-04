import {
  vexo,
  customEvent,
  identifyDevice,
  enableTracking,
} from "vexo-analytics";
import Constants from "expo-constants";
import * as Device from "expo-device";
import { DEVELOPER_MODE } from "../confAppConstants";
import safeLogError from "./error";
import { VexoEvents, VexoEventName } from "./vexo-constants";

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
      console.log("[Vexo] Skipping initialization (dev mode or simulator)");
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

    console.log("[Vexo] Successfully initialized");
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

export function trackEvent(
  eventName: VexoEventName,
  properties?: Record<string, any>
) {
  if (!vexoEnabled) return;
  try {
    customEvent(eventName, properties || {});
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
