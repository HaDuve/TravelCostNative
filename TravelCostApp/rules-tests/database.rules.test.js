/**
 * Emulator tests for database.rules.json (Realtime Database).
 *
 * Run with `pnpm test:rules` from TravelCostApp/. The script starts the
 * Realtime Database emulator through `firebase emulators:exec`, so Java must
 * be installed locally.
 *
 * Every path the app reads or writes through util/http.tsx (BACKEND_URL) and
 * util/firebase-auth.ts is covered: signed-in access is allowed, anonymous
 * access is denied.
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
const SIGNED_IN_UID = "user-a";
const OTHER_UID = "user-b";

const SEED = {
  server: {
    version: "1.3.005",
    feedback: {
      "fb-1": { feedbackString: "Great app", createdAt: 1700000000000 },
    },
  },
  trips: {
    [TRIP_ID]: {
      tripName: "Lisbon",
      categories: { food: { name: "Food", icon: "fast-food" } },
      travellers: {
        [SIGNED_IN_UID]: { uid: SIGNED_IN_UID, name: "Alex" },
      },
      tokens: {
        "token-1": { token: { data: "ExponentPushToken[abc]" } },
      },
      [SIGNED_IN_UID]: {
        expenses: {
          "exp-1": {
            id: "exp-1",
            name: "Dinner",
            price: 42,
            serverTimestamp: 1700000000000,
          },
        },
      },
    },
  },
  users: {
    [SIGNED_IN_UID]: {
      name: "Alex",
      tripHistory: { [TRIP_ID]: { tripid: TRIP_ID } },
    },
  },
};

/**
 * Every RTDB path the app touches. `value` is the payload the app writes at
 * that path; `read` is the path the app reads (may be a query for expenses).
 */
const APP_PATHS = [
  {
    name: "root",
    path: "/",
    value: SEED,
  },
  {
    name: "server",
    path: "/server",
    value: { version: "1.3.005" },
  },
  {
    name: "server feedback",
    path: "/server/feedback",
    value: { "fb-2": { feedbackString: "Nice", createdAt: 1 } },
  },
  {
    name: "trips list",
    path: "/trips",
    value: { [TRIP_ID]: { tripName: "Lisbon" } },
  },
  {
    name: "trip metadata",
    path: `/trips/${TRIP_ID}`,
    value: { tripName: "Lisbon" },
  },
  {
    name: "trip name",
    path: `/trips/${TRIP_ID}/tripName`,
    value: "Lisbon",
  },
  {
    name: "trip categories",
    path: `/trips/${TRIP_ID}/categories`,
    value: { food: { name: "Food", icon: "fast-food" } },
  },
  {
    name: "trip travellers",
    path: `/trips/${TRIP_ID}/travellers`,
    value: { [SIGNED_IN_UID]: { uid: SIGNED_IN_UID, name: "Alex" } },
  },
  {
    name: "single traveller",
    path: `/trips/${TRIP_ID}/travellers/${SIGNED_IN_UID}`,
    value: { uid: SIGNED_IN_UID, name: "Alex" },
  },
  {
    name: "trip expenses",
    path: `/trips/${TRIP_ID}/${SIGNED_IN_UID}/expenses`,
    value: { "exp-2": { id: "exp-2", price: 10, serverTimestamp: 1 } },
  },
  {
    name: "single expense",
    path: `/trips/${TRIP_ID}/${SIGNED_IN_UID}/expenses/exp-1`,
    value: { id: "exp-1", price: 42, serverTimestamp: 1700000000000 },
  },
  {
    name: "trip tokens",
    path: `/trips/${TRIP_ID}/tokens`,
    value: { "token-2": { token: { data: "ExponentPushToken[xyz]" } } },
  },
  {
    name: "single trip token",
    path: `/trips/${TRIP_ID}/tokens/token-1`,
    value: { token: { data: "ExponentPushToken[abc]" } },
  },
  {
    name: "user",
    path: `/users/${SIGNED_IN_UID}`,
    value: { name: "Alex" },
  },
  {
    name: "user trip history",
    path: `/users/${SIGNED_IN_UID}/tripHistory`,
    value: { [TRIP_ID]: { tripid: TRIP_ID } },
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
const signedInDb = () => testEnv.authenticatedContext(SIGNED_IN_UID).database();

describe("database.rules.json: anonymous access is denied", () => {
  test.each(APP_PATHS)("denies anonymous read of $name", async ({ path: p }) => {
    await assertFails(anonymousDb().ref(p).once("value"));
  });

  test.each(APP_PATHS)("denies anonymous write of $name", async ({ path: p, value }) => {
    await assertFails(anonymousDb().ref(p).set(value));
  });

  test("denies anonymous query of the ordered expenses (serverTimestamp)", async () => {
    await assertFails(
      anonymousDb()
        .ref(`/trips/${TRIP_ID}/${SIGNED_IN_UID}/expenses`)
        .orderByChild("serverTimestamp")
        .startAt(0)
        .once("value")
    );
  });

  test("denies anonymous update and remove of an expense", async () => {
    const expenseRef = anonymousDb().ref(
      `/trips/${TRIP_ID}/${SIGNED_IN_UID}/expenses/exp-1`
    );
    await assertFails(expenseRef.update({ price: 1 }));
    await assertFails(expenseRef.remove());
  });

  test("anonymous write does not change the seeded data", async () => {
    await assertFails(anonymousDb().ref("/").set({}));
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const snap = await ctx.database().ref("/server/version").once("value");
      expect(snap.val()).toBe("1.3.005");
    });
  });
});

describe("database.rules.json: signed-in access is allowed", () => {
  test.each(APP_PATHS)("allows signed-in read of $name", async ({ path: p }) => {
    await assertSucceeds(signedInDb().ref(p).once("value"));
  });

  test.each(APP_PATHS)("allows signed-in write of $name", async ({ path: p, value }) => {
    await assertSucceeds(signedInDb().ref(p).set(value));
  });

  test("allows signed-in ordered expenses query (serverTimestamp)", async () => {
    const snap = await assertSucceeds(
      signedInDb()
        .ref(`/trips/${TRIP_ID}/${SIGNED_IN_UID}/expenses`)
        .orderByChild("serverTimestamp")
        .startAt(1)
        .once("value")
    );
    expect(snap.val()).toEqual({
      "exp-1": expect.objectContaining({ price: 42 }),
    });
  });

  test("allows signed-in feedback push under server/feedback", async () => {
    await assertSucceeds(
      signedInDb()
        .ref("/server/feedback")
        .push({ feedbackString: "Works", createdAt: 2 })
    );
  });

  test("allows signed-in access to another user's expenses", async () => {
    // Trip members read each other's expense nodes; rules are auth-only.
    await assertSucceeds(
      signedInDb().ref(`/trips/${TRIP_ID}/${OTHER_UID}/expenses`).once("value")
    );
  });
});
