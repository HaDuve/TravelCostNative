import { getMMKVString, setMMKVString } from "../store/mmkv";

/**
 * Simple timestamp management for expenses fetch
 * Stores the last fetch timestamp in MMKV for each trip on this device
 */

/**
 * Validate that a timestamp is a valid positive number
 * @param timestamp - Value to validate
 * @returns True if valid timestamp
 */
function isValidTimestamp(timestamp: any): timestamp is number {
  return typeof timestamp === "number" && !isNaN(timestamp) && timestamp > 0;
}

/**
 * Get the last fetch timestamp for a trip
 * @param tripid - Trip ID
 * @returns Unix timestamp of last fetch, or 0 if never fetched
 */
export function getLastFetchTimestamp(tripid: string): number {
  try {
    const stored = getMMKVString(`lastFetch_${tripid}`);
    if (!stored || stored === "") {
      return 0;
    }
    const parsed = parseInt(stored, 10);

    // how many minutes ago?
    const minutesAgo = Math.floor((Date.now() - parsed) / 60000);
    return isNaN(parsed) ? 0 : parsed;
  } catch (error) {
    console.error("Error getting last fetch timestamp:", error);
    return 0;
  }
}

/**
 * Set the last fetch timestamp for a trip
 * @param tripid - Trip ID
 * @param timestamp - Unix timestamp of last fetch
 */
export function setLastFetchTimestamp(tripid: string, timestamp: number): void {
  try {
    if (!isValidTimestamp(timestamp)) {
      console.error("Invalid timestamp provided:", timestamp);
      return;
    }
    setMMKVString(`lastFetch_${tripid}`, timestamp.toString());
  } catch (error) {
    console.error("Error setting last fetch timestamp:", error);
  }
}

/**
 * Clear the last fetch timestamp for a trip (useful for testing)
 * @param tripid - Trip ID
 */
export function clearLastFetchTimestamp(tripid: string): void {
  try {
    setMMKVString(`lastFetch_${tripid}`, "0");
  } catch (error) {
    console.error("Error clearing last fetch timestamp:", error);
  }
}
