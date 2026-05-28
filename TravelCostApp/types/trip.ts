import type { ExpenseData, isPaidString } from "../util/expense";
import type { Traveller } from "../util/traveler";
import type { Category } from "../util/category";

export interface TripData {
  tripName?: string;
  expenses?: ExpenseData[];
  totalBudget?: string;
  dailyBudget?: string;
  tripCurrency?: string;
  travellers?: Traveller[];
  tripid?: string;
  /** @deprecated derive trip total spent from expenses instead (see #247) */
  totalSum?: number;
  tripProgress?: number;
  startDate?: string;
  endDate?: string;
  isPaidDate?: string;
  isPaid?: isPaidString;
  isPaidTimestamp?: number;
  isDynamicDailyBudget?: boolean;
  // online categories are stored as a JSON.stringified strings
  // local categories are stored as Category arrays.
  categories?: Category[] | string;
}

