jest.mock("../../util/http", () => ({
  removeTravelerFromTrip: jest.fn(async () => ({ status: 200 })),
  removeTripFromHistory: jest.fn(async () => undefined),
}));

import { leaveTrip } from "../../util/leave-trip";
import {
  removeTravelerFromTrip,
  removeTripFromHistory,
} from "../../util/http";

const removeTravelerFromTripMock = removeTravelerFromTrip as jest.MockedFunction<
  typeof removeTravelerFromTrip
>;
const removeTripFromHistoryMock = removeTripFromHistory as jest.MockedFunction<
  typeof removeTripFromHistory
>;

describe("leaveTrip plain leave", () => {
  beforeEach(() => {
    removeTravelerFromTripMock.mockClear();
    removeTripFromHistoryMock.mockClear();
  });

  it("loads the Traveller roster before planning so a non-active leave can run", async () => {
    const removeFromTripHistoryLocal = jest.fn();
    const getTravellers = jest.fn(async () => [
      { uid: "u1", userName: "Alice" },
      { uid: "u2", userName: "Bob" },
    ]);

    const result = await leaveTrip("trip-b", {
      uid: "u1",
      tripHistory: ["trip-a", "trip-b"],
      activeTripId: "trip-a",
      getTravellers,
      removeFromTripHistoryLocal,
    });

    expect(getTravellers).toHaveBeenCalledWith("trip-b");
    expect(result.performed).toBe(true);
    expect(result.mode).toBe("leave");
    expect(removeTravelerFromTripMock).toHaveBeenCalledWith("trip-b", "u1");
    expect(removeTripFromHistoryMock).toHaveBeenCalledWith("u1", "trip-b");
    expect(removeFromTripHistoryLocal).toHaveBeenCalledWith("trip-b");
  });

  it("does not write when the planner refuses plain leave", async () => {
    const removeFromTripHistoryLocal = jest.fn();
    const getTravellers = jest.fn(async () => [
      { uid: "u1", userName: "Alice" },
    ]);

    const result = await leaveTrip("trip-b", {
      uid: "u1",
      tripHistory: ["trip-a", "trip-b"],
      activeTripId: "trip-a",
      getTravellers,
      removeFromTripHistoryLocal,
    });

    expect(result.performed).toBe(false);
    expect(result.mode).toBe("cascadeDelete");
    expect(removeTravelerFromTripMock).not.toHaveBeenCalled();
    expect(removeTripFromHistoryMock).not.toHaveBeenCalled();
    expect(removeFromTripHistoryLocal).not.toHaveBeenCalled();
  });
});
