/**
 * Retry gate for the App online-setup tick. Each attempt runs a full Active
 * trip activation (every Traveller's expenses), so failures back off
 * exponentially instead of re-downloading the ledger on every tick.
 */
export const ONLINE_SETUP_BASE_BACKOFF_MS = 30_000;
export const ONLINE_SETUP_MAX_BACKOFF_MS = 30 * 60_000;

export type OnlineSetupBackoff = { failures: number; nextAttemptAt: number };

export const initialOnlineSetupBackoff = (): OnlineSetupBackoff => ({
  failures: 0,
  nextAttemptAt: 0,
});

export function canAttemptOnlineSetup(
  state: OnlineSetupBackoff,
  now: number
): boolean {
  return now >= state.nextAttemptAt;
}

export function recordOnlineSetupFailure(
  state: OnlineSetupBackoff,
  now: number
): OnlineSetupBackoff {
  const failures = state.failures + 1;
  const delay = Math.min(
    ONLINE_SETUP_BASE_BACKOFF_MS * 2 ** (failures - 1),
    ONLINE_SETUP_MAX_BACKOFF_MS
  );
  return { failures, nextAttemptAt: now + delay };
}
