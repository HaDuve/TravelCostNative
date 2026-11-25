# Realtime Database rules

`database.rules.json` is the only source of the live RTDB rules. Never edit rules in the Firebase console.

## Who can access what

| Path | Read | Write |
|---|---|---|
| `trips/<tripId>` (metadata, categories, Travellers, Expenses, tokens) | members | members |
| `trips/<tripId>/tripName` | any signed-in user (join preview) | members |
| `trips/<tripId>/members/<uid>` | members | members; any signed-in user can add **their own** uid with `true` (joining by invite) |
| new `trips/<pushId>` | n/a | signed-in user, if the new trip lists them under `members` |
| `splitHistory/<tripId>/<entryId>` (Split Summary change history) | members of `<tripId>` | members, **create only**: the entry must be new, authored by the caller (`byUid`), keyed by its own `id`, with a valid `kind`; an entry may carry `range` (`rangeId`, `startDate`, `endDate`) and `days` (per-day lines of a grouped **Ranged expense** change), both validated for shape |
| `users/<uid>` | that user | that user |
| `users/<uid>/userName` | any signed-in user | that user |
| `server/<configKey>` | any signed-in user | nobody (console/admin only) |
| `server/feedback/<id>` | nobody | create only, with `uid` equal to the sender |
| `/`, `/trips`, `/users`, `/server`, `/splitHistory` as a whole | nobody | nobody |

Split history sits beside `trips`, not under it, because the member write on `trips/<tripId>` cascades to everything below and could not be made append-only. Entries are never edited or deleted. Deleting a trip leaves its history behind, unreadable because the trip (and so its `members`) is gone.

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

To roll back to the rules from before #426 (signed-in only), run `scripts/rtdb-rollout.sh rollback`. It deploys that rules file from git without touching your working tree.

Older app versions read `server` as a whole. After the deploy that read fails, and they fall back to the config keys they have already cached.

## Rolling out trip-membership rules (#426)

`scripts/rtdb-rollout.sh` runs every production step, from `TravelCostApp/` on an up-to-date `main`. Each step that changes production shows what it will do and asks first.

1. Publish the app update (OTA) that writes `members` (`/update-budget-app`). The `1.3.005r!` entry is critical, so it force-applies. Wait until most active devices have it. Older app versions can still use trips they are a member of after the deploy, but cannot create or join trips.
2. Log in and run the read-only checks (clean `main`, Java 21+, firebase login, token refresh allowed, anonymous access refused):
   ```bash
   pnpm dlx firebase-tools@15.5.1 login
   ```
   ```bash
   scripts/rtdb-rollout.sh preflight
   ```
3. Back up the database and backfill memberships from Traveller rosters, Expense owners and users' trip history. This only adds; re-running is safe:
   ```bash
   scripts/rtdb-rollout.sh backfill
   ```
4. Deploy: this runs preflight, a fresh backfill and the emulator tests, shows the rules, deploys, and verifies anonymous access is refused:
   ```bash
   scripts/rtdb-rollout.sh deploy
   ```
5. Watch for 48 h: Permission Denied counts in `pnpm dlx firebase-tools@15.5.1 database:profile`, the `[AUTH-FAILURE]` logs, and the RTDB downloads graph.
6. If Travellers are locked out:
   ```bash
   scripts/rtdb-rollout.sh rollback
   ```

Backups and update files are kept in `~/rtdb-rollout/<timestamp>/`.
