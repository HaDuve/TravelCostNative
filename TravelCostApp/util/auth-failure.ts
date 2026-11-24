import safeLogError, { getErrorMessage } from "./error";

/** Log tag for every auth failure, so a rules rollout can be monitored by tag. */
export const AUTH_FAILURE_TAG = "[AUTH-FAILURE]";

/**
 * Thrown when a request cannot be authenticated: no valid ID token, or RTDB
 * still answers 401/403 after one token refresh and one retry.
 */
export class AuthFailureError extends Error {
  constructor(context: string) {
    super(`${AUTH_FAILURE_TAG} ${context}`);
    this.name = "AuthFailureError";
  }
}

export function isAuthFailureError(error: unknown): error is AuthFailureError {
  return (
    error instanceof AuthFailureError ||
    (error as { name?: string })?.name === "AuthFailureError"
  );
}

/** True for an RTDB/Token response rejected as unauthenticated or forbidden. */
export function isAuthRejection(error: unknown): boolean {
  const status = (error as { response?: { status?: number } })?.response
    ?.status;
  return status === 401 || status === 403;
}

export function logAuthFailure(context: string, cause?: unknown) {
  const detail = cause ? `: ${getErrorMessage(cause)}` : "";
  safeLogError(`${AUTH_FAILURE_TAG} ${context}${detail}`);
}

let authLostHandler: (() => void) | null = null;

/** The app registers this to send the Traveller to the login screen. */
export function setAuthLostHandler(handler: (() => void) | null) {
  authLostHandler = handler;
}

/** Called when no ID token is available and no stored credentials remain. */
export function notifyAuthLost() {
  try {
    authLostHandler?.();
  } catch (error) {
    safeLogError(error);
  }
}
