import { isAuthFailureError } from "./auth-failure";

const DEFAULT_DELAYS_MS = [1000, 2000, 4000];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetries<T>(
  fn: () => Promise<T>,
  options?: { maxAttempts?: number; delaysMs?: number[] },
): Promise<T> {
  const maxAttempts = options?.maxAttempts ?? 3;
  const delaysMs = options?.delaysMs ?? DEFAULT_DELAYS_MS;
  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      // Retrying cannot fix a missing or rejected token: fail fast so the
      // caller can queue the item.
      if (isAuthFailureError(error)) throw error;
      lastError = error;
      if (attempt < maxAttempts - 1) {
        await sleep(delaysMs[attempt] ?? delaysMs[delaysMs.length - 1]);
      }
    }
  }

  throw lastError;
}
