import {
  isPaidString,
  readPaidBackFromOnlineRecord,
  toExpenseOnline,
} from "../../util/expense";
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
  });
});
