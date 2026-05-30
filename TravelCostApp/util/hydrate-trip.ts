import { MAX_JS_NUMBER } from "../confAppConstants";
import type { TripData } from "../types/trip";
import { isPaidString } from "./expense";

export function hydrateTrip(raw: TripData): TripData {
  if (!raw) return raw;

  const trip: TripData = { ...raw };
  if ("totalSum" in trip) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (trip as any).totalSum;
  }

  if (trip.isPaidDate && !trip.isPaidTimestamp) {
    const date = new Date(trip.isPaidDate);
    if (!isNaN(date.getTime())) {
      trip.isPaidTimestamp = date.getTime();
      trip.isPaid = isPaidString.notPaid;
    }
  }

  const totalBudget = trip.totalBudget
    ? trip.totalBudget.toString()
    : MAX_JS_NUMBER.toString();

  const dailyBudgetRaw = trip.dailyBudget?.toString() ?? "0";
  const dailyBudget =
    Number(dailyBudgetRaw) < 0 ? "0.0001" : dailyBudgetRaw;

  return {
    ...trip,
    totalBudget,
    dailyBudget,
    isPaid: trip.isPaid ?? isPaidString.notPaid,
    isPaidDate: trip.isPaidDate ?? "",
  };
}
