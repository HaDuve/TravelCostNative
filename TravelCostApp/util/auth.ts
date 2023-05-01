import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const API_KEY = "AIzaSyAPXaokb5pgZ286Ih-ty8ZERoc8nubf1TE";
const SIGN_UP = "signUp";
const SIGN_IN = "signInWithPassword";

async function authenticate(mode: string, email: string, password: string) {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:${mode}?key=${API_KEY}`;
  const response = await axios.post(url, {
    email: email,
    password: password,
    returnSecureToken: true,
  });

  //store email and password in async storage
  await AsyncStorage.setItem("ENCM", email);
  console.log("authenticate ~ email:", email);
  await AsyncStorage.setItem("ENCP", password);

  const token = response.data.idToken;
  const uid = response.data.localId;
  return { token, uid };
}

export function createUser(email: string, password: string) {
  return authenticate(SIGN_UP, email, password);
}

export async function login(email: string, password: string) {
  return authenticate(SIGN_IN, email, password);
}
