import { DateTime } from "luxon";
import { getCatLocalized } from "./category";
import {
  DuplicateOption,
  ExpenseData,
  paidBackStatus,
  Split,
} from "./expense";
import { splitType } from "./split";

export type ExpenseFormSnapshot = {
  uid: string;
  amountValue: string | number;
  dateIso: string;
  startDateIso: string;
  endDateIso: string;
  description: string;
  categoryInput: string;
  country: string;
  currency: string;
  whoPaid: string | null;
  splitType: splitType;
  splitList: Split[];
  listEQUAL: string[];
  paidBack?: paidBackStatus;
  isSpecialExpense: boolean;
  duplOrSplit: DuplicateOption | number;
  iconName: string;
  alreadyDividedAmountByDays: boolean;
  newCat: boolean;
  pickedCat: string;
  isSoloTraveller: boolean;
  userName: string;
  lastCountry: string;
  lastCurrency: string;
};

export type ExpenseFieldValidity = {
  amount: boolean;
  date: boolean;
  description: boolean;
  whoPaid: boolean;
  category: boolean;
  country: boolean;
  currency: boolean;
};

export type BuiltAdvancedExpenseData = ExpenseData & {
  alreadyDividedAmountByDays: boolean;
};

function createSafeDate(dateValue: string): Date {
  if (dateValue && dateValue !== "") {
    const parsedDate = DateTime.fromISO(dateValue);
    return parsedDate.isValid
      ? parsedDate.toJSDate()
      : DateTime.now().toJSDate();
  }
  return DateTime.now().toJSDate();
}

function sharedExpenseCore(snapshot: ExpenseFormSnapshot) {
  return {
    uid: snapshot.uid,
    amount: +snapshot.amountValue,
    splitType: snapshot.splitType,
    splitList: snapshot.splitList,
    iconName: snapshot.iconName,
    paidBack: snapshot.paidBack,
    isSpecialExpense: snapshot.isSpecialExpense,
    duplOrSplit: snapshot.duplOrSplit,
  };
}

export function buildExpenseData(
  snapshot: ExpenseFormSnapshot
): BuiltAdvancedExpenseData {
  const category = snapshot.newCat
    ? snapshot.pickedCat
    : snapshot.categoryInput;

  const expenseData: BuiltAdvancedExpenseData = {
    ...sharedExpenseCore(snapshot),
    date: createSafeDate(snapshot.dateIso),
    startDate: createSafeDate(snapshot.startDateIso),
    endDate: createSafeDate(snapshot.endDateIso),
    description: snapshot.description,
    category,
    categoryString: snapshot.categoryInput,
    calcAmount: +snapshot.amountValue,
    country: snapshot.country,
    currency: snapshot.currency,
    whoPaid: snapshot.whoPaid,
    listEQUAL: snapshot.listEQUAL,
    alreadyDividedAmountByDays: snapshot.alreadyDividedAmountByDays,
  };

  if (snapshot.isSoloTraveller || expenseData.whoPaid === null) {
    expenseData.whoPaid = snapshot.userName;
  }
  if (expenseData.description === "") {
    expenseData.description = getCatLocalized(expenseData.category);
  }

  return expenseData;
}

export function buildFastExpenseData(
  snapshot: ExpenseFormSnapshot
): ExpenseData {
  const rangeDate = DateTime.fromISO(snapshot.startDateIso).toJSDate();

  return {
    ...sharedExpenseCore(snapshot),
    date: rangeDate,
    startDate: rangeDate,
    endDate: DateTime.fromISO(snapshot.endDateIso).toJSDate(),
    description: getCatLocalized(snapshot.pickedCat),
    category: snapshot.pickedCat,
    country: snapshot.lastCountry ? snapshot.lastCountry : "",
    currency: snapshot.lastCurrency,
    whoPaid: snapshot.userName,
    listEQUAL: snapshot.listEQUAL,
  };
}

export function validateExpenseData(expenseData: ExpenseData): {
  valid: boolean;
  fieldValidity: ExpenseFieldValidity;
} {
  const fieldValidity: ExpenseFieldValidity = {
    amount:
      !isNaN(expenseData.amount) &&
      expenseData.amount > 0 &&
      expenseData.amount < 34359738368,
    date: expenseData.date?.toString() !== "Invalid Date",
    description: expenseData.description.trim()?.length > 0,
    whoPaid: true,
    category: true,
    country: true,
    currency: true,
  };

  return {
    valid: Object.values(fieldValidity).every(Boolean),
    fieldValidity,
  };
}
