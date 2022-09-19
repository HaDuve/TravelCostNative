import axios from "axios";

const DUMMYTRIP = "abcdefgh";

const BACKEND_URL =
  "https://travelcostnative-default-rtdb.asia-southeast1.firebasedatabase.app";

export async function storeExpense(tripid, uid, expenseData) {
  const response = await axios.post(
    BACKEND_URL + "/trips/" + tripid + "/" + uid + "/expenses.json",
    expenseData
  );
  const id = response.data.name;
  return id;
}

export async function fetchExpensesWithUIDs(tripid, uidlist) {
  const expenses = [];
  uidlist.forEach((uid) => {
    async function getExp(uid) {
      console.log("getExp ~ uid", uid);
      const response = await axios.get(
        BACKEND_URL + "/trips/" + tripid + "/" + uid + "/expenses.json"
      );

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
        console.log("getExp ~ expenseObj", expenseObj);
        expenses.push(expenseObj);
        console.log("getExp ~ expenses!!!!", expenses);
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

export async function fetchExpenses(tripid, uid) {
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

export function updateExpense(tripid, uid, id, expenseData) {
  return axios.put(
    BACKEND_URL + "/trips/" + tripid + "/" + uid + "/expenses/" + `${id}.json`,
    expenseData
  );
}

export function deleteExpense(tripid, uid, id) {
  return axios.delete(
    BACKEND_URL + "/trips/" + tripid + "/" + uid + "/expenses/" + `${id}.json`
  );
}

export async function storeUser(uid, userData) {
  const response = await axios.post(
    BACKEND_URL + "/users/" + `${uid}.json`,
    userData ? userData : { uid: uid }
  );
  const id = response.data.name;
  return id;
}

export function updateUser(uid, userData) {
  return axios.put(BACKEND_URL + "/users/" + `${uid}.json`, userData);
}

export async function fetchUser(uid) {
  const response = await axios.get(BACKEND_URL + "/users/" + `${uid}.json`);
  return response.data;
}

export async function storeTrip(tripData) {
  const response = await axios.post(BACKEND_URL + "/trips.json", tripData);
  const id = response.data.name;
  return id;
}

export function updateTrip(tripid, tripData) {
  return axios.put(BACKEND_URL + "/trips/" + `${tripid}.json`, tripData);
}

export async function fetchTrip(tripid) {
  const response = await axios.get(BACKEND_URL + "/trips/" + `${tripid}.json`);
  return response.data;
}

export async function storeUserToTrip(tripid, uid) {
  const response = await axios.post(
    BACKEND_URL + "/trips/" + `${tripid}/` + `travellers.json`,
    uid
  );
  const id = response.data.name;
  return id;
}

export async function fetchTripUsers(tripid) {
  const response = await axios.get(
    BACKEND_URL + `/trips/${tripid}/travellers.json`
  );
  return response.data;
}

export async function getTravellers(tripid) {
  const response = await fetchTripUsers(tripid);
  let travellerids = [];
  let travellers = [];
  for (let key in response) {
    const traveller = response[key].userName;
    const uid = response[key].travellerid;
    if (!travellerids.includes(uid) && traveller && traveller.length > 0) {
      travellerids.push(uid);
      travellers.push(traveller);
    }
  }
  return travellers;
}

export async function getUIDs(tripid) {
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

export async function getAllExpenses(tripid) {
  const uids = await getUIDs(tripid);
  console.log("getAllExpenses ~ uids", uids);
  const expenses = await fetchExpensesWithUIDs(tripid, uids);
  console.log("getAllExpenses ~ expenses", expenses);
  return expenses;
}
