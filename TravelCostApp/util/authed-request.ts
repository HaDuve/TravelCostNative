import {
  getValidIdToken,
  hasStoredCredentials,
  refreshIdTokenAfterRejection,
} from "./firebase-auth";
import {
  AuthFailureError,
  isAuthRejection,
  logAuthFailure,
  notifyAuthLost,
} from "./auth-failure";

async function failWithoutToken(context: string, cause?: unknown): Promise<never> {
  logAuthFailure(`${context}: no valid ID token`, cause);
  if (!(await hasStoredCredentials())) {
    notifyAuthLost();
  }
  throw new AuthFailureError(context);
}

/**
 * Runs an authenticated RTDB request. A missing token throws an AuthFailure
 * (the caller decides whether to queue). A 401/403 gets one token refresh and
 * one retry; a second rejection throws an AuthFailure.
 */
export async function withAuthToken<T>(
  context: string,
  send: (authToken: string) => Promise<T>
): Promise<T> {
  const authToken = await getValidIdToken();
  if (!authToken) return failWithoutToken(context);

  try {
    return await send(authToken);
  } catch (error) {
    if (!isAuthRejection(error)) throw error;

    const refreshedToken = await refreshIdTokenAfterRejection(authToken);
    if (!refreshedToken) return failWithoutToken(context, error);

    try {
      return await send(refreshedToken);
    } catch (retryError) {
      if (!isAuthRejection(retryError)) throw retryError;
      logAuthFailure(`${context}: rejected again after token refresh`, retryError);
      throw new AuthFailureError(context);
    }
  }
}
