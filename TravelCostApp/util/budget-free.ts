import { MAX_JS_NUMBER } from "../confAppConstants";
import type { TripData } from "../types/trip";

type BudgetFields = Pick<TripData, "dailyBudget" | "totalBudget">;

/** True when a total budget amount is set and usable as a spending cap. */
export function hasTotalBudget(
  trip: Pick<TripData, "totalBudget"> | null | undefined
): boolean {
  if (!trip) return false;
  const raw = trip.totalBudget;
  if (raw === undefined || raw === null || raw === "") return false;
  const asString = String(raw);
  if (asString === "0") return false;
  const n = Number(asString);
  if (Number.isNaN(n) || n <= 0) return false;
  if (n >= MAX_JS_NUMBER) return false;
  return true;
}

/** True when a daily budget amount is set and usable as a daily target. */
export function hasDailyBudget(
  trip: Pick<TripData, "dailyBudget"> | null | undefined
): boolean {
  if (!trip) return false;
  const raw = trip.dailyBudget;
  if (raw === undefined || raw === null || raw === "") return false;
  const asString = String(raw);
  if (asString === "0") return false;
  const n = Number(asString);
  if (Number.isNaN(n) || n <= 0) return false;
  return true;
}

/**
 * Budget-free: neither total nor daily budget is set.
 * Progress / over-budget UI must stay hidden until at least one is set.
 */
export function isBudgetFree(trip: BudgetFields | null | undefined): boolean {
  return !hasTotalBudget(trip) && !hasDailyBudget(trip);
}

/**
 * Whether the ExpensesSummary progress bar applies for this period.
 * Daily-only trips skip total progress; total-only trips skip period/daily bars.
 */
export function periodProgressApplies(
  trip: BudgetFields | null | undefined,
  periodName: string
): boolean {
  if (isBudgetFree(trip)) return false;
  if (periodName === "total") return hasTotalBudget(trip);
  return hasDailyBudget(trip);
}
