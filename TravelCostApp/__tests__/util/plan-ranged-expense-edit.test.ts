import { DuplicateOption } from "../../util/expense";
import {
  haveRangedExpenseSpanChanged,
  planNonRangedToRangedInstances,
  planRangedExpenseInPlaceUpdates,
  planRangedExpenseReplacement,
  shouldReplaceRangedExpenseInstances,
} from "../../util/plan-ranged-expense-edit";
import { makeExpense } from "../fixtures/expense";

const DAY1 = new Date("2026-01-15T12:00:00.000Z");
const DAY2 = new Date("2026-01-16T12:00:00.000Z");
const DAY3 = new Date("2026-01-17T12:00:00.000Z");

describe("planRangedExpenseInPlaceUpdates", () => {
  it("updates existing instances in place with per-day split distribution", () => {
    const existing = [
      makeExpense({
        id: "e1",
        rangeId: "r1",
        date: DAY1,
        startDate: DAY1,
        endDate: DAY3,
        amount: 40,
        calcAmount: 40,
      }),
      makeExpense({
        id: "e2",
        rangeId: "r1",
        date: DAY2,
        startDate: DAY1,
        endDate: DAY3,
        amount: 40,
        calcAmount: 40,
      }),
      makeExpense({
        id: "e3",
        rangeId: "r1",
        date: DAY3,
        startDate: DAY1,
        endDate: DAY3,
        amount: 40,
        calcAmount: 40,
      }),
    ];
    const submitted = makeExpense({
      startDate: DAY1,
      endDate: DAY3,
      amount: 150,
      calcAmount: 150,
      duplOrSplit: DuplicateOption.split,
      splitList: [
        { userName: "Alice", amount: 90 },
        { userName: "Bob", amount: 60 },
      ],
      description: "updated hotel",
    });

    const updates = planRangedExpenseInPlaceUpdates(submitted, existing);

    expect(updates).toHaveLength(3);
    expect(updates.map((u) => u.id)).toEqual(["e1", "e2", "e3"]);
    expect(updates.every((u) => u.expenseData.rangeId === "r1")).toBe(true);
    expect(updates.every((u) => u.expenseData.amount === 50)).toBe(true);
    expect(updates.every((u) => u.expenseData.description === "updated hotel")).toBe(
      true
    );
    const summed = updates.reduce((sum, u) => sum + u.expenseData.amount, 0);
    expect(Number(summed.toFixed(2))).toBe(150);
  });
});

describe("haveRangedExpenseSpanChanged", () => {
  const existing = [
    makeExpense({
      id: "e1",
      rangeId: "r1",
      date: DAY1,
      startDate: DAY1,
      endDate: DAY2,
    }),
    makeExpense({
      id: "e2",
      rangeId: "r1",
      date: DAY2,
      startDate: DAY1,
      endDate: DAY2,
    }),
  ];

  it("returns false when start and end match the stored span", () => {
    const submitted = makeExpense({ startDate: DAY1, endDate: DAY2 });
    expect(haveRangedExpenseSpanChanged(existing, submitted)).toBe(false);
  });

  it("returns true when the submitted span differs", () => {
    const submitted = makeExpense({ startDate: DAY1, endDate: DAY3 });
    expect(haveRangedExpenseSpanChanged(existing, submitted)).toBe(true);
  });
});

describe("shouldReplaceRangedExpenseInstances", () => {
  it("returns true when span endpoints match but stored instance count differs", () => {
    const existing = [
      makeExpense({
        id: "e1",
        rangeId: "r1",
        date: DAY1,
        startDate: DAY1,
        endDate: DAY3,
      }),
      makeExpense({
        id: "e3",
        rangeId: "r1",
        date: DAY3,
        startDate: DAY1,
        endDate: DAY3,
      }),
    ];
    const submitted = makeExpense({ startDate: DAY1, endDate: DAY3 });

    expect(haveRangedExpenseSpanChanged(existing, submitted)).toBe(false);
    expect(shouldReplaceRangedExpenseInstances(existing, submitted)).toBe(true);
  });

  it("returns false when span and instance count both match", () => {
    const existing = [
      makeExpense({
        id: "e1",
        rangeId: "r1",
        date: DAY1,
        startDate: DAY1,
        endDate: DAY3,
      }),
      makeExpense({
        id: "e2",
        rangeId: "r1",
        date: DAY2,
        startDate: DAY1,
        endDate: DAY3,
      }),
      makeExpense({
        id: "e3",
        rangeId: "r1",
        date: DAY3,
        startDate: DAY1,
        endDate: DAY3,
      }),
    ];
    const submitted = makeExpense({ startDate: DAY1, endDate: DAY3 });

    expect(shouldReplaceRangedExpenseInstances(existing, submitted)).toBe(false);
  });
});

describe("planRangedExpenseReplacement", () => {
  it("expands a fresh instance set whose per-day amounts reconstruct the total", () => {
    const submitted = makeExpense({
      startDate: DAY1,
      endDate: DAY3,
      amount: 150,
      calcAmount: 150,
      duplOrSplit: DuplicateOption.split,
    });

    const instances = planRangedExpenseReplacement(submitted, "r-new");

    expect(instances).toHaveLength(3);
    expect(instances.every((e) => e.rangeId === "r-new")).toBe(true);
    expect(instances.every((e) => e.amount === 50)).toBe(true);
    const summed = instances.reduce((sum, e) => sum + e.amount, 0);
    expect(Number(summed.toFixed(2))).toBe(150);
  });

  it("documents rounding drift when the total does not divide evenly", () => {
    const submitted = makeExpense({
      startDate: DAY1,
      endDate: DAY3,
      amount: 100,
      calcAmount: 100,
      duplOrSplit: DuplicateOption.split,
    });

    const instances = planRangedExpenseReplacement(submitted, "r-new");

    expect(instances.map((e) => e.amount)).toEqual([33.33, 33.33, 33.33]);
    expect(Number(instances.reduce((sum, e) => sum + e.amount, 0).toFixed(2))).toBe(
      99.99
    );
  });
});

describe("planNonRangedToRangedInstances", () => {
  it("expands a single-day expense into per-day instances sharing one rangeId", () => {
    const submitted = makeExpense({
      startDate: DAY1,
      endDate: DAY3,
      amount: 90,
      calcAmount: 90,
      duplOrSplit: DuplicateOption.split,
    });

    const instances = planNonRangedToRangedInstances(submitted, "r-convert");

    expect(instances).toHaveLength(3);
    expect(instances.every((e) => e.rangeId === "r-convert")).toBe(true);
    expect(instances.every((e) => e.amount === 30)).toBe(true);
  });
});
