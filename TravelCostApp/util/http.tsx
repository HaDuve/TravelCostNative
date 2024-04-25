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
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

import { Traveller } from "./traveler";
import uniqBy from "lodash.uniqby";
import { getMMKVString, setMMKVString } from "../store/mmkv";
import { secureStoreGetItem } from "../store/secure-storage";
import { ExpoPushToken } from "expo-notifications";
import safeLogError from "./error";

const BACKEND_URL =
  "https://travelcostnative-default-rtdb.asia-southeast1.firebasedatabase.app";

/** AXIOS Instance */
// const Axios = axios.create({
//   baseURL: BACKEND_URL,
// });
axios.defaults.timeout = AXIOS_TIMEOUT_DEFAULT; // Set default timeout to 5 seconds

/** ACCESS TOKEN */
/** Sets the ACCESS TOKEN for all future http requests */
export function setAxiosAccessToken(token: string) {
  if (!token || token?.length < 2) {
    console.error("https: ~ setAxiosAccessToken ~ wrong token QPAR error");
    setMMKVString("QPAR", "");
    return;
  }
  setMMKVString("QPAR", `?auth=${token}`);
  // automatically set the token as authorization token for all axios requests
  // axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

/** Axios Logger */
axios.interceptors.request.use(
  (config) => {
    // set header
    // config.headers.common["Authorization"] = `Bearer ${getMMKVString("QPAR")}`;
    // console.log(
    //   `\n--- AXIOS LOG ~~~ \n`,
    //   `${config.method.toUpperCase()} request sent to ${truncateString(
    //     config.url,
    //     160
    //   )}`,
    //   `\n~~~ AXIOS LOG --- \n`
    // );
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
    const response = await axios.get(
      `${BACKEND_URL}/server.json${getMMKVString("QPAR")}`,
      {
        timeout: AXIOS_TIMOUT_LONG,
      }
    );

    // Process the response data here
    if (!response) throw new Error("No response from server");
    const data = response?.data;
    if (!data) throw new Error("No data on the server");
    return data;
  } catch (error) {
    safeLogError(error);
  }
};

// fetch categories function from /trips/tripid/categories
export async function fetchCategories(tripid: string) {
  try {
    const response = await axios.get(
      BACKEND_URL +
        "/trips/" +
        tripid +
        "/categories.json" +
        getMMKVString("QPAR"),
      {
        timeout: AXIOS_TIMOUT_LONG,
      }
    );
    if (response) return JSON.parse(response.data);
  } catch (error) {
    safeLogError(error);
  }
}

export async function deleteCategories(tripid: string) {
  try {
    const response = await axios.delete(
      BACKEND_URL + `/trips/${tripid}/categories.json` + getMMKVString("QPAR")
    );
    return response?.data;
  } catch (error) {
    safeLogError(error);
  }
}

export async function patchCategories(tripid: string, categories: Category[]) {
  const json = JSON.stringify(categories);
  try {
    const response = await axios.post(
      BACKEND_URL + `/trips/${tripid}/categories.json` + getMMKVString("QPAR"),
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
    const response = await axios.post(
      BACKEND_URL +
        "/trips/" +
        tripid +
        "/" +
        uid +
        "/expenses.json" +
        getMMKVString("QPAR"),
      expenseData
    );
    const id: string = response.data.name;
    return id;
  } catch (error) {
    safeLogError(error);
  }
}

export async function fetchExpensesWithUIDs(tripid: string, uidlist: string[]) {
  if (!tripid || !uidlist || DEBUG_NO_DATA) return [];
  const expenses: ExpenseData[] = [];
  const axios_calls = [];
  uidlist.forEach((uid) => {
    try {
      const new_axios_call = axios.get(
        BACKEND_URL +
          "/trips/" +
          tripid +
          "/" +
          uid +
          "/expenses.json" +
          getMMKVString("QPAR"),
        {
          timeout: AXIOS_TIMOUT_LONG,
        }
      );
      axios_calls.push(new_axios_call);
    } catch (error) {
      safeLogError(error);
    }
  });
  try {
    const responseArray = await Promise.all(axios_calls);
    responseArray.forEach((response) => {
      for (const key in response.data) {
        const r: ExpenseDataOnline = response.data[key];
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
          editedTimestamp: +r.editedTimestamp,
        };
        expenses.push(expenseObj);
      }
    });
  } catch (error) {
    safeLogError(error);
  }

  return expenses;
}

export async function fetchExpenses(tripid: string, uid: string) {
  if (!tripid || DEBUG_NO_DATA) return [];

  try {
    const response = await axios.get(
      BACKEND_URL +
        "/trips/" +
        tripid +
        "/" +
        uid +
        "/expenses.json" +
        getMMKVString("QPAR"),
      {
        timeout: AXIOS_TIMOUT_LONG,
      }
    );
    const expenses = [];

    // ExpenseData
    for (const key in response.data) {
      const data: ExpenseDataOnline = response.data[key];
      const expenseObj: ExpenseData = {
        id: key,
        amount: data.amount,
        date: new Date(data.date),
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        description: data.description,
        category: data.category,
        country: data.country,
        currency: data.currency,
        whoPaid: data.whoPaid,
        uid: data.uid,
        calcAmount: data.calcAmount,
        splitType: data.splitType,
        splitList: data.splitList,
        categoryString: data.categoryString,
        duplOrSplit: data.duplOrSplit,
        rangeId: data.rangeId,
        isPaid: data.isPaid,
        isSpecialExpense: data.isSpecialExpense,
        editedTimestamp: +data.editedTimestamp,
      };
      expenses.push(expenseObj);
    }

    return expenses;
  } catch (error) {
    safeLogError(error);
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
export function updateExpense(
  tripid: string,
  uid: string,
  id: string,
  expenseData: ExpenseData
) {
  try {
    const response = axios.put(
      BACKEND_URL +
        "/trips/" +
        tripid +
        "/" +
        uid +
        "/expenses/" +
        `${id}.json` +
        getMMKVString("QPAR"),
      expenseData
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
export function deleteExpense(tripid: string, uid: string, id: string) {
  try {
    const response = axios.delete(
      BACKEND_URL +
        "/trips/" +
        tripid +
        "/" +
        uid +
        "/expenses/" +
        `${id}.json` +
        getMMKVString("QPAR")
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
  const response = await axios.put(
    BACKEND_URL + "/users/" + `${uid}.json` + getMMKVString("QPAR"),
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
    await axios.patch(
      BACKEND_URL + "/users/" + `${uid}.json` + getMMKVString("QPAR"),
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
    const response = await axios.get(BACKEND_URL + "/users/" + `${uid}.json`, {
      timeout: AXIOS_TIMOUT_LONG,
    });
    const userData: UserData = response.data;
    return userData;
  } catch (error) {
    safeLogError(error);
  }
}

export async function storeTrip(tripData: TripData) {
  try {
    const response = await axios.post(
      BACKEND_URL + "/trips.json" + getMMKVString("QPAR"),
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
    const res = await axios.patch(
      BACKEND_URL + "/trips/" + `${tripid}.json` + getMMKVString("QPAR"),
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
    const response = await axios.get(
      BACKEND_URL + "/trips/" + `${tripid}.json` + getMMKVString("QPAR"),
      {
        timeout: AXIOS_TIMOUT_LONG,
      }
    );
    return response.data;
  } catch (error) {
    throw new Error("error while fetching trip");
  }
}

export async function deleteTrip(tripid: string) {
  try {
    const response = await axios.delete(
      BACKEND_URL + "/trips/" + `${tripid}.json` + getMMKVString("QPAR")
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
    const response = await axios.put(
      BACKEND_URL +
        `/trips/${tripid}/travellers/${traveller.uid}.json` +
        getMMKVString("QPAR"),
      { uid: traveller.uid, userName: traveller.userName }
    );
    return response.data;
  } catch (error) {
    safeLogError(error);
  }
}

export async function fetchTripsTravellers(tripid: string) {
  try {
    const response = await axios.get(
      BACKEND_URL + `/trips/${tripid}/travellers.json` + getMMKVString("QPAR"),
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

export async function getAllExpenses(tripid: string, uid?: string) {
  const uids = await getUIDs(tripid);
  if (uids?.length < 1) uids.push(uid);
  const expenses = await fetchExpensesWithUIDs(tripid, uids);
  return expenses;
}

export async function updateTripHistory(userId: string, newTripid: string) {
  const tripHistory = await fetchTripHistory(userId);
  if (!tripHistory) return storeTripHistory(userId, [newTripid]);
  // look for newTripid inside of oldTripHistory
  if (tripHistory.indexOf(newTripid) > -1) return;
  tripHistory.push(newTripid);
  return axios.put(
    BACKEND_URL + `/users/${userId}/tripHistory.json` + getMMKVString("QPAR"),
    tripHistory
  );
}

export async function storeTripHistory(userId: string, tripHistory: string[]) {
  try {
    const response = await axios.put(
      BACKEND_URL + `/users/${userId}/tripHistory.json` + getMMKVString("QPAR"),
      tripHistory
    );
    return response.data;
  } catch (error) {
    throw new Error("error while storing trip history");
  }
}

export async function fetchTripHistory(userId: string) {
  try {
    const response = await axios.get(
      BACKEND_URL + `/users/${userId}/tripHistory.json` + getMMKVString("QPAR"),
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
    const response = await axios.get(
      BACKEND_URL + `/users/${userId}.json` + getMMKVString("QPAR"),
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
    const response = await axios.get(
      BACKEND_URL + `/users/${userId}.json` + getMMKVString("QPAR"),
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
    const response = await axios.get(
      BACKEND_URL + `/trips/${tripId}.json` + getMMKVString("QPAR"),
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
    const response = await axios.patch(
      BACKEND_URL +
        `/trips/${tripid}/travellers/${firebaseId}.json` +
        getMMKVString("QPAR"),
      { touched: isTouched, timout: AXIOS_TIMOUT_LONG }
    );
    return response;
  } catch (error) {
    safeLogError(error);
  }
}

export async function touchAllTravelers(tripid: string, flag: boolean) {
  const response = await fetchTripsTravellers(tripid);
  const axios_calls = [];
  for (const key in response) {
    const new_axios_call = touchTraveler(tripid, key, flag);
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
    let returnIsTouched = null;
    for (const key in allTravelersRes) {
      const DatabaseUid = allTravelersRes[key].uid;
      if (DatabaseUid !== uid) continue;
      returnIsTouched = allTravelersRes[key].touched;
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
  const localeToken: localeExpoPushToken = token;
  localeToken.tripid = usedTripID;
  localeToken.locale = i18n.locale;
  const response = await axios.get(
    BACKEND_URL + `/trips/${usedTripID}/tokens.json` + getMMKVString("QPAR"),
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
        BACKEND_URL +
          `/trips/${usedTripID}/tokens/${key}.json` +
          getMMKVString("QPAR")
      )
    );
  }

  let finalResponse: AxiosResponse = null;
  try {
    const response = await axios.post(
      BACKEND_URL + `/trips/${usedTripID}/tokens.json` + getMMKVString("QPAR"),
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
