import axios from "axios";

const DUMMYTRIP = "abcdefgh";

const BACKEND_URL =
  "https://travelcostnative-default-rtdb.asia-southeast1.firebasedatabase.app";

export async function storeExpense(uid, expenseData) {
  console.log(uid);
  const response = await axios.post(
    BACKEND_URL + "/trips/" + DUMMYTRIP + "/" + uid + "/expenses.json",
    expenseData
  );
  const id = response.data.name;
  return id;
}

export async function fetchExpenses(uid) {
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

export function updateExpense(uid, id, expenseData) {
  return axios.put(
    BACKEND_URL +
      "/trips/" +
      DUMMYTRIP +
      "/" +
      uid +
      "/expenses/" +
      `${id}.json`,
    expenseData
  );
}

export function deleteExpense(uid, id) {
  return axios.delete(
    BACKEND_URL +
      "/trips/" +
      DUMMYTRIP +
      "/" +
      uid +
      "/expenses/" +
      `${id}.json`
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
