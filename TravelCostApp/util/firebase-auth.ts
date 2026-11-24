import axios from "axios";
import { setMMKVString } from "../store/mmkv";
import {
  secureStoreGetItem,
  secureStoreSetItem,
} from "../store/secure-storage";
import safeLogError from "./error";
import { setAxiosAccessToken } from "./axios-config";

const API_KEY = "AIzaSyAPXaokb5pgZ286Ih-ty8ZERoc8nubf1TE";
const BACKEND_URL =
  "https://travelcostnative-default-rtdb.asia-southeast1.firebasedatabase.app";

/**
 * Firebase Authentication utilities for Realtime Database
 * Handles ID token refresh and proper authentication
 */

interface FirebaseAuthResponse {
  idToken: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
}

/**
 * Identifies the signed-in account. Bumped whenever the stored credentials
 * are replaced (storeAuthData) or cleared (sign-out). Work started under an
 * older generation must not read or write the current account's credentials.
 */
let authGeneration = 0;

/**
 * Drops any in-flight refresh or sign-in and makes it unable to write.
 * Call on sign-out, before the stored credentials are cleared.
 */
export function invalidateAuthSession(): void {
  authGeneration += 1;
  inFlightTokenRequest = null;
}

function isStale(generation: number): boolean {
  return generation !== authGeneration;
}

/**
 * Refresh Firebase ID token using refresh token
 */
async function refreshIdToken(
  refreshToken: string,
  generation: number
): Promise<string | null> {
  try {
    const url = `https://securetoken.googleapis.com/v1/token?key=${API_KEY}`;
    const response = await axios.post(url, {
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    });

    const { access_token, expires_in, refresh_token } = response.data;

    if (isStale(generation)) {
      return null;
    }

    // Write the rotated refresh token first: if a later write fails, the
    // stored refresh token still matches the old access token, never the
    // other way round.
    if (refresh_token) {
      // The Token Service may rotate the refresh token; keep the latest one
      await secureStoreSetItem("refreshToken", refresh_token);
    }
    await secureStoreSetItem("token", access_token);
    await secureStoreSetItem(
      "tokenExpiry",
      (Date.now() + parseInt(expires_in) * 1000).toString()
    );

    // Update authentication token for immediate use
    setAxiosAccessToken(access_token);

    return access_token;
  } catch (error) {
    console.error("[FIREBASE-AUTH] Failed to refresh token:", error);
    safeLogError(error);
    return null;
  }
}

/**
 * The refresh or sign-in in flight for one account generation. Concurrent
 * callers of that account share it, so an expired token hits the network
 * once. Callers of a later account never join it.
 */
let inFlightTokenRequest: {
  generation: number;
  promise: Promise<string | null>;
} | null = null;

/**
 * Get valid Firebase ID token, refreshing if necessary.
 * A still-valid token is returned directly. Only the refresh and re-auth
 * branch is shared between concurrent callers of the same account.
 */
export async function getValidIdToken(): Promise<string | null> {
  const generation = authGeneration;
  try {
    const currentToken = await secureStoreGetItem("token");
    const tokenExpiry = await secureStoreGetItem("tokenExpiry");

    if (!currentToken) {
      console.warn("[FIREBASE-AUTH] No token found");
      return null;
    }

    // Check if token is expired (with 5 minute buffer)
    const now = Date.now();
    const expiryTime = tokenExpiry ? parseInt(tokenExpiry) : 0;
    const bufferTime = 5 * 60 * 1000; // 5 minutes

    if (now < expiryTime - bufferTime) {
      return currentToken;
    }

    return sharedRefresh(generation);
  } catch (error) {
    console.error("[FIREBASE-AUTH] Error getting valid token:", error);
    safeLogError(error);
    return null;
  }
}

/**
 * Returns the shared refresh or re-auth for this generation, starting one if
 * none is in flight for it.
 */
function sharedRefresh(generation: number): Promise<string | null> {
  if (inFlightTokenRequest?.generation === generation) {
    return inFlightTokenRequest.promise;
  }
  const promise: Promise<string | null> = refreshOrReauthenticate(
    generation
  ).finally(() => {
    if (inFlightTokenRequest?.promise === promise) {
      inFlightTokenRequest = null;
    }
  });
  inFlightTokenRequest = { generation, promise };
  return promise;
}

async function refreshOrReauthenticate(
  generation: number
): Promise<string | null> {
  const refreshToken = await secureStoreGetItem("refreshToken");
  if (refreshToken) {
    const newToken = await refreshIdToken(refreshToken, generation);
    if (newToken || isStale(generation)) {
      return newToken;
    }
  }

  // If refresh failed, try to re-authenticate
  return await reAuthenticate(generation);
}

/**
 * Re-authenticate using stored email/password
 */
async function reAuthenticate(generation: number): Promise<string | null> {
  try {
    const email = await secureStoreGetItem("ENCM");
    const password = await secureStoreGetItem("ENCP");

    if (!email || !password) {
      console.error(
        "[FIREBASE-AUTH] No stored credentials for re-authentication"
      );
      return null;
    }

    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`;
    const response = await axios.post(url, {
      email: email,
      password: password,
      returnSecureToken: true,
    });

    const { idToken, refreshToken, expiresIn, localId }: FirebaseAuthResponse =
      response.data;

    if (isStale(generation)) {
      return null;
    }

    // Store all auth data
    await secureStoreSetItem("token", idToken);
    await secureStoreSetItem("refreshToken", refreshToken);
    await secureStoreSetItem(
      "tokenExpiry",
      (Date.now() + parseInt(expiresIn) * 1000).toString()
    );
    await secureStoreSetItem("uid", localId);

    // Update authentication token for immediate use
    setAxiosAccessToken(idToken);

    return idToken;
  } catch (error) {
    console.error("[FIREBASE-AUTH] Re-authentication failed:", error);
    safeLogError(error);
    return null;
  }
}

/**
 * Test Firebase authentication with current token
 */
export async function testFirebaseAuth(): Promise<{
  success: boolean;
  error?: string;
  token?: string;
  uid?: string;
}> {
  try {
    const token = await getValidIdToken();
    if (!token) {
      return { success: false, error: "No valid token available" };
    }

    // Test with server info endpoint (now requires auth)
    const response = await axios.get(
      `${BACKEND_URL}/server.json?auth=${token}`,
      {
        timeout: 10000,
      }
    );

    const uid = await secureStoreGetItem("uid");

    return {
      success: true,
      token: token.substring(0, 20) + "...",
      uid: uid || "unknown",
    };
  } catch (error) {
    console.error("[FIREBASE-AUTH] Auth test failed:", error);
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message,
    };
  }
}

/**
 * Get current authentication status
 */
export async function getAuthStatus(): Promise<{
  hasToken: boolean;
  tokenExpiry: number;
  isExpired: boolean;
  timeUntilExpiry: number;
}> {
  const token = await secureStoreGetItem("token");
  const tokenExpiry = await secureStoreGetItem("tokenExpiry");

  const now = Date.now();
  const expiry = tokenExpiry ? parseInt(tokenExpiry) : 0;
  const timeUntilExpiry = expiry - now;

  return {
    hasToken: !!token,
    tokenExpiry: expiry,
    isExpired: now >= expiry,
    timeUntilExpiry: Math.max(0, timeUntilExpiry),
  };
}

/**
 * Store authentication data after successful login
 */
export async function storeAuthData(authData: {
  idToken: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
}): Promise<void> {
  const { idToken, refreshToken, expiresIn, localId } = authData;

  // A new account: nothing started for the previous one may write now
  invalidateAuthSession();

  // Store all auth data
  await secureStoreSetItem("token", idToken);
  await secureStoreSetItem("refreshToken", refreshToken);
  await secureStoreSetItem(
    "tokenExpiry",
    (Date.now() + parseInt(expiresIn) * 1000).toString()
  );
  await secureStoreSetItem("uid", localId);

  // Update authentication token for immediate use
  setAxiosAccessToken(idToken);
}
