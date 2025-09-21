import { fetchTravelerIsTouched } from "./http";
import { getLastSyncTimestamp, isSyncNeeded } from "./sync-timestamp";
import safeLogError from "./error";

/**
 * Smart sync logic for determining when to sync data
 * Integrates with existing touched flag system and sync timestamps
 */

export interface SyncDecision {
  shouldSync: boolean;
  reason: string;
  lastSync: number;
  timeSinceSync: number;
  isTouched: boolean;
}

/**
 * Check if expenses should be synced for a specific user
 * @param tripid - Trip ID
 * @param uid - User ID
 * @param thresholdMs - Threshold in milliseconds (default: 1 hour)
 * @returns Promise<SyncDecision> - Sync decision with details
 */
export async function shouldSyncExpenses(
  tripid: string,
  uid: string,
  thresholdMs: number = 3600000
): Promise<SyncDecision> {
  try {
    const lastSync = getLastSyncTimestamp(tripid, uid);
    const timeSinceSync = Date.now() - lastSync;
    const isTouched = await fetchTravelerIsTouched(tripid, uid);
    const needsSyncByTime = isSyncNeeded(lastSync, thresholdMs);

    // Sync if touched OR if it's been too long since last sync
    const shouldSync = isTouched || needsSyncByTime;

    let reason = "";
    if (shouldSync) {
      if (isTouched) {
        reason = "User marked as touched";
      } else if (needsSyncByTime) {
        reason = `Last sync was ${Math.round(
          timeSinceSync / 1000 / 60
        )} minutes ago`;
      }
    } else {
      reason = "No changes detected and recent sync";
    }

    return {
      shouldSync,
      reason,
      lastSync,
      timeSinceSync,
      isTouched,
    };
  } catch (error) {
    safeLogError(error);
    // Default to sync on error
    return {
      shouldSync: true,
      reason: "Error checking sync status - defaulting to sync",
      lastSync: 0,
      timeSinceSync: Date.now(),
      isTouched: false,
    };
  }
}

/**
 * Check if trip data should be synced
 * @param tripid - Trip ID
 * @param thresholdMs - Threshold in milliseconds (default: 1 hour)
 * @returns Promise<SyncDecision> - Sync decision with details
 */
export async function shouldSyncTrip(
  tripid: string,
  thresholdMs: number = 3600000
): Promise<SyncDecision> {
  try {
    const { getTripSyncTimestamp } = require("./sync-timestamp");
    const lastSync = getTripSyncTimestamp(tripid);
    const timeSinceSync = Date.now() - lastSync;
    const needsSyncByTime = isSyncNeeded(lastSync, thresholdMs);

    const shouldSync = needsSyncByTime;

    let reason = "";
    if (shouldSync) {
      reason = `Trip data last synced ${Math.round(
        timeSinceSync / 1000 / 60
      )} minutes ago`;
    } else {
      reason = "Trip data recently synced";
    }

    return {
      shouldSync,
      reason,
      lastSync,
      timeSinceSync,
      isTouched: false,
    };
  } catch (error) {
    safeLogError(error);
    return {
      shouldSync: true,
      reason: "Error checking trip sync status - defaulting to sync",
      lastSync: 0,
      timeSinceSync: Date.now(),
      isTouched: false,
    };
  }
}

/**
 * Check if categories should be synced
 * @param tripid - Trip ID
 * @param thresholdMs - Threshold in milliseconds (default: 24 hours)
 * @returns Promise<SyncDecision> - Sync decision with details
 */
export async function shouldSyncCategories(
  tripid: string,
  thresholdMs: number = 86400000 // 24 hours
): Promise<SyncDecision> {
  try {
    const { getCategoriesSyncTimestamp } = require("./sync-timestamp");
    const lastSync = getCategoriesSyncTimestamp(tripid);
    const timeSinceSync = Date.now() - lastSync;
    const needsSyncByTime = isSyncNeeded(lastSync, thresholdMs);

    const shouldSync = needsSyncByTime;

    let reason = "";
    if (shouldSync) {
      reason = `Categories last synced ${Math.round(
        timeSinceSync / 1000 / 60 / 60
      )} hours ago`;
    } else {
      reason = "Categories recently synced";
    }

    return {
      shouldSync,
      reason,
      lastSync,
      timeSinceSync,
      isTouched: false,
    };
  } catch (error) {
    safeLogError(error);
    return {
      shouldSync: true,
      reason: "Error checking categories sync status - defaulting to sync",
      lastSync: 0,
      timeSinceSync: Date.now(),
      isTouched: false,
    };
  }
}

/**
 * Check if travellers should be synced
 * @param tripid - Trip ID
 * @param thresholdMs - Threshold in milliseconds (default: 1 hour)
 * @returns Promise<SyncDecision> - Sync decision with details
 */
export async function shouldSyncTravellers(
  tripid: string,
  thresholdMs: number = 3600000
): Promise<SyncDecision> {
  try {
    const { getTravellersSyncTimestamp } = require("./sync-timestamp");
    const lastSync = getTravellersSyncTimestamp(tripid);
    const timeSinceSync = Date.now() - lastSync;
    const needsSyncByTime = isSyncNeeded(lastSync, thresholdMs);

    const shouldSync = needsSyncByTime;

    let reason = "";
    if (shouldSync) {
      reason = `Travellers last synced ${Math.round(
        timeSinceSync / 1000 / 60
      )} minutes ago`;
    } else {
      reason = "Travellers recently synced";
    }

    return {
      shouldSync,
      reason,
      lastSync,
      timeSinceSync,
      isTouched: false,
    };
  } catch (error) {
    safeLogError(error);
    return {
      shouldSync: true,
      reason: "Error checking travellers sync status - defaulting to sync",
      lastSync: 0,
      timeSinceSync: Date.now(),
      isTouched: false,
    };
  }
}

/**
 * Get comprehensive sync status for a trip
 * @param tripid - Trip ID
 * @param uids - Array of user IDs in the trip
 * @returns Promise<object> - Complete sync status
 */
export async function getTripSyncStatus(
  tripid: string,
  uids: string[] = []
): Promise<{
  trip: SyncDecision;
  categories: SyncDecision;
  travellers: SyncDecision;
  users: { [uid: string]: SyncDecision };
  overallSyncNeeded: boolean;
}> {
  try {
    const [trip, categories, travellers, ...userDecisions] = await Promise.all([
      shouldSyncTrip(tripid),
      shouldSyncCategories(tripid),
      shouldSyncTravellers(tripid),
      ...uids.map((uid) => shouldSyncExpenses(tripid, uid)),
    ]);

    const users: { [uid: string]: SyncDecision } = {};
    uids.forEach((uid, index) => {
      users[uid] = userDecisions[index];
    });

    const overallSyncNeeded =
      trip.shouldSync ||
      categories.shouldSync ||
      travellers.shouldSync ||
      Object.values(users).some((user) => user.shouldSync);

    return {
      trip,
      categories,
      travellers,
      users,
      overallSyncNeeded,
    };
  } catch (error) {
    safeLogError(error);
    return {
      trip: {
        shouldSync: true,
        reason: "Error",
        lastSync: 0,
        timeSinceSync: 0,
        isTouched: false,
      },
      categories: {
        shouldSync: true,
        reason: "Error",
        lastSync: 0,
        timeSinceSync: 0,
        isTouched: false,
      },
      travellers: {
        shouldSync: true,
        reason: "Error",
        lastSync: 0,
        timeSinceSync: 0,
        isTouched: false,
      },
      users: {},
      overallSyncNeeded: true,
    };
  }
}

/**
 * Log sync decision for debugging
 * @param decision - Sync decision to log
 * @param context - Additional context for logging
 */
export function logSyncDecision(
  decision: SyncDecision,
  context: string = ""
): void {
  const prefix = context ? `[${context}] ` : "";
  console.log(
    `${prefix}Sync Decision: ${decision.shouldSync ? "SYNC" : "SKIP"} - ${
      decision.reason
    }`
  );
  if (decision.lastSync > 0) {
    console.log(
      `${prefix}Last sync: ${new Date(decision.lastSync).toISOString()}`
    );
  }
  if (decision.isTouched) {
    console.log(`${prefix}User is marked as touched`);
  }
}
