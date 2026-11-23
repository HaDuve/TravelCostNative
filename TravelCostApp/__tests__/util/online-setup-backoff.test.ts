import {
  canAttemptOnlineSetup,
  initialOnlineSetupBackoff,
  ONLINE_SETUP_MAX_BACKOFF_MS,
  recordOnlineSetupFailure,
} from "../../util/online-setup-backoff";

describe("online setup backoff", () => {
  it("allows the first attempt immediately", () => {
    expect(canAttemptOnlineSetup(initialOnlineSetupBackoff(), 0)).toBe(true);
  });

  it("doubles the wait after each failure, capped", () => {
    let state = initialOnlineSetupBackoff();
    const waits: number[] = [];
    for (let i = 0; i < 10; i++) {
      state = recordOnlineSetupFailure(state, 0);
      waits.push(state.nextAttemptAt);
    }
    expect(waits.slice(0, 3)).toEqual([30_000, 60_000, 120_000]);
    expect(waits[9]).toBe(ONLINE_SETUP_MAX_BACKOFF_MS);
    expect(canAttemptOnlineSetup(state, ONLINE_SETUP_MAX_BACKOFF_MS - 1)).toBe(false);
    expect(canAttemptOnlineSetup(state, ONLINE_SETUP_MAX_BACKOFF_MS)).toBe(true);
  });
});
