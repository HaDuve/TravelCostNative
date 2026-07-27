import { planTripLeave } from "../../util/plan-trip-leave";

describe("planTripLeave", () => {
  const base = {
    tripHistory: ["trip-a", "trip-b"],
    roster: [
      { uid: "u1", userName: "Alice" },
      { uid: "u2", userName: "Bob" },
    ],
    openBalances: [] as unknown[],
    activeTripId: "trip-a",
    tripid: "trip-b",
  };

  it("forbids leaving when Trip history has only one trip", () => {
    const plan = planTripLeave({
      ...base,
      tripHistory: ["trip-a"],
      tripid: "trip-a",
      activeTripId: "trip-a",
    });

    expect(plan.allowed).toBe(false);
  });

  it("allows plain leave when other Travellers remain on a non-active trip", () => {
    const plan = planTripLeave(base);

    expect(plan).toEqual({
      allowed: true,
      mode: "leave",
      nextActiveTripId: null,
      warnings: [],
    });
  });

  it("chooses cascadeDelete when the leaver is the last Traveller on the roster", () => {
    const plan = planTripLeave({
      ...base,
      roster: [{ uid: "u1" }],
    });

    expect(plan.allowed).toBe(true);
    expect(plan.mode).toBe("cascadeDelete");
    expect(plan.warnings).toContain("permanentDelete");
  });

  it("promotes the first remaining Trip history id when leaving the Active trip", () => {
    const plan = planTripLeave({
      ...base,
      tripid: "trip-a",
      activeTripId: "trip-a",
      tripHistory: ["trip-a", "trip-b", "trip-c"],
    });

    expect(plan.allowed).toBe(true);
    expect(plan.nextActiveTripId).toBe("trip-b");
  });

  it("does not propose a new Active trip when leaving a non-active trip", () => {
    const plan = planTripLeave({
      ...base,
      tripid: "trip-c",
      activeTripId: "trip-a",
      tripHistory: ["trip-a", "trip-b", "trip-c"],
    });

    expect(plan.nextActiveTripId).toBeNull();
  });

  it("warns about open Balances when any are present", () => {
    const plan = planTripLeave({
      ...base,
      openBalances: [{ from: "u1", to: "u2", amount: 12 }],
    });

    expect(plan.warnings).toContain("openBalances");
  });

  it("omits openBalances warning when there are none", () => {
    const plan = planTripLeave({
      ...base,
      openBalances: [],
    });

    expect(plan.warnings).not.toContain("openBalances");
  });

  it("can combine permanentDelete and openBalances warnings on cascade leave", () => {
    const plan = planTripLeave({
      ...base,
      roster: [{ uid: "u1" }],
      openBalances: [{ from: "u1", to: "u2", amount: 5 }],
    });

    expect(plan.mode).toBe("cascadeDelete");
    expect(plan.warnings).toEqual(
      expect.arrayContaining(["permanentDelete", "openBalances"])
    );
  });
});
