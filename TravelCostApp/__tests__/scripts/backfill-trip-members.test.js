const { buildTripMembersUpdate } = require("../../scripts/backfill-trip-members");

describe("buildTripMembersUpdate", () => {
  test("adds Travellers keyed by uid and by legacy push key", () => {
    const trips = {
      t1: {
        tripName: "Lisbon",
        travellers: {
          alice: { uid: "alice", userName: "Alice" },
          "-Nlegacy": { uid: "bob", userName: "Bob" },
          "-Nnameonly": { userName: "Carol" },
        },
      },
    };
    const { update } = buildTripMembersUpdate(null, trips);
    expect(update).toEqual({
      "trips/t1/members/alice": true,
      "trips/t1/members/bob": true,
    });
  });

  test("adds Expense owners, but not metadata keys", () => {
    const trips = {
      t1: {
        tripName: "Lisbon",
        categories: "[]",
        tokens: { k: { token: {} } },
        dave: { expenses: { e1: { price: 1 } } },
      },
    };
    const { update } = buildTripMembersUpdate(null, trips);
    expect(update).toEqual({ "trips/t1/members/dave": true });
  });

  test("adds users whose tripHistory or currentTrip names the trip", () => {
    const trips = { t1: { tripName: "A" }, t2: { tripName: "B" }, t3: {} };
    const users = {
      eve: { tripHistory: ["t1", "missing"], currentTrip: "t2" },
      frank: { tripHistory: { "-k": "t2", t3: { tripid: "t3" } } },
    };
    const { update } = buildTripMembersUpdate(users, trips);
    expect(update).toEqual({
      "trips/t1/members/eve": true,
      "trips/t2/members/eve": true,
      "trips/t2/members/frank": true,
      "trips/t3/members/frank": true,
    });
  });

  test("skips existing members and invalid keys", () => {
    const trips = {
      t1: {
        members: { alice: true },
        travellers: {
          alice: { uid: "alice", userName: "Alice" },
          x: { uid: "bad.uid", userName: "X" },
        },
      },
    };
    const { update, stats } = buildTripMembersUpdate(null, trips);
    expect(update).toEqual({});
    expect(stats).toMatchObject({ alreadyMembers: 1, skippedInvalid: 1 });
  });

  test("returns an empty update for an empty database", () => {
    expect(buildTripMembersUpdate(null, null).update).toEqual({});
  });
});
