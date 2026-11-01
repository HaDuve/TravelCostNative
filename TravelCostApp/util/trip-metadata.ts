import type { TripData } from "../types/trip";
import { normalizeTravellers } from "./normalize-travellers";

/** Scalar / safe trip fields returned by a shallow trip GET (objects become `true`). */
const TRIP_METADATA_FIELD_KEYS = [
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

type TripMetadataFieldKey = (typeof TRIP_METADATA_FIELD_KEYS)[number];

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
    // Object children are truncated to `true` by shallow GET; skip those.
    // Boolean metadata fields (isDynamicDailyBudget, isImplicitDefault) keep `true`.
    if (key === "categories" && value === true) continue;
    (trip as Record<string, unknown>)[key] = value;
  }

  trip.travellers = normalizeTravellers(travellersRaw);
  return trip;
}

/**
 * Fields safe to PATCH onto a trip node. Never includes Traveller expense
 * subtrees, roster placeholders, or shallow `true` category stubs.
 */
export function tripMetadataPatch(tripData: TripData): Partial<TripData> {
  const patch: Partial<TripData> = {};
  if (!tripData || typeof tripData !== "object") return patch;

  for (const key of TRIP_METADATA_FIELD_KEYS) {
    const value = tripData[key as TripMetadataFieldKey];
    if (value === undefined) continue;
    if (key === "categories" && value === true) continue;
    (patch as Record<string, unknown>)[key] = value;
  }

  return patch;
}
