import { makeExpense } from "../fixtures/expense";
import {
  asPeriodSlice,
  sumForTrip,
  sumByPeriod,
  sumByTraveller,
} from "../../util/expenseTotals";

beforeAll(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2026-01-15T12:00:00.000Z"));
});

afterAll(() => {
  jest.useRealTimers();
});

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

  it("reconstructs full cost for ranged-split expenses (duplOrSplit=2)", () => {
    // €600 rent stored as 3 daily instances of €200 each
    const expenses = [
      makeExpense({
        id: "e1",
        rangeId: "r1",
        duplOrSplit: 2,
        amount: 200,
        calcAmount: 200,
        splitList: [],
      }),
      makeExpense({
        id: "e2",
        rangeId: "r1",
        duplOrSplit: 2,
        amount: 200,
        calcAmount: 200,
        splitList: [],
      }),
      makeExpense({
        id: "e3",
        rangeId: "r1",
        duplOrSplit: 2,
        amount: 200,
        calcAmount: 200,
        splitList: [],
      }),
    ];
    expect(sumForTrip(expenses)).toBe(600);
  });

  it("excludes deleted ranged expense instances before deduplication", () => {
    const expenses = [
      makeExpense({ id: "e1", rangeId: "r1", calcAmount: 100, isDeleted: true, splitList: [] }),
      makeExpense({ id: "e2", rangeId: "r1", calcAmount: 100, splitList: [] }),
    ];
    // e1 is deleted; e2 is first surviving instance → counts once
    expect(sumForTrip(expenses)).toBe(100);
  });

  it("ignores non-finite calcAmount values", () => {
    const expenses = [
      makeExpense({ id: "e1", calcAmount: 10, splitList: [] }),
      makeExpense({ id: "e2", calcAmount: Number.POSITIVE_INFINITY, splitList: [] }),
    ];
    expect(sumForTrip(expenses)).toBe(10);
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
    expect(sumByPeriod(asPeriodSlice(expenses))).toBe(250);
  });

  it("excludes deleted expenses from period spend", () => {
    const expenses = [
      makeExpense({ id: "e1", calcAmount: 100, splitList: [] }),
      makeExpense({ id: "e2", calcAmount: 50, isDeleted: true, splitList: [] }),
    ];
    expect(sumByPeriod(asPeriodSlice(expenses))).toBe(100);
  });

  it("ignores non-finite calcAmount values", () => {
    const expenses = [
      makeExpense({ id: "e1", calcAmount: 10, splitList: [] }),
      makeExpense({ id: "e2", calcAmount: Number.NEGATIVE_INFINITY, splitList: [] }),
    ];
    expect(sumByPeriod(asPeriodSlice(expenses))).toBe(10);
  });

  it("excludes special expenses when hideSpecial is true", () => {
    const expenses = [
      makeExpense({ id: "e1", calcAmount: 100, splitList: [] }),
      makeExpense({ id: "e2", calcAmount: 40, isSpecialExpense: true, splitList: [] }),
    ];
    expect(sumByPeriod(asPeriodSlice(expenses), true)).toBe(100);
  });

  it("includes special expenses when hideSpecial is false (default)", () => {
    const expenses = [
      makeExpense({ id: "e1", calcAmount: 100, splitList: [] }),
      makeExpense({ id: "e2", calcAmount: 40, isSpecialExpense: true, splitList: [] }),
    ];
    expect(sumByPeriod(asPeriodSlice(expenses))).toBe(140);
    expect(sumByPeriod(asPeriodSlice(expenses), false)).toBe(140);
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

  it("ignores non-finite fallback amounts when calcAmount is missing (no splits)", () => {
    const expenses = [
      makeExpense({
        id: "e1",
        whoPaid: "Alice",
        calcAmount: undefined as unknown as number,
        amount: Number.POSITIVE_INFINITY,
        splitList: [],
      }),
    ];
    expect(sumByTraveller(expenses, "Alice")).toBe(0);
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

  it("ignores expenses with non-finite calcAmount values", () => {
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
        calcAmount: Number.POSITIVE_INFINITY,
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

  it("reconstructs full cost for ranged-split expenses when isTotal is true", () => {
    const expenses = [
      makeExpense({
        id: "e1",
        rangeId: "r1",
        duplOrSplit: 2,
        amount: 200,
        calcAmount: 200,
        splitList: [{ userName: "Alice", amount: 200 }],
      }),
      makeExpense({
        id: "e2",
        rangeId: "r1",
        duplOrSplit: 2,
        amount: 200,
        calcAmount: 200,
        splitList: [{ userName: "Alice", amount: 200 }],
      }),
      makeExpense({
        id: "e3",
        rangeId: "r1",
        duplOrSplit: 2,
        amount: 200,
        calcAmount: 200,
        splitList: [{ userName: "Alice", amount: 200 }],
      }),
    ];
    expect(sumByTraveller(expenses, "Alice", true)).toBe(600);
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
