import { settleTrip } from "../../util/settlement";
import { makeExpense } from "../fixtures/expense";
import { rollupOpenBalances } from "../../util/split";
import { getEffectiveIsPaid, isPaidString } from "../../util/expense";

describe("Settlement (settleTrip)", () => {
  it("sets isPaid, isPaidTimestamp, isPaidDate and preserves all other trip fields", () => {
    const now = Date.UTC(2026, 0, 15, 12, 0, 0);
    const trip = {
      tripid: "t1",
      tripName: "Japan",
      tripCurrency: "EUR",
      isPaid: isPaidString.notPaid,
      isPaidTimestamp: 0,
      isPaidDate: "",
      travellers: [{ uid: "u1", userName: "Alice", touched: true }],
      expenses: [makeExpense()],
      totalBudget: "1000",
      dailyBudget: "50",
      startDate: "2026-01-01T00:00:00.000Z",
      endDate: "2026-02-01T00:00:00.000Z",
      isDynamicDailyBudget: false,
    };

    const settled = settleTrip(trip, now);

    expect(settled).toEqual({
      ...trip,
      isPaid: isPaidString.paid,
      isPaidTimestamp: now,
      isPaidDate: new Date(now).toISOString(),
    });
    expect(settled).not.toBe(trip);
  });

  it("satisfies the invariant: after settlement, open Balances roll up to []", () => {
    const now = 1000;
    const trip = {
      tripCurrency: "EUR",
      expenses: [
        makeExpense({
          whoPaid: "Alice",
          editedTimestamp: 0,
          splitList: [
            { userName: "Alice", amount: 50 },
            { userName: "Bob", amount: 50 },
          ],
        }),
        makeExpense({
          id: "e2",
          whoPaid: "Bob",
          editedTimestamp: 0,
          splitList: [
            { userName: "Alice", amount: 20 },
            { userName: "Bob", amount: 80 },
          ],
        }),
      ],
    };

    const openBefore = rollupOpenBalances(trip.expenses, trip.tripCurrency, 0);
    expect(openBefore.length).toBeGreaterThan(0);

    const settledTrip = settleTrip(trip, now);
    expect(settledTrip.isPaid).toBe(isPaidString.paid);
    expect(settledTrip.isPaidTimestamp).toBe(now);
    expect(settledTrip.isPaidDate).toBe(new Date(now).toISOString());

    // Per-expense paid-back is derived by getEffectiveIsPaid with trip settlement timestamp.
    for (const exp of trip.expenses) {
      expect(getEffectiveIsPaid(exp, settledTrip.isPaidTimestamp)).toBe(
        isPaidString.paid
      );
    }

    const openAfter = rollupOpenBalances(
      trip.expenses,
      trip.tripCurrency,
      settledTrip.isPaidTimestamp
    );
    expect(openAfter).toEqual([]);
  });

  it("keeps an expense open when edited after settlement timestamp", () => {
    const settledAt = 1000;
    const trip = {
      tripCurrency: "EUR",
      expenses: [
        makeExpense({
          whoPaid: "Alice",
          editedTimestamp: settledAt + 1,
          splitList: [
            { userName: "Alice", amount: 50 },
            { userName: "Bob", amount: 50 },
          ],
        }),
      ],
    };

    const settledTrip = settleTrip(trip, settledAt);

    expect(
      getEffectiveIsPaid(trip.expenses[0], settledTrip.isPaidTimestamp)
    ).toBe(isPaidString.notPaid);

    const openBalances = rollupOpenBalances(
      trip.expenses,
      trip.tripCurrency,
      settledTrip.isPaidTimestamp
    );
    expect(openBalances.length).toBeGreaterThan(0);
  });
});

