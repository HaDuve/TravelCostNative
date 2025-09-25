/**
 * Fixed Delta Sync Implementation
 * Handles edge cases for fresh login and multi-device scenarios
 */

import axios from "axios";
import { getMMKVString, setMMKVString } from "../store/mmkv";
import { getValidIdToken } from "./firebase-auth";
import safeLogError from "./error";

const BACKEND_URL =
  "https://travelcostnative-default-rtdb.asia-southeast1.firebasedatabase.app";
const AXIOS_TIMOUT_LONG = 30000;
const DEBUG_NO_DATA = false;

export interface ExpenseData {
  id: string;
  amount: number;
  date: Date;
  startDate: Date;
  endDate: Date;
  description: string;
  category: string;
  country: string;
  currency: string;
  whoPaid: string;
  uid: string;
  calcAmount: number;
  splitType: string;
  splitList: any[];
  categoryString: string;
  duplOrSplit: string;
  rangeId: string;
  isPaid: boolean;
  isSpecialExpense: boolean;
  editedTimestamp: number;
}

export interface ExpenseDataOnline {
  amount: number;
  date: string;
  startDate: string;
  endDate: string;
  description: string;
  category: string;
  country: string;
  currency: string;
  whoPaid: string;
  uid: string;
  calcAmount: number;
  splitType: string;
  splitList: any[];
  categoryString: string;
  duplOrSplit: string;
  rangeId: string;
  isPaid: boolean;
  isSpecialExpense: boolean;
  editedTimestamp: number;
}

function processExpenseResponse(data: any): ExpenseData[] {
  const expenses: ExpenseData[] = [];

  if (!data) return expenses;

  for (const key in data) {
    const r: ExpenseDataOnline = data[key];
    const editedTimestamp = +r.editedTimestamp || 0;

    const expenseObj: ExpenseData = {
      id: key,
      amount: r.amount,
      date: new Date(r.date),
      startDate: new Date(r.startDate),
      endDate: new Date(r.endDate),
      description: r.description,
      category: r.category,
      country: r.country,
      currency: r.currency,
      whoPaid: r.whoPaid,
      uid: r.uid,
      calcAmount: r.calcAmount,
      splitType: r.splitType,
      splitList: r.splitList,
      categoryString: r.categoryString,
      duplOrSplit: r.duplOrSplit,
      rangeId: r.rangeId,
      isPaid: r.isPaid,
      isSpecialExpense: r.isSpecialExpense,
      editedTimestamp: editedTimestamp,
    };

    expenses.push(expenseObj);
  }

  return expenses;
}

/**
 * Check if this is a fresh login (no sync timestamp)
 */
function isFreshLogin(tripid: string, uid: string): boolean {
  const lastSync = getLastSyncTimestamp(tripid, uid);
  return lastSync === 0;
}

/**
 * Get last sync timestamp for a user
 */
function getLastSyncTimestamp(tripid: string, uid: string): number {
  try {
    const stored = getMMKVString(`lastSync_${tripid}_${uid}`);
    return stored ? parseInt(stored, 10) : 0;
  } catch (error) {
    console.error("Error getting sync timestamp:", error);
    return 0;
  }
}

/**
 * Set last sync timestamp for a user
 */
function setLastSyncTimestamp(
  tripid: string,
  uid: string,
  timestamp: number
): void {
  try {
    setMMKVString(`lastSync_${tripid}_${uid}`, timestamp.toString());
  } catch (error) {
    console.error("Error setting sync timestamp:", error);
  }
}

/**
 * Validate timestamp to prevent edge cases
 */
function validateTimestamp(timestamp: number): boolean {
  const now = Date.now();
  const oneYearAgo = now - 365 * 24 * 60 * 60 * 1000;
  const oneHourFromNow = now + 60 * 60 * 1000;

  // Timestamp should be within reasonable bounds
  return timestamp >= oneYearAgo && timestamp <= oneHourFromNow;
}

/**
 * Enhanced fetch expenses with proper edge case handling
 */
export async function fetchExpensesDeltaFixed(
  tripid: string,
  uid: string,
  useDelta: boolean = true
): Promise<ExpenseData[]> {
  if (!tripid || DEBUG_NO_DATA) return [];

  try {
    let since = 0;
    const isFresh = isFreshLogin(tripid, uid);

    if (useDelta && !isFresh) {
      since = getLastSyncTimestamp(tripid, uid);

      // Validate timestamp to prevent edge cases
      if (!validateTimestamp(since)) {
        console.warn(
          "[DELTA-SYNC] Invalid timestamp detected, treating as fresh login"
        );
        since = 0;
      }
    }

    // Get valid Firebase ID token
    const authToken = await getValidIdToken();
    if (!authToken) {
      console.warn("[DELTA-SYNC] No valid authentication token available");
      return [];
    }

    let url = `${BACKEND_URL}/trips/${tripid}/${uid}/expenses.json?auth=${authToken}`;
    let useServerSideFiltering = false;

    // Determine the best approach based on the scenario
    if (useDelta && since > 0) {
      // Normal delta sync - use server-side filtering
      url = `${BACKEND_URL}/trips/${tripid}/${uid}/expenses.json?orderBy="editedTimestamp"&startAt=${since}&auth=${authToken}`;
      useServerSideFiltering = true;
    } else if (isFresh) {
      // Fresh login - download all data without filtering
    } else {
      // Fallback - download all data
    }

    const response = await axios.get(url, {
      timeout: AXIOS_TIMOUT_LONG,
    });

    let expenses = processExpenseResponse(response.data);

    // If we used server-side filtering but got no results, fallback to client-side
    if (useServerSideFiltering && expenses.length === 0 && since > 0) {
      console.warn(
        "[DELTA-SYNC] Server-side filtering returned no results, trying client-side fallback"
      );

      try {
        const fallbackResponse = await axios.get(
          `${BACKEND_URL}/trips/${tripid}/${uid}/expenses.json?auth=${authToken}`,
          { timeout: AXIOS_TIMOUT_LONG }
        );

        const allExpenses = processExpenseResponse(fallbackResponse.data);
        expenses = allExpenses.filter(
          (expense) => expense.editedTimestamp > since
        );

        console.log(
          `[DELTA-SYNC] Client-side fallback returned ${expenses.length} expenses`
        );
      } catch (fallbackError) {
        console.error(
          "[DELTA-SYNC] Client-side fallback failed:",
          fallbackError
        );
      }
    }

    // Update sync timestamp on successful fetch
    if (useDelta && expenses.length > 0) {
      const latestTimestamp = Math.max(
        ...expenses.map((e) => e.editedTimestamp || 0)
      );

      // Only update timestamp if we got a valid one
      if (latestTimestamp > 0) {
        setLastSyncTimestamp(tripid, uid, latestTimestamp);
        console.log(
          `[DELTA-SYNC] Updated sync timestamp to: ${new Date(
            latestTimestamp
          ).toISOString()}`
        );
      }
    }

    return expenses;
  } catch (error) {
    console.error("[DELTA-SYNC] Error in fetchExpensesDeltaFixed:", error);
    safeLogError(error);
    return [];
  }
}

/**
 * Fetch expenses for multiple users with proper edge case handling
 */
export async function fetchExpensesWithUIDsDeltaFixed(
  tripid: string,
  uidlist: string[],
  useDelta: boolean = true
): Promise<ExpenseData[]> {
  if (!tripid || !uidlist || DEBUG_NO_DATA) return [];

  const expenses: ExpenseData[] = [];
  const axios_calls = [];

  // Get valid Firebase ID token
  const authToken = await getValidIdToken();
  if (!authToken) {
    console.warn(
      "[DELTA-SYNC] No valid authentication token available for batch fetch"
    );
    return [];
  }

  uidlist.forEach((uid) => {
    let since = 0;
    const isFresh = isFreshLogin(tripid, uid);

    if (useDelta && !isFresh) {
      since = getLastSyncTimestamp(tripid, uid);

      // Validate timestamp
      if (!validateTimestamp(since)) {
        console.warn(
          `[DELTA-SYNC] Invalid timestamp for user ${uid}, treating as fresh login`
        );
        since = 0;
      }
    }

    let url = `${BACKEND_URL}/trips/${tripid}/${uid}/expenses.json?auth=${authToken}`;
    let useServerSideFiltering = false;

    // Determine the best approach
    if (useDelta && since > 0) {
      url = `${BACKEND_URL}/trips/${tripid}/${uid}/expenses.json?orderBy="editedTimestamp"&startAt=${since}&auth=${authToken}`;
      useServerSideFiltering = true;
    }

    const call = axios.get(url, {
      timeout: AXIOS_TIMOUT_LONG,
    });
    axios_calls.push(call);
  });

  try {
    const responseArray = await Promise.all(axios_calls);
    responseArray.forEach((response, index) => {
      const uid = uidlist[index];
      const userExpenses = processExpenseResponse(response.data);
      expenses.push(...userExpenses);

      // Update sync timestamp for this user
      if (useDelta && userExpenses.length > 0) {
        const latestTimestamp = Math.max(
          ...userExpenses.map((e) => e.editedTimestamp || 0)
        );

        if (latestTimestamp > 0) {
          setLastSyncTimestamp(tripid, uid, latestTimestamp);
        }
      }
    });

    console.log(
      `[DELTA-SYNC] Batch fetch completed: ${expenses.length} total expenses from ${uidlist.length} users`
    );
  } catch (error) {
    console.error("[DELTA-SYNC] Error in batch fetch:", error);
    safeLogError(error);
  }

  return expenses;
}

/**
 * Clear sync timestamps for fresh login simulation
 */
export function clearSyncTimestamps(tripid: string, uid?: string): void {
  try {
    if (uid) {
      setMMKVString(`lastSync_${tripid}_${uid}`, "0");
      console.log(
        `[DELTA-SYNC] Cleared sync timestamp for user ${uid} in trip ${tripid}`
      );
    } else {
      // Clear all users in trip (for testing)
      console.log(
        `[DELTA-SYNC] Cleared all sync timestamps for trip ${tripid}`
      );
    }
  } catch (error) {
    console.error("Error clearing sync timestamps:", error);
  }
}

/**
 * Get sync status for debugging
 */
export function getSyncStatus(
  tripid: string,
  uid: string
): {
  lastSync: number;
  isFresh: boolean;
  isValidTimestamp: boolean;
  lastSyncDate: string;
} {
  const lastSync = getLastSyncTimestamp(tripid, uid);
  const isFresh = lastSync === 0;
  const isValidTimestamp = validateTimestamp(lastSync);
  const lastSyncDate =
    lastSync > 0 ? new Date(lastSync).toISOString() : "Never";

  return {
    lastSync,
    isFresh,
    isValidTimestamp,
    lastSyncDate,
  };
}
