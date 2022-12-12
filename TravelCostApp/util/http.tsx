import axios from "axios";
import { truncateString } from "./string";

const BACKEND_URL =
  "https://travelcostnative-default-rtdb.asia-southeast1.firebasedatabase.app";

/** AXIOS Instance */
// const Axios = axios.create({
//   baseURL: BACKEND_URL,
// });

/** ACCESS TOKEN */
var QPAR: string = "";
/** Sets the ACCESS TOKEN for all future http requests */
export function setAxiosAccessToken(token: string) {
  if (!token || token.length < 2) {
    console.error("wrong token error");
    return;
  }
  QPAR = `?auth=${token}`;
}

/** Axios Logger */
axios.interceptors.request.use(
  (config) => {
    console.log(
      `\n--- AXIOS LOG ~~~ \n`,
      `${config.method.toUpperCase()} request sent to ${truncateString(
        config.url,
        160
      )}`,
      `\n~~~ AXIOS LOG --- \n`
    );
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
  console.log("storeExpense ~ uid", uid);
  console.log("storeExpense ~ tripid", tripid);
  // TODO: create expenseData interface for TypeScript
  const response = await axios.post(
    BACKEND_URL + "/trips/" + tripid + "/" + uid + "/expenses.json" + QPAR,
    expenseData
  );
  const id = response.data.name;
  return id;
}

export async function fetchExpensesWithUIDs(tripid: string, uidlist: string[]) {
  console.log("fetchExpensesWithUIDs ~ uidlist", uidlist);
  console.log("fetchExpensesWithUIDs ~ tripid", tripid);
  const expenses = [];
  if (!tripid || !uidlist) return expenses;

  const axios_calls = [];
  uidlist.forEach((uid) => {
    const new_axios_call = axios.get(
      BACKEND_URL + "/trips/" + tripid + "/" + uid + "/expenses.json" + QPAR
    );
    axios_calls.push(new_axios_call);
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
  console.log("fetchExpenses ~ uid", uid);
  console.log("fetchExpenses ~ tripid", tripid);
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
}

export function updateExpense(
  tripid: string,
  uid: string,
  id: string,
  expenseData
) {
  console.log("uid", uid);
  console.log("tripid", tripid);
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
  console.log("deleteExpense ~ tripid", tripid);
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
  console.log("storeUser ~ userData", userData);
  const response = await axios.post(
    BACKEND_URL + "/users/" + `${uid}`,
    userData
  );
  const id = response.data.name;
  return id;
}

export async function saveUserCorrectly(uid: string, userName: string) {
  console.log("saveUserCorrectly ~ userName", userName);
  const response = await axios.post(
    BACKEND_URL + "/users/" + `${uid}`,
    userName + "2"
  );
  const id = response.data.name;
  return id;
}

export function updateUser(uid: string, userData: object) {
  console.log("updateUser ~ uid", uid);
  //TODO: create userData Interface for TypeScript
  return axios.patch(BACKEND_URL + "/users/" + `${uid}.json` + QPAR, userData);
}

export async function fetchUser(uid: string) {
  console.log("fetchUser ~ uid", uid);
  const response = await axios.get(
    BACKEND_URL + "/users/" + `${uid}.json` + QPAR
  );
  return response.data;
}

export async function storeTrip(tripData) {
  console.log("storeTrip ~ tripData", tripData);
  //TODO: create tripData Interface for TypeScript
  const response = await axios.post(
    BACKEND_URL + "/trips.json" + QPAR,
    tripData
  );
  const id = response.data.name;
  return id;
}

// export function updateTrip(tripid: string, tripData) {
//    create tripData Interface for TypeScript
//   return axios.put(BACKEND_URL + "/trips/" + `${tripid}.json`, tripData);
// }

export async function fetchTrip(tripid: string) {
  console.log("fetchTrip ~ tripid", tripid);
  const response = await axios.get(
    BACKEND_URL + "/trips/" + `${tripid}.json` + QPAR
  );
  return response.data;
}

export async function storeTravellerToTrip(tripid: string, traveller) {
  console.log("storeTravellerToTrip ~ traveller", traveller);
  // TODO: add traveller interface for TypeScript ({ userName: userName, uid: uid })
  const response = await axios.post(
    BACKEND_URL + `/trips/${tripid}/travellers.json` + QPAR,
    traveller
  );
  return response.data;
}

export async function fetchTripsTravellers(tripid: string) {
  const response = await axios.get(
    BACKEND_URL + `/trips/${tripid}/travellers.json` + QPAR
  );
  console.log("fetchTripsTravellers ~ response", response.data);
  return response.data;
}

export async function getTravellers(tripid: string) {
  console.log("getTravellers ~ tripid", tripid);
  const response = await fetchTripsTravellers(tripid);
  console.log("getTravellers ~ response", response);
  let travellerids = [];
  let travellers = [];
  for (let key in response) {
    const traveller = response[key].userName;
    const uid = response[key].uid;
    if (
      !travellerids.includes(uid) &&
      !travellers.includes(traveller) &&
      traveller &&
      traveller.length > 0
    ) {
      travellerids.push(uid);
      travellers.push(traveller);
    }
  }
  return travellers;
}

export async function getUIDs(tripid: string) {
  const response = await fetchTripsTravellers(tripid);
  let travellerids: string[] = [];
  for (let key in response) {
    const uid = response[key].uid;
    console.log("getUIDs ~ uid", uid);
    if (!travellerids.includes(uid) && uid && uid.length > 0) {
      travellerids.push(uid);
    }
  }
  return travellerids;
}

export async function getAllExpenses(tripid: string, uid?: string) {
  console.log("getAllExpenses ~ tripid", tripid);
  const uids = await getUIDs(tripid);
  if (uids.length < 1) uids.push(uid);
  const expenses = await fetchExpensesWithUIDs(tripid, uids);
  return expenses;
}

export async function storeTripHistory(userId: string, tripHistory: string[]) {
  console.log("storeTripHistory ~ userId", userId);
  const response = await axios.put(
    BACKEND_URL + `/users/${userId}/tripHistory.json` + QPAR,
    tripHistory
  );
  return response.data;
}

export async function fetchTripHistory(userId: string) {
  console.log("fetchTripHistory ~ userId", userId);
  const response = await axios.get(
    BACKEND_URL + `/users/${userId}/tripHistory.json` + QPAR
  );
  console.log("fetchTripHistory ~ response", response.data);
  return response.data;
}

export async function fetchUserName(userId: string): Promise<string> {
  const response = await axios.get(
    BACKEND_URL + `/users/${userId}.json` + QPAR
  );
  console.log("fetchUserName ~ response", response.data);
  return response.data.userName;
}
