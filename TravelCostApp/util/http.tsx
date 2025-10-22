import axios, { AxiosResponse } from "axios";
import {
  AXIOS_TIMEOUT_DEFAULT,
  AXIOS_TIMOUT_LONG,
  DEBUG_NO_DATA,
} from "../confAppConstants";

import { Category } from "./category";
import { TripData } from "../store/trip-context";
import { ExpenseData, ExpenseDataOnline } from "./expense";
import { UserData } from "../store/user-context";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr, ru } from "../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale =
  Localization.getLocales()[0] && Localization.getLocales()[0].languageCode
    ? Localization.getLocales()[0].languageCode.slice(0, 2)
    : "en";
i18n.enableFallback = true;
// i18n.locale = "en";

import { Traveller } from "./traveler";
import uniqBy from "lodash.uniqby";
import { getMMKVString, setMMKVString } from "../store/mmkv";
import { secureStoreGetItem } from "../store/secure-storage";
import { ExpoPushToken } from "expo-notifications";
import safeLogError from "./error";
import { safelyParseJSON } from "./jsonParse";
import { getValidIdToken } from "./firebase-auth";
import {
  getLastFetchTimestamp,
  setLastFetchTimestamp,
} from "./last-fetch-timestamp";

const BACKEND_URL =
  "https://travelcostnative-default-rtdb.asia-southeast1.firebasedatabase.app";

// Field name for server timestamp in expense data -- needs to be updated in .rules firebase backend
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
    // eslint-disable-next-line no-console
    console.log(`Time taken by ${func.name} is ${end - start} ms`);
    return result;
  };
};

// fetch server info
export const fetchServerInfo = async () => {
  try {
    console.log("🌐 [HTTP] fetchServerInfo: Getting auth token");
    const authToken = await getValidIdToken();
    if (!authToken) {
      console.warn("[HTTP] No valid auth token available for fetchServerInfo");
      return null;
    }

    console.log("🌐 [HTTP] fetchServerInfo: Making request to server");
    const response = await axios.get(
      `${BACKEND_URL}/server.json?auth=${authToken}`,
      {
        timeout: AXIOS_TIMOUT_LONG,
      }
    );

    // Process the response data here
    if (!response) throw new Error("No response from server");
    const data = response?.data;
    if (!data) throw new Error("No data on the server");
    console.log("🌐 [HTTP] fetchServerInfo: Successfully fetched server data");
    return data;
  } catch (error) {
    console.log("❌ [HTTP] fetchServerInfo failed:", error.message);
    safeLogError(error);
    return null;
  }
};

// fetch categories function from /trips/tripid/categories
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
  try {
    const authToken = await getValidIdToken();
    if (!authToken) {
      console.warn("[HTTP] No valid auth token for storeExpense");
      return null;
    }

    // Add serverTimestamp to expense data
    const expenseDataWithTimestamp = {
      ...expenseData,
      [SERVER_TIMESTAMP_FIELD]: Date.now(),
    };

    const response = await axios.post(
      `${BACKEND_URL}/trips/${tripid}/${uid}/expenses.json?auth=${authToken}`,
      expenseDataWithTimestamp
    );
    const id: string = response.data.name;
    return id;
  } catch (error) {
    safeLogError(error);
  }
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
      isPaid: r.isPaid,
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

export async function fetchExpensesWithUIDs(
  tripid: string,
  uidlist: string[],
  useDelta: boolean = true,
  loadingCallback?: SyncLoadingCallback
) {
  if (!tripid || !uidlist || DEBUG_NO_DATA) return [];
  const expenses: ExpenseData[] = [];
  let latestTimestamp: number = 0;

  // Notify sync start
  loadingCallback?.onStart?.();

  const authToken = await getValidIdToken();
  if (!authToken) {
    loadingCallback?.onComplete?.();
    return [];
  }

  // check devices sync status (only fetch new data)
  console.log(
    `fetchExpensesWithUIDs getLastFetchTimestamp: tripid is ${tripid}`
  );
  const lastFetch = getLastFetchTimestamp(tripid);
  const isFirstFetch = lastFetch === 0;

  for (let i = 0; i < uidlist.length; i++) {
    const uid = uidlist[i];
    try {
      let userExpenses: ExpenseData[] = [];
      const serverFilteredUrl = `${BACKEND_URL}/trips/${tripid}/${uid}/expenses.json?orderBy="${SERVER_TIMESTAMP_FIELD}"&startAt=${lastFetch}&auth=${authToken}`;
      const allDataUrl = `${BACKEND_URL}/trips/${tripid}/${uid}/expenses.json?auth=${authToken}`;
      const shouldFilter = useDelta && !isFirstFetch;
      const url = shouldFilter ? serverFilteredUrl : allDataUrl;

      const response = await axios.get(url, {
        timeout: AXIOS_TIMOUT_LONG,
      });
      userExpenses = processExpenseResponse(response.data);

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
      safeLogError(error);
    }
  }
  console.log(
    `SET: fetchExpensesWithUIDs  setLastFetchTimestamp: tripid is ${tripid} to ${latestTimestamp}, fetched ${expenses.length} expenses`
  );
  if (latestTimestamp > 0) {
    setLastFetchTimestamp(tripid, latestTimestamp);
  }

  // Notify sync completion
  loadingCallback?.onComplete?.();
  return expenses;
}

export async function fetchExpenses(
  tripid: string,
  uid: string,
  useDelta: boolean = true,
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
          isPaid: r.isPaid,
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
    console.log(`fetchExpenses getLastFetchTimestamp: tripid is ${tripid}`);
    const isFirstFetch = lastFetch === 0;

    const authToken = await getValidIdToken();
    if (!authToken) {
      return [];
    }

    let expenses: ExpenseData[] = [];

    if (useDelta && !isFirstFetch) {
      const url = `${BACKEND_URL}/trips/${tripid}/${uid}/expenses.json?orderBy="${SERVER_TIMESTAMP_FIELD}"&startAt=${lastFetch}&auth=${authToken}`;
      const response = await axios.get(url, {
        timeout: AXIOS_TIMOUT_LONG,
      });
      expenses = processExpenseResponse(response.data);
    } else {
      const url = `${BACKEND_URL}/trips/${tripid}/${uid}/expenses.json?auth=${authToken}`;
      const response = await axios.get(url, {
        timeout: AXIOS_TIMOUT_LONG,
      });
      expenses = processExpenseResponse(response.data);
    }

    if (expenses.length > 0) {
      // Hybrid approach: Use serverTimestamp (preferred) with editedTimestamp fallback for backward compatibility
      // TODO: After 100% migration to serverTimestamp and running migration script, simplify to:
      // .map((e) => e.serverTimestamp || 0)
      const validTimestamps = expenses
        .map((e) => e.serverTimestamp || e.editedTimestamp || 0)
        .filter((ts) => ts > 0);

      if (validTimestamps.length > 0) {
        const latestTimestamp = Math.max(...validTimestamps);
        console.log(
          `SET: fetchExpenses setLastFetchTimestamp: tripid is ${tripid} to ${latestTimestamp}`
        );
        setLastFetchTimestamp(tripid, latestTimestamp);
      }
    }

    // Notify sync completion
    loadingCallback?.onComplete?.();
    return expenses;
  } catch (error) {
    safeLogError(error);
    loadingCallback?.onComplete?.();
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
  try {
    const authToken = await getValidIdToken();
    if (!authToken) {
      console.warn("[HTTP] No valid auth token for updateExpense");
      return null;
    }

    // Add serverTimestamp to expense data
    const expenseDataWithTimestamp = {
      ...expenseData,
      [SERVER_TIMESTAMP_FIELD]: Date.now(),
    };

    const response = await axios.put(
      `${BACKEND_URL}/trips/${tripid}/${uid}/expenses/${id}.json?auth=${authToken}`,
      expenseDataWithTimestamp
    );
    return response;
  } catch (error) {
    safeLogError(error);
  }
}

/**
 * Deletes an expense from a trip.
 * @param tripid - The ID of the trip.
 * @param uid - The ID of the user.
 * @param id - The ID of the expense.
 * @returns A Promise that resolves to the response from the server.
 */
export async function deleteExpense(tripid: string, uid: string, id: string) {
  try {
    const authToken = await getValidIdToken();
    if (!authToken) {
      console.warn("[HTTP] No valid auth token for deleteExpense");
      return null;
    }

    // Soft delete: mark as deleted instead of removing
    const deletionData = {
      isDeleted: true,
      [SERVER_TIMESTAMP_FIELD]: Date.now(),
    };

    const response = await axios.patch(
      `${BACKEND_URL}/trips/${tripid}/${uid}/expenses/${id}.json?auth=${authToken}`,
      deletionData
    );
    return response;
  } catch (error) {
    safeLogError(error);
  }
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

export async function storeTrip(tripData: TripData) {
  try {
    const authToken = await getValidIdToken();
    if (!authToken) {
      console.warn("[HTTP] No valid auth token for storeTrip");
      throw new Error("No valid auth token");
    }

    const response = await axios.post(
      `${BACKEND_URL}/trips.json?auth=${authToken}`,
      tripData
    );
    const id = response.data.name;
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

    const res = await axios.patch(
      `${BACKEND_URL}/trips/${tripid}.json?auth=${authToken}`,
      tripData
    );
    return res;
  } catch (error) {
    throw new Error("error while updating trip");
  }
}

export async function fetchTrip(tripid: string): Promise<TripData> {
  if (!tripid) return null;
  try {
    const authToken = await getValidIdToken();
    if (!authToken) {
      console.warn("[HTTP] No valid auth token for fetchTrip");
      return null;
    }

    const response = await axios.get(
      `${BACKEND_URL}/trips/${tripid}.json?auth=${authToken}`,
      {
        timeout: AXIOS_TIMOUT_LONG,
      }
    );
    const tripData = response.data;

    // Filter out deleted trips
    if (tripData && tripData.deleted) {
      return null;
    }

    return tripData;
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

export async function softDeleteTrip(tripid: string) {
  try {
    const authToken = await getValidIdToken();
    if (!authToken) {
      console.warn("[HTTP] No valid auth token for softDeleteTrip");
      return null;
    }

    const deletionData = {
      deleted: true,
      deletedTimestamp: Date.now(),
    };

    const response = await axios.patch(
      `${BACKEND_URL}/trips/${tripid}.json?auth=${authToken}`,
      deletionData
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

export async function removeTravelerFromTrip(tripid: string, uid: string) {
  try {
    if (!uid || uid === undefined) {
      throw new Error("uid is undefined");
    }

    const authToken = await getValidIdToken();
    if (!authToken) {
      console.warn("[HTTP] No valid auth token for removeTravelerFromTrip");
      return null;
    }

    const response = await axios.delete(
      `${BACKEND_URL}/trips/${tripid}/travellers/${uid}.json?auth=${authToken}`
    );
    return response.data;
  } catch (error) {
    safeLogError(error);
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

export type TravellerNames = string[];

export async function getTravellers(tripid: string): Promise<TravellerNames> {
  try {
    const response = await fetchTripsTravellers(tripid);
    const travellerids = [];
    const travelerNames = [];
    for (const key in response) {
      const travelerName = response[key].userName;
      const uid = response[key].uid;
      if (
        !travellerids.includes(uid) &&
        !travelerNames.includes(travelerName) &&
        travelerName &&
        travelerName?.length > 0
      ) {
        travellerids.push(uid);
        travelerNames.push(travelerName);
      }
    }
    return uniqBy(travelerNames);
  } catch (error) {
    safeLogError(error);
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
  useDelta: boolean = true,
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

export async function fetchTripHistory(userId: string, filtered = true) {
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
    if (filtered) {
      const filteredTripHistory: string[] = [];
      for (const tripid of response.data) {
        const trip = await fetchTrip(tripid);
        if (trip?.deleted !== true) {
          filteredTripHistory.push(tripid);
        }
      }
      return filteredTripHistory;
    }
    return response.data;
  } catch (error) {
    throw new Error("error while fetching trip history");
  }
}

export async function fetchAllUserTrips(userId: string): Promise<TripData[]> {
  try {
    const tripHistory = await fetchTripHistory(userId);
    if (!tripHistory || tripHistory.length === 0) {
      return [];
    }

    const authToken = await getValidIdToken();
    if (!authToken) {
      console.warn("[HTTP] No valid auth token for fetchAllUserTrips");
      return [];
    }

    const tripPromises = tripHistory.map(async (tripid: string) => {
      try {
        const response = await axios.get(
          `${BACKEND_URL}/trips/${tripid}.json?auth=${authToken}`,
          {
            timeout: AXIOS_TIMOUT_LONG,
          }
        );
        const tripData = response.data;
        // Add tripid to the data
        tripData.tripid = tripid;
        return tripData;
      } catch (error) {
        // If trip doesn't exist or is inaccessible, return null
        return null;
      }
    });

    const trips = await Promise.all(tripPromises);
    // Filter out null values and deleted trips
    return trips.filter((trip) => trip && !trip.deleted);
  } catch (error) {
    safeLogError(error);
    return [];
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

    const response = await axios.get(
      `${BACKEND_URL}/users/${userId}.json?auth=${authToken}`,
      {
        timeout: AXIOS_TIMOUT_LONG,
      }
    );
    return response.data.userName;
  } catch (error) {
    safeLogError(error);
  }
}

export async function fetchTripName(tripId: string): Promise<string> {
  try {
    const authToken = await getValidIdToken();
    if (!authToken) {
      console.warn("[HTTP] No valid auth token for fetchTripName");
      return null;
    }

    const response = await axios.get(
      `${BACKEND_URL}/trips/${tripId}.json?auth=${authToken}`,
      {
        timeout: AXIOS_TIMOUT_LONG,
      }
    );
    return response.data.tripName;
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
    usedTripID = await secureStoreGetItem("currentTripId");
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
