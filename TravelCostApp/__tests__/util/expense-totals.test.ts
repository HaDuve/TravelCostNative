import { makeExpense } from "../fixtures/expense";
import {
  sumForTrip,
  sumByPeriod,
  sumByTraveller,
} from "../../util/expenseTotals";

// ─── sumForTrip ───────────────────────────────────────────────────────────────

describe("sumForTrip (trip total spent)", () => {
  it("sums non-ranged, non-deleted expenses", () => {
    const expenses = [
      makeExpense({ id: "e1", calcAmount: 30, splitList: [] }),
      makeExpense({ id: "e2", calcAmount: 20, splitList: [] }),
    ];
    expect(sumForTrip(expenses)).toBe(50);
  });

  it("excludes deleted expenses from trip total spent", () => {
    const expenses = [
      makeExpense({ id: "e1", calcAmount: 100, splitList: [] }),
      makeExpense({ id: "e2", calcAmount: 50, isDeleted: true, splitList: [] }),
    ];
    expect(sumForTrip(expenses)).toBe(100);
  });

  it("counts each ranged expense once regardless of how many days it spans", () => {
    const expenses = [
      makeExpense({ id: "e1", rangeId: "r1", calcAmount: 100, splitList: [] }),
      makeExpense({ id: "e2", rangeId: "r1", calcAmount: 100, splitList: [] }),
      makeExpense({ id: "e3", rangeId: "r2", calcAmount: 50, splitList: [] }),
    ];
    expect(sumForTrip(expenses)).toBe(150);
  });

  it("excludes deleted ranged expense instances before deduplication", () => {
    const expenses = [
      makeExpense({ id: "e1", rangeId: "r1", calcAmount: 100, isDeleted: true, splitList: [] }),
      makeExpense({ id: "e2", rangeId: "r1", calcAmount: 100, splitList: [] }),
    ];
    // e1 is deleted; e2 is first surviving instance → counts once
    expect(sumForTrip(expenses)).toBe(100);
  });
});

// ─── sumByPeriod ──────────────────────────────────────────────────────────────

describe("sumByPeriod (period spend)", () => {
  it("counts all day-instances of a ranged expense separately", () => {
    const expenses = [
      makeExpense({ id: "e1", rangeId: "r1", calcAmount: 100, splitList: [] }),
      makeExpense({ id: "e2", rangeId: "r1", calcAmount: 100, splitList: [] }),
      makeExpense({ id: "e3", calcAmount: 50, splitList: [] }),
    ];
    expect(sumByPeriod(expenses)).toBe(250);
  });

  it("excludes deleted expenses from period spend", () => {
    const expenses = [
      makeExpense({ id: "e1", calcAmount: 100, splitList: [] }),
      makeExpense({ id: "e2", calcAmount: 50, isDeleted: true, splitList: [] }),
    ];
    expect(sumByPeriod(expenses)).toBe(100);
  });

  it("excludes special expenses when hideSpecial is true", () => {
    const expenses = [
      makeExpense({ id: "e1", calcAmount: 100, splitList: [] }),
      makeExpense({ id: "e2", calcAmount: 40, isSpecialExpense: true, splitList: [] }),
    ];
    expect(sumByPeriod(expenses, true)).toBe(100);
  });

  it("includes special expenses when hideSpecial is false (default)", () => {
    const expenses = [
      makeExpense({ id: "e1", calcAmount: 100, splitList: [] }),
      makeExpense({ id: "e2", calcAmount: 40, isSpecialExpense: true, splitList: [] }),
    ];
    expect(sumByPeriod(expenses)).toBe(140);
    expect(sumByPeriod(expenses, false)).toBe(140);
  });
});

// ─── sumByTraveller ───────────────────────────────────────────────────────────

describe("sumByTraveller (per-traveller attribution)", () => {
  it("sums expenses where the traveller was who-paid (no splits)", () => {
    const expenses = [
      makeExpense({ id: "e1", whoPaid: "Alice", calcAmount: 100, splitList: [] }),
      makeExpense({ id: "e2", whoPaid: "Bob", calcAmount: 50, splitList: [] }),
    ];
    expect(sumByTraveller(expenses, "Alice")).toBe(100);
    expect(sumByTraveller(expenses, "Bob")).toBe(50);
  });

  it("excludes deleted expenses from traveller attribution", () => {
    const expenses = [
      makeExpense({
        id: "e1",
        amount: 100,
        calcAmount: 100,
        splitList: [{ userName: "Alice", amount: 100 }],
      }),
      makeExpense({
        id: "e2",
        amount: 100,
        calcAmount: 100,
        isDeleted: true,
        splitList: [{ userName: "Alice", amount: 100 }],
      }),
    ];
    expect(sumByTraveller(expenses, "Alice")).toBe(100);
  });

  it("uses each traveller's split amount from splitList", () => {
    const expenses = [
      makeExpense({
        id: "e1",
        amount: 100,
        calcAmount: 100,
        splitList: [
          { userName: "Alice", amount: 60 },
          { userName: "Bob", amount: 40 },
        ],
      }),
    ];
    expect(sumByTraveller(expenses, "Alice")).toBe(60);
    expect(sumByTraveller(expenses, "Bob")).toBe(40);
  });

  it("applies currency-conversion ratio to split amounts", () => {
    // 100 expense currency = 120 trip currency; Alice's 60 share → 60/100 × 120 = 72
    const expenses = [
      makeExpense({
        id: "e1",
        amount: 100,
        calcAmount: 120,
        splitList: [
          { userName: "Alice", amount: 60 },
          { userName: "Bob", amount: 40 },
        ],
      }),
    ];
    expect(sumByTraveller(expenses, "Alice")).toBeCloseTo(72);
    expect(sumByTraveller(expenses, "Bob")).toBeCloseTo(48);
  });

  it("returns 0 for a traveller not on any expense", () => {
    const expenses = [
      makeExpense({ id: "e1", whoPaid: "Alice", calcAmount: 100, splitList: [] }),
    ];
    expect(sumByTraveller(expenses, "Charlie")).toBe(0);
  });

  it("deduplicates ranged expenses when isTotal is true", () => {
    const expenses = [
      makeExpense({ id: "e1", rangeId: "r1", whoPaid: "Alice", calcAmount: 100, splitList: [] }),
      makeExpense({ id: "e2", rangeId: "r1", whoPaid: "Alice", calcAmount: 100, splitList: [] }),
    ];
    expect(sumByTraveller(expenses, "Alice", true)).toBe(100);
  });

  it("counts all ranged instances when isTotal is false (default)", () => {
    const expenses = [
      makeExpense({ id: "e1", rangeId: "r1", whoPaid: "Alice", calcAmount: 100, splitList: [] }),
      makeExpense({ id: "e2", rangeId: "r1", whoPaid: "Alice", calcAmount: 100, splitList: [] }),
    ];
    expect(sumByTraveller(expenses, "Alice")).toBe(200);
    expect(sumByTraveller(expenses, "Alice", false)).toBe(200);
  });
});
