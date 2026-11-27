import { DateTime } from "luxon";
import { RangeString } from "../../store/expenses-context";
import {
  ExpenseListEntry,
  formatExpenseTimeOfDay,
  groupExpensesForList,
} from "../../util/expense-list-sections";
import { makeExpense } from "../fixtures/expense";

// Local wall-clock dates (jest pins TZ=Europe/Berlin), so day boundaries are
// the user's local days.
function at(
  year: number,
  month: number,
  day: number,
  hour = 12,
  minute = 0,
): Date {
  return new Date(year, month - 1, day, hour, minute);
}

function expenseOn(id: string, date: Date, extra = {}) {
  return makeExpense({ id, date, startDate: date, endDate: date, ...extra });
}

/** Compact view of the list: header labels and Expense ids, in order. */
function outline(entries: ExpenseListEntry[]): string[] {
  return entries.map((entry) =>
    entry.kind === "header" ? `# ${entry.label}` : entry.expense.id,
  );
}

describe("groupExpensesForList (day period)", () => {
  it("splits today into time-of-day groups at fixed boundaries", () => {
    // late in the day, so "Just now" only covers 22:59-23:59
    const now = at(2026, 11, 27, 23, 59);
    const expenses = [
      expenseOn("22:00", at(2026, 11, 27, 22, 0)),
      expenseOn("18:00", at(2026, 11, 27, 18, 0)),
      expenseOn("17:59", at(2026, 11, 27, 17, 59)),
      expenseOn("14:00", at(2026, 11, 27, 14, 0)),
      expenseOn("13:59", at(2026, 11, 27, 13, 59)),
      expenseOn("11:00", at(2026, 11, 27, 11, 0)),
      expenseOn("10:59", at(2026, 11, 27, 10, 59)),
      expenseOn("05:00", at(2026, 11, 27, 5, 0)),
      expenseOn("04:59", at(2026, 11, 27, 4, 59)),
      expenseOn("00:01", at(2026, 11, 27, 0, 1)),
    ];

    const entries = groupExpensesForList(expenses, RangeString.day, now, "en");

    expect(outline(entries)).toEqual([
      "# This evening",
      "22:00",
      "18:00",
      "# This afternoon",
      "17:59",
      "14:00",
      "# Midday",
      "13:59",
      "11:00",
      "# This morning",
      "10:59",
      "05:00",
      "# Last night",
      "04:59",
      "00:01",
    ]);
  });

  it("puts the last hour under Just now, ahead of the time-of-day groups", () => {
    const now = at(2026, 11, 27, 15, 0);
    const expenses = [
      expenseOn("14:30", at(2026, 11, 27, 14, 30)),
      expenseOn("14:01", at(2026, 11, 27, 14, 1)),
      expenseOn("14:00", at(2026, 11, 27, 14, 0)),
      expenseOn("09:00", at(2026, 11, 27, 9, 0)),
    ];

    const entries = groupExpensesForList(expenses, RangeString.day, now, "en");

    expect(outline(entries)).toEqual([
      "# Just now",
      "14:30",
      "14:01",
      "# This afternoon",
      "14:00",
      "# This morning",
      "09:00",
    ]);
  });

  it("puts midnight Expenses under Today and Ranged expense days under Multi-day expenses, after the timed ones", () => {
    const now = at(2026, 11, 27, 15, 0);
    const expenses = [
      expenseOn("lunch", at(2026, 11, 27, 14, 30)),
      expenseOn("hotel-day", at(2026, 11, 27, 10, 0), { rangeId: "r1" }),
      expenseOn("coffee", at(2026, 11, 27, 9, 0)),
      expenseOn("no-time", at(2026, 11, 27, 0, 0)),
    ];

    const entries = groupExpensesForList(expenses, RangeString.day, now, "en");

    expect(outline(entries)).toEqual([
      "# Just now",
      "lunch",
      "# This morning",
      "coffee",
      "# Today",
      "no-time",
      "# Multi-day expenses",
      "hotel-day",
    ]);
  });

  it("puts an Expense dated later today than now under Just now, not in a group above it", () => {
    const now = at(2026, 11, 27, 15, 0);
    const expenses = [
      expenseOn("ticket", at(2026, 11, 27, 16, 30)),
      expenseOn("snack", at(2026, 11, 27, 14, 30)),
      expenseOn("coffee", at(2026, 11, 27, 9, 0)),
    ];

    const entries = groupExpensesForList(expenses, RangeString.day, now, "en");

    expect(outline(entries)).toEqual([
      "# Just now",
      "ticket",
      "snack",
      "# This morning",
      "coffee",
    ]);
  });

  it("shows only the time on rows under time-of-day headers", () => {
    const now = at(2026, 11, 27, 15, 0);
    const entries = groupExpensesForList(
      [expenseOn("coffee", at(2026, 11, 27, 9, 0))],
      RangeString.day,
      now,
      "en",
    );

    expect(entries[1]).toMatchObject({ kind: "expense", underDayHeader: true });
  });

  it("gives Expenses from other days (e.g. a filtered list) their day label instead of a time of day", () => {
    const now = at(2026, 11, 27, 15, 0);
    const expenses = [
      expenseOn("coffee", at(2026, 11, 27, 9, 0)),
      expenseOn("dinner", at(2026, 11, 26, 20, 0)),
      expenseOn("taxi", at(2026, 11, 23, 8, 0)),
    ];

    const entries = groupExpensesForList(expenses, RangeString.day, now, "en");

    expect(outline(entries)).toEqual([
      "# This morning",
      "coffee",
      "# Yesterday",
      "dinner",
      "# Monday 23.11",
      "taxi",
    ]);
  });

  it("keeps today's no-time group with today's groups, above older days", () => {
    const now = at(2026, 11, 27, 15, 0);
    const expenses = [
      expenseOn("hotel-day", at(2026, 11, 27, 10, 0), { rangeId: "r1" }),
      expenseOn("coffee", at(2026, 11, 27, 9, 0)),
      expenseOn("dinner", at(2026, 11, 26, 20, 0)),
    ];

    const entries = groupExpensesForList(expenses, RangeString.day, now, "en");

    expect(outline(entries)).toEqual([
      "# This morning",
      "coffee",
      "# Multi-day expenses",
      "hotel-day",
      "# Yesterday",
      "dinner",
    ]);
  });
});

describe("groupExpensesForList (month period)", () => {
  it("puts a day header with the week labels above each day, showing only the time on rows", () => {
    const now = at(2026, 11, 27, 15, 0);
    const expenses = [
      expenseOn("lunch", at(2026, 11, 27, 13, 0)),
      expenseOn("dinner", at(2026, 11, 26, 20, 0)),
      expenseOn("taxi", at(2026, 11, 3, 8, 0)),
      expenseOn("bus", at(2026, 11, 1, 8, 0)),
    ];

    const entries = groupExpensesForList(
      expenses,
      RangeString.month,
      now,
      "en",
    );

    expect(outline(entries)).toEqual([
      "# Friday 27.11",
      "lunch",
      "# Thursday 26.11",
      "dinner",
      "# Tuesday 03.11",
      "taxi",
      "# Sunday 01.11",
      "bus",
    ]);
    const rows = entries.filter((entry) => entry.kind === "expense");
    expect(
      rows.map((row) => row.kind === "expense" && row.underDayHeader),
    ).toEqual([true, true, true, true]);
  });

  it("calls the last day of the previous month Yesterday on the 1st", () => {
    const now = at(2026, 12, 1, 10, 0);
    const expenses = [
      expenseOn("breakfast", at(2026, 12, 1, 8, 0)),
      expenseOn("dinner", at(2026, 11, 30, 20, 0)),
    ];

    const entries = groupExpensesForList(
      expenses,
      RangeString.month,
      now,
      "en",
    );

    expect(outline(entries)).toEqual([
      "# Tuesday 01.12",
      "breakfast",
      "# Monday 30.11",
      "dinner",
    ]);
  });
});

describe.each([RangeString.year, RangeString.total])(
  "groupExpensesForList (%s period)",
  (period) => {
    it("puts a month header above each month, naming the month and year, and keeps the short date on rows", () => {
      const now = at(2026, 11, 27, 15, 0);
      const expenses = [
        expenseOn("lunch", at(2026, 11, 27, 13, 0)),
        expenseOn("hostel", at(2026, 11, 1, 0, 0)),
        expenseOn("flight", at(2026, 10, 31, 23, 59)),
        expenseOn("visa", at(2026, 2, 14, 9, 0)),
      ];

      const entries = groupExpensesForList(expenses, period, now, "en");

      expect(outline(entries)).toEqual([
        "# November 2026",
        "lunch",
        "hostel",
        "# October 2026",
        "flight",
        "# February 2026",
        "visa",
      ]);
      const rows = entries.filter((entry) => entry.kind === "expense");
      expect(
        rows.map((row) => row.kind === "expense" && row.underDayHeader),
      ).toEqual([false, false, false, false]);
    });

    it("keeps the year apart across a year change", () => {
      const now = at(2027, 1, 5, 12, 0);
      const expenses = [
        expenseOn("snacks", at(2027, 1, 2, 10, 0)),
        expenseOn("party", at(2026, 12, 31, 22, 0)),
        expenseOn("old-january", at(2026, 1, 20, 10, 0)),
      ];

      const entries = groupExpensesForList(expenses, period, now, "en");

      expect(outline(entries)).toEqual([
        "# January 2027",
        "snacks",
        "# December 2026",
        "party",
        "# January 2026",
        "old-january",
      ]);
    });

    it.each([
      ["de", ["# November 2026", "# Oktober 2026"]],
      ["fr", ["# novembre 2026", "# octobre 2026"]],
      ["ru", ["# ноябрь 2026", "# октябрь 2026"]],
    ])("takes month names from the locale (%s)", (locale, headers) => {
      const now = at(2026, 11, 27, 15, 0);
      const expenses = [
        expenseOn("lunch", at(2026, 11, 27, 13, 0)),
        expenseOn("flight", at(2026, 10, 31, 20, 0)),
      ];

      const entries = groupExpensesForList(expenses, period, now, locale);

      expect(outline(entries).filter((line) => line.startsWith("#"))).toEqual(
        headers,
      );
    });
  },
);

describe("groupExpensesForList (localized time-of-day headers)", () => {
  it.each([
    ["de", ["# Gerade eben", "# Mittags", "# Heute Morgen", "# Heute"]],
    ["fr", ["# À l'instant", "# Midi", "# Ce matin", "# Aujourd'hui"]],
    ["ru", ["# Только что", "# В обед", "# Сегодня утром", "# Сегодня"]],
  ])("localizes the day period in %s", (locale, headers) => {
    const now = at(2026, 11, 27, 15, 0);
    const expenses = [
      expenseOn("snack", at(2026, 11, 27, 14, 30)),
      expenseOn("lunch", at(2026, 11, 27, 12, 0)),
      expenseOn("coffee", at(2026, 11, 27, 9, 0)),
      expenseOn("no-time", at(2026, 11, 27, 0, 0)),
    ];

    const entries = groupExpensesForList(
      expenses,
      RangeString.day,
      now,
      locale,
    );

    expect(outline(entries).filter((line) => line.startsWith("#"))).toEqual(
      headers,
    );
  });
});

describe("groupExpensesForList (order)", () => {
  const now = at(2026, 11, 27, 15, 0);

  it("sorts Expenses newest first whatever order they come in (e.g. one just added with an earlier date)", () => {
    const expenses = [
      expenseOn("dinner", at(2026, 11, 26, 20, 0)),
      expenseOn("coffee", at(2026, 11, 27, 9, 0)),
      expenseOn("taxi", at(2026, 11, 23, 8, 0)),
      expenseOn("lunch", at(2026, 11, 27, 13, 0)),
      expenseOn("snack", at(2026, 11, 26, 22, 0)),
    ];

    const entries = groupExpensesForList(expenses, RangeString.week, now, "en");

    expect(outline(entries)).toEqual([
      "# Friday 27.11",
      "lunch",
      "coffee",
      "# Thursday 26.11",
      "snack",
      "dinner",
      "# Monday 23.11",
      "taxi",
    ]);
  });

  it("sorts today's time-of-day groups in the day period", () => {
    const expenses = [
      expenseOn("coffee", at(2026, 11, 27, 9, 0)),
      expenseOn("lunch", at(2026, 11, 27, 12, 0)),
      expenseOn("bakery", at(2026, 11, 27, 10, 0)),
    ];

    const entries = groupExpensesForList(expenses, RangeString.day, now, "en");

    expect(outline(entries)).toEqual([
      "# Midday",
      "lunch",
      "# This morning",
      "bakery",
      "coffee",
    ]);
  });

  it("puts Ranged expense days after the timed Expenses of their day, even when stamped later than now", () => {
    // a Ranged expense created yesterday at 20:00 carries 20:00 on every day
    const expenses = [
      expenseOn("hotel-today", at(2026, 11, 27, 20, 0), { rangeId: "r1" }),
      expenseOn("hotel-yesterday", at(2026, 11, 26, 20, 0), { rangeId: "r1" }),
      expenseOn("lunch", at(2026, 11, 27, 13, 0)),
      expenseOn("coffee", at(2026, 11, 27, 9, 0)),
      expenseOn("dinner", at(2026, 11, 26, 19, 0)),
    ];

    const entries = groupExpensesForList(expenses, RangeString.week, now, "en");

    expect(outline(entries)).toEqual([
      "# Friday 27.11",
      "lunch",
      "coffee",
      "hotel-today",
      "# Thursday 26.11",
      "dinner",
      "hotel-yesterday",
    ]);
  });

  it("sorts months and the Expenses inside them in the year period", () => {
    const expenses = [
      expenseOn("october", at(2026, 10, 3, 9, 0)),
      expenseOn("late-nov", at(2026, 11, 25, 9, 0)),
      expenseOn("september", at(2026, 9, 14, 9, 0)),
      expenseOn("early-nov", at(2026, 11, 2, 9, 0)),
    ];

    const entries = groupExpensesForList(expenses, RangeString.year, now, "en");

    expect(outline(entries)).toEqual([
      "# November 2026",
      "late-nov",
      "early-nov",
      "# October 2026",
      "october",
      "# September 2026",
      "september",
    ]);
  });
});

describe("groupExpensesForList (cost)", () => {
  it.each([
    [RangeString.week, "weekday"],
    [RangeString.year, "month"],
  ])(
    "names the %s header (%s name) once per group, not once per Expense",
    (period) => {
      const now = at(2026, 11, 27, 15, 0);
      // two older groups (no Today / This month), three Expenses each
      const expenses = [
        expenseOn("a1", at(2026, 10, 23, 9, 0)),
        expenseOn("a2", at(2026, 10, 23, 10, 0)),
        expenseOn("a3", at(2026, 10, 23, 11, 0)),
        expenseOn("b1", at(2026, 9, 14, 9, 0)),
        expenseOn("b2", at(2026, 9, 14, 10, 0)),
        expenseOn("b3", at(2026, 9, 14, 11, 0)),
      ];
      const localeNames = jest.spyOn(DateTime.prototype, "toLocaleString");
      try {
        groupExpensesForList(expenses, period, now, "en");

        expect(localeNames).toHaveBeenCalledTimes(2);
      } finally {
        localeNames.mockRestore();
      }
    },
  );
});

describe("formatExpenseTimeOfDay", () => {
  it("gives the time of a timed Expense and none for a Ranged expense day", () => {
    const date = at(2026, 11, 27, 20, 0);
    expect(formatExpenseTimeOfDay({ date })).toBe("20:00");
    expect(formatExpenseTimeOfDay({ date, rangeId: "r1" })).toBe("");
  });
});
