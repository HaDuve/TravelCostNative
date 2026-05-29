import {
  isPaidString,
  normalizeExpensePaidBack,
  readPaidBackFromOnlineRecord,
  toExpenseOnline,
} from "../../util/expense";
import type { ExpenseData } from "../../util/expense";
import { makeExpense } from "../fixtures/expense";

describe("expense paidBack sync", () => {
  describe("readPaidBackFromOnlineRecord", () => {
    it("reads paidBack when the server sends the new field", () => {
      expect(readPaidBackFromOnlineRecord({ paidBack: "paid" })).toBe(
        isPaidString.paid
      );
    });

    it("falls back to legacy isPaid when paidBack is absent", () => {
      expect(readPaidBackFromOnlineRecord({ isPaid: "paid" })).toBe(
        isPaidString.paid
      );
    });

    it("prefers paidBack when both legacy isPaid and paidBack are present", () => {
      expect(
        readPaidBackFromOnlineRecord({
          paidBack: "not paid",
          isPaid: "paid",
        })
      ).toBe(isPaidString.notPaid);
    });
  });

  describe("toExpenseOnline", () => {
    it("writes paidBack and omits legacy isPaid", () => {
      const online = toExpenseOnline(
        makeExpense({ paidBack: isPaidString.paid })
      );

      expect(online.paidBack).toBe("paid");
      expect(online).not.toHaveProperty("isPaid");
    });

    it("migrates legacy isPaid to paidBack on write when paidBack is unset", () => {
      const online = toExpenseOnline({
        ...makeExpense(),
        isPaid: isPaidString.paid,
      } as ExpenseData & { isPaid: typeof isPaidString.paid });

      expect(online.paidBack).toBe("paid");
      expect(online).not.toHaveProperty("isPaid");
    });

    it("omits paidBack when neither paidBack nor legacy isPaid is set", () => {
      const online = toExpenseOnline(makeExpense());

      expect(online).not.toHaveProperty("paidBack");
      expect(online).not.toHaveProperty("isPaid");
    });
  });

  describe("normalizeExpensePaidBack", () => {
    it("maps legacy isPaid onto paidBack and strips isPaid from in-memory expense", () => {
      const normalized = normalizeExpensePaidBack({
        ...makeExpense(),
        isPaid: isPaidString.paid,
      } as ExpenseData & { isPaid: typeof isPaidString.paid });

      expect(normalized.paidBack).toBe(isPaidString.paid);
      expect(normalized).not.toHaveProperty("isPaid");
    });

    it("leaves expense unchanged when no paid-back flag is stored", () => {
      const expense = makeExpense();
      const normalized = normalizeExpensePaidBack(expense);

      expect(normalized).toEqual(expense);
      expect(normalized).not.toHaveProperty("paidBack");
    });
  });
});
