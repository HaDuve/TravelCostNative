jest.mock("react-native-toast-message", () => ({
  show: jest.fn(),
  hide: jest.fn(),
}));

jest.mock("../../util/offline-queue", () => ({
  deleteExpenseOnlineOffline: jest.fn(async () => {}),
}));

jest.mock("../../util/http", () => ({
  touchAllTravelers: jest.fn(async () => {}),
}));

import Toast from "react-native-toast-message";
import { i18n } from "../../i18n/i18n";
import { deleteExpenseOnlineOffline } from "../../util/offline-queue";
import { deleteAllExpensesByRangedId } from "../../util/expense";
import type { ExpenseData } from "../../util/expense";

function makeRangedExpense(
  id: string,
  rangeId: string,
): ExpenseData {
  return {
    id,
    uid: "u1",
    rangeId,
    isDeleted: false,
    calcAmount: 10,
    amount: 10,
    currency: "EUR",
    description: "Hotel",
    date: new Date("2026-01-01"),
    startDate: new Date("2026-01-01"),
    endDate: new Date("2026-01-03"),
  } as ExpenseData;
}

describe("deleteAllExpensesByRangedId", () => {
  const expenseCtx = {
    expenses: [
      makeRangedExpense("e1", "r1"),
      makeRangedExpense("e2", "r1"),
      makeRangedExpense("e3", "r2"),
    ],
    deleteExpense: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("soft-deletes every day in the range and shows the undo toast", async () => {
    await deleteAllExpensesByRangedId(
      "trip-1",
      makeRangedExpense("e1", "r1"),
      true,
      expenseCtx,
    );

    expect(expenseCtx.deleteExpense).toHaveBeenCalledTimes(2);
    expect(expenseCtx.deleteExpense).toHaveBeenCalledWith("e1");
    expect(expenseCtx.deleteExpense).toHaveBeenCalledWith("e2");
    expect(deleteExpenseOnlineOffline).toHaveBeenCalledTimes(2);

    const deletedToastCall = (Toast.show as jest.Mock).mock.calls.find(
      ([args]) => args.type === "deletedExpense",
    );
    expect(deletedToastCall).toBeDefined();
  });

  it("shows an error toast instead of failing silently when the ledger is empty", async () => {
    const emptyLedgerCtx = { expenses: [], deleteExpense: jest.fn() };

    await deleteAllExpensesByRangedId(
      "trip-1",
      makeRangedExpense("e1", "r1"),
      true,
      emptyLedgerCtx,
    );

    expect(emptyLedgerCtx.deleteExpense).not.toHaveBeenCalled();
    expect(deleteExpenseOnlineOffline).not.toHaveBeenCalled();
    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "error",
        text2: i18n.t("deleteError"),
      }),
    );
  });
});
