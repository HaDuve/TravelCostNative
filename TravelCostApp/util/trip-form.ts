import type { TripData } from "../types/trip";
import { daysBetween } from "./date";
import { hasDailyBudget, hasTotalBudget } from "./budget-free";

export type TripFormMode = "promote" | "addAnother" | "edit";

export type TripFormRouteParams = {
  tripId?: string;
  mode?: TripFormMode | string;
};

/** Resolve Trip form mode from navigation params + loaded trip flags. */
export function resolveTripFormMode(
  params: TripFormRouteParams | null | undefined,
  trip?: Pick<TripData, "isImplicitDefault"> | null
): TripFormMode {
  const mode = params?.mode;
  if (mode === "promote") return "promote";
  if (mode === "addAnother") return "addAnother";
  if (mode === "edit") return "edit";

  const tripId = params?.tripId;
  if (tripId) {
    if (trip?.isImplicitDefault === true) return "promote";
    return "edit";
  }
  return "addAnother";
}

/** Optional accordion fields already set → auto-expand on edit. */
export function hasOptionalTripFormValues(
  trip: Pick<
    TripData,
    | "dailyBudget"
    | "totalBudget"
    | "startDate"
    | "endDate"
    | "isDynamicDailyBudget"
  > | null
  | undefined
): boolean {
  if (!trip) return false;
  if (hasDailyBudget(trip) || hasTotalBudget(trip)) return true;
  if (trip.isDynamicDailyBudget) return true;
  if (trip.startDate && String(trip.startDate).trim().length > 0) return true;
  if (trip.endDate && String(trip.endDate).trim().length > 0) return true;
  return false;
}

export type BuildTripFormSubmitInput = {
  mode: TripFormMode;
  tripName: string;
  tripCurrency: string;
  totalBudget: string;
  dailyBudget: string;
  isDynamicDailyBudget: boolean;
  startDate?: string | null;
  endDate?: string | null;
  tripid?: string;
  travellers?: TripData["travellers"];
};

/**
 * Build trip payload for promote / add-another / edit.
 * Does not invent dates or daily-from-total without dates.
 * Promote clears isImplicitDefault.
 */
export function buildTripFormSubmitData(
  input: BuildTripFormSubmitInput
): TripData {
  const startDate =
    input.startDate && String(input.startDate).trim().length > 0
      ? String(input.startDate).trim()
      : undefined;
  const endDate =
    input.endDate && String(input.endDate).trim().length > 0
      ? String(input.endDate).trim()
      : undefined;

  let dailyBudget = input.dailyBudget?.trim() ?? "";
  let totalBudget = input.totalBudget?.trim() ?? "";

  if (
    !dailyBudget &&
    totalBudget &&
    startDate &&
    endDate &&
    !input.isDynamicDailyBudget
  ) {
    const diffDays = daysBetween(new Date(endDate), new Date(startDate)) + 1;
    if (diffDays > 0 && Number(totalBudget) > 0) {
      dailyBudget = (Number(totalBudget) / diffDays).toFixed(2);
    }
  }

  if (!totalBudget) totalBudget = "0";
  if (!dailyBudget) dailyBudget = "0";

  const tripData: TripData = {
    tripName: input.tripName,
    tripCurrency: input.tripCurrency,
    totalBudget,
    dailyBudget,
    isDynamicDailyBudget: input.isDynamicDailyBudget,
    travellers: input.travellers,
  };

  if (startDate) tripData.startDate = startDate;
  if (endDate) tripData.endDate = endDate;
  if (input.tripid) tripData.tripid = input.tripid;

  if (input.mode === "promote") {
    tripData.isImplicitDefault = false;
  }

  return tripData;
}

/** Whether changing trip currency requires a confirm step. */
export function shouldConfirmCurrencyChange(options: {
  isEditing: boolean;
  expenseCount: number;
}): boolean {
  // Edit always confirms (expenseCtx may be Active trip only).
  if (options.isEditing) return true;
  return options.expenseCount > 0;
}
