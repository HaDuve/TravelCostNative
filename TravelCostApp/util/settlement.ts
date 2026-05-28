import type { TripData } from "../types/trip";
import { isPaidString } from "./expense";

export function settleTrip(trip: TripData, now?: number): TripData {
  const ts = now ?? Date.now();
  return {
    ...trip,
    isPaid: isPaidString.paid,
    isPaidTimestamp: ts,
    isPaidDate: new Date(ts).toISOString(),
  };
}

