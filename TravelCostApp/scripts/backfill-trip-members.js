#!/usr/bin/env node
/**
 * Backfill `trips/<tripId>/members/<uid> = true` for existing trips (#426).
 *
 * The trip-membership database rules only let uids listed under a trip's
 * `members` read or write that trip. Trips created before the rules have no
 * `members` node, so this builds one from what the data already says about
 * who belongs to a trip:
 *   - Traveller roster entries with a uid (keyed by uid or by a legacy push key)
 *   - uids that own an Expense node (`trips/<tripId>/<uid>/expenses`)
 *   - users whose `tripHistory` or `currentTrip` names the trip
 *
 * Usage (from TravelCostApp/, signed in with `firebase login`):
 *   firebase database:get /users > /tmp/users.json
 *   firebase database:get /trips > /tmp/trips.json
 *   node scripts/backfill-trip-members.js /tmp/users.json /tmp/trips.json > /tmp/members-update.json
 *   firebase database:update / /tmp/members-update.json
 *
 * The output is a multi-path update ({"trips/<tripId>/members/<uid>": true}).
 * It only adds memberships and never removes any, so it is safe to re-run.
 * A summary goes to stderr.
 */
const fs = require("fs");

/** Trip children that are trip metadata, never a uid owning Expenses. */
const RESERVED_TRIP_KEYS = new Set([
  "members",
  "travellers",
  "tokens",
  "categories",
  "tripName",
]);

/** RTDB keys cannot contain these characters; skip anything that does. */
const INVALID_KEY = /[.#$[\]/]/;

function isValidKey(key) {
  return typeof key === "string" && key.length > 0 && !INVALID_KEY.test(key);
}

function travellerUids(travellers) {
  const uids = [];
  if (!travellers || typeof travellers !== "object") return uids;
  for (const entry of Object.values(travellers)) {
    if (entry && typeof entry === "object" && typeof entry.uid === "string") {
      uids.push(entry.uid);
    }
  }
  return uids;
}

function expenseOwnerUids(trip) {
  const uids = [];
  for (const [key, value] of Object.entries(trip)) {
    if (RESERVED_TRIP_KEYS.has(key)) continue;
    if (value && typeof value === "object" && "expenses" in value) {
      uids.push(key);
    }
  }
  return uids;
}

function historyTripIds(user) {
  const ids = [];
  if (!user || typeof user !== "object") return ids;
  if (typeof user.currentTrip === "string") ids.push(user.currentTrip);
  const history = user.tripHistory;
  if (!history || typeof history !== "object") return ids;
  for (const [key, value] of Object.entries(history)) {
    if (typeof value === "string") ids.push(value);
    else if (value && typeof value === "object") {
      if (typeof value.tripid === "string") ids.push(value.tripid);
      else ids.push(key);
    }
  }
  return ids;
}

/**
 * @param {object|null} users the `/users` node
 * @param {object|null} trips the `/trips` node
 * @returns {{ update: Record<string, true>, stats: object }}
 */
function buildTripMembersUpdate(users, trips) {
  const update = {};
  const stats = {
    trips: 0,
    tripsWithoutMembers: 0,
    added: 0,
    alreadyMembers: 0,
    skippedInvalid: 0,
  };
  if (!trips || typeof trips !== "object") return { update, stats };

  const candidates = new Map();
  const addCandidate = (tripId, uid) => {
    if (!Object.prototype.hasOwnProperty.call(trips, tripId)) return;
    if (!isValidKey(tripId) || !isValidKey(uid)) {
      stats.skippedInvalid += 1;
      return;
    }
    if (!candidates.has(tripId)) candidates.set(tripId, new Set());
    candidates.get(tripId).add(uid);
  };

  for (const [tripId, trip] of Object.entries(trips)) {
    stats.trips += 1;
    if (!trip || typeof trip !== "object") continue;
    for (const uid of travellerUids(trip.travellers)) addCandidate(tripId, uid);
    for (const uid of expenseOwnerUids(trip)) addCandidate(tripId, uid);
  }

  if (users && typeof users === "object") {
    for (const [uid, user] of Object.entries(users)) {
      for (const tripId of historyTripIds(user)) addCandidate(tripId, uid);
    }
  }

  for (const [tripId, uids] of candidates) {
    const existing = (trips[tripId] && trips[tripId].members) || {};
    if (Object.keys(existing).length === 0) stats.tripsWithoutMembers += 1;
    for (const uid of uids) {
      if (existing[uid] === true) {
        stats.alreadyMembers += 1;
        continue;
      }
      update[`trips/${tripId}/members/${uid}`] = true;
      stats.added += 1;
    }
  }

  return { update, stats };
}

function readJson(path) {
  const text = fs.readFileSync(path, "utf8").trim();
  return text.length === 0 ? null : JSON.parse(text);
}

if (require.main === module) {
  const [usersPath, tripsPath] = process.argv.slice(2);
  if (!usersPath || !tripsPath) {
    console.error(
      "Usage: node scripts/backfill-trip-members.js <users.json> <trips.json>"
    );
    process.exit(1);
  }
  const { update, stats } = buildTripMembersUpdate(
    readJson(usersPath),
    readJson(tripsPath)
  );
  process.stdout.write(JSON.stringify(update, null, 2) + "\n");
  console.error(JSON.stringify(stats));
}

module.exports = { buildTripMembersUpdate };
