# Realtime Database rules

`database.rules.json` is the only source of the live RTDB rules. Never edit rules in the Firebase console.

## Who can access what

| Path | Read | Write |
|---|---|---|
| `trips/<tripId>` (metadata, categories, Travellers, Expenses, tokens) | members | members |
| `trips/<tripId>/tripName` | any signed-in user (join preview) | members |
| `trips/<tripId>/members/<uid>` | members | members; any signed-in user can add **their own** uid with `true` (joining by invite) |
| new `trips/<pushId>` | n/a | signed-in user, if the new trip lists them under `members` |
| `users/<uid>` | that user | that user |
| `users/<uid>/userName` | any signed-in user | that user |
| `server/<configKey>` | any signed-in user | nobody (console/admin only) |
| `server/feedback/<id>` | nobody | create only, with `uid` equal to the sender |
| `/`, `/trips`, `/users`, `/server` as a whole | nobody | nobody |

A trip member is a uid with `trips/<tripId>/members/<uid> = true`. The trip id works as the invite: anyone signed in who holds it can add themselves. The app writes membership when it:
- creates a trip (`storeTrip` sends `members` in the create request),
- joins a trip (`JoinTrip` calls `ensureTripMembership` before any trip read),
- loads a trip (`fetchTrip` calls `ensureTripMembership`, once per app session). This self-heals Travellers whose membership predates the `members` index.

## Commands

`firebase-tools` is not an app dependency. The scripts run a pinned version with `pnpm dlx firebase-tools@15.5.1`. Use the same for the manual commands below (`firebase …` stands for `pnpm dlx firebase-tools@15.5.1 …`, after `pnpm dlx firebase-tools@15.5.1 login`). The rules tests also need Java 21+.

From `TravelCostApp/`:

```bash
pnpm test:rules
```

```bash
pnpm deploy:rules
```

To roll back, restore the previous rules file and deploy it:

```bash
git checkout <previous-commit> -- database.rules.json && pnpm deploy:rules
```

Older app versions read `server` as a whole. After the deploy that read fails, and they fall back to the config keys they have already cached.

## Rolling out trip-membership rules (#426)

1. Ship the app update (OTA) that writes `members`. Wait until it has reached most active devices. Older app versions do not write membership. After the deploy, they can still use trips that have a membership, but they cannot create or join trips.
2. Backfill `members` for existing trips from Traveller rosters, Expense owners and users' trip history:
   ```bash
   firebase database:get /users > /tmp/users.json
   ```
   ```bash
   firebase database:get /trips > /tmp/trips.json
   ```
   ```bash
   node scripts/backfill-trip-members.js /tmp/users.json /tmp/trips.json > /tmp/members-update.json
   ```
   Review the summary on stderr and spot-check the output, then apply:
   ```bash
   firebase database:update / /tmp/members-update.json
   ```
   The backfill only adds memberships, so it is safe to re-run just before the deploy.
3. Deploy with `pnpm deploy:rules`.
4. Watch it: run `firebase database:profile` and check the Permission Denied counts and the `[AUTH-FAILURE]` logs for 48 h.
5. If Travellers are locked out, roll back (see above), re-run the backfill, and investigate.
