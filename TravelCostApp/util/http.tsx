import axios from "axios";

const BACKEND_URL =
  "https://travelcostnative-default-rtdb.asia-southeast1.firebasedatabase.app";

/** Axios Logger */

axios.interceptors.request.use(
  (config) => {
    console.log(`${config.method.toUpperCase()} request sent to ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * storeExpense posts expense data under the specified path:
 * #### trips/$tripid/$user/
 * @param tripid
 * @param uid
 * @param expenseData
 * @returns id
 */
export async function storeExpense(tripid: string, uid: string, expenseData) {
  // TODO: create expenseData interface for TypeScript
  const response = await axios.post(
    BACKEND_URL + "/trips/" + tripid + "/" + uid + "/expenses.json",
    expenseData
  );
  const id = response.data.name;
  return id;
}

export async function fetchExpensesWithUIDs(tripid: string, uidlist: string[]) {
  const expenses = [];
  uidlist.forEach((uid) => {
    async function getExp(uid: string) {
      const response = await axios.get(
        BACKEND_URL + "/trips/" + tripid + "/" + uid + "/expenses.json"
      );

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
    }
    getExp(uid);
  });

  // TODO: find out why we dont await the above
  // for some reason we dont await the above so we have to do this to really get all the expense
  const response1 = await axios.get(
    BACKEND_URL + "/trips/" + tripid + "/" + uidlist[0] + "/expenses.json"
  );
  const response2 = await axios.get(
    BACKEND_URL + "/trips/" + tripid + "/" + uidlist[0] + "/expenses.json"
  );
  return expenses;
}

export async function fetchExpenses(tripid: string, uid: string) {
  const response = await axios.get(
    BACKEND_URL + "/trips/" + tripid + "/" + uid + "/expenses.json"
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
  //TODO: create expenseData Interface for TypeScript
  return axios.put(
    BACKEND_URL + "/trips/" + tripid + "/" + uid + "/expenses/" + `${id}.json`,
    expenseData
  );
}

export function deleteExpense(tripid: string, uid: string, id: string) {
  return axios.delete(
    BACKEND_URL + "/trips/" + tripid + "/" + uid + "/expenses/" + `${id}.json`
  );
}

export async function storeUser(uid: string, userData) {
  // TODO: fix the double store User bug
  const response = await axios.post(
    // POST /users/uid.jos with userData if it exists, otherwise with {uid:uid}
    BACKEND_URL + "/users/" + `${uid}.json`,
    userData ? userData : { uid: uid }
  );
  const id = response.data.name;
  return id;
}

export function updateUser(uid: string, userData) {
  //TODO: create userData Interface for TypeScript
  return axios.patch(BACKEND_URL + "/users/" + `${uid}.json`, userData);
}

export async function fetchUser(uid: string) {
  const response = await axios.get(BACKEND_URL + "/users/" + `${uid}.json`);
  return response.data;
}

export async function storeTrip(tripData) {
  //TODO: create tripData Interface for TypeScript
  const response = await axios.post(BACKEND_URL + "/trips.json", tripData);
  const id = response.data.name;
  return id;
}

// export function updateTrip(tripid: string, tripData) {
//    create tripData Interface for TypeScript
//   return axios.put(BACKEND_URL + "/trips/" + `${tripid}.json`, tripData);
// }

export async function fetchTrip(tripid: string) {
  const response = await axios.get(BACKEND_URL + "/trips/" + `${tripid}.json`);
  return response.data;
}

export async function storeUserToTrip(tripid: string, uid) {
  console.log("storeUserToTrip ~ tripid", tripid);
  // TODO: check first if User is already in the Trip!
  const response = await axios.post(
    BACKEND_URL + "/trips/" + `${tripid}/` + `${uid}.json`
  );
  const id = response.data.name;
  return id;
}

export async function storeTripidToUser(tripid: string, uid: string) {
  return await axios.post(
    BACKEND_URL + `/${uid}/` + "/trips/" + `${tripid}.json`
  );
}

export async function fetchTripUsers(tripid: string) {
  const response = await axios.get(
    BACKEND_URL + `/trips/${tripid}/travellers.json`
  );
  return response.data;
}

export async function getTravellers(tripid: string) {
  const response = await fetchTripUsers(tripid);
  let travellerids = [];
  let travellers = [];
  for (let key in response) {
    const traveller = response[key].userName;
    const uid = response[key].travellerid;
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
  const response = await fetchTripUsers(tripid);
  let travellerids = [];
  for (let key in response) {
    const uid = response[key].travellerid;
    if (!travellerids.includes(uid) && uid && uid.length > 0) {
      travellerids.push(uid);
    }
  }
  return travellerids;
}

export async function getAllExpenses(tripid: string) {
  const uids = await getUIDs(tripid);
  const expenses = await fetchExpensesWithUIDs(tripid, uids);
  return expenses;
}
