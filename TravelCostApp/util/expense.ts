import { DateOrDateTime } from "./date";
// expense interface
export interface Expense {
  tripid: string;
  uid: string;
  id?: string;
  expenseData?: ExpenseData;
}

export interface ExpenseData {
  id?: string;
  uid?: string;
  splitType: string;
  startDate: DateOrDateTime;
  endDate: DateOrDateTime;
  categoryString: string;
  description: string;
  amount: number;
  date: DateOrDateTime;
  category: string;
  country?: string;
  currency: string;
  whoPaid: string;
  owePerc: number;
  calcAmount: number;
  duplOrSplit?: number;
  splitList?: Split[];
  listEQUAL?: string[];
  iconName?: string;
  rangeId?: string;
  isPaid?: string;
}

export interface ExpenseDataOnline {
  isPaid: string;
  id?: string;
  uid?: string;
  splitType: string;
  startDate: string;
  endDate: string;
  categoryString: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  country?: string;
  currency: string;
  whoPaid: string;
  owePerc: number;
  calcAmount: number;
  duplOrSplit?: number;
  splitList?: Split[];
  iconName?: string;
  rangeId?: string;
}

export interface Split {
  userName: string;
  amount: number;
  whoPaid?: string;
  rate?: number;
}
