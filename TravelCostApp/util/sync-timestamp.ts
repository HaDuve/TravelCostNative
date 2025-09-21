import { getMMKVString, setMMKVString } from "../store/mmkv";

/**
 * Sync timestamp management for delta sync functionality
 * Tracks last sync timestamps for different data types and users
 */

// MMKV Keys for sync tracking
export const SYNC_KEYS = {
  lastSync: (tripid: string) => `lastSync_${tripid}`,
  userSync: (tripid: string, uid: string) => `lastSync_${tripid}_${uid}`,
  tripSync: (tripid: string) => `tripSync_${tripid}`,
  categoriesSync: (tripid: string) => `categoriesSync_${tripid}`,
  travellersSync: (tripid: string) => `travellersSync_${tripid}`,
} as const;

/**
 * Store the last sync timestamp for a specific user in a trip
 * @param tripid - Trip ID
 * @param uid - User ID
 * @param timestamp - Unix timestamp of last sync
 */
export function setLastSyncTimestamp(
  tripid: string,
  uid: string,
  timestamp: number
): void {
  try {
    setMMKVString(SYNC_KEYS.userSync(tripid, uid), timestamp.toString());
  } catch (error) {
    console.error("Error setting sync timestamp:", error);
  }
}

/**
 * Get the last sync timestamp for a specific user in a trip
 * @param tripid - Trip ID
 * @param uid - User ID
 * @returns Unix timestamp of last sync, or 0 if never synced
 */
export function getLastSyncTimestamp(tripid: string, uid: string): number {
  try {
    const stored = getMMKVString(SYNC_KEYS.userSync(tripid, uid));
    return stored ? parseInt(stored, 10) : 0;
  } catch (error) {
    console.error("Error getting sync timestamp:", error);
    return 0;
  }
}

/**
 * Store the last sync timestamp for trip metadata
 * @param tripid - Trip ID
 * @param timestamp - Unix timestamp of last sync
 */
export function setTripSyncTimestamp(tripid: string, timestamp: number): void {
  try {
    setMMKVString(SYNC_KEYS.tripSync(tripid), timestamp.toString());
  } catch (error) {
    console.error("Error setting trip sync timestamp:", error);
  }
}

/**
 * Get the last sync timestamp for trip metadata
 * @param tripid - Trip ID
 * @returns Unix timestamp of last sync, or 0 if never synced
 */
export function getTripSyncTimestamp(tripid: string): number {
  try {
    const stored = getMMKVString(SYNC_KEYS.tripSync(tripid));
    return stored ? parseInt(stored, 10) : 0;
  } catch (error) {
    console.error("Error getting trip sync timestamp:", error);
    return 0;
  }
}

/**
 * Store the last sync timestamp for categories
 * @param tripid - Trip ID
 * @param timestamp - Unix timestamp of last sync
 */
export function setCategoriesSyncTimestamp(
  tripid: string,
  timestamp: number
): void {
  try {
    setMMKVString(SYNC_KEYS.categoriesSync(tripid), timestamp.toString());
  } catch (error) {
    console.error("Error setting categories sync timestamp:", error);
  }
}

/**
 * Get the last sync timestamp for categories
 * @param tripid - Trip ID
 * @returns Unix timestamp of last sync, or 0 if never synced
 */
export function getCategoriesSyncTimestamp(tripid: string): number {
  try {
    const stored = getMMKVString(SYNC_KEYS.categoriesSync(tripid));
    return stored ? parseInt(stored, 10) : 0;
  } catch (error) {
    console.error("Error getting categories sync timestamp:", error);
    return 0;
  }
}

/**
 * Store the last sync timestamp for travellers
 * @param tripid - Trip ID
 * @param timestamp - Unix timestamp of last sync
 */
export function setTravellersSyncTimestamp(
  tripid: string,
  timestamp: number
): void {
  try {
    setMMKVString(SYNC_KEYS.travellersSync(tripid), timestamp.toString());
  } catch (error) {
    console.error("Error setting travellers sync timestamp:", error);
  }
}

/**
 * Get the last sync timestamp for travellers
 * @param tripid - Trip ID
 * @returns Unix timestamp of last sync, or 0 if never synced
 */
export function getTravellersSyncTimestamp(tripid: string): number {
  try {
    const stored = getMMKVString(SYNC_KEYS.travellersSync(tripid));
    return stored ? parseInt(stored, 10) : 0;
  } catch (error) {
    console.error("Error getting travellers sync timestamp:", error);
    return 0;
  }
}

/**
 * Clear all sync timestamps for a trip (useful for resetting sync state)
 * @param tripid - Trip ID
 */
export function clearSyncTimestamps(tripid: string): void {
  try {
    // Note: MMKV doesn't have a direct delete method, but we can set to empty string
    // In a real implementation, you might want to track keys and delete them properly
    setMMKVString(SYNC_KEYS.tripSync(tripid), "");
    setMMKVString(SYNC_KEYS.categoriesSync(tripid), "");
    setMMKVString(SYNC_KEYS.travellersSync(tripid), "");

    // For user sync timestamps, we'd need to know all UIDs to clear them
    // This is a limitation of the current design
    console.warn("User sync timestamps not cleared - need UID list");
  } catch (error) {
    console.error("Error clearing sync timestamps:", error);
  }
}

/**
 * Get all sync timestamps for a trip (for debugging/monitoring)
 * @param tripid - Trip ID
 * @param uids - Array of user IDs in the trip
 * @returns Object with all sync timestamps
 */
export function getAllSyncTimestamps(
  tripid: string,
  uids: string[] = []
): {
  trip: number;
  categories: number;
  travellers: number;
  users: { [uid: string]: number };
} {
  const result = {
    trip: getTripSyncTimestamp(tripid),
    categories: getCategoriesSyncTimestamp(tripid),
    travellers: getTravellersSyncTimestamp(tripid),
    users: {} as { [uid: string]: number },
  };

  uids.forEach((uid) => {
    result.users[uid] = getLastSyncTimestamp(tripid, uid);
  });

  return result;
}

/**
 * Check if a sync is needed based on timestamp and threshold
 * @param lastSync - Last sync timestamp
 * @param thresholdMs - Threshold in milliseconds (default: 1 hour)
 * @returns True if sync is needed
 */
export function isSyncNeeded(
  lastSync: number,
  thresholdMs: number = 3600000
): boolean {
  if (lastSync === 0) return true; // Never synced
  return Date.now() - lastSync > thresholdMs;
}
