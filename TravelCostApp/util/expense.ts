// expense interface
export interface Expense {
  tripid: string;
  uid: string;
  id?: string;
  expenseData?: ExpenseData;
}

export interface ExpenseData {
  description: string;
  amount: number;
  date: string;
  category: string;
  country: string;
  currency: string;
  whoPaid: string;
  owePerc: number;
  calcAmount: number;
  duplOrSplit: number;
}
