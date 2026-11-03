import type { TripData } from "../types/trip";
import { normalizeTravellers } from "./normalize-travellers";

/**
 * Scalar / safe trip fields. Firebase REST `shallow=true` on a trip object
 * truncates *every* child to `true` (including string/number leaves) — see
 * retrieve-data docs example where `"body": "Hello!"` becomes `body: true`.
 * Only real boolean metadata may keep `true`/`false` from a shallow snapshot.
 */
export const TRIP_METADATA_FIELD_KEYS = [
  "tripName",
  "totalBudget",
  "dailyBudget",
  "tripCurrency",
  "startDate",
  "endDate",
  "isPaidDate",
  "isPaid",
  "isPaidTimestamp",
  "isDynamicDailyBudget",
  "isImplicitDefault",
  "tripProgress",
  "categories",
] as const;

export type TripMetadataFieldKey = (typeof TRIP_METADATA_FIELD_KEYS)[number];

const TRIP_BOOLEAN_METADATA_KEYS = new Set<TripMetadataFieldKey>([
  "isDynamicDailyBudget",
  "isImplicitDefault",
]);

/**
 * Shallow GET placeholders are boolean `true` for any non-primitive-at-location
 * child. Boolean metadata fields are the only keys that may keep a boolean.
 */
export function isShallowMetadataPlaceholder(
  key: TripMetadataFieldKey,
  value: unknown
): boolean {
  if (TRIP_BOOLEAN_METADATA_KEYS.has(key)) return false;
  return value === true;
}

/**
 * Drop shallow `true` placeholders and non-metadata keys from a shallow trip
 * snapshot, then attach the Traveller roster from a separate read.
 */
export function tripMetadataFromShallow(
  shallow: Record<string, unknown> | null | undefined,
  travellersRaw: unknown
): TripData {
  const trip: TripData = {};
  if (!shallow || typeof shallow !== "object") {
    trip.travellers = normalizeTravellers(travellersRaw);
    return trip;
  }

  for (const key of TRIP_METADATA_FIELD_KEYS) {
    if (!(key in shallow)) continue;
    const value = shallow[key];
    if (isShallowMetadataPlaceholder(key, value)) continue;
    (trip as Record<string, unknown>)[key] = value;
  }

  trip.travellers = normalizeTravellers(travellersRaw);
  return trip;
}

/**
 * Build trip metadata from per-leaf GET values (actual scalars), plus roster.
 * Skips null/undefined leaves and any lingering boolean placeholders.
 */
export function tripMetadataFromLeaves(
  leaves: Partial<Record<TripMetadataFieldKey, unknown>>,
  travellersRaw: unknown
): TripData {
  const trip: TripData = {};
  for (const key of TRIP_METADATA_FIELD_KEYS) {
    if (!(key in leaves)) continue;
    const value = leaves[key];
    if (value === undefined || value === null) continue;
    if (isShallowMetadataPlaceholder(key, value)) continue;
    (trip as Record<string, unknown>)[key] = value;
  }
  trip.travellers = normalizeTravellers(travellersRaw);
  return trip;
}

/** True when cached/fetched trip metadata still holds shallow `true` stubs. */
export function hasPoisonedTripMetadata(trip: TripData | null | undefined): boolean {
  if (!trip || typeof trip !== "object") return false;
  for (const key of TRIP_METADATA_FIELD_KEYS) {
    if (!(key in trip)) continue;
    if (isShallowMetadataPlaceholder(key, trip[key as TripMetadataFieldKey])) {
      return true;
    }
  }
  return false;
}

/**
 * Fields safe to PATCH onto a trip node. Never includes Traveller expense
 * subtrees, roster placeholders, or shallow `true` stubs on non-boolean fields.
 */
export function tripMetadataPatch(tripData: TripData): Partial<TripData> {
  const patch: Partial<TripData> = {};
  if (!tripData || typeof tripData !== "object") return patch;

  for (const key of TRIP_METADATA_FIELD_KEYS) {
    const value = tripData[key as TripMetadataFieldKey];
    if (value === undefined) continue;
    if (isShallowMetadataPlaceholder(key, value)) continue;
    (patch as Record<string, unknown>)[key] = value;
  }

  return patch;
}
