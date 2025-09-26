import axios from "axios";
import { setMMKVString } from "../store/mmkv";
import {
  secureStoreGetItem,
  secureStoreSetItem,
} from "../store/secure-storage";
import safeLogError from "./error";

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
 * Refresh Firebase ID token using refresh token
 */
async function refreshIdToken(refreshToken: string): Promise<string | null> {
  try {
    const url = `https://securetoken.googleapis.com/v1/token?key=${API_KEY}`;
    const response = await axios.post(url, {
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    });

    const { access_token, expires_in } = response.data;

    // Store the new token and expiration
    await secureStoreSetItem("token", access_token);
    await secureStoreSetItem(
      "tokenExpiry",
      (Date.now() + parseInt(expires_in) * 1000).toString()
    );

    // Update QPAR for immediate use
    setAxiosAccessToken(access_token);

    console.log("[FIREBASE-AUTH] Token refreshed successfully");
    return access_token;
  } catch (error) {
    console.error("[FIREBASE-AUTH] Failed to refresh token:", error);
    safeLogError(error);
    return null;
  }
}

/**
 * Get valid Firebase ID token, refreshing if necessary
 */
export async function getValidIdToken(): Promise<string | null> {
  try {
    const currentToken = await secureStoreGetItem("token");
    const tokenExpiry = await secureStoreGetItem("tokenExpiry");
    const refreshToken = await secureStoreGetItem("refreshToken");

    if (!currentToken) {
      console.warn("[FIREBASE-AUTH] No token found");
      return null;
    }

    // Check if token is expired (with 5 minute buffer)
    const now = Date.now();
    const expiryTime = tokenExpiry ? parseInt(tokenExpiry) : 0;
    const bufferTime = 5 * 60 * 1000; // 5 minutes

    if (now >= expiryTime - bufferTime) {
      console.log(
        "[FIREBASE-AUTH] Token expired or expiring soon, refreshing..."
      );

      if (refreshToken) {
        const newToken = await refreshIdToken(refreshToken);
        if (newToken) {
          return newToken;
        }
      }

      // If refresh failed, try to re-authenticate
      console.log(
        "[FIREBASE-AUTH] Refresh failed, attempting re-authentication..."
      );
      return await reAuthenticate();
    }

    return currentToken;
  } catch (error) {
    console.error("[FIREBASE-AUTH] Error getting valid token:", error);
    safeLogError(error);
    return null;
  }
}

/**
 * Re-authenticate using stored email/password
 */
async function reAuthenticate(): Promise<string | null> {
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

    // Store all auth data
    await secureStoreSetItem("token", idToken);
    await secureStoreSetItem("refreshToken", refreshToken);
    await secureStoreSetItem(
      "tokenExpiry",
      (Date.now() + parseInt(expiresIn) * 1000).toString()
    );
    await secureStoreSetItem("uid", localId);

    // Update QPAR for immediate use
    setAxiosAccessToken(idToken);

    console.log("[FIREBASE-AUTH] Re-authentication successful");
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

    // Test with server info endpoint
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

  // Store all auth data
  await secureStoreSetItem("token", idToken);
  await secureStoreSetItem("refreshToken", refreshToken);
  await secureStoreSetItem(
    "tokenExpiry",
    (Date.now() + parseInt(expiresIn) * 1000).toString()
  );
  await secureStoreSetItem("uid", localId);

  // Update QPAR for immediate use
  setAxiosAccessToken(idToken);

  console.log("[FIREBASE-AUTH] Auth data stored successfully");
}

// Import setAxiosAccessToken from http.tsx
function setAxiosAccessToken(token: string) {
  if (!token || token?.length < 2) {
    console.error("[FIREBASE-AUTH] Invalid token provided");
    setMMKVString("QPAR", "");
    return;
  }
  const qpar = `?auth=${token}`;
  console.log(
    "[FIREBASE-AUTH] Setting authentication token:",
    qpar.substring(0, 20) + "..."
  );
  setMMKVString("QPAR", qpar);
}
