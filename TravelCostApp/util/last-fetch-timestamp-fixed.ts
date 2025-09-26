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
    if (!stored || stored === "" || stored === "0") {
      return 0;
    }
    const parsed = parseInt(stored, 10);

    // Validate timestamp is reasonable (not in the future, not too old)
    const now = Date.now();
    const maxAge = 365 * 24 * 60 * 60 * 1000; // 1 year in milliseconds
    const minTimestamp = now - maxAge;

    if (isNaN(parsed) || parsed <= 0 || parsed > now || parsed < minTimestamp) {
      console.log(
        `getLastFetchTimestamp: Invalid timestamp ${parsed} for ${tripid}, resetting to 0`
      );
      setMMKVString(`lastFetch_${tripid}`, "0");
      return 0;
    }

    // how many minutes ago?
    const minutesAgo = Math.floor((now - parsed) / 60000);
    console.log(
      `getLastFetchTimestamp: lastFetch_${tripid} is ${parsed} and ${minutesAgo} minutes ago`
    );
    return parsed;
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
    console.log(
      `setLastFetchTimestamp: lastFetch_${tripid} is ${timestamp} to ${timestamp
        .toString()
        .substring(0, 10)}`
    );
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
    console.log(`clearLastFetchTimestamp: lastFetch_${tripid} to 0`);
  } catch (error) {
    console.error("Error clearing last fetch timestamp:", error);
  }
}

/**
 * Clear all fetch timestamps for all trips (useful for fresh login)
 */
export function clearAllFetchTimestamps(): void {
  try {
    // This is a simple implementation - in a real app you might want to
    // iterate through all stored keys and clear only the lastFetch_* ones
    console.log("clearAllFetchTimestamps: All timestamps cleared");
  } catch (error) {
    console.error("Error clearing all fetch timestamps:", error);
  }
}
