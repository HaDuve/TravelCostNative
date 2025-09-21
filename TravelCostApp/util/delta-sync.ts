import axios from "axios";
import { AXIOS_TIMOUT_LONG, DEBUG_NO_DATA } from "../confAppConstants";
import { ExpenseData, ExpenseDataOnline } from "./expense";
import { getMMKVString } from "../store/mmkv";
import safeLogError from "./error";
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
 * Fetch expenses with delta sync support
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
    if (useDelta) {
      since = getLastSyncTimestamp(tripid, uid);
    }

    const response = await axios.get(
      `${BACKEND_URL}/trips/${tripid}/${uid}/expenses.json`,
      {
        params: useDelta
          ? {
              orderBy: '"editedTimestamp"',
              startAt: since,
            }
          : {},
        timeout: AXIOS_TIMOUT_LONG,
      }
    );

    const expenses = processExpenseResponse(response.data);

    // Update sync timestamp on successful fetch
    if (useDelta && expenses.length > 0) {
      const latestTimestamp = Math.max(
        ...expenses.map((e) => e.editedTimestamp || 0)
      );
      setLastSyncTimestamp(tripid, uid, latestTimestamp);
    }

    return expenses;
  } catch (error) {
    safeLogError(error);
    return [];
  }
}

/**
 * Fetch expenses for multiple users with delta sync
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

  uidlist.forEach((uid) => {
    let since = 0;
    if (useDelta) {
      since = getLastSyncTimestamp(tripid, uid);
    }

    const call = axios.get(
      `${BACKEND_URL}/trips/${tripid}/${uid}/expenses.json`,
      {
        params: useDelta
          ? {
              orderBy: '"editedTimestamp"',
              startAt: since,
            }
          : {},
        timeout: AXIOS_TIMOUT_LONG,
      }
    );
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
        setLastSyncTimestamp(tripid, uid, latestTimestamp);
      }
    });
  } catch (error) {
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

    const response = await axios.get(`${BACKEND_URL}/trips/${tripid}.json`, {
      params: useDelta
        ? {
            orderBy: '"lastModified"',
            startAt: since,
          }
        : {},
      timeout: AXIOS_TIMOUT_LONG,
    });

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

    const response = await axios.get(
      `${BACKEND_URL}/trips/${tripid}/categories.json`,
      {
        params: useDelta
          ? {
              orderBy: '"lastModified"',
              startAt: since,
            }
          : {},
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

    const response = await axios.get(
      `${BACKEND_URL}/trips/${tripid}/travellers.json`,
      {
        params: useDelta
          ? {
              orderBy: '"lastModified"',
              startAt: since,
            }
          : {},
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
