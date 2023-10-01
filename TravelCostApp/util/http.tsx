import axios from "axios";
import { DEBUG_NO_DATA } from "../confAppConstants";
import { Category } from "./category";
import { TripData } from "../store/trip-context";
import { ExpenseData, ExpenseDataOnline } from "./expense";
import { UserData } from "../store/user-context";
import { truncateString } from "./string";
import { Traveller } from "./traveler";
import uniqBy from "lodash.uniqby";
import { getMMKVString, setMMKVString } from "../store/mmkv";

const BACKEND_URL =
  "https://travelcostnative-default-rtdb.asia-southeast1.firebasedatabase.app";

/** AXIOS Instance */
// const Axios = axios.create({
//   baseURL: BACKEND_URL,
// });

/** ACCESS TOKEN */
/** Sets the ACCESS TOKEN for all future http requests */
export function setAxiosAccessToken(token: string) {
  console.log("setAxiosAccessToken ~ setQPAR", truncateString(token, 5));
  if (!token || token?.length < 2) {
    console.error("https: ~ setAxiosAccessToken ~ wrong token QPAR error");
    setMMKVString("QPAR", "");
    return;
  }
  setMMKVString("QPAR", `?auth=${token}`);
}

/** Axios Logger */
axios.interceptors.request.use(
  (config) => {
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
    console.log(`Timing ${func.name} now!`);
    const start = Date.now();
    const result = await func(...args);
    const end = Date.now();
    console.log(`Time taken by ${func.name} is ${end - start} ms`);
    return result;
  };
};

// fetch server info
export const fetchServerInfo = async () => {
  try {
    const response = await axios.get(
      `${BACKEND_URL}/server.json${getMMKVString("QPAR")}`
    );

    // Process the response data here
    if (!response) throw new Error("No response from server");
    const data = response.data;
    if (!data) throw new Error("No data on the server");
    console.log("fetchServerInfo ~ data:", data);

    // Return or set the data to your state or do other operations as needed
    return data;
  } catch (error) {
    console.error("Error fetching server info from Firebase:", error);
    // Handle errors as per your app's requirements
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
        getMMKVString("QPAR")
    );
    if (response) return JSON.parse(response.data);
  } catch (error) {
    console.error(error);
  }
}

export async function deleteCategories(tripid: string) {
  try {
    const response = await axios.delete(
      BACKEND_URL + `/trips/${tripid}/categories.json` + getMMKVString("QPAR")
    );
    return response.data;
  } catch (error) {
    // log error
    console.log("deleteCategories:", error);
  }
}

export async function patchCategories(tripid: string, categories: Category[]) {
  console.log("categories:", categories);
  const json = JSON.stringify(categories);
  try {
    const response = await axios.post(
      BACKEND_URL + `/trips/${tripid}/categories.json` + getMMKVString("QPAR"),
      json
    );
    return response;
  } catch (error) {
    // log error
    console.log("patchCategories:", error);
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
export async function storeExpense(tripid: string, uid: string, expenseData) {
  // console.log("https: ~ storeExpense ~ uid", uid);
  // console.log("https: ~ storeExpense ~ tripid", tripid);
  // TODO: create expenseData interface for TypeScript
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
    const id = response.data.name;
    return id;
  } catch (error) {
    console.error(
      `Failed to store expense for trip ${tripid}: ${error.message}`
    );
    throw new Error(`Failed to store expense for trip ${tripid}`);
  }
}

export async function fetchExpensesWithUIDs(tripid: string, uidlist: string[]) {
  // console.log(
  // "https: ~ fetchExpensesWithUIDs ~ uidlist",
  // uidlist,
  // "tripid",
  // tripid
  // );
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
          getMMKVString("QPAR")
      );
      axios_calls.push(new_axios_call);
    } catch (error) {
      console.warn("error while fetchingExpenses of user: ", uid, error);
      throw new Error("error while fetchingExpenses of user: " + uid);
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
        };
        expenses.push(expenseObj);
      }
    });
  } catch (error) {
    console.log("error while fetching expenses: ", error);
    throw new Error("error while fetching expenses");
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
        getMMKVString("QPAR")
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
      };
      expenses.push(expenseObj);
    }

    return expenses;
  } catch (error) {
    console.warn(error);
    throw new Error("error while fetching expenses");
  }
}

export function updateExpense(
  tripid: string,
  uid: string,
  id: string,
  expenseData
) {
  // console.log("updateExpense ~ expenseData", expenseData);
  //TODO: create expenseData Interface for TypeScript
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
    console.warn(error);
    throw new Error("error while updating expense");
  }
}

export function deleteExpense(tripid: string, uid: string, id: string) {
  console.log("https: ~ deleteExpense ~ tripid", tripid);
  console.log("deleteExpense ~ uid", uid);
  console.log("deleteExpense ~ id", id);
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
    console.warn(error);
    throw new Error("error while deleting expense");
  }
}

/**
 * Stores the initially created User in Firebase,
 * @param uid
 * @param userData
 * @returns uid
 */
export async function storeUser(uid: string, userData: object) {
  console.log("https: ~ storeUser ~ uid:", uid);
  console.log("https: ~ storeUser ~ userData", userData);
  console.log("https: ~ storeUser ~ global QPAR", getMMKVString("QPAR"));
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
  // console.log("updateUser ~ userData", userData);
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
  // console.log("https: ~ fetchUser ~ uid", uid);
  if (!uid) {
    console.warn("https: ~ fetchUser ~ uid is empty");
    return null;
  }
  try {
    const response = await axios.get(
      BACKEND_URL + "/users/" + `${uid}.json` + getMMKVString("QPAR")
    );
    const userData: UserData = response.data;
    return userData;
  } catch (error) {
    console.log(error);
    throw new Error("error while fetching user");
  }
}

export async function storeTrip(tripData: TripData) {
  // console.log("https: ~ storeTrip ~ tripData", tripData);
  //TODO: create tripData Interface for TypeScript
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

export async function updateTrip(tripid: string, tripData) {
  // console.log("https: ~ updateTrip ~ tripData", tripData);
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
  // console.log("https: ~ fetchTrip ~ tripid", tripid);
  try {
    const response = await axios.get(
      BACKEND_URL + "/trips/" + `${tripid}.json` + getMMKVString("QPAR")
    );
    return response.data;
  } catch (error) {
    throw new Error("error while fetching trip");
  }
}

export async function deleteTrip(tripid: string) {
  // console.log("https: ~ deleteTrip ~ tripid", tripid);
  try {
    const response = await axios.delete(
      BACKEND_URL + "/trips/" + `${tripid}.json` + getMMKVString("QPAR")
    );
    return response;
  } catch (error) {
    throw new Error("error while deleting trip");
  }
}

export async function putTravelerInTrip(tripid: string, traveller: Traveller) {
  console.log("https: ~ putTravelerInTrip ~ traveller", traveller);
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
    console.log(error.message);
    throw new Error("error while putting traveller to trip", error.message);
  }
}

export async function fetchTripsTravellers(tripid: string) {
  // console.log("fetchTripsTravellers ~ tripid", tripid);
  try {
    const response = await axios.get(
      BACKEND_URL + `/trips/${tripid}/travellers.json` + getMMKVString("QPAR")
    );
    return response.data;
  } catch (error) {
    throw new Error("error while fetching travellers of trip");
  }
}

export async function getTravellers(tripid: string) {
  // console.log("getTravellers ~ tripid", tripid);
  try {
    const response = await fetchTripsTravellers(tripid);
    // console.log("getTravellers ~ response:", response);
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
    throw new Error("error while fetching travellers of trip");
  }
}

export async function getUIDs(tripid: string) {
  // console.log("getUIDs ~ tripid", tripid);
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
    throw new Error("error while fetching UIDs of trip");
  }
}

export async function getAllExpenses(tripid: string, uid?: string) {
  // console.log("~~ https: ~ getAllExpenses ~ tripid", tripid);
  // console.log("~~ https: ~ getAllExpenses ~ uid", uid);
  const uids = await getUIDs(tripid);
  if (uids?.length < 1) uids.push(uid);
  const expenses = await fetchExpensesWithUIDs(tripid, uids);
  return expenses;
}

export async function updateTripHistory(userId: string, newTripid: string) {
  // console.log("updateTripHistory ~ newTripid", newTripid);
  const tripHistory = await fetchTripHistory(userId);
  console.log("updateTripHistory ~ tripHistory:", tripHistory);
  // if triphistory empty, just await storeTripHistory(uid, [tripid]);
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
  // console.log("storeTripHistory ~ tripHistory", tripHistory);
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
  // console.log("fetchTripHistory ~ userId", userId);
  try {
    const response = await axios.get(
      BACKEND_URL + `/users/${userId}/tripHistory.json` + getMMKVString("QPAR")
    );
    return response.data;
  } catch (error) {
    throw new Error("error while fetching trip history");
  }
}

export async function fetchCurrentTrip(userId: string) {
  // console.log("https: ~ fetchCurrentTrip ~ userId", userId);
  try {
    const response = await axios.get(
      BACKEND_URL + `/users/${userId}.json` + getMMKVString("QPAR")
    );
    // console.log("https: ~ fetchCurrentTrip ~ response", response.data);
    if (!response?.data?.currentTrip)
      console.warn("https: ~ could not find current trip of this user!");
    return response.data.currentTrip;
  } catch (error) {
    throw new Error("error while fetching current trip");
  }
}

export async function fetchUserName(userId: string): Promise<string> {
  try {
    const response = await axios.get(
      BACKEND_URL + `/users/${userId}.json` + getMMKVString("QPAR")
    );
    // console.log("https: ~ fetchUserName ~ response", response.data);
    return response.data.userName;
  } catch (error) {
    throw new Error("error while fetching user name");
  }
}

export async function fetchTripName(tripId: string): Promise<string> {
  try {
    const response = await axios.get(
      BACKEND_URL + `/trips/${tripId}.json` + getMMKVString("QPAR")
    );
    return response.data.tripName;
  } catch (error) {
    throw new Error("error while fetching trip name");
  }
}

export async function touchTraveler(
  tripid: string,
  firebaseId: string,
  isTouched: boolean
) {
  console.log("touching with QPAR", getMMKVString("QPAR"));
  try {
    const response = await axios.patch(
      BACKEND_URL +
        `/trips/${tripid}/travellers/${firebaseId}.json` +
        getMMKVString("QPAR"),
      { touched: isTouched }
    );
    return response;
  } catch (error) {
    throw new Error("error while touching traveler");
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
    console.log("touching:", error);
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
    console.log("touching:", error);
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
    console.log("touching:", error);
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
    // return true if uid is not found in allTravelersRes
    return returnIsTouched ?? true;
  } catch (error) {
    console.log("fetchTravelerIsTouched:", error);
    return false;
  }
}
