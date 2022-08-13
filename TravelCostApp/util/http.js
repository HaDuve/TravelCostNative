import axios from "axios";

const DUMMYTRIP = "abcdefgh";

const BACKEND_URL =
  "https://travelcostnative-default-rtdb.asia-southeast1.firebasedatabase.app";

export async function storeExpense(tripid, uid, expenseData) {
  console.log(uid);
  const response = await axios.post(
    BACKEND_URL + "/trips/" + tripid + "/" + uid + "/expenses.json",
    expenseData
  );
  const id = response.data.name;
  return id;
}

export async function fetchExpenses(tripid, uid) {
  const response = await axios.get(
    BACKEND_URL + "/trips/" + DUMMYTRIP + "/" + uid + "/expenses.json"
  );

  const expenses = [];

  for (const key in response.data) {
    const expenseObj = {
      id: key,
      amount: response.data[key].amount,
      date: new Date(response.data[key].date),
      description: response.data[key].description,
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
