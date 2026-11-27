import { RangeString } from "../../store/expenses-context";
import {
  ExpenseListEntry,
  groupExpensesForList,
} from "../../util/expense-list-sections";
import { makeExpense } from "../fixtures/expense";

// Local wall-clock dates (jest pins TZ=Europe/Berlin).
const now = new Date(2026, 10, 27, 15, 0); // Friday 27.11.2026

function expenseOn(id: string, date: Date, calcAmount: number, extra = {}) {
  return makeExpense({
    id,
    date,
    startDate: date,
    endDate: date,
    calcAmount,
    ...extra,
  });
}

function headers(entries: ExpenseListEntry[]) {
  return entries.flatMap((entry) =>
    entry.kind === "header" ? [{ label: entry.label, total: entry.total }] : [],
  );
}

const data = () => [
  expenseOn("today-1", new Date(2026, 10, 27, 9, 0), 10),
  expenseOn("today-2", new Date(2026, 10, 27, 12, 0), 5.5),
  expenseOn("yesterday", new Date(2026, 10, 26, 12, 0), 20),
  expenseOn("older", new Date(2026, 10, 20, 12, 0), 7),
  expenseOn("october", new Date(2026, 9, 3, 12, 0), 100),
];

describe.each([RangeString.week, RangeString.month])(
  "day headers in the %s period",
  (period) => {
    it("name the exact day instead of Today / Yesterday and carry the period spend", () => {
      const entries = groupExpensesForList(data(), period, now, "en");
      expect(headers(entries).slice(0, 3)).toEqual([
        { label: "Friday 27.11", total: 15.5 },
        { label: "Thursday 26.11", total: 20 },
        { label: "Friday 20.11", total: 7 },
      ]);
    });
  },
);

describe.each([RangeString.year, RangeString.total])(
  "month headers in the %s period",
  (period) => {
    it("name month and year instead of This month and carry the period spend", () => {
      const entries = groupExpensesForList(data(), period, now, "en");
      expect(headers(entries)).toEqual([
        { label: "November 2026", total: 42.5 },
        { label: "October 2026", total: 100 },
      ]);
    });
  },
);

describe("day period", () => {
  it("keeps relative captions", () => {
    const entries = groupExpensesForList(data(), RangeString.day, now, "en");
    expect(headers(entries).map((h) => h.label)).toContain("Yesterday");
    expect(headers(entries).map((h) => h.label)).not.toContain("Friday 27.11");
  });
});

describe("period spend", () => {
  it("sums only the Expenses given, so a filtered list gets filtered sums", () => {
    const filtered = data().filter((e) => e.id !== "today-2");
    const entries = groupExpensesForList(filtered, RangeString.week, now, "en");
    expect(headers(entries)[0]).toEqual({ label: "Friday 27.11", total: 10 });
  });

  it("counts every Ranged expense day in the group it appears in", () => {
    const ranged = [
      expenseOn("r1", new Date(2026, 10, 26, 0, 0), 8, { rangeId: "r" }),
      expenseOn("r2", new Date(2026, 10, 27, 0, 0), 8, { rangeId: "r" }),
      expenseOn("plain", new Date(2026, 10, 27, 10, 0), 2),
    ];
    const week = headers(
      groupExpensesForList(ranged, RangeString.week, now, "en"),
    );
    expect(week).toEqual([
      { label: "Friday 27.11", total: 10 },
      { label: "Thursday 26.11", total: 8 },
    ]);
    expect(
      headers(groupExpensesForList(ranged, RangeString.year, now, "en")),
    ).toEqual([{ label: "November 2026", total: 18 }]);
  });
});
