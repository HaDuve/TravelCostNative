import axios from "axios";
import { AXIOS_TIMOUT_LONG, DEBUG_NO_DATA } from "../confAppConstants";
import { ExpenseData, ExpenseDataOnline } from "./expense";
import { getMMKVString } from "../store/mmkv";
import safeLogError from "./error";
import { getValidIdToken } from "./firebase-auth";
import {
  getLastSyncTimestamp,
  setLastSyncTimestamp,
  getTripSyncTimestamp,
  setTripSyncTimestamp,
  getCategoriesSyncTimestamp,
  setCategoriesSyncTimestamp,
  getTravellersSyncTimestamp,
  setTravellersSyncTimestamp,
  isSyncNeeded,
} from "./sync-timestamp";

const BACKEND_URL =
  "https://travelcostnative-default-rtdb.asia-southeast1.firebasedatabase.app";

/**
 * Process Firebase expense response data into ExpenseData array
 * @param data - Raw Firebase response data
 * @returns Array of processed ExpenseData objects
 */
function processExpenseResponse(data: any): ExpenseData[] {
  if (!data) return [];

  const expenses: ExpenseData[] = [];

  for (const key in data) {
    const r: ExpenseDataOnline = data[key];
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
      editedTimestamp: r.editedTimestamp ? parseInt(r.editedTimestamp, 10) : 0,
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
 * Fetch expenses with proper Firebase server-side filtering and edge case handling
 * @param tripid - Trip ID
 * @param uid - User ID
 * @param useDelta - Whether to use delta sync (default: true)
 * @returns Promise<ExpenseData[]> - Array of expense data
 */
export async function fetchExpensesDelta(
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

    // Get valid Firebase ID token (with automatic refresh)
    const authToken = await getValidIdToken();
    if (!authToken) {
      console.warn("[DELTA-SYNC] No valid authentication token available");
      return [];
    }

    // Build URL with proper Firebase REST API query parameters for server-side filtering
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
    console.error("[DELTA-SYNC] Error in fetchExpensesDelta:", error);
    safeLogError(error);
    return [];
  }
}

/**
 * Fetch expenses for multiple users with proper Firebase server-side filtering
 * @param tripid - Trip ID
 * @param uidlist - Array of user IDs
 * @param useDelta - Whether to use delta sync (default: true)
 * @returns Promise<ExpenseData[]> - Array of all expense data
 */
export async function fetchExpensesWithUIDsDelta(
  tripid: string,
  uidlist: string[],
  useDelta: boolean = true
): Promise<ExpenseData[]> {
  if (!tripid || !uidlist || DEBUG_NO_DATA) return [];

  const expenses: ExpenseData[] = [];
  const axios_calls = [];

  // Get valid Firebase ID token (with automatic refresh)
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

      // Validate timestamp to prevent edge cases
      if (!validateTimestamp(since)) {
        console.warn(
          `[DELTA-SYNC] Invalid timestamp for user ${uid}, treating as fresh login`
        );
        since = 0;
      }
    }

    // Build URL with proper Firebase REST API query parameters for server-side filtering
    let url = `${BACKEND_URL}/trips/${tripid}/${uid}/expenses.json?auth=${authToken}`;
    let useServerSideFiltering = false;

    // Determine the best approach
    if (useDelta && since > 0) {
      url = `${BACKEND_URL}/trips/${tripid}/${uid}/expenses.json?orderBy="editedTimestamp"&startAt=${since}&auth=${authToken}`;
      useServerSideFiltering = true;
    } else if (isFresh) {
      // Fresh login - download all data
    } else {
      // Fallback - download all data
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

      // Update sync timestamp
      if (useDelta && userExpenses.length > 0) {
        const latestTimestamp = Math.max(
          ...userExpenses.map((e) => e.editedTimestamp || 0)
        );

        if (latestTimestamp > 0) {
          setLastSyncTimestamp(tripid, uid, latestTimestamp);
        }
      }
    });
  } catch (error) {
    console.error("[DELTA-SYNC] Error in batch fetch:", error);
    safeLogError(error);
  }

  return expenses;
}

/**
 * Fetch trip data with delta sync
 * @param tripid - Trip ID
 * @param useDelta - Whether to use delta sync (default: true)
 * @returns Promise<any> - Trip data
 */
export async function fetchTripDelta(
  tripid: string,
  useDelta: boolean = true
): Promise<any> {
  if (!tripid) return null;

  try {
    let since = 0;
    if (useDelta) {
      since = getTripSyncTimestamp(tripid);
    }

    const qpar = getMMKVString("QPAR");
    const response = await axios.get(
      `${BACKEND_URL}/trips/${tripid}.json${qpar}`,
      {
        params: {},
        timeout: AXIOS_TIMOUT_LONG,
      }
    );

    const tripData = response.data;

    // Update sync timestamp on successful fetch
    if (useDelta && tripData) {
      setTripSyncTimestamp(tripid, Date.now());
    }

    return tripData;
  } catch (error) {
    safeLogError(error);
    return null;
  }
}

/**
 * Fetch categories with delta sync
 * @param tripid - Trip ID
 * @param useDelta - Whether to use delta sync (default: true)
 * @returns Promise<any> - Categories data
 */
export async function fetchCategoriesDelta(
  tripid: string,
  useDelta: boolean = true
): Promise<any> {
  if (!tripid) return null;

  try {
    let since = 0;
    if (useDelta) {
      since = getCategoriesSyncTimestamp(tripid);
    }

    const qpar = getMMKVString("QPAR");
    const response = await axios.get(
      `${BACKEND_URL}/trips/${tripid}/categories.json${qpar}`,
      {
        params: {},
        timeout: AXIOS_TIMOUT_LONG,
      }
    );

    const categories = response.data;

    // Update sync timestamp on successful fetch
    if (useDelta && categories) {
      setCategoriesSyncTimestamp(tripid, Date.now());
    }

    return categories;
  } catch (error) {
    safeLogError(error);
    return null;
  }
}

/**
 * Fetch travellers with delta sync
 * @param tripid - Trip ID
 * @param useDelta - Whether to use delta sync (default: true)
 * @returns Promise<any> - Travellers data
 */
export async function fetchTravellersDelta(
  tripid: string,
  useDelta: boolean = true
): Promise<any> {
  if (!tripid) return null;

  try {
    let since = 0;
    if (useDelta) {
      since = getTravellersSyncTimestamp(tripid);
    }

    const qpar = getMMKVString("QPAR");
    const response = await axios.get(
      `${BACKEND_URL}/trips/${tripid}/travellers.json${qpar}`,
      {
        params: {},
        timeout: AXIOS_TIMOUT_LONG,
      }
    );

    const travellers = response.data;

    // Update sync timestamp on successful fetch
    if (useDelta && travellers) {
      setTravellersSyncTimestamp(tripid, Date.now());
    }

    return travellers;
  } catch (error) {
    safeLogError(error);
    return null;
  }
}

/**
 * Check if sync is needed for expenses
 * @param tripid - Trip ID
 * @param uid - User ID
 * @param thresholdMs - Threshold in milliseconds (default: 1 hour)
 * @returns Promise<boolean> - True if sync is needed
 */
export async function shouldSyncExpenses(
  tripid: string,
  uid: string,
  thresholdMs: number = 3600000
): Promise<boolean> {
  try {
    const lastSync = getLastSyncTimestamp(tripid, uid);
    return isSyncNeeded(lastSync, thresholdMs);
  } catch (error) {
    safeLogError(error);
    return true; // Default to sync on error
  }
}

/**
 * Check if sync is needed for trip data
 * @param tripid - Trip ID
 * @param thresholdMs - Threshold in milliseconds (default: 1 hour)
 * @returns Promise<boolean> - True if sync is needed
 */
export async function shouldSyncTrip(
  tripid: string,
  thresholdMs: number = 3600000
): Promise<boolean> {
  try {
    const lastSync = getTripSyncTimestamp(tripid);
    return isSyncNeeded(lastSync, thresholdMs);
  } catch (error) {
    safeLogError(error);
    return true; // Default to sync on error
  }
}

/**
 * Get sync statistics for monitoring
 * @param tripid - Trip ID
 * @param uids - Array of user IDs
 * @returns Object with sync statistics
 */
export function getSyncStatistics(
  tripid: string,
  uids: string[] = []
): {
  trip: { lastSync: number; needsSync: boolean };
  categories: { lastSync: number; needsSync: boolean };
  travellers: { lastSync: number; needsSync: boolean };
  users: { [uid: string]: { lastSync: number; needsSync: boolean } };
} {
  const result = {
    trip: {
      lastSync: getTripSyncTimestamp(tripid),
      needsSync: isSyncNeeded(getTripSyncTimestamp(tripid)),
    },
    categories: {
      lastSync: getCategoriesSyncTimestamp(tripid),
      needsSync: isSyncNeeded(getCategoriesSyncTimestamp(tripid)),
    },
    travellers: {
      lastSync: getTravellersSyncTimestamp(tripid),
      needsSync: isSyncNeeded(getTravellersSyncTimestamp(tripid)),
    },
    users: {} as { [uid: string]: { lastSync: number; needsSync: boolean } },
  };

  uids.forEach((uid) => {
    const lastSync = getLastSyncTimestamp(tripid, uid);
    result.users[uid] = {
      lastSync,
      needsSync: isSyncNeeded(lastSync),
    };
  });

  return result;
}

/**
 * Validate that server-side filtering is working correctly
 * @param tripid - Trip ID
 * @param uid - User ID
 * @returns Object with validation results
 */
export async function validateServerSideFiltering(
  tripid: string,
  uid: string
): Promise<{
  isWorking: boolean;
  serverCount: number;
  clientCount: number;
  dataReduction: number;
  error?: string;
}> {
  try {
    // Get valid Firebase ID token (with automatic refresh)
    const authToken = await getValidIdToken();
    if (!authToken) {
      return {
        isWorking: false,
        serverCount: 0,
        clientCount: 0,
        dataReduction: 0,
        error: "No valid authentication token",
      };
    }

    // Get all data (no filtering)
    const allResponse = await axios.get(
      `${BACKEND_URL}/trips/${tripid}/${uid}/expenses.json?auth=${authToken}`,
      { timeout: AXIOS_TIMOUT_LONG }
    );
    const allExpenses = processExpenseResponse(allResponse.data);

    // Get filtered data (server-side filtering)
    const since = getLastSyncTimestamp(tripid, uid);

    const filteredResponse = await axios.get(
      `${BACKEND_URL}/trips/${tripid}/${uid}/expenses.json?orderBy="editedTimestamp"&startAt=${since}&auth=${authToken}`,
      { timeout: AXIOS_TIMOUT_LONG }
    );
    const filteredExpenses = processExpenseResponse(filteredResponse.data);

    const dataReduction =
      allExpenses.length > 0
        ? ((allExpenses.length - filteredExpenses.length) /
            allExpenses.length) *
          100
        : 0;

    const isWorking =
      filteredExpenses.length < allExpenses.length || allExpenses.length === 0;

    return {
      isWorking,
      serverCount: filteredExpenses.length,
      clientCount: allExpenses.length,
      dataReduction,
    };
  } catch (error) {
    console.error("[DELTA-SYNC] Validation failed:", error);
    return {
      isWorking: false,
      serverCount: 0,
      clientCount: 0,
      dataReduction: 0,
      error: error.message,
    };
  }
}

/**
 * Fetch expenses with fallback to client-side filtering if server-side fails
 * @param tripid - Trip ID
 * @param uid - User ID
 * @param useDelta - Whether to use delta sync (default: true)
 * @returns Promise<ExpenseData[]> - Array of expense data
 */
export async function fetchExpensesWithFallback(
  tripid: string,
  uid: string,
  useDelta: boolean = true
): Promise<ExpenseData[]> {
  try {
    // Try server-side filtering first
    return await fetchExpensesDelta(tripid, uid, useDelta);
  } catch (serverError) {
    console.warn(
      "[DELTA-SYNC] Server-side filtering failed, falling back to client-side:",
      serverError
    );

    // Fallback to client-side filtering
    try {
      const authToken = await getValidIdToken();
      if (!authToken) {
        console.warn(
          "[DELTA-SYNC] No valid authentication token available for fallback"
        );
        return [];
      }

      const response = await axios.get(
        `${BACKEND_URL}/trips/${tripid}/${uid}/expenses.json?auth=${authToken}`,
        { timeout: AXIOS_TIMOUT_LONG }
      );

      const allExpenses = processExpenseResponse(response.data);

      if (!useDelta) return allExpenses;

      const since = getLastSyncTimestamp(tripid, uid);
      const filteredExpenses = allExpenses.filter(
        (expense) => expense.editedTimestamp > since
      );

      // Update sync timestamp
      if (filteredExpenses.length > 0) {
        const latestTimestamp = Math.max(
          ...filteredExpenses.map((e) => e.editedTimestamp || 0)
        );
        setLastSyncTimestamp(tripid, uid, latestTimestamp);
      }

      console.log(
        `[DELTA-SYNC] Fallback completed: ${filteredExpenses.length} expenses (client-side filtering)`
      );
      return filteredExpenses;
    } catch (clientError) {
      console.error(
        "[DELTA-SYNC] Both server-side and client-side filtering failed:",
        clientError
      );
      safeLogError(clientError);
      return [];
    }
  }
}

/**
 * Clear sync timestamps for fresh login simulation
 */
export function clearSyncTimestamps(tripid: string, uid?: string): void {
  try {
    if (uid) {
      setLastSyncTimestamp(tripid, uid, 0);
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
