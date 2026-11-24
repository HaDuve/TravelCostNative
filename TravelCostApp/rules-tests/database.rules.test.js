/**
 * Emulator tests for database.rules.json (Realtime Database).
 *
 * Run with `pnpm test:rules` from TravelCostApp/. The script starts the
 * Realtime Database emulator through `firebase emulators:exec`, so Java must
 * be installed locally.
 *
 * Access is scoped by trip membership (`trips/<tripId>/members/<uid>`):
 * - Trip members read and write the whole trip (metadata, categories,
 *   Travellers, Expenses, push tokens).
 * - A signed-in non-member can read only the trip name, and can add only
 *   themselves to `members` (joining by invite link).
 * - Users read and write their own node; other users see only `userName`.
 * - `server/<config>` leaves are readable when signed in; `server/feedback`
 *   is create-only.
 * - Anonymous access is denied everywhere.
 */
const fs = require("fs");
const path = require("path");
const {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} = require("@firebase/rules-unit-testing");

const PROJECT_ID = "travelcostnative";
const RULES_PATH = path.join(__dirname, "..", "database.rules.json");

const [EMULATOR_HOST, EMULATOR_PORT] = (
  process.env.FIREBASE_DATABASE_EMULATOR_HOST || "127.0.0.1:9000"
).split(":");

const TRIP_ID = "trip-1";
const OTHER_TRIP_ID = "trip-2";
const MEMBER_UID = "user-a";
const CO_MEMBER_UID = "user-b";
const OUTSIDER_UID = "user-c";

const SEED = {
  server: {
    VEXO: "vexo-key",
    REVCAT_A: "revcat-key",
    feedback: {
      "fb-1": { uid: CO_MEMBER_UID, feedbackString: "Great app", timestamp: 1 },
    },
  },
  trips: {
    [TRIP_ID]: {
      tripName: "Lisbon",
      tripCurrency: "EUR",
      members: { [MEMBER_UID]: true, [CO_MEMBER_UID]: true },
      categories: { food: { name: "Food", icon: "fast-food" } },
      travellers: {
        [MEMBER_UID]: { uid: MEMBER_UID, userName: "Alex" },
        [CO_MEMBER_UID]: { uid: CO_MEMBER_UID, userName: "Bea" },
      },
      tokens: {
        "token-1": { token: { data: "ExponentPushToken[abc]" } },
      },
      [MEMBER_UID]: {
        expenses: {
          "exp-1": {
            id: "exp-1",
            description: "Dinner",
            amount: 42,
            serverTimestamp: 1700000000000,
          },
        },
      },
      [CO_MEMBER_UID]: {
        expenses: {
          "exp-2": { id: "exp-2", amount: 7, serverTimestamp: 1700000000001 },
        },
      },
    },
    [OTHER_TRIP_ID]: {
      tripName: "Porto",
      members: { [OUTSIDER_UID]: true },
      travellers: { [OUTSIDER_UID]: { uid: OUTSIDER_UID, userName: "Cem" } },
    },
  },
  users: {
    [MEMBER_UID]: {
      userName: "Alex",
      currentTrip: TRIP_ID,
      tripHistory: [TRIP_ID],
    },
    [CO_MEMBER_UID]: {
      userName: "Bea",
      currentTrip: TRIP_ID,
      tripHistory: [TRIP_ID],
    },
  },
};

/** Trip paths the app reads and writes through util/http.tsx. */
const TRIP_PATHS = [
  { name: "trip metadata field", path: `/trips/${TRIP_ID}/tripCurrency`, value: "USD" },
  { name: "trip categories", path: `/trips/${TRIP_ID}/categories`, value: { food: { name: "Food" } } },
  {
    name: "trip travellers",
    path: `/trips/${TRIP_ID}/travellers`,
    value: { [MEMBER_UID]: { uid: MEMBER_UID, userName: "Alex" } },
  },
  {
    name: "single traveller",
    path: `/trips/${TRIP_ID}/travellers/${MEMBER_UID}`,
    value: { uid: MEMBER_UID, userName: "Alex" },
  },
  {
    name: "own expenses",
    path: `/trips/${TRIP_ID}/${MEMBER_UID}/expenses`,
    value: { "exp-3": { id: "exp-3", amount: 10, serverTimestamp: 1 } },
  },
  {
    name: "single expense",
    path: `/trips/${TRIP_ID}/${MEMBER_UID}/expenses/exp-1`,
    value: { id: "exp-1", amount: 43, serverTimestamp: 1700000000002 },
  },
  {
    name: "co-member expenses",
    path: `/trips/${TRIP_ID}/${CO_MEMBER_UID}/expenses`,
    value: { "exp-4": { id: "exp-4", amount: 1, serverTimestamp: 2 } },
  },
  {
    name: "trip tokens",
    path: `/trips/${TRIP_ID}/tokens`,
    value: { "token-2": { token: { data: "ExponentPushToken[xyz]" } } },
  },
];

let testEnv;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    database: {
      host: EMULATOR_HOST,
      port: Number(EMULATOR_PORT),
      rules: fs.readFileSync(RULES_PATH, "utf8"),
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearDatabase();
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.database().ref("/").set(SEED);
  });
});

const anonymousDb = () => testEnv.unauthenticatedContext().database();
const dbAs = (uid) => testEnv.authenticatedContext(uid).database();
const memberDb = () => dbAs(MEMBER_UID);
const outsiderDb = () => dbAs(OUTSIDER_UID);

async function readAdmin(p) {
  let value;
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    value = (await ctx.database().ref(p).once("value")).val();
  });
  return value;
}

describe("anonymous access is denied", () => {
  const anonymousPaths = [
    "/",
    "/server",
    "/server/VEXO",
    "/server/feedback",
    "/trips",
    `/trips/${TRIP_ID}`,
    `/trips/${TRIP_ID}/tripName`,
    `/users/${MEMBER_UID}`,
    `/users/${MEMBER_UID}/userName`,
    ...TRIP_PATHS.map((p) => p.path),
  ];

  test.each(anonymousPaths)("denies anonymous read of %s", async (p) => {
    await assertFails(anonymousDb().ref(p).once("value"));
  });

  test.each(anonymousPaths)("denies anonymous write of %s", async (p) => {
    await assertFails(anonymousDb().ref(p).set({ x: 1 }));
  });

  test("denies anonymous trip creation, join and feedback", async () => {
    await assertFails(
      anonymousDb().ref("/trips").push({ tripName: "X", members: { anon: true } })
    );
    await assertFails(anonymousDb().ref(`/trips/${TRIP_ID}/members/anon`).set(true));
    await assertFails(
      anonymousDb().ref("/server/feedback").push({ uid: "anon", feedbackString: "x" })
    );
  });
});

describe("trip members", () => {
  test.each(TRIP_PATHS)("member reads $name", async ({ path: p }) => {
    await assertSucceeds(memberDb().ref(p).once("value"));
  });

  test.each(TRIP_PATHS)("member writes $name", async ({ path: p, value }) => {
    await assertSucceeds(memberDb().ref(p).set(value));
  });

  test("member reads the trip shallowly and in full", async () => {
    await assertSucceeds(memberDb().ref(`/trips/${TRIP_ID}`).once("value"));
  });

  test("member patches trip metadata and removes a Traveller", async () => {
    await assertSucceeds(
      memberDb().ref(`/trips/${TRIP_ID}`).update({ tripName: "Lisboa", totalBudget: "500" })
    );
    await assertSucceeds(
      memberDb().ref(`/trips/${TRIP_ID}/travellers/${CO_MEMBER_UID}`).remove()
    );
  });

  test("member runs the ordered Expenses query (serverTimestamp)", async () => {
    const snap = await assertSucceeds(
      memberDb()
        .ref(`/trips/${TRIP_ID}/${CO_MEMBER_UID}/expenses`)
        .orderByChild("serverTimestamp")
        .startAt(1700000000001)
        .once("value")
    );
    expect(Object.keys(snap.val())).toEqual(["exp-2"]);
  });

  test("member deletes the trip", async () => {
    await assertSucceeds(memberDb().ref(`/trips/${TRIP_ID}`).remove());
  });

  test("member cannot list all trips", async () => {
    await assertFails(memberDb().ref("/trips").once("value"));
    await assertFails(memberDb().ref("/").once("value"));
  });
});

describe("signed-in non-members", () => {
  test.each(TRIP_PATHS)("non-member cannot read $name", async ({ path: p }) => {
    await assertFails(outsiderDb().ref(p).once("value"));
  });

  test.each(TRIP_PATHS)("non-member cannot write $name", async ({ path: p, value }) => {
    await assertFails(outsiderDb().ref(p).set(value));
  });

  test("non-member cannot read the trip node or its members", async () => {
    await assertFails(outsiderDb().ref(`/trips/${TRIP_ID}`).once("value"));
    await assertFails(outsiderDb().ref(`/trips/${TRIP_ID}/members`).once("value"));
  });

  test("non-member cannot overwrite or delete the trip", async () => {
    await assertFails(
      outsiderDb().ref(`/trips/${TRIP_ID}`).set({ members: { [OUTSIDER_UID]: true } })
    );
    await assertFails(outsiderDb().ref(`/trips/${TRIP_ID}`).remove());
  });

  test("non-member reads only the trip name (join preview)", async () => {
    const snap = await assertSucceeds(
      outsiderDb().ref(`/trips/${TRIP_ID}/tripName`).once("value")
    );
    expect(snap.val()).toBe("Lisbon");
  });

  test("non-member cannot add or remove someone else's membership", async () => {
    await assertFails(
      outsiderDb().ref(`/trips/${TRIP_ID}/members/someone-else`).set(true)
    );
    await assertFails(
      outsiderDb().ref(`/trips/${TRIP_ID}/members/${MEMBER_UID}`).remove()
    );
  });

  test("membership value must be true", async () => {
    await assertFails(
      outsiderDb().ref(`/trips/${TRIP_ID}/members/${OUTSIDER_UID}`).set("yes")
    );
  });

  test("a membership write for a missing trip only creates the caller's own empty trip", async () => {
    // Allowed by the create rule (the new trip lists the caller as a member);
    // it gives no access to anyone else's data.
    await assertSucceeds(
      outsiderDb().ref(`/trips/no-such-trip/members/${OUTSIDER_UID}`).set(true)
    );
    expect(await readAdmin("/trips/no-such-trip")).toEqual({
      members: { [OUTSIDER_UID]: true },
    });
  });
});

describe("joining by invite", () => {
  test("a Traveller joins, adds themselves to the roster and sees the shared ledger", async () => {
    const db = outsiderDb();
    await assertSucceeds(db.ref(`/trips/${TRIP_ID}/tripName`).once("value"));
    await assertSucceeds(db.ref(`/trips/${TRIP_ID}/members/${OUTSIDER_UID}`).set(true));
    await assertSucceeds(
      db
        .ref(`/trips/${TRIP_ID}/travellers/${OUTSIDER_UID}`)
        .set({ uid: OUTSIDER_UID, userName: "Cem" })
    );

    const roster = await assertSucceeds(db.ref(`/trips/${TRIP_ID}/travellers`).once("value"));
    expect(Object.keys(roster.val()).sort()).toEqual([MEMBER_UID, CO_MEMBER_UID, OUTSIDER_UID].sort());

    const ledger = await assertSucceeds(
      db.ref(`/trips/${TRIP_ID}/${MEMBER_UID}/expenses`).once("value")
    );
    expect(ledger.val()).toHaveProperty("exp-1");

    await assertSucceeds(
      db
        .ref(`/trips/${TRIP_ID}/${OUTSIDER_UID}/expenses`)
        .push({ amount: 5, serverTimestamp: 3 })
    );
  });

  test("re-writing an existing membership succeeds (self-heal on trip load)", async () => {
    await assertSucceeds(memberDb().ref(`/trips/${TRIP_ID}/members/${MEMBER_UID}`).set(true));
  });
});

describe("trip creation", () => {
  test("creating a trip that lists the creator as a member succeeds", async () => {
    const ref = await assertSucceeds(
      memberDb().ref("/trips").push({ tripName: "New", members: { [MEMBER_UID]: true } })
    );
    await assertSucceeds(
      memberDb()
        .ref(`/trips/${ref.key}/travellers/${MEMBER_UID}`)
        .set({ uid: MEMBER_UID, userName: "Alex" })
    );
    await assertSucceeds(memberDb().ref(`/trips/${ref.key}`).once("value"));
  });

  test("creating a trip without the creator as a member is denied", async () => {
    await assertFails(memberDb().ref("/trips").push({ tripName: "New" }));
    await assertFails(
      memberDb().ref("/trips").push({ tripName: "New", members: { [CO_MEMBER_UID]: true } })
    );
  });
});

describe("users", () => {
  test("user reads and writes their own node", async () => {
    await assertSucceeds(memberDb().ref(`/users/${MEMBER_UID}`).once("value"));
    await assertSucceeds(
      memberDb().ref(`/users/${MEMBER_UID}`).update({ currentTrip: TRIP_ID })
    );
    await assertSucceeds(
      memberDb().ref(`/users/${MEMBER_UID}/tripHistory`).set([TRIP_ID])
    );
  });

  test("a new user creates their own node", async () => {
    await assertSucceeds(
      dbAs("user-new").ref("/users/user-new").set({ userName: "New" })
    );
  });

  test("user reads only userName of another user", async () => {
    const snap = await assertSucceeds(
      memberDb().ref(`/users/${CO_MEMBER_UID}/userName`).once("value")
    );
    expect(snap.val()).toBe("Bea");
    await assertFails(memberDb().ref(`/users/${CO_MEMBER_UID}`).once("value"));
    await assertFails(
      memberDb().ref(`/users/${CO_MEMBER_UID}/tripHistory`).once("value")
    );
    await assertFails(
      memberDb().ref(`/users/${CO_MEMBER_UID}/currentTrip`).once("value")
    );
  });

  test("user cannot write another user's node", async () => {
    await assertFails(memberDb().ref(`/users/${CO_MEMBER_UID}`).update({ userName: "X" }));
    await assertFails(memberDb().ref(`/users/${CO_MEMBER_UID}/userName`).set("X"));
    await assertFails(memberDb().ref(`/users/${CO_MEMBER_UID}`).remove());
  });

  test("user cannot list all users", async () => {
    await assertFails(memberDb().ref("/users").once("value"));
  });
});

describe("server", () => {
  test("signed-in user reads a config leaf", async () => {
    const snap = await assertSucceeds(memberDb().ref("/server/VEXO").once("value"));
    expect(snap.val()).toBe("vexo-key");
  });

  test("the whole server node and feedback are not readable", async () => {
    await assertFails(memberDb().ref("/server").once("value"));
    await assertFails(memberDb().ref("/server/feedback").once("value"));
    await assertFails(memberDb().ref("/server/feedback/fb-1").once("value"));
  });

  test("config is not writable", async () => {
    await assertFails(memberDb().ref("/server/VEXO").set("evil"));
    await assertFails(memberDb().ref("/server").set({}));
  });

  test("feedback is create-only, under the sender's own uid", async () => {
    await assertSucceeds(
      memberDb()
        .ref("/server/feedback")
        .push({ uid: MEMBER_UID, feedbackString: "Works", timestamp: 2 })
    );
    await assertFails(
      memberDb()
        .ref("/server/feedback")
        .push({ uid: CO_MEMBER_UID, feedbackString: "Spoof", timestamp: 2 })
    );
    await assertFails(
      memberDb().ref("/server/feedback/fb-1").set({ uid: MEMBER_UID, feedbackString: "x" })
    );
    await assertFails(memberDb().ref("/server/feedback/fb-1").remove());
    expect(await readAdmin("/server/feedback/fb-1/feedbackString")).toBe("Great app");
  });
});
