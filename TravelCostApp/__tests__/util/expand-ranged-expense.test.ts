import { DuplicateOption } from "../../util/expense";
import { expandRangedExpense } from "../../util/expand-ranged-expense";
import { asPeriodSlice, sumByPeriod, sumForTrip } from "../../util/expenseTotals";
import { makeExpense } from "../fixtures/expense";

describe("expandRangedExpense", () => {
  it("returns one ExpenseData per injected date", () => {
    const dates = [
      new Date("2026-01-15T12:00:00.000Z"),
      new Date("2026-01-16T12:00:00.000Z"),
      new Date("2026-01-17T12:00:00.000Z"),
    ];
    const source = makeExpense({
      startDate: dates[0],
      endDate: dates[2],
      amount: 90,
      calcAmount: 90,
      duplOrSplit: DuplicateOption.split,
    });

    const expanded = expandRangedExpense(source, {
      rangeId: "range-1",
      dates,
    });

    expect(expanded).toHaveLength(3);
    expect(expanded.map((e) => e.date)).toEqual(dates);
  });

  it("stamps rangeId on each instance for a multi-day span", () => {
    const dates = [
      new Date("2026-01-15T12:00:00.000Z"),
      new Date("2026-01-16T12:00:00.000Z"),
    ];
    const expanded = expandRangedExpense(makeExpense({ startDate: dates[0], endDate: dates[1] }), {
      rangeId: "range-abc",
      dates,
    });

    expect(expanded.every((e) => e.rangeId === "range-abc")).toBe(true);
  });

  it("returns one instance with no rangeId for a single-day span", () => {
    const date = new Date("2026-01-15T12:00:00.000Z");
    const expanded = expandRangedExpense(makeExpense({ startDate: date, endDate: date }), {
      rangeId: "ignored",
      dates: [date],
    });

    expect(expanded).toHaveLength(1);
    expect(expanded[0].rangeId).toBeNull();
  });

  it("gives each instance its own splitList", () => {
    const dates = [
      new Date("2026-01-15T12:00:00.000Z"),
      new Date("2026-01-16T12:00:00.000Z"),
    ];
    const expanded = expandRangedExpense(
      makeExpense({
        amount: 100,
        calcAmount: 100,
        duplOrSplit: DuplicateOption.split,
        splitList: [
          { userName: "Alice", amount: 60 },
          { userName: "Bob", amount: 40 },
        ],
      }),
      { rangeId: "r1", dates }
    );

    expanded[0].splitList![0].amount = 999;
    expect(expanded[1].splitList![0].amount).toBe(30);
  });

  it("spreads a ranged-split total evenly per day", () => {
    const dates = [
      new Date("2026-01-15T12:00:00.000Z"),
      new Date("2026-01-16T12:00:00.000Z"),
      new Date("2026-01-17T12:00:00.000Z"),
    ];
    const expanded = expandRangedExpense(
      makeExpense({
        amount: 150,
        calcAmount: 150,
        duplOrSplit: DuplicateOption.split,
        splitList: [
          { userName: "Alice", amount: 90 },
          { userName: "Bob", amount: 60 },
        ],
      }),
      { rangeId: "r1", dates }
    );

    expect(expanded.every((e) => e.amount === 50)).toBe(true);
    expect(expanded.every((e) => e.calcAmount === 50)).toBe(true);
    expect(expanded[0].splitList).toEqual([
      { userName: "Alice", amount: 30 },
      { userName: "Bob", amount: 20 },
    ]);
    const summed = expanded.reduce((sum, e) => sum + e.amount, 0);
    expect(Number(summed.toFixed(2))).toBe(150);
  });

  it("keeps the full per-day amount for ranged duplicate", () => {
    const dates = [
      new Date("2026-01-15T12:00:00.000Z"),
      new Date("2026-01-16T12:00:00.000Z"),
    ];
    const expanded = expandRangedExpense(
      makeExpense({
        amount: 50,
        calcAmount: 50,
        duplOrSplit: DuplicateOption.duplicate,
      }),
      { rangeId: "r1", dates }
    );

    expect(expanded.every((e) => e.amount === 50 && e.calcAmount === 50)).toBe(
      true
    );
    expect(expanded.reduce((sum, e) => sum + e.amount, 0)).toBe(100);
  });

  it("keeps per-day amounts when the total is already divided", () => {
    const dates = [
      new Date("2026-01-15T12:00:00.000Z"),
      new Date("2026-01-16T12:00:00.000Z"),
    ];
    const expanded = expandRangedExpense(
      makeExpense({
        amount: 50,
        calcAmount: 50,
        duplOrSplit: DuplicateOption.split,
        alreadyDividedAmountByDays: true,
      }),
      { rangeId: "r1", dates }
    );

    expect(expanded.every((e) => e.amount === 50)).toBe(true);
  });

  it("ranged split per-day instances reconstruct the original total in trip total spent", () => {
    const dates = [
      new Date("2026-01-15T12:00:00.000Z"),
      new Date("2026-01-16T12:00:00.000Z"),
      new Date("2026-01-17T12:00:00.000Z"),
    ];
    const source = makeExpense({
      amount: 150,
      calcAmount: 150,
      duplOrSplit: DuplicateOption.split,
    });
    const expanded = expandRangedExpense(source, { rangeId: "r1", dates }).map(
      (expense, index) => ({ ...expense, id: `e${index}` })
    );

    expect(sumForTrip(expanded)).toBe(150);
  });

  it("ranged duplicate counts once in trip total spent and every day in period spend", () => {
    const dates = [
      new Date("2026-01-15T12:00:00.000Z"),
      new Date("2026-01-16T12:00:00.000Z"),
    ];
    const expanded = expandRangedExpense(
      makeExpense({
        amount: 50,
        calcAmount: 50,
        duplOrSplit: DuplicateOption.duplicate,
      }),
      { rangeId: "r1", dates }
    ).map((expense, index) => ({ ...expense, id: `e${index}` }));

    expect(sumForTrip(expanded)).toBe(50);
    expect(sumByPeriod(asPeriodSlice(expanded))).toBe(100);
  });

  it("does not mutate the submitted expense data", () => {
    const dates = [
      new Date("2026-01-15T12:00:00.000Z"),
      new Date("2026-01-16T12:00:00.000Z"),
    ];
    const source = makeExpense({
      amount: 100,
      calcAmount: 100,
      duplOrSplit: DuplicateOption.split,
    });

    expandRangedExpense(source, { rangeId: "r1", dates });

    expect(source.amount).toBe(100);
    expect(source.calcAmount).toBe(100);
  });
});
