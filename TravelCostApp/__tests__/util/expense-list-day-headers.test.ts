import { RangeString } from "../../store/expenses-context";
import {
  ExpenseListEntry,
  expenseListItemLayouts,
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
  minute = 0
): Date {
  return new Date(year, month - 1, day, hour, minute);
}

function expenseOn(id: string, date: Date) {
  return makeExpense({ id, date, startDate: date, endDate: date });
}

/** Compact view of the list: header labels and Expense ids, in order. */
function outline(entries: ExpenseListEntry[]): string[] {
  return entries.map((entry) =>
    entry.kind === "dayHeader" ? `# ${entry.label}` : entry.expense.id
  );
}

describe("groupExpensesForList (week period)", () => {
  // Friday 27 November 2026
  const now = at(2026, 11, 27, 15, 0);

  it("puts Today, Yesterday and weekday dd.MM headers above each day's Expenses, newest first", () => {
    const expenses = [
      expenseOn("lunch", at(2026, 11, 27, 13, 0)),
      expenseOn("coffee", at(2026, 11, 27, 9, 0)),
      expenseOn("dinner", at(2026, 11, 26, 20, 0)),
      expenseOn("taxi", at(2026, 11, 23, 8, 0)),
    ];

    const entries = groupExpensesForList(expenses, RangeString.week, now, "en");

    expect(outline(entries)).toEqual([
      "# Today",
      "lunch",
      "coffee",
      "# Yesterday",
      "dinner",
      "# Monday 23.11",
      "taxi",
    ]);
  });

  it("splits at local midnight: 00:01 is Today, 23:59 the evening before is Yesterday", () => {
    const justAfterMidnight = at(2026, 11, 27, 0, 30);
    const expenses = [
      expenseOn("early", at(2026, 11, 27, 0, 1)),
      expenseOn("late", at(2026, 11, 26, 23, 59)),
    ];

    const entries = groupExpensesForList(
      expenses,
      RangeString.week,
      justAfterMidnight,
      "en"
    );

    expect(outline(entries)).toEqual([
      "# Today",
      "early",
      "# Yesterday",
      "late",
    ]);
  });

  it("labels future-dated Expenses with their weekday and date", () => {
    const expenses = [
      expenseOn("museum", at(2026, 11, 29, 10, 0)),
      expenseOn("hostel", at(2026, 11, 28, 18, 0)),
      expenseOn("lunch", at(2026, 11, 27, 13, 0)),
    ];

    const entries = groupExpensesForList(expenses, RangeString.week, now, "en");

    expect(outline(entries)).toEqual([
      "# Sunday 29.11",
      "museum",
      "# Saturday 28.11",
      "hostel",
      "# Today",
      "lunch",
    ]);
  });

  it("returns no rows for an empty list", () => {
    expect(groupExpensesForList([], RangeString.week, now, "en")).toEqual([]);
  });

  it("keeps day and month apart across a month change", () => {
    // Wednesday 2 December 2026; the week started Monday 30 November
    const wednesday = at(2026, 12, 2, 12, 0);
    const expenses = [
      expenseOn("wed", at(2026, 12, 2, 9, 0)),
      expenseOn("tue", at(2026, 12, 1, 9, 0)),
      expenseOn("mon", at(2026, 11, 30, 9, 0)),
    ];

    const entries = groupExpensesForList(
      expenses,
      RangeString.week,
      wednesday,
      "en"
    );

    expect(outline(entries)).toEqual([
      "# Today",
      "wed",
      "# Yesterday",
      "tue",
      "# Monday 30.11",
      "mon",
    ]);
  });

  it.each([
    ["de", ["# Heute", "# Gestern", "# Montag 23.11"]],
    ["fr", ["# Aujourd'hui", "# Hier", "# lundi 23.11"]],
    ["ru", ["# Сегодня", "# Вчера", "# понедельник 23.11"]],
  ])("localizes header labels in %s", (locale, headers) => {
    const expenses = [
      expenseOn("lunch", at(2026, 11, 27, 13, 0)),
      expenseOn("dinner", at(2026, 11, 26, 20, 0)),
      expenseOn("taxi", at(2026, 11, 23, 8, 0)),
    ];

    const entries = groupExpensesForList(expenses, RangeString.week, now, locale);

    expect(outline(entries).filter((line) => line.startsWith("#"))).toEqual(
      headers
    );
  });

  it("marks every Expense as sitting under a day header", () => {
    const entries = groupExpensesForList(
      [expenseOn("lunch", at(2026, 11, 27, 13, 0))],
      RangeString.week,
      now,
      "en"
    );

    expect(entries[1]).toMatchObject({
      kind: "expense",
      underDayHeader: true,
    });
  });
});

describe("groupExpensesForList on Hermes (no usable Intl formatToParts)", () => {
  // Hermes on iOS returns parts without a weekday/month part, which makes
  // luxon's toFormat("cccc") / ("LLLL") print "null". Labels must not depend
  // on formatToParts.
  const original = Intl.DateTimeFormat.prototype.formatToParts;
  beforeEach(() => {
    Intl.DateTimeFormat.prototype.formatToParts = function (date) {
      return [{ type: "literal", value: this.format(date) }];
    };
  });
  afterEach(() => {
    Intl.DateTimeFormat.prototype.formatToParts = original;
  });

  it("still names the weekday in week headers", () => {
    const now = at(2026, 11, 27, 15, 0);
    const entries = groupExpensesForList(
      [expenseOn("groceries", at(2026, 11, 25, 18, 30))],
      RangeString.week,
      now,
      "de"
    );

    expect(outline(entries)).toEqual(["# Mittwoch 25.11", "groceries"]);
  });
});

describe("groupExpensesForList (other periods)", () => {
  const now = at(2026, 11, 27, 15, 0);
  const expenses = [
    expenseOn("lunch", at(2026, 11, 27, 13, 0)),
    expenseOn("dinner", at(2026, 11, 26, 20, 0)),
  ];

  it.each([
    RangeString.day,
    RangeString.month,
    RangeString.year,
    RangeString.total,
  ])("%s lists plain Expense rows without headers", (period) => {
    const entries = groupExpensesForList(expenses, period, now, "en");

    expect(entries).toEqual([
      { kind: "expense", key: "lunch", expense: expenses[0], underDayHeader: false },
      { kind: "expense", key: "dinner", expense: expenses[1], underDayHeader: false },
    ]);
  });
});

describe("expenseListItemLayouts", () => {
  const now = at(2026, 11, 27, 15, 0);
  const heights = { expenseRowHeight: 55, dayHeaderHeight: 30 };

  it("adds up header and Expense row heights so each row knows its offset", () => {
    const entries = groupExpensesForList(
      [
        expenseOn("lunch", at(2026, 11, 27, 13, 0)),
        expenseOn("coffee", at(2026, 11, 27, 9, 0)),
        expenseOn("dinner", at(2026, 11, 26, 20, 0)),
      ],
      RangeString.week,
      now,
      "en"
    );

    expect(expenseListItemLayouts(entries, heights)).toEqual([
      { length: 30, offset: 0 }, // Today
      { length: 55, offset: 30 }, // lunch
      { length: 55, offset: 85 }, // coffee
      { length: 30, offset: 140 }, // Yesterday
      { length: 55, offset: 170 }, // dinner
    ]);
  });

  it("keeps the fixed Expense row spacing when there are no headers", () => {
    const entries = groupExpensesForList(
      [
        expenseOn("lunch", at(2026, 11, 27, 13, 0)),
        expenseOn("dinner", at(2026, 11, 26, 20, 0)),
      ],
      RangeString.month,
      now,
      "en"
    );

    expect(expenseListItemLayouts(entries, heights)).toEqual([
      { length: 55, offset: 0 },
      { length: 55, offset: 55 },
    ]);
  });
});
