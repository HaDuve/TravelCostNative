# Secure `currentTripId` is the authoritative Active trip id

Three stores held an Active trip id — secure `currentTripId`, server `users/{uid}.currentTrip`, and `TripContext.tripid` — and readers preferred different ones, so switches and relogin could disagree. We treat secure `currentTripId` as the single source of truth (survives restart, readable offline, already used by the offline queue). Server `currentTrip` and `TripContext.tripid` are mirrors updated only through `activateTrip`. All readers resolve the id via `getActiveTripId`.

## Considered options

- **Server `currentTrip` as authority** — rejected: unavailable offline; a stale or failed server write during switch made relogin override the device’s last successful selection.
- **`TripContext.tripid` as authority** — rejected: in-memory only; lost on process death; not shared with the offline queue or HTTP helpers.
- **Secure `currentTripId` as authority** — accepted: durable on device, readable offline, already the queue’s source.

## Consequences

- Call sites that need “which trip is active” use `getActiveTripId`; they must not prefer server or context over secure storage.
- Mirror writes belong in `activateTrip` (switch/restore). Creation paths that mint a new Active trip may still set the secure key (and mirrors) when establishing the first id.
