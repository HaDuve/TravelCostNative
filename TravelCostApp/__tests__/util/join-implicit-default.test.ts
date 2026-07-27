import {
  applyJoinImplicitDefaultCleanup,
  removeTripFromHistory,
  resolveJoinImplicitDefaultDecision,
} from "../../util/join-implicit-default";

describe("resolveJoinImplicitDefaultDecision", () => {
  it("promotes an implicit Active trip that has expenses when joining another trip", () => {
    expect(
      resolveJoinImplicitDefaultDecision({
        activeTripId: "implicit-1",
        isImplicitDefault: true,
        expenseCount: 3,
        joinedTripId: "shared-9",
        promotedTripName: "My Budget",
      })
    ).toEqual({
      action: "promote",
      tripid: "implicit-1",
      tripName: "My Budget",
    });
  });

  it("deletes an empty implicit Active trip when joining another trip", () => {
    expect(
      resolveJoinImplicitDefaultDecision({
        activeTripId: "implicit-1",
        isImplicitDefault: true,
        expenseCount: 0,
        joinedTripId: "shared-9",
        promotedTripName: "My Budget",
      })
    ).toEqual({
      action: "delete",
      tripid: "implicit-1",
    });
  });

  it("does nothing when the Active trip is not an implicit default", () => {
    expect(
      resolveJoinImplicitDefaultDecision({
        activeTripId: "named-1",
        isImplicitDefault: false,
        expenseCount: 2,
        joinedTripId: "shared-9",
        promotedTripName: "My Budget",
      })
    ).toEqual({ action: "none" });
  });

  it("does nothing when joining the same trip id", () => {
    expect(
      resolveJoinImplicitDefaultDecision({
        activeTripId: "implicit-1",
        isImplicitDefault: true,
        expenseCount: 0,
        joinedTripId: "implicit-1",
        promotedTripName: "My Budget",
      })
    ).toEqual({ action: "none" });
  });
});

describe("removeTripFromHistory", () => {
  it("removes the trip id from Trip history", () => {
    expect(removeTripFromHistory(["implicit-1", "shared-9"], "implicit-1")).toEqual(
      ["shared-9"]
    );
  });
});

describe("applyJoinImplicitDefaultCleanup", () => {
  it("auto-promotes the implicit trip to the localized My Budget name", async () => {
    const updateTrip = jest.fn(async () => undefined);
    const deleteTrip = jest.fn(async () => undefined);
    const storeTripHistory = jest.fn(async () => undefined);
    const setTripHistory = jest.fn();

    await applyJoinImplicitDefaultCleanup(
      {
        action: "promote",
        tripid: "implicit-1",
        tripName: "My Budget",
      },
      {
        uid: "u1",
        tripHistory: ["implicit-1", "shared-9"],
        updateTrip,
        deleteTrip,
        storeTripHistory,
        setTripHistory,
      }
    );

    expect(updateTrip).toHaveBeenCalledWith("implicit-1", {
      tripName: "My Budget",
      isImplicitDefault: false,
    });
    expect(deleteTrip).not.toHaveBeenCalled();
    expect(storeTripHistory).not.toHaveBeenCalled();
  });

  it("silently deletes an empty implicit trip and drops it from Trip history", async () => {
    const updateTrip = jest.fn(async () => undefined);
    const deleteTrip = jest.fn(async () => undefined);
    const storeTripHistory = jest.fn(async () => undefined);
    const setTripHistory = jest.fn();

    await applyJoinImplicitDefaultCleanup(
      { action: "delete", tripid: "implicit-1" },
      {
        uid: "u1",
        tripHistory: ["implicit-1", "shared-9"],
        updateTrip,
        deleteTrip,
        storeTripHistory,
        setTripHistory,
      }
    );

    expect(deleteTrip).toHaveBeenCalledWith("implicit-1");
    expect(storeTripHistory).toHaveBeenCalledWith("u1", ["shared-9"]);
    expect(setTripHistory).toHaveBeenCalledWith(["shared-9"]);
    expect(updateTrip).not.toHaveBeenCalled();
  });
});
