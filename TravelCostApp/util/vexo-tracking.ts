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

let vexoInitialized = false;
let vexoEnabled = false;

export interface VexoUserContext {
  userId?: string;
  tripId?: string;
  locale?: string;
  buildProfile?: string;
}

const isProduction = !__DEV__;

const shouldEnableVexo = isProduction && Device.isDevice && !DEVELOPER_MODE;

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

export const VexoEvents = {
  // Expense Management
  EXPENSE_CREATED: "expense_created",
  EXPENSE_EDITED: "expense_edited",
  EXPENSE_DELETED: "expense_deleted",
  BULK_EXPENSE_ACTION: "bulk_expense_action",

  // Trip Management
  TRIP_CREATED: "trip_created",
  TRIP_JOINED: "trip_joined",
  TRIP_SHARED: "trip_shared",
  TRAVELER_ADDED: "traveler_added",

  // Financial Features
  SPLIT_CALCULATED: "split_calculated",
  PAYMENT_MARKED: "payment_marked",
  SETTLE_ALL_PRESSED: "settle_all_pressed",
  EXPORT_TRIGGERED: "export_triggered",

  // AI/Smart Features
  GPT_RECOMMENDATION_USED: "gpt_recommendation_used",
  CATEGORY_SUGGESTION_ACCEPTED: "category_suggestion_accepted",
  SMART_CATEGORIZATION: "smart_categorization",

  // Premium/Monetization
  PAYWALL_VIEWED: "paywall_viewed",
  SUBSCRIPTION_STARTED: "subscription_started",
  TRIAL_STARTED: "trial_started",
  FEATURE_BLOCKED: "feature_blocked",

  // Social/Sharing
  TRIP_INVITE_SENT: "trip_invite_sent",
  DEEP_LINK_OPENED: "deep_link_opened",
  REFERRAL_COMPLETED: "referral_completed",

  // Error Tracking
  ERROR_OCCURRED: "error_occurred",
} as const;

export type VexoEventName = (typeof VexoEvents)[keyof typeof VexoEvents];
