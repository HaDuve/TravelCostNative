import { paidBackStatus, type ExpenseData } from "../../util/expense";
import { settleTrip } from "../../util/settlement";
import {
  buildExpenseEditEntry,
  buildSplitHistoryEntry,
  type SplitHistoryEntry,
} from "../../util/split-history";
import {
  addExpense,
  buildExpense,
  computeSplitSummary,
  makeTrip,
  markPaidBack,
  resetHarnessIds,
  type SplitSummaryTrip,
} from "../fixtures/split-summary";

const author = { uid: "u1", userName: "Alice" };
const NOW = 1_767_268_800_000;

beforeEach(() => resetHarnessIds());

/** Net position per Traveller (positive = is owed) from the harness Split Summary. */
function summaryNet(trip: SplitSummaryTrip): Record<string, number> {
  const net: Record<string, number> = {};
  for (const b of computeSplitSummary(trip).balances) {
    net[b.from] = (net[b.from] ?? 0) - b.amount;
    net[b.to] = (net[b.to] ?? 0) + b.amount;
  }
  return net;
}

function entryFor(
  trip: SplitSummaryTrip,
  kind: SplitHistoryEntry["kind"],
  before: ExpenseData[],
  after: ExpenseData[],
  description = "Dinner"
) {
  return buildSplitHistoryEntry({
    kind,
    description,
    before,
    after,
    tripCurrency: trip.tripCurrency,
    isPaidTimestamp: trip.isPaidTimestamp,
    author,
    now: NOW,
  });
}

function changeOf(entry: SplitHistoryEntry | null, userName: string) {
  return entry?.balanceChanges.find((c) => c.userName === userName)?.amount;
}

function expectZeroSum(entry: SplitHistoryEntry | null) {
  const cents = (entry?.balanceChanges ?? []).reduce(
    (sum, c) => sum + Math.round(c.amount * 100),
    0
  );
  expect(cents).toBe(0);
}

/** Cumulative entries must equal the harness Split Summary, per Traveller. */
function expectEntriesMatchSummary(
  trip: SplitSummaryTrip,
  entries: (SplitHistoryEntry | null)[]
) {
  const total: Record<string, number> = {};
  for (const entry of entries) {
    for (const c of entry?.balanceChanges ?? []) {
      total[c.userName] = (total[c.userName] ?? 0) + c.amount;
    }
  }
  const expected = summaryNet(trip);
  for (const t of trip.travellers) {
    expect(total[t] ?? 0).toBeCloseTo(expected[t] ?? 0, 2);
  }
}

describe("Split history entries", () => {
  it("records an added Expense as the Balance change it caused", () => {
    const trip = makeTrip(["Alice", "Bob"]);
    const [dinner] = addExpense(
      trip,
      buildExpense(trip, { amount: 100, whoPaid: "Alice", description: "Dinner" })
    );

    const entry = entryFor(trip, "added", [], [dinner]);

    expect(entry).toMatchObject({
      kind: "added",
      description: "Dinner",
      byUid: "u1",
      byName: "Alice",
      timestamp: NOW,
      tripCurrency: "EUR",
    });
    expect(changeOf(entry, "Alice")).toBe(50);
    expect(changeOf(entry, "Bob")).toBe(-50);
    expectZeroSum(entry);
    expectEntriesMatchSummary(trip, [entry]);
  });

  it("records an edit as the difference between old and new Splits", () => {
    const trip = makeTrip(["Alice", "Bob"]);
    const [dinner] = addExpense(trip, buildExpense(trip, { amount: 100, whoPaid: "Alice" }));
    const added = entryFor(trip, "added", [], [dinner]);

    const edited = buildExpense(trip, { amount: 140, whoPaid: "Alice", id: dinner.id });
    trip.expenses = trip.expenses.map((e) => (e.id === dinner.id ? { ...edited, id: dinner.id } : e));
    const entry = entryFor(trip, "edited", [dinner], [{ ...edited, id: dinner.id }]);

    expect(changeOf(entry, "Alice")).toBe(20);
    expect(changeOf(entry, "Bob")).toBe(-20);
    expectZeroSum(entry);
    expectEntriesMatchSummary(trip, [added, entry]);
  });

  it("records delete and undo as opposite Balance changes", () => {
    const trip = makeTrip(["Alice", "Bob", "Cleo"]);
    const [lunch] = addExpense(trip, buildExpense(trip, { amount: 90, whoPaid: "Bob" }));

    const deleted = entryFor(trip, "deleted", [lunch], []);
    const undone = entryFor(trip, "undone", [], [lunch]);

    expect(changeOf(deleted, "Bob")).toBe(-60);
    expect(changeOf(undone, "Bob")).toBe(60);
    expect(changeOf(undone, "Alice")).toBe(-30);
    expectZeroSum(deleted);
    expectZeroSum(undone);
  });

  it("records Paid back as clearing the Expense's open Balance", () => {
    const trip = makeTrip(["Alice", "Bob"]);
    const added = addExpense(trip, buildExpense(trip, { amount: 100, whoPaid: "Alice" }));
    const addEntry = entryFor(trip, "added", [], added);
    const before = trip.expenses.map((e) => ({ ...e }));
    markPaidBack(trip, added[0].id as string);

    const entry = entryFor(trip, "paidBack", before, trip.expenses);

    expect(changeOf(entry, "Alice")).toBe(-50);
    expect(changeOf(entry, "Bob")).toBe(50);
    expect(trip.expenses[0].paidBack).toBe(paidBackStatus.paid);
    expectEntriesMatchSummary(trip, [addEntry, entry]);
  });

  it("records a Settlement as clearing every open Balance", () => {
    const trip = makeTrip(["Alice", "Bob", "Cleo"]);
    const a = addExpense(trip, buildExpense(trip, { amount: 90, whoPaid: "Alice" }));
    const b = addExpense(trip, buildExpense(trip, { amount: 30, whoPaid: "Bob" }));
    const entries = [entryFor(trip, "added", [], a), entryFor(trip, "added", [], b)];
    const before = [...trip.expenses];
    const settled = settleTrip({} as never, NOW + 1);
    trip.isPaidTimestamp = settled.isPaidTimestamp as number;

    const entry = buildSplitHistoryEntry({
      kind: "settlement",
      description: "",
      before,
      after: before,
      tripCurrency: trip.tripCurrency,
      isPaidTimestamp: 0,
      afterIsPaidTimestamp: trip.isPaidTimestamp,
      author,
      now: NOW,
    });

    expectZeroSum(entry);
    expect(changeOf(entry, "Alice")).toBe(-50);
    expectEntriesMatchSummary(trip, [...entries, entry]);
    expect(summaryNet(trip)).toEqual({});
  });

  it("rounds Trip currency amounts so each entry sums to exactly zero", () => {
    const trip = makeTrip(["Alice", "Bob", "Cleo"]);
    const added = addExpense(trip, buildExpense(trip, { amount: 10, whoPaid: "Alice" }));

    const entry = entryFor(trip, "added", [], added);

    expectZeroSum(entry);
    expect(entry?.balanceChanges.length).toBe(3);
  });

  it("writes no entry when the change does not affect the Split Summary", () => {
    const trip = makeTrip(["Alice", "Bob"]);
    const self = buildExpense(trip, { amount: 20, whoPaid: "Alice", splitType: "SELF", splitList: [] });

    expect(entryFor(trip, "added", [], [{ ...self, id: "s1" }])).toBeNull();
  });
});

describe("Split history entry for an edited Expense", () => {
  const base = {
    tripCurrency: "EUR",
    isPaidTimestamp: 0,
    author,
    now: NOW,
  };

  it("is an edit when the Split changes", () => {
    const trip = makeTrip(["Alice", "Bob"]);
    const [dinner] = addExpense(trip, buildExpense(trip, { amount: 100, whoPaid: "Alice" }));
    const after = { ...buildExpense(trip, { amount: 120, whoPaid: "Alice" }), id: dinner.id };

    const entry = buildExpenseEditEntry({ ...base, before: dinner, after });

    expect(entry?.kind).toBe("edited");
    expect(changeOf(entry, "Alice")).toBe(10);
  });

  it("is Paid back when the edit only marks the Expense paid back", () => {
    const trip = makeTrip(["Alice", "Bob"]);
    const [dinner] = addExpense(trip, buildExpense(trip, { amount: 100, whoPaid: "Alice" }));
    const after = { ...dinner, paidBack: paidBackStatus.paid };

    const entry = buildExpenseEditEntry({ ...base, before: dinner, after });

    expect(entry?.kind).toBe("paidBack");
    expect(changeOf(entry, "Alice")).toBe(-50);
    expectZeroSum(entry);
  });

  it("writes nothing when only the Description changes", () => {
    const trip = makeTrip(["Alice", "Bob"]);
    const [dinner] = addExpense(trip, buildExpense(trip, { amount: 100, whoPaid: "Alice" }));

    expect(
      buildExpenseEditEntry({ ...base, before: dinner, after: { ...dinner, description: "Late dinner" } })
    ).toBeNull();
  });
});
