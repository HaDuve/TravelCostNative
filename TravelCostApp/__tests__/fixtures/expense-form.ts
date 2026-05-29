import type { ExpenseFormSnapshot } from "../../util/expense-form-submit";
import { DuplicateOption, isPaidString } from "../../util/expense";

export function makeExpenseFormSnapshot(
  overrides: Partial<ExpenseFormSnapshot> = {}
): ExpenseFormSnapshot {
  return {
    uid: "u1",
    amountValue: "42.5",
    dateIso: "2026-01-15",
    startDateIso: "2026-01-15",
    endDateIso: "2026-01-16",
    description: "Lunch",
    categoryInput: "Food",
    country: "DE",
    currency: "EUR",
    whoPaid: "Alice",
    splitType: "EQUAL",
    splitList: [{ userName: "Alice", amount: 21.25 }],
    listEQUAL: ["Alice", "Bob"],
    paidBack: isPaidString.notPaid,
    isSpecialExpense: false,
    duplOrSplit: DuplicateOption.null,
    iconName: "food",
    alreadyDividedAmountByDays: false,
    newCat: false,
    pickedCat: "food",
    isSoloTraveller: false,
    userName: "Alice",
    lastCountry: "DE",
    lastCurrency: "EUR",
    ...overrides,
  };
}
