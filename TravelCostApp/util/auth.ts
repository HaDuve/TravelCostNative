import axios from "axios";

import { secureStoreSetItem } from "../store/secure-storage";

import { storeAuthData } from "./firebase-auth";

const API_KEY = "AIzaSyAPXaokb5pgZ286Ih-ty8ZERoc8nubf1TE";
const SIGN_UP = "signUp";
const SIGN_IN = "signInWithPassword";

interface FirebaseAuthResponse {
  idToken: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
}

async function authenticate(mode: string, email: string, password: string) {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:${mode}?key=${API_KEY}`;
  const response = await axios.post(url, {
    email,
    password,
    returnSecureToken: true,
  });

  // Store email and password in secure storage
  await secureStoreSetItem("ENCM", email);
  await secureStoreSetItem("ENCP", password);

  // Store complete auth data including refresh token
  const authData: FirebaseAuthResponse = {
    idToken: response.data.idToken,
    refreshToken: response.data.refreshToken,
    expiresIn: response.data.expiresIn,
    localId: response.data.localId,
  };

  await storeAuthData(authData);

  const token: string = response.data.idToken;
  const uid: string = response.data.localId;
  return { token, uid };
}

export function createUser(email: string, password: string) {
  return authenticate(SIGN_UP, email, password);
}

export async function login(email: string, password: string) {
  return authenticate(SIGN_IN, email, password);
}
