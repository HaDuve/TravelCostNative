import axios from "axios";
import { DEBUG_NO_DATA } from "../appConfig";
import { Category } from "./category";
import { TripData } from "../store/trip-context";

const BACKEND_URL =
  "https://travelcostnative-default-rtdb.asia-southeast1.firebasedatabase.app";

/** AXIOS Instance */
// const Axios = axios.create({
//   baseURL: BACKEND_URL,
// });

/** ACCESS TOKEN */
let QPAR = "";
/** Sets the ACCESS TOKEN for all future http requests */
export function setAxiosAccessToken(token: string) {
  if (!token || token.length < 2) {
    console.error("https: ~ wrong token error");
    return;
  }
  QPAR = `?auth=${token}`;
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
      BACKEND_URL + "/trips/" + tripid + "/" + uid + "/expenses.json" + QPAR,
      expenseData
    );
    const id = response.data.name;
    return id;
  } catch (error) {
    console.warn(error);
    return null;
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
  const expenses = [];
  const axios_calls = [];
  console.log("loading expense list...");
  uidlist.forEach((uid) => {
    try {
      const new_axios_call = axios.get(
        BACKEND_URL + "/trips/" + tripid + "/" + uid + "/expenses.json" + QPAR
      );
      axios_calls.push(new_axios_call);
    } catch (error) {
      console.warn("error while fetchingExpenses of user: ", uid, error);
    }
  });
  const responseArray = await Promise.all(axios_calls);
  responseArray.forEach((response) => {
    for (const key in response.data) {
      const r = response.data[key];
      const expenseObj = {
        id: key,
        amount: r.amount,
        date: new Date(r.date),
        description: r.description,
        category: r.category,
        country: r.country,
        currency: r.currency,
        whoPaid: r.whoPaid,
        owePerc: r.owePerc,
        uid: r.uid,
        calcAmount: r.calcAmount,
        splitType: r.splitType,
        listEQUAL: r.listEQUAL,
        splitList: r.splitList,
      };
      expenses.push(expenseObj);
    }
  });

  return expenses;
}

export async function fetchExpenses(tripid: string, uid: string) {
  if (!tripid || DEBUG_NO_DATA) return [];

  try {
    console.log("loading expense list...");
    const response = await axios.get(
      BACKEND_URL + "/trips/" + tripid + "/" + uid + "/expenses.json" + QPAR
    );
    const expenses = [];

    for (const key in response.data) {
      const expenseObj = {
        id: key,
        amount: response.data[key].amount,
        date: new Date(response.data[key].date),
        description: response.data[key].description,
        category: response.data[key].category,
        country: response.data[key].country,
        currency: response.data[key].currency,
        whoPaid: response.data[key].whoPaid,
        owePerc: response.data[key].owePerc,
        uid: response.data[key].uid,
        calcAmount: response.data[key].calcAmount,
      };
      expenses.push(expenseObj);
    }

    return expenses;
  } catch (error) {
    console.warn(error);
    return [];
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
  return axios.put(
    BACKEND_URL +
      "/trips/" +
      tripid +
      "/" +
      uid +
      "/expenses/" +
      `${id}.json` +
      QPAR,
    expenseData
  );
}

export function deleteExpense(tripid: string, uid: string, id: string) {
  console.log("https: ~ deleteExpense ~ tripid", tripid);
  console.log("deleteExpense ~ uid", uid);
  console.log("deleteExpense ~ id", id);
  return axios.delete(
    BACKEND_URL +
      "/trips/" +
      tripid +
      "/" +
      uid +
      "/expenses/" +
      `${id}.json` +
      QPAR
  );
}

/**
 * Stores the initially created User in Firebase,
 * @param uid
 * @param userData
 * @returns uid
 */
export async function storeUser(uid: string, userData: object) {
  // console.log("https: ~ storeUser ~ userData", userData);
  try {
    const response = await axios.post(
      BACKEND_URL + "/users/" + `${uid}`,
      userData
    );
    const id = response.data.name;
    return id;
  } catch (error) {
    console.warn(error);
    return null;
  }
}

/**
 * Updates User via axios.patch given uid and userdata to patch
 */
export function updateUser(uid: string, userData: object) {
  // console.log("updateUser ~ userData", userData);
  return axios.patch(BACKEND_URL + "/users/" + `${uid}.json` + QPAR, userData);
}

export async function fetchUser(uid: string) {
  // console.log("https: ~ fetchUser ~ uid", uid);
  if (!uid) {
    console.warn("https: ~ fetchUser ~ uid is empty");
    return null;
  }
  try {
    const response = await axios.get(
      BACKEND_URL + "/users/" + `${uid}.json` + QPAR
    );
    return response.data;
  } catch (error) {
    console.log(error);
    return null;
  }
}

export async function storeTrip(tripData) {
  // console.log("https: ~ storeTrip ~ tripData", tripData);
  //TODO: create tripData Interface for TypeScript
  const response = await axios.post(
    BACKEND_URL + "/trips.json" + QPAR,
    tripData
  );
  const id = response.data.name;
  return id;
}

export async function updateTrip(tripid: string, tripData) {
  // console.log("https: ~ updateTrip ~ tripData", tripData);
  const res = await axios.patch(
    BACKEND_URL + "/trips/" + `${tripid}.json` + QPAR,
    tripData
  );
  return res;
}

export async function fetchTrip(tripid: string): Promise<TripData> {
  if (!tripid) return null;
  // console.log("https: ~ fetchTrip ~ tripid", tripid);
  const response = await axios.get(
    BACKEND_URL + "/trips/" + `${tripid}.json` + QPAR
  );
  return response.data;
}

export async function deleteTrip(tripid: string) {
  // console.log("https: ~ deleteTrip ~ tripid", tripid);
  const response = await axios.delete(
    BACKEND_URL + "/trips/" + `${tripid}.json` + QPAR
  );
  return response;
}

export async function storeTravellerToTrip(tripid: string, traveller) {
  // console.log("https: ~ storeTravellerToTrip ~ traveller", traveller);
  // TODO: add traveller interface for TypeScript ({ userName: userName, uid: uid })

  // TODO: check if Traveller already exists
  const listTravellers = await getTravellers(tripid);
  const objTravellers = [];
  listTravellers.forEach((traveller) => {
    objTravellers.push({ userName: traveller });
  });
  console.log("storeTravellerToTrip ~ objTravellers", objTravellers);
  // // look for newTripid inside of oldTripHistory
  if (objTravellers.indexOf(traveller.userName) > -1) {
    console.log(traveller.userName + " already exists");
    return;
  }
  const response = await axios.post(
    BACKEND_URL + `/trips/${tripid}/travellers.json` + QPAR,
    traveller
  );
  return response.data;
}

export async function fetchTripsTravellers(tripid: string) {
  // console.log("fetchTripsTravellers ~ tripid", tripid);
  const response = await axios.get(
    BACKEND_URL + `/trips/${tripid}/travellers.json` + QPAR
  );
  return response.data;
}

export async function getTravellers(tripid: string) {
  // console.log("getTravellers ~ tripid", tripid);
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
      travelerName.length > 0
    ) {
      travellerids.push(uid);
      travelerNames.push(travelerName);
    }
  }
  return travelerNames;
}

export async function getUIDs(tripid: string) {
  // console.log("getUIDs ~ tripid", tripid);
  const response = await fetchTripsTravellers(tripid);
  const travellerids: string[] = [];
  for (const key in response) {
    const uid = response[key].uid;
    if (!travellerids.includes(uid) && uid && uid.length > 0) {
      travellerids.push(uid);
    }
  }
  return travellerids;
}

export async function getAllExpenses(tripid: string, uid?: string) {
  // console.log("~~ https: ~ getAllExpenses ~ tripid", tripid);
  // console.log("~~ https: ~ getAllExpenses ~ uid", uid);
  const uids = await getUIDs(tripid);
  if (uids.length < 1) uids.push(uid);
  const expenses = await fetchExpensesWithUIDs(tripid, uids);
  return expenses;
}

export async function updateTripHistory(userId: string, newTripid: string) {
  // console.log("updateTripHistory ~ newTripid", newTripid);
  const tripHistory = await fetchTripHistory(userId);
  // look for newTripid inside of oldTripHistory
  if (tripHistory.indexOf(newTripid) > -1) return;
  tripHistory.push(newTripid);
  return axios.put(
    BACKEND_URL + `/users/${userId}/tripHistory.json` + QPAR,
    tripHistory
  );
}

export async function storeTripHistory(userId: string, tripHistory: string[]) {
  // console.log("storeTripHistory ~ tripHistory", tripHistory);
  const response = await axios.put(
    BACKEND_URL + `/users/${userId}/tripHistory.json` + QPAR,
    tripHistory
  );
  return response.data;
}

export async function fetchTripHistory(userId: string) {
  // console.log("fetchTripHistory ~ userId", userId);
  const response = await axios.get(
    BACKEND_URL + `/users/${userId}/tripHistory.json` + QPAR
  );
  return response.data;
}

export async function fetchCurrentTrip(userId: string) {
  // console.log("https: ~ fetchCurrentTrip ~ userId", userId);
  const response = await axios.get(
    BACKEND_URL + `/users/${userId}.json` + QPAR
  );
  // console.log("https: ~ fetchCurrentTrip ~ response", response.data);
  if (!response?.data?.currentTrip)
    console.warn("https: ~ could not find current trip of this user!");
  return response.data.currentTrip;
}

export async function fetchUserName(userId: string): Promise<string> {
  const response = await axios.get(
    BACKEND_URL + `/users/${userId}.json` + QPAR
  );
  // console.log("https: ~ fetchUserName ~ response", response.data);
  return response.data.userName;
}

export async function fetchTripName(tripId: string): Promise<string> {
  const response = await axios.get(
    BACKEND_URL + `/trips/${tripId}.json` + QPAR
  );
  return response.data.tripName;
}

export async function touchTraveler(
  tripid: string,
  firebaseId: string,
  isTouched: boolean
) {
  const response = await axios.patch(
    BACKEND_URL + `/trips/${tripid}/travellers/${firebaseId}.json` + QPAR,
    { touched: isTouched }
  );
  return response;
}

export async function touchAllTravelers(tripid: string, flag: boolean) {
  const response = await fetchTripsTravellers(tripid);
  for (const key in response) {
    console.log("touching: ", response[key].userName);
    await touchTraveler(tripid, key, flag);
  }
}

export async function unTouchTraveler(tripid: string, uid: string) {
  const response = await fetchTripsTravellers(tripid);
  for (const key in response) {
    if (uid !== response[key].uid) continue;
    console.log("untouching: ", response[key].userName);
    await touchTraveler(tripid, key, false);
  }
}

export async function touchMyTraveler(tripid: string, uid: string) {
  const response = await fetchTripsTravellers(tripid);
  for (const key in response) {
    if (uid !== response[key].uid) continue;
    console.log("TOUCHING: ", response[key].userName);
    await touchTraveler(tripid, key, true);
  }
}

export async function fetchTravelerIsTouched(tripid: string, uid: string) {
  // only fatch the flag if the uid is the same as the uid in key in response
  const allTravelersRes = await fetchTripsTravellers(tripid);
  let returnIsTouched = null;
  for (const key in allTravelersRes) {
    const DatabaseUid = allTravelersRes[key].uid;
    if (DatabaseUid !== uid) continue;
    // console.log(
    //   "Fetching traveler:" + allTravelersRes[key].userName + " isTouched: ",
    //   allTravelersRes[key].touched
    // );
    returnIsTouched = allTravelersRes[key].touched;
  }
  // catch undefined and null values of return as a default true
  // either we didnt find the user, or the user was never touched
  // we want to fetch new data and then set touched to false later
  if (returnIsTouched == null) returnIsTouched = true;
  return returnIsTouched;
}

export async function storeCategories(tripid: string, categories: Category[]) {
  const response = await axios.put(
    BACKEND_URL + `/trips/${tripid}/categories.json` + QPAR,
    categories
  );
  return response.data;
}

export async function updateCategories(tripid: string, categories: Category[]) {
  console.log("categories:", categories);
  const response = await axios.patch(
    BACKEND_URL + `/trips/${tripid}.json` + QPAR,
    { categories: categories }
  );
  return response;
}
