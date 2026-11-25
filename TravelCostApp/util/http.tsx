import axios, { AxiosResponse } from "axios";
import {
  AXIOS_TIMEOUT_DEFAULT,
  AXIOS_TIMOUT_LONG,
  DEBUG_NO_DATA,
} from "../confAppConstants";

import { Category } from "./category";
import type { TripData } from "../types/trip";
import type { SplitHistoryEntry } from "./split-history";
import type { ExpenseData, ExpenseDataOnline } from "./expense";
import {
  readPaidBackFromOnlineRecord,
  toExpenseOnline,
} from "./expense";
import { UserData } from "../store/user-context";

import { i18n } from "../i18n/i18n";

import { Traveller } from "./traveler";
import { normalizeTravellers } from "./normalize-travellers";
import { getMMKVString, setMMKVString } from "../store/mmkv";
import { MMKV_KEY_PATTERNS } from "../store/mmkv-keys";
import { ExpoPushToken } from "expo-notifications";
import { getActiveTripId } from "./active-trip-id";
import safeLogError from "./error";
import { safelyParseJSON } from "./jsonParse";
import { getValidIdToken } from "./firebase-auth";
import { secureStoreGetItem } from "../store/secure-storage";
import { withAuthToken } from "./authed-request";
import { AuthFailureError, isAuthFailureError } from "./auth-failure";
import {
  getLastFetchTimestamp,
  setLastFetchTimestamp,
} from "./last-fetch-timestamp";
import {
  TRIP_METADATA_FIELD_KEYS,
  tripMetadataFromLeaves,
  tripMetadataPatch,
  type TripMetadataFieldKey,
} from "./trip-metadata";

const BACKEND_URL =
  "https://travelcostnative-default-rtdb.asia-southeast1.firebasedatabase.app";

// Field name for server timestamp in expense data -- needs to be updated in database.rules.json firebase backend
export const SERVER_TIMESTAMP_FIELD = "serverTimestamp";

/** AXIOS Instance */
// const Axios = axios.create({
//   baseURL: BACKEND_URL,
// });
axios.defaults.timeout = AXIOS_TIMEOUT_DEFAULT; // Set default timeout to 5 seconds

// setAxiosAccessToken moved to util/axios-config.ts to avoid circular dependency

/** Axios Logger */
axios.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/*
 * development decorator to time the execution of an async function
 */
export const dataResponseTime = (func) => {
  return async (...args) => {
    const start = Date.now();
    const result = await func(...args);
    const end = Date.now();
    return result;
  };
};

/**
 * Config keys the app reads from `server/`. Each is fetched as its own leaf:
 * `server/feedback` sits next to them and is not readable by Travellers, so
 * the whole `server` node cannot be read in one request.
 */
export const SERVER_CONFIG_KEYS = [
  "REVCAT_G",
  "REVCAT_A",
  "OPENAI",
  "EXCHANGE",
  "FREEEXCHANGE",
  "BRAN",
  "VEXO",
] as const;

export type ServerConfigKey = (typeof SERVER_CONFIG_KEYS)[number];

// fetch server info
export const fetchServerInfo = async (): Promise<Partial<
  Record<ServerConfigKey, string>
> | null> => {
  try {
    const authToken = await getValidIdToken();
    if (!authToken) {
      console.warn("[HTTP] No valid auth token available for fetchServerInfo");
      return null;
    }

    const responses = await Promise.all(
      SERVER_CONFIG_KEYS.map((key) =>
        axios.get(`${BACKEND_URL}/server/${key}.json?auth=${authToken}`, {
          timeout: AXIOS_TIMOUT_LONG,
        })
      )
    );

    const data: Partial<Record<ServerConfigKey, string>> = {};
    SERVER_CONFIG_KEYS.forEach((key, index) => {
      const value = responses[index]?.data;
      if (value != null) data[key] = value;
    });
    if (Object.keys(data).length === 0)
      throw new Error("No data on the server");
    return data;
  } catch (error) {
    safeLogError(error);
    return null;
  }
};

export async function fetchCategories(tripid: string) {
  try {
    const authToken = await getValidIdToken();
    if (!authToken) {
      console.warn("[HTTP] No valid auth token for fetchCategories");
      return null;
    }

    const response = await axios.get(
      `${BACKEND_URL}/trips/${tripid}/categories.json?auth=${authToken}`,
      {
        timeout: AXIOS_TIMOUT_LONG,
      }
    );
    if (response) return safelyParseJSON(response.data);
  } catch (error) {
    safeLogError(error);
  }
}

export async function deleteCategories(tripid: string) {
  try {
    const authToken = await getValidIdToken();
    if (!authToken) {
      console.warn("[HTTP] No valid auth token for deleteCategories");
      return null;
    }

    const response = await axios.delete(
      `${BACKEND_URL}/trips/${tripid}/categories.json?auth=${authToken}`
    );
    return response?.data;
  } catch (error) {
    safeLogError(error);
  }
}

export async function patchCategories(tripid: string, categories: Category[]) {
  try {
    const authToken = await getValidIdToken();
    if (!authToken) {
      console.warn("[HTTP] No valid auth token for patchCategories");
      return null;
    }

    const json = JSON.stringify(categories);
    const response = await axios.post(
      `${BACKEND_URL}/trips/${tripid}/categories.json?auth=${authToken}`,
      json
    );
    return response;
  } catch (error) {
    // log error
    safeLogError(error);
  }
}

/**
 * storeExpense posts expense data under the specified path:
 * #### trips/$tripid/$user/expenses.json
 * @param tripid
 * @param uid
 * @param expenseData
 * @returns id
 */
export async function storeExpense(
  tripid: string,
  uid: string,
  expenseData: ExpenseData
) {
  return await withAuthToken("storeExpense", async (authToken) => {
    // Add serverTimestamp to expense data
    const expenseDataWithTimestamp = {
      ...toExpenseOnline(expenseData),
      [SERVER_TIMESTAMP_FIELD]: Date.now(),
    };

    const response = await axios.post(
      `${BACKEND_URL}/trips/${tripid}/${uid}/expenses.json?auth=${authToken}`,
      expenseDataWithTimestamp
    );
    const id: string = response.data.name;
    return id;
  });
}

export async function storeExpenseWithId(
  tripid: string,
  uid: string,
  id: string,
  expenseData: ExpenseData
) {
  await withAuthToken("storeExpenseWithId", async (authToken) => {
    // Add serverTimestamp to expense data
    const expenseDataWithTimestamp = {
      ...toExpenseOnline(expenseData),
      [SERVER_TIMESTAMP_FIELD]: Date.now(),
    };

    await axios.put(
      `${BACKEND_URL}/trips/${tripid}/${uid}/expenses/${id}.json?auth=${authToken}`,
      expenseDataWithTimestamp
    );
  });
  return id;
}

const processExpenseResponse = (data: any): ExpenseData[] => {
  const expenses: ExpenseData[] = [];
  if (!data) return expenses;

  for (const key in data) {
    const r: ExpenseDataOnline = data[key];

    const editedTimestamp = r.editedTimestamp
      ? parseInt(r.editedTimestamp, 10)
      : 0;

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
      paidBack: readPaidBackFromOnlineRecord(r),
      isSpecialExpense: r.isSpecialExpense,
      editedTimestamp: editedTimestamp,
      isDeleted: r.isDeleted || false,
      serverTimestamp: r.serverTimestamp,
    };

    // Include ALL expenses (including deleted ones) - filtering happens in MERGE
    expenses.push(expenseObj);
  }
  return expenses;
};

// Clean callback interface for sync loading
export interface SyncLoadingCallback {
  onStart?: () => void;
  onComplete?: () => void;
}

// Single-flight: concurrent callers (online-setup retries, RecentExpenses
// polling, trip history) share one ledger download instead of stacking them.
const inFlightLedgerFetches = new Map<string, Promise<ExpenseData[]>>();

export function fetchExpensesWithUIDs(
  tripid: string,
  uidlist: string[],
  useDelta = true,
  loadingCallback?: SyncLoadingCallback
): Promise<ExpenseData[]> {
  const key = `${tripid}|${(uidlist ?? []).join(",")}|${useDelta}`;
  const pending = inFlightLedgerFetches.get(key);
  if (pending) return pending;
  const run = fetchExpensesWithUIDsOnce(
    tripid,
    uidlist,
    useDelta,
    loadingCallback
  ).finally(() => inFlightLedgerFetches.delete(key));
  inFlightLedgerFetches.set(key, run);
  return run;
}

async function fetchExpensesWithUIDsOnce(
  tripid: string,
  uidlist: string[],
  useDelta = true,
  loadingCallback?: SyncLoadingCallback
): Promise<ExpenseData[]> {
  if (!tripid || !uidlist || DEBUG_NO_DATA) return [];
  const expenses: ExpenseData[] = [];
  let latestTimestamp = 0;
  let anyUidFailed = false;
  let firstError: unknown;
  let authFailure: AuthFailureError | undefined;

  // Notify sync start
  loadingCallback?.onStart?.();

  // check devices sync status (only fetch new data)
  const lastFetch = getLastFetchTimestamp(tripid);
  const isFirstFetch = lastFetch === 0;
  const shouldFilter = useDelta && !isFirstFetch;

  for (let i = 0; i < uidlist.length; i++) {
    const uid = uidlist[i];
    try {
      const response = await withAuthToken(
        "fetchExpensesWithUIDs",
        (authToken) => {
          const serverFilteredUrl = `${BACKEND_URL}/trips/${tripid}/${uid}/expenses.json?orderBy="${SERVER_TIMESTAMP_FIELD}"&startAt=${lastFetch}&auth=${authToken}`;
          const allDataUrl = `${BACKEND_URL}/trips/${tripid}/${uid}/expenses.json?auth=${authToken}`;
          return axios.get(shouldFilter ? serverFilteredUrl : allDataUrl, {
            timeout: AXIOS_TIMOUT_LONG,
          });
        }
      );
      const userExpenses = processExpenseResponse(response.data);

      if (userExpenses.length > 0) {
        // Hybrid approach: Use serverTimestamp (preferred) with editedTimestamp fallback for backward compatibility
        // TODO: After 100% migration to serverTimestamp and running migration script, simplify to:
        // .map((e) => e.serverTimestamp || 0)
        const validTimestamps = userExpenses
          .map((e) => e.serverTimestamp || e.editedTimestamp || 0)
          .filter((ts) => ts > 0);

        if (validTimestamps.length > 0) {
          const userLatestTimestamp = Math.max(...validTimestamps);
          if (latestTimestamp < userLatestTimestamp) {
            latestTimestamp = userLatestTimestamp;
          }
        }
      }

      expenses.push(...userExpenses);
    } catch (error) {
      // withAuthToken already logged it.
      if (isAuthFailureError(error)) {
        // Every other Traveller's request would fail the same way.
        authFailure = error as AuthFailureError;
        break;
      }
      anyUidFailed = true;
      firstError ??= error;
    }
  }

  // An auth failure is reported, never shown as an empty ledger, and moves nothing.
  if (authFailure) {
    loadingCallback?.onComplete?.();
    throw authFailure;
  }

  // A failed full replace throws below and must not move lastFetch. Delta polls
  // keep advancing, otherwise one permanently failing Traveller would pin
  // lastFetch and every poll would re-download everything since then.
  if (latestTimestamp > 0 && (useDelta || !anyUidFailed)) {
    setLastFetchTimestamp(tripid, latestTimestamp);
  }

  // Notify sync completion
  loadingCallback?.onComplete?.();
  // A full replace must not apply a partial ledger.
  if (anyUidFailed && !useDelta) throw firstError;
  return expenses;
}

export async function fetchExpenses(
  tripid: string,
  uid: string,
  useDelta = true,
  loadingCallback?: SyncLoadingCallback
) {
  if (!tripid || DEBUG_NO_DATA) return [];

  // Notify sync start
  loadingCallback?.onStart?.();

  try {
    const processExpenseResponse = (data: any): ExpenseData[] => {
      const expenses: ExpenseData[] = [];
      if (!data) return expenses;

      for (const key in data) {
        const r: ExpenseDataOnline = data[key];

        const editedTimestamp = r.editedTimestamp
          ? parseInt(r.editedTimestamp, 10)
          : 0;

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
          paidBack: readPaidBackFromOnlineRecord(r),
          isSpecialExpense: r.isSpecialExpense,
          editedTimestamp: editedTimestamp,
          isDeleted: r.isDeleted || false,
          serverTimestamp: r.serverTimestamp,
        };

        // Include ALL expenses (including deleted ones) - filtering happens in MERGE
        expenses.push(expenseObj);
      }
      return expenses;
    };

    const lastFetch = getLastFetchTimestamp(tripid);
    const isFirstFetch = lastFetch === 0;
    const shouldFilter = useDelta && !isFirstFetch;

    const response = await withAuthToken("fetchExpenses", (authToken) => {
      const url = shouldFilter
        ? `${BACKEND_URL}/trips/${tripid}/${uid}/expenses.json?orderBy="${SERVER_TIMESTAMP_FIELD}"&startAt=${lastFetch}&auth=${authToken}`
        : `${BACKEND_URL}/trips/${tripid}/${uid}/expenses.json?auth=${authToken}`;
      return axios.get(url, { timeout: AXIOS_TIMOUT_LONG });
    });
    const expenses: ExpenseData[] = processExpenseResponse(response.data);

    if (expenses.length > 0) {
      // Hybrid approach: Use serverTimestamp (preferred) with editedTimestamp fallback for backward compatibility
      // TODO: After 100% migration to serverTimestamp and running migration script, simplify to:
      // .map((e) => e.serverTimestamp || 0)
      const validTimestamps = expenses
        .map((e) => e.serverTimestamp || e.editedTimestamp || 0)
        .filter((ts) => ts > 0);

      if (validTimestamps.length > 0) {
        const latestTimestamp = Math.max(...validTimestamps);
        setLastFetchTimestamp(tripid, latestTimestamp);
      }
    }

    // Notify sync completion
    loadingCallback?.onComplete?.();
    return expenses;
  } catch (error) {
    // withAuthToken already logged it.
    loadingCallback?.onComplete?.();
    // An auth failure is reported, not shown as an empty ledger.
    if (isAuthFailureError(error)) throw error;
    return [];
  }
}

/**
 * Updates an expense for a specific trip and user.
 * @param tripid - The ID of the trip.
 * @param uid - The ID of the user.
 * @param id - The ID of the expense.
 * @param expenseData - The updated expense data.
 * @returns A Promise that resolves to the response from the server.
 */
export async function updateExpense(
  tripid: string,
  uid: string,
  id: string,
  expenseData: ExpenseData
) {
  return await withAuthToken("updateExpense", (authToken) => {
    // Add serverTimestamp to expense data
    const expenseDataWithTimestamp = {
      ...toExpenseOnline(expenseData),
      [SERVER_TIMESTAMP_FIELD]: Date.now(),
    };

    return axios.put(
      `${BACKEND_URL}/trips/${tripid}/${uid}/expenses/${id}.json?auth=${authToken}`,
      expenseDataWithTimestamp
    );
  });
}

/**
 * Appends one split history entry to a trip:
 * #### splitHistory/$tripid/$entryId.json
 * PUT at the entry's own id, so a retry cannot duplicate it. The rules are
 * create-only, so a retry of an entry that already landed is refused with
 * an auth failure: that is fine and must never block the Expense sync.
 */
export async function appendSplitHistoryEntry(
  tripid: string,
  entry: SplitHistoryEntry
): Promise<void> {
  try {
    await withAuthToken("appendSplitHistoryEntry", (authToken) =>
      axios.put(
        `${BACKEND_URL}/splitHistory/${tripid}/${entry.id}.json?auth=${authToken}`,
        entry
      )
    );
  } catch (error) {
    // Create-only rules refuse a retry of an entry that already landed.
    if (isAuthFailureError(error)) return;
    throw error;
  }
}

export const SPLIT_HISTORY_PAGE_SIZE = 20;

export type SplitHistoryPage = {
  /** Newest first. */
  entries: SplitHistoryEntry[];
  hasMore: boolean;
};

/**
 * Reads one page of a trip's split history, newest first. Entry ids sort by
 * time, so pages are cut by key: `beforeId` is the oldest id already shown.
 */
export async function fetchSplitHistoryPage(
  tripid: string,
  {
    beforeId,
    pageSize = SPLIT_HISTORY_PAGE_SIZE,
  }: { beforeId?: string; pageSize?: number } = {}
): Promise<SplitHistoryPage> {
  // endAt is inclusive, so one extra row for the cursor; one more to know hasMore.
  const limit = pageSize + 1 + (beforeId ? 1 : 0);
  const range = beforeId ? `&endAt=${encodeURIComponent(JSON.stringify(beforeId))}` : "";
  const data = await withAuthToken("fetchSplitHistoryPage", async (authToken) => {
    const response = await axios.get(
      `${BACKEND_URL}/splitHistory/${tripid}.json?auth=${authToken}&orderBy=${encodeURIComponent(
        '"$key"'
      )}&limitToLast=${limit}${range}`
    );
    return response.data as Record<string, SplitHistoryEntry> | null;
  });
  const newestFirst = Object.values(data ?? {})
    .filter((entry) => entry && entry.id !== beforeId)
    .sort((a, b) => (a.id < b.id ? 1 : -1));
  return {
    entries: newestFirst.slice(0, pageSize),
    hasMore: newestFirst.length > pageSize,
  };
}

/**
 * Deletes an expense from a trip.
 * @param tripid - The ID of the trip.
 * @param uid - The ID of the user.
 * @param id - The ID of the expense.
 * @returns A Promise that resolves to the response from the server.
 */
export async function deleteExpense(tripid: string, uid: string, id: string) {
  // Soft delete: mark as deleted instead of removing
  const deletionData = {
    isDeleted: true,
    [SERVER_TIMESTAMP_FIELD]: Date.now(),
  };

  return await withAuthToken("deleteExpense", (authToken) =>
    axios.patch(
      `${BACKEND_URL}/trips/${tripid}/${uid}/expenses/${id}.json?auth=${authToken}`,
      deletionData
    )
  );
}

/**
 * Restores a soft-deleted expense on a trip.
 */
export async function restoreExpense(tripid: string, uid: string, id: string) {
  const restoreData = {
    isDeleted: false,
    [SERVER_TIMESTAMP_FIELD]: Date.now(),
  };

  return await withAuthToken("restoreExpense", (authToken) =>
    axios.patch(
      `${BACKEND_URL}/trips/${tripid}/${uid}/expenses/${id}.json?auth=${authToken}`,
      restoreData
    )
  );
}

/**
 * Stores the initially created User in Firebase,
 * @param uid
 * @param userData
 * @returns uid
 */
export async function storeUser(uid: string, userData: object) {
  const authToken = await getValidIdToken();
  if (!authToken) {
    console.warn("[HTTP] No valid auth token for storeUser");
    return null;
  }

  const response = await axios.put(
    `${BACKEND_URL}/users/${uid}.json?auth=${authToken}`,
    userData
  );
  const id = response.data.name;
  return id;
}

/**
 * Updates User via axios.patch given uid and userdata to patch
 */
export async function updateUser(uid: string, userData: UserData) {
  try {
    const authToken = await getValidIdToken();
    if (!authToken) {
      console.warn("[HTTP] No valid auth token for updateUser");
      throw new Error("No valid auth token");
    }

    await axios.patch(
      `${BACKEND_URL}/users/${uid}.json?auth=${authToken}`,
      userData
    );
  } catch (error) {
    throw new Error("error while updating user");
  }
}

export async function fetchUser(uid: string) {
  if (!uid) {
    safeLogError("fetchUser: uid is undefined", "http.tsx", 356);
    return null;
  }
  try {
    const authToken = await getValidIdToken();
    if (!authToken) {
      console.warn("[HTTP] No valid auth token for fetchUser");
      return null;
    }

    const response = await axios.get(
      `${BACKEND_URL}/users/${uid}.json?auth=${authToken}`,
      {
        timeout: AXIOS_TIMOUT_LONG,
      }
    );
    const userData: UserData = response.data;
    return userData;
  } catch (error) {
    safeLogError(error);
  }
}

/**
 * Trip membership is the access check in the database rules: only uids under
 * `trips/<tripid>/members` can read or write a trip. Holding the trip id (the
 * invite link) lets a signed-in user add themselves, so joining by invite keeps
 * working.
 */
const ensuredTripMemberships = new Set<string>();

function tripMembershipKey(tripid: string, uid: string) {
  return `${tripid}/${uid}`;
}

/** Test seam: forget which memberships were written this session. */
export function resetEnsuredTripMemberships() {
  ensuredTripMemberships.clear();
}

/**
 * Creates a trip. The creating Traveller is written to `members` in the same
 * request: the database rules only let a signed-in user create a trip that
 * lists them as a member.
 */
export async function storeTrip(tripData: TripData, creatorUid: string) {
  try {
    if (!creatorUid) throw new Error("storeTrip requires the creator's uid");
    const authToken = await getValidIdToken();
    if (!authToken) {
      console.warn("[HTTP] No valid auth token for storeTrip");
      throw new Error("No valid auth token");
    }

    const response = await axios.post(
      `${BACKEND_URL}/trips.json?auth=${authToken}`,
      { ...tripData, members: { [creatorUid]: true } }
    );
    const id = response.data.name;
    if (id) ensuredTripMemberships.add(tripMembershipKey(id, creatorUid));
    return id;
  } catch (error) {
    throw new Error("error while storing trip");
  }
}

export async function updateTrip(tripid: string, tripData: TripData) {
  try {
    const authToken = await getValidIdToken();
    if (!authToken) {
      console.warn("[HTTP] No valid auth token for updateTrip");
      throw new Error("No valid auth token");
    }

    const metadata = tripMetadataPatch(tripData);
    const res = await axios.patch(
      `${BACKEND_URL}/trips/${tripid}.json?auth=${authToken}`,
      metadata
    );
    if (typeof metadata.tripName === "string" && metadata.tripName.length > 0) {
      setMMKVString(MMKV_KEY_PATTERNS.TRIP_NAME(tripid), metadata.tripName);
    }
    return res;
  } catch (error) {
    throw new Error("error while updating trip");
  }
}

/**
 * Writes `trips/<tripid>/members/<uid> = true` once per app session. Called
 * before a trip is loaded, so a Traveller whose membership predates the
 * `members` index (or was missed by the backfill) regains access on their own.
 * Returns false instead of throwing; the following read reports the failure.
 */
export async function ensureTripMembership(
  tripid: string,
  uid?: string
): Promise<boolean> {
  if (!tripid) return false;
  try {
    const memberUid = uid || (await secureStoreGetItem("uid"));
    if (!memberUid) return false;
    const key = tripMembershipKey(tripid, memberUid);
    if (ensuredTripMemberships.has(key)) return true;

    const authToken = await getValidIdToken();
    if (!authToken) {
      console.warn("[HTTP] No valid auth token for ensureTripMembership");
      return false;
    }

    await axios.put(
      `${BACKEND_URL}/trips/${tripid}/members/${memberUid}.json?auth=${authToken}`,
      true
    );
    ensuredTripMemberships.add(key);
    return true;
  } catch (error) {
    safeLogError(error);
    return false;
  }
}

export async function fetchTrip(tripid: string): Promise<TripData> {
  if (!tripid) return null;
  try {
    await ensureTripMembership(tripid);
    const authToken = await getValidIdToken();
    if (!authToken) {
      console.warn("[HTTP] No valid auth token for fetchTrip");
      return null;
    }

    // Shallow only proves the trip node exists and avoids downloading Expense
    // subtrees. Per Firebase REST docs, shallow=true truncates *every* child
    // to `true` (scalars included), so metadata must be read from leaf paths.
    const shallowResponse = await axios.get(
      `${BACKEND_URL}/trips/${tripid}.json?shallow=true&auth=${authToken}`,
      {
        timeout: AXIOS_TIMOUT_LONG,
      }
    );
    if (shallowResponse.data == null) return null;

    const shallowKeys =
      typeof shallowResponse.data === "object" && shallowResponse.data !== null
        ? shallowResponse.data
        : {};
    const presentMetadataKeys = TRIP_METADATA_FIELD_KEYS.filter(
      (key) => key in shallowKeys
    );

    const [travellers, ...leafResponses] = await Promise.all([
      getTravellers(tripid),
      ...presentMetadataKeys.map((key) =>
        axios.get(
          `${BACKEND_URL}/trips/${tripid}/${key}.json?auth=${authToken}`,
          { timeout: AXIOS_TIMOUT_LONG }
        )
      ),
    ]);

    const leaves: Partial<Record<TripMetadataFieldKey, unknown>> = {};
    presentMetadataKeys.forEach((key, index) => {
      leaves[key] = leafResponses[index]?.data;
    });
    const trip = tripMetadataFromLeaves(leaves, travellers);

    if (typeof trip.tripName === "string" && trip.tripName.length > 0) {
      setMMKVString(MMKV_KEY_PATTERNS.TRIP_NAME(tripid), trip.tripName);
    }
    return trip;
  } catch (error) {
    throw new Error("error while fetching trip");
  }
}

export async function deleteTrip(tripid: string) {
  try {
    const authToken = await getValidIdToken();
    if (!authToken) {
      console.warn("[HTTP] No valid auth token for deleteTrip");
      return null;
    }

    const response = await axios.delete(
      `${BACKEND_URL}/trips/${tripid}.json?auth=${authToken}`
    );
    return response;
  } catch (error) {
    safeLogError(error);
  }
}

export async function putTravelerInTrip(tripid: string, traveller: Traveller) {
  try {
    if (
      !traveller ||
      !traveller.userName ||
      !traveller.uid ||
      traveller.uid === undefined
    ) {
      throw new Error("traveller.uid is undefined");
    }

    const authToken = await getValidIdToken();
    if (!authToken) {
      console.warn("[HTTP] No valid auth token for putTravelerInTrip");
      return null;
    }

    const response = await axios.put(
      `${BACKEND_URL}/trips/${tripid}/travellers/${traveller.uid}.json?auth=${authToken}`,
      { uid: traveller.uid, userName: traveller.userName }
    );
    return response.data;
  } catch (error) {
    safeLogError(error);
  }
}

/** Remove a Traveller roster entry (Leave trip). Does not delete expenses/splits. */
export async function removeTravelerFromTrip(tripid: string, uid: string) {
  try {
    if (!tripid || !uid) {
      throw new Error("tripid and uid are required");
    }

    const authToken = await getValidIdToken();
    if (!authToken) {
      console.warn("[HTTP] No valid auth token for removeTravelerFromTrip");
      throw new Error("No valid auth token");
    }

    const response = await axios.delete(
      `${BACKEND_URL}/trips/${tripid}/travellers/${uid}.json?auth=${authToken}`
    );
    return response;
  } catch (error) {
    safeLogError(error);
    throw error;
  }
}

export type tripTravellers = {
  [key: string]: {
    uid: string;
    userName: string;
    touched: boolean;
  };
};

export async function fetchTripsTravellers(
  tripid: string
): Promise<tripTravellers> {
  try {
    const authToken = await getValidIdToken();
    if (!authToken) {
      console.warn("[HTTP] No valid auth token for fetchTripsTravellers");
      return null;
    }

    const response = await axios.get(
      `${BACKEND_URL}/trips/${tripid}/travellers.json?auth=${authToken}`,
      {
        timeout: AXIOS_TIMOUT_LONG,
      }
    );
    return response.data;
  } catch (error) {
    throw new Error("error while fetching travellers of trip");
  }
}

export async function getTravellers(tripid: string): Promise<Traveller[]> {
  try {
    const response = await fetchTripsTravellers(tripid);
    return normalizeTravellers(response);
  } catch (error) {
    safeLogError(error);
    return [];
  }
}

export async function getUIDs(tripid: string) {
  try {
    const response = await fetchTripsTravellers(tripid);
    const travellerids: string[] = [];
    for (const key in response) {
      const uid = response[key].uid;
      if (!travellerids.includes(uid) && uid && uid?.length > 0) {
        travellerids.push(uid);
      }
    }
    return travellerids;
  } catch (error) {
    safeLogError(error);
  }
}

export async function getAllExpenses(
  tripid: string,
  uid?: string,
  useDelta = true,
  loadingCallback?: SyncLoadingCallback
) {
  const uids = await getUIDs(tripid);
  if (uids?.length < 1) uids.push(uid);
  const expenses = await fetchExpensesWithUIDs(
    tripid,
    uids,
    useDelta,
    loadingCallback
  );
  return expenses;
}

export async function updateTripHistory(userId: string, newTripid: string) {
  const tripHistory = await fetchTripHistory(userId);
  if (!tripHistory) return storeTripHistory(userId, [newTripid]);
  // look for newTripid inside of oldTripHistory
  if (tripHistory.indexOf(newTripid) > -1) return;
  tripHistory.push(newTripid);

  const authToken = await getValidIdToken();
  if (!authToken) {
    console.warn("[HTTP] No valid auth token for updateTripHistory");
    return null;
  }

  return axios.put(
    `${BACKEND_URL}/users/${userId}/tripHistory.json?auth=${authToken}`,
    tripHistory
  );
}

/** Splice a trip id out of the User's Trip history (Leave trip). */
export async function removeTripFromHistory(userId: string, tripid: string) {
  const tripHistory = await fetchTripHistory(userId);
  const nextHistory = (tripHistory ?? []).filter(
    (id: string) => id !== tripid
  );
  return storeTripHistory(userId, nextHistory);
}

export async function storeTripHistory(userId: string, tripHistory: string[]) {
  try {
    const authToken = await getValidIdToken();
    if (!authToken) {
      console.warn("[HTTP] No valid auth token for storeTripHistory");
      throw new Error("No valid auth token");
    }

    const response = await axios.put(
      `${BACKEND_URL}/users/${userId}/tripHistory.json?auth=${authToken}`,
      tripHistory
    );
    return response.data;
  } catch (error) {
    throw new Error("error while storing trip history");
  }
}

export async function fetchTripHistory(userId: string) {
  try {
    const authToken = await getValidIdToken();
    if (!authToken) {
      console.warn("[HTTP] No valid auth token for fetchTripHistory");
      return null;
    }

    const response = await axios.get(
      `${BACKEND_URL}/users/${userId}/tripHistory.json?auth=${authToken}`,
      {
        timeout: AXIOS_TIMOUT_LONG,
      }
    );
    return response.data;
  } catch (error) {
    throw new Error("error while fetching trip history");
  }
}

export async function fetchCurrentTrip(userId: string) {
  try {
    const authToken = await getValidIdToken();
    if (!authToken) {
      console.warn("[HTTP] No valid auth token for fetchCurrentTrip");
      return null;
    }

    const response = await axios.get(
      `${BACKEND_URL}/users/${userId}.json?auth=${authToken}`,
      {
        timeout: AXIOS_TIMOUT_LONG,
      }
    );
    return response.data.currentTrip;
  } catch (error) {
    throw new Error("error while fetching current trip");
  }
}

export async function fetchUserName(userId: string): Promise<string> {
  try {
    const authToken = await getValidIdToken();
    if (!authToken) {
      console.warn("[HTTP] No valid auth token for fetchUserName");
      return null;
    }

    // Only `userName` is readable on another user's node.
    const response = await axios.get(
      `${BACKEND_URL}/users/${userId}/userName.json?auth=${authToken}`,
      {
        timeout: AXIOS_TIMOUT_LONG,
      }
    );
    return response.data;
  } catch (error) {
    safeLogError(error);
  }
}

export async function fetchTripName(tripId: string): Promise<string> {
  try {
    if (!tripId) return null;
    const cached = getMMKVString(MMKV_KEY_PATTERNS.TRIP_NAME(tripId));
    if (cached) return cached;

    const authToken = await getValidIdToken();
    if (!authToken) {
      console.warn("[HTTP] No valid auth token for fetchTripName");
      return null;
    }

    const response = await axios.get(
      `${BACKEND_URL}/trips/${tripId}/tripName.json?auth=${authToken}`,
      {
        timeout: AXIOS_TIMOUT_LONG,
      }
    );
    const tripName =
      typeof response.data === "string" ? response.data : response.data?.tripName;
    if (typeof tripName === "string" && tripName.length > 0) {
      setMMKVString(MMKV_KEY_PATTERNS.TRIP_NAME(tripId), tripName);
    }
    return tripName;
  } catch (error) {
    safeLogError(error);
  }
}

export async function touchTraveler(
  tripid: string,
  firebaseId: string,
  isTouched: boolean
) {
  try {
    const authToken = await getValidIdToken();
    if (!authToken) {
      console.warn("[HTTP] No valid auth token for touchTraveler");
      return null;
    }

    const response = await axios.patch(
      `${BACKEND_URL}/trips/${tripid}/travellers/${firebaseId}.json?auth=${authToken}`,
      { touched: isTouched, timout: AXIOS_TIMOUT_LONG }
    );
    return response;
  } catch (error) {
    safeLogError(error);
  }
}

export async function touchAllTravelers(
  tripid: string,
  flag: boolean,
  exceptionUid = ""
) {
  const response = await fetchTripsTravellers(tripid);
  const axios_calls = [];
  for (const firebaseIdKey in response) {
    if (!!exceptionUid && exceptionUid === response[firebaseIdKey].uid)
      continue;
    const new_axios_call = touchTraveler(tripid, firebaseIdKey, flag);
    axios_calls.push(new_axios_call);
  }
  try {
    await Promise.all(axios_calls);
  } catch (error) {
    safeLogError(error);
  }
}

export async function unTouchTraveler(tripid: string, uid: string) {
  const response = await fetchTripsTravellers(tripid);
  const axios_calls = [];
  for (const key in response) {
    if (uid !== response[key].uid) continue;
    axios_calls.push(touchTraveler(tripid, key, false));
  }
  try {
    await Promise.all(axios_calls);
  } catch (error) {
    safeLogError(error);
  }
}

export async function touchMyTraveler(tripid: string, uid: string) {
  const response = await fetchTripsTravellers(tripid);
  const axios_calls = [];
  for (const key in response) {
    if (uid !== response[key].uid) continue;
    axios_calls.push(touchTraveler(tripid, key, true));
  }
  try {
    await Promise.all(axios_calls);
  } catch (error) {
    safeLogError(error);
  }
}

export async function fetchTravelerIsTouched(tripid: string, uid: string) {
  try {
    const allTravelersRes = await fetchTripsTravellers(tripid);
    let returnIsTouched = false;
    for (const key in allTravelersRes) {
      const compareUid = allTravelersRes[key].uid;
      if (compareUid !== uid) continue;
      returnIsTouched = allTravelersRes[key].touched || !!returnIsTouched;
    }
    return returnIsTouched ?? true;
  } catch (error) {
    safeLogError(error);
    return false;
  }
}

export type localeExpoPushToken = {
  tripid?: string;
  locale?: string;
} & ExpoPushToken;

export async function storeExpoPushTokenInTrip(
  token: ExpoPushToken,
  tripid: string
) {
  if (!token) return;
  let usedTripID = tripid;
  if (!tripid || tripid.length < 1)
    usedTripID = await getActiveTripId();
  if (!usedTripID) return;

  const authToken = await getValidIdToken();
  if (!authToken) {
    console.warn("[HTTP] No valid auth token for storeExpoPushTokenInTrip");
    return null;
  }

  const localeToken: localeExpoPushToken = token;
  localeToken.tripid = usedTripID;
  localeToken.locale = i18n.locale;
  const response = await axios.get(
    `${BACKEND_URL}/trips/${usedTripID}/tokens.json?auth=${authToken}`,
    {
      timeout: AXIOS_TIMOUT_LONG,
    }
  );
  const res = response?.data;
  const keysToDelete = [];
  if (res) {
    for (const key in res) {
      const compareToken = res[key].token ?? res[key].localeToken;
      if (!compareToken) continue;
      if (localeToken.data == compareToken.data) {
        // delete all redundant tokens that have the same data as localeToken from database
        keysToDelete.push(key);
      }
    }
  }
  const axiosCalls = [];
  for (const key of keysToDelete) {
    axiosCalls.push(
      axios.delete(
        `${BACKEND_URL}/trips/${usedTripID}/tokens/${key}.json?auth=${authToken}`
      )
    );
  }

  let finalResponse: AxiosResponse = null;
  try {
    const response = await axios.post(
      `${BACKEND_URL}/trips/${usedTripID}/tokens.json?auth=${authToken}`,
      { token: localeToken }
    );
    finalResponse = response;
  } catch (error) {
    safeLogError(error, "http.tsx", 735);
  }
  try {
    await Promise.all(axiosCalls);
  } catch (error) {
    safeLogError(error);
  }
  return finalResponse;
}

export async function fetchChangelog() {
  try {
    const response = await axios.get(
      "https://raw.githubusercontent.com/HaDuve/TravelCostNative/main/TravelCostApp/changelog.txt",
      {
        timeout: AXIOS_TIMOUT_LONG,
      }
    );
    let tempText = "";
    if (response) tempText = response.data;
    return tempText;
  } catch (error) {
    safeLogError(error);
  }
}

// Feedback data interface
export interface FeedbackData {
  uid: string; // From UserContext
  feedbackString: string; // User input
  date: string; // ISO timestamp
  timestamp: number; // Unix timestamp for sorting
  userAgent?: string; // Device/app info
  version?: string; // App version
}

/**
 * Store feedback in the database
 * @param feedbackData - The feedback data to store
 * @returns Promise<string> - The Firebase-generated ID
 */
export async function storeFeedback(
  feedbackData: FeedbackData
): Promise<string> {
  try {
    const authToken = await getValidIdToken();
    if (!authToken) {
      console.warn("[HTTP] No valid auth token for storeFeedback");
      throw new Error("No valid auth token");
    }

    const response = await axios.post(
      `${BACKEND_URL}/server/feedback.json?auth=${authToken}`,
      feedbackData
    );
    return response.data.name; // Firebase-generated ID
  } catch (error) {
    safeLogError(error);
    throw new Error("error while storing feedback");
  }
}
