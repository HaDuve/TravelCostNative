import axios from "axios";
import { AuthContext } from "../store/auth-context";
import { useContext } from "react";

const DUMMYTRIP = "abcdefgh";

const BACKEND_URL =
  "https://travelcostnative-default-rtdb.asia-southeast1.firebasedatabase.app";

export async function storeExpense(uid, expenseData) {
  console.log(uid);
  const response = await axios.post(
    BACKEND_URL +
      "/data/users/" +
      uid +
      "/trips/" +
      DUMMYTRIP +
      "/expenses.json",
    expenseData
  );
  const id = response.data.name;
  return id;
}

export async function fetchExpenses(uid) {
  const response = await axios.get(
    BACKEND_URL +
      "/data/users/" +
      uid +
      "/trips/" +
      DUMMYTRIP +
      "/expenses.json"
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
      "/data/users/" +
      uid +
      "/trips/" +
      DUMMYTRIP +
      "/expenses/" +
      `${id}.json`,
    expenseData
  );
}

export function deleteExpense(uid, id) {
  return axios.delete(
    BACKEND_URL +
      "/data/users/" +
      uid +
      "/trips/" +
      DUMMYTRIP +
      "/expenses/" +
      `${id}.json`
  );
}
