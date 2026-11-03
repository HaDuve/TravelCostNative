import { MAX_JS_NUMBER } from "../confAppConstants";
import type { TripData } from "../types/trip";
import { isPaidString } from "./expense";
import {
  isShallowMetadataPlaceholder,
  TRIP_METADATA_FIELD_KEYS,
  type TripMetadataFieldKey,
} from "./trip-metadata";

function isUsableScalar(value: unknown): boolean {
  // Shallow placeholders and other non-scalars must not become "true"/epoch.
  if (value === true || value === false) return false;
  if (value === null || value === undefined) return false;
  return typeof value === "string" || typeof value === "number";
}

function stripMetadataPlaceholders(trip: TripData): void {
  for (const key of TRIP_METADATA_FIELD_KEYS) {
    if (!(key in trip)) continue;
    if (
      isShallowMetadataPlaceholder(
        key,
        trip[key as TripMetadataFieldKey]
      )
    ) {
      delete (trip as Record<string, unknown>)[key];
    }
  }
}

export function hydrateTrip(raw: TripData): TripData {
  if (!raw) return raw;

  const trip: TripData =
    "totalSum" in raw
      ? (() => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
          const { totalSum, ...rest } = raw as any;
          return rest as TripData;
        })()
      : { ...raw };

  stripMetadataPlaceholders(trip);

  if (trip.isPaidDate && !trip.isPaidTimestamp) {
    const date = new Date(trip.isPaidDate);
    if (!isNaN(date.getTime())) {
      trip.isPaidTimestamp = date.getTime();
      trip.isPaid = isPaidString.notPaid;
    }
  }

  const totalBudget = isUsableScalar(trip.totalBudget)
    ? String(trip.totalBudget)
    : MAX_JS_NUMBER.toString();

  const dailyBudgetRaw = isUsableScalar(trip.dailyBudget)
    ? String(trip.dailyBudget)
    : "0";
  const dailyBudget =
    Number(dailyBudgetRaw) < 0 ? "0.0001" : dailyBudgetRaw;

  const tripCurrency =
    typeof trip.tripCurrency === "string" ? trip.tripCurrency : "";

  const startDate = isUsableScalar(trip.startDate)
    ? String(trip.startDate)
    : undefined;
  const endDate = isUsableScalar(trip.endDate)
    ? String(trip.endDate)
    : undefined;

  return {
    ...trip,
    totalBudget,
    dailyBudget,
    tripCurrency,
    startDate,
    endDate,
    isPaid: trip.isPaid ?? isPaidString.notPaid,
    isPaidDate: isUsableScalar(trip.isPaidDate)
      ? String(trip.isPaidDate)
      : "",
  };
}
