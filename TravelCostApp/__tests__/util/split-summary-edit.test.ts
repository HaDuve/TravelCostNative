import { DuplicateOption, paidBackStatus, type ExpenseData } from "../../util/expense";
import { buildExpenseData } from "../../util/expense-form-submit";
import {
  clearPendingUndoDelete,
  collectUserDeleteTargets,
  deleteUserExpenses,
} from "../../util/user-delete-expense";
import { expensesReducer } from "../../store/expenses-context";
import { makeExpenseFormSnapshot } from "../fixtures/expense-form";
import {
  addExpense,
  addRangedExpense,
  buildExpense,
  computeSplitSummary,
  editExpense,
  equalSplit,
  expectEditEqualsDeleteAndReAdd,
  expectSplitSummary,
  expenseCtxFor,
  makeTrip,
  resetHarnessIds,
  type ExpectedSplitSummary,
  type SplitSummaryTrip,
} from "../fixtures/split-summary";

jest.mock("react-native-toast-message", () => ({
  __esModule: true,
  default: { show: jest.fn(), hide: jest.fn() },
}));
jest.mock("../../util/http", () => ({
  touchAllTravelers: jest.fn(async () => undefined),
}));
jest.mock("../../util/offline-queue", () => ({
  deleteExpenseOnlineOffline: jest.fn(async () => undefined),
  restoreExpenseOnlineOffline: jest.fn(async () => undefined),
  updateExpenseOnlineOffline: jest.fn(async () => undefined),
  storeExpenseWithRetryAndQueue: jest.fn(async () => undefined),
  updateExpenseWithRetryAndQueue: jest.fn(async () => undefined),
  deleteExpenseWithRetryAndQueue: jest.fn(async () => undefined),
}));

const day = (d: number) => new Date(Date.UTC(2026, 0, d, 12));

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2026-01-15T12:00:00.000Z"));
  resetHarnessIds();
});
afterEach(() => {
  clearPendingUndoDelete();
  jest.useRealTimers();
});

async function userDelete(trip: SplitSummaryTrip, id: string) {
  const targets = collectUserDeleteTargets("t1", trip.expenses, [id]);
  await deleteUserExpenses({
    tripid: "t1",
    targets,
    isOnline: true,
    expenseCtx: expenseCtxFor(trip),
  });
}

type Scenario = {
  travellers?: string[];
  tripCurrency?: string;
  /** Adds the Expense(s) to the trip and returns the id of the one to edit. */
  seed: (trip: SplitSummaryTrip) => string;
  /** The edit under test, done through the real edit path. */
  edit: (trip: SplitSummaryTrip, id: string) => Promise<void>;
  /** The edited Expense added from scratch (after deleting the old one). */
  reAdd: (trip: SplitSummaryTrip) => void;
  expected: ExpectedSplitSummary;
};

async function expectEditToEqualDeleteAndReAdd(s: Scenario) {
  const edited = makeTrip(s.travellers, s.tripCurrency);
  await s.edit(edited, s.seed(edited));

  const reAdded = makeTrip(s.travellers, s.tripCurrency);
  await userDelete(reAdded, s.seed(reAdded));
  s.reAdd(reAdded);

  expectEditEqualsDeleteAndReAdd(edited, reAdded, s.expected);
}

const seedBase = (trip: SplitSummaryTrip) =>
  addExpense(trip, buildExpense(trip, { id: "target", amount: 100 }))[0].id!;
const seedOther = (trip: SplitSummaryTrip) =>
  addExpense(trip, buildExpense(trip, { id: "other", amount: 20, whoPaid: "Bob" }));

describe("Split Summary: edit == delete + re-add (single-day Expense)", () => {
  it("change the amount", () =>
    expectEditToEqualDeleteAndReAdd({
      seed: (t) => (seedOther(t), seedBase(t)),
      edit: (t, id) =>
        editExpense(t, id, { amount: 60, splitList: equalSplit(60, ["Alice", "Bob"]) }),
      reAdd: (t) => addExpense(t, buildExpense(t, { amount: 60 })),
      // Bob owes 30, Alice owes Bob 10.
      expected: { balances: [{ from: "Bob", to: "Alice", amount: 20 }] },
    }));

  it("change the Expense currency and its rate", () =>
    expectEditToEqualDeleteAndReAdd({
      seed: seedBase,
      edit: (t, id) =>
        editExpense(
          t,
          id,
          { currency: "USD", amount: 110, splitList: equalSplit(110, ["Alice", "Bob"]) },
          { rate: 1.1 }
        ),
      reAdd: (t) =>
        addExpense(
          t,
          buildExpense(t, {
            currency: "USD",
            amount: 110,
            calcAmount: 100,
            splitList: equalSplit(110, ["Alice", "Bob"]),
          })
        ),
      expected: { balances: [{ from: "Bob", to: "Alice", amount: 50 }] },
    }));

  it("change the rate of an Expense already in a foreign Expense currency (no double conversion)", () =>
    expectEditToEqualDeleteAndReAdd({
      seed: (t) =>
        addExpense(
          t,
          buildExpense(t, {
            id: "target",
            currency: "USD",
            amount: 110,
            calcAmount: 100,
            splitList: equalSplit(110, ["Alice", "Bob"]),
          })
        )[0].id!,
      edit: (t, id) =>
        editExpense(t, id, { amount: 120, splitList: equalSplit(120, ["Alice", "Bob"]) }, { rate: 1.2 }),
      reAdd: (t) =>
        addExpense(
          t,
          buildExpense(t, {
            currency: "USD",
            amount: 120,
            calcAmount: 100,
            splitList: equalSplit(120, ["Alice", "Bob"]),
          })
        ),
      expected: { balances: [{ from: "Bob", to: "Alice", amount: 50 }] },
    }));

  it("change Who paid", () =>
    expectEditToEqualDeleteAndReAdd({
      seed: seedBase,
      edit: (t, id) => editExpense(t, id, { whoPaid: "Bob" }),
      reAdd: (t) => addExpense(t, buildExpense(t, { whoPaid: "Bob" })),
      expected: { balances: [{ from: "Alice", to: "Bob", amount: 50 }] },
    }));

  it("change the Split type: equal -> exact -> percentage -> equal", async () => {
    const trip = makeTrip(["Alice", "Bob"]);
    const id = seedBase(trip);
    const exact = [
      { userName: "Alice", amount: 70 },
      { userName: "Bob", amount: 30 },
    ];
    await editExpense(trip, id, { splitType: "EXACT", splitList: exact });
    expectSplitSummary(trip, { balances: [{ from: "Bob", to: "Alice", amount: 30 }] });

    // 20% / 80% of 100, stored as amounts like the form does.
    await editExpense(trip, id, {
      splitType: "PERCENT",
      splitList: [
        { userName: "Alice", amount: 20 },
        { userName: "Bob", amount: 80 },
      ],
    });
    expectSplitSummary(trip, { balances: [{ from: "Bob", to: "Alice", amount: 80 }] });

    await editExpense(trip, id, { splitType: "EQUAL", splitList: equalSplit(100, ["Alice", "Bob"]) });
    expectSplitSummary(trip, { balances: [{ from: "Bob", to: "Alice", amount: 50 }] });
  });

  it("change the Split type to SELF removes the Expense from Balances", () =>
    expectEditToEqualDeleteAndReAdd({
      seed: seedBase,
      edit: (t, id) => editExpense(t, id, { splitType: "SELF" }),
      reAdd: (t) => addExpense(t, buildExpense(t, { splitType: "SELF", splitList: [] })),
      expected: { balances: [] },
    }));

  describe("split list edits", () => {
    const three = ["Alice", "Bob", "Carol"];
    const seedTwo = (t: SplitSummaryTrip) =>
      addExpense(
        t,
        buildExpense(t, { id: "target", amount: 90, splitList: equalSplit(90, ["Alice", "Bob"]) })
      )[0].id!;

    it("add a Traveller", () =>
      expectEditToEqualDeleteAndReAdd({
        travellers: three,
        seed: seedTwo,
        edit: (t, id) => editExpense(t, id, { splitList: equalSplit(90, three), listEQUAL: three }),
        reAdd: (t) => addExpense(t, buildExpense(t, { amount: 90 })),
        expected: {
          balances: [
            { from: "Bob", to: "Alice", amount: 30 },
            { from: "Carol", to: "Alice", amount: 30 },
          ],
        },
      }));

    it("remove a Traveller", () =>
      expectEditToEqualDeleteAndReAdd({
        travellers: three,
        seed: (t) =>
          addExpense(t, buildExpense(t, { id: "target", amount: 90 }))[0].id!,
        edit: (t, id) =>
          editExpense(t, id, {
            splitList: equalSplit(90, ["Alice", "Carol"]),
            listEQUAL: ["Alice", "Carol"],
          }),
        reAdd: (t) =>
          addExpense(
            t,
            buildExpense(t, {
              amount: 90,
              splitList: equalSplit(90, ["Alice", "Carol"]),
              listEQUAL: ["Alice", "Carol"],
            })
          ),
        expected: { balances: [{ from: "Carol", to: "Alice", amount: 45 }] },
      }));

    it("change one share (exact Split)", () => {
      const shares = [
        { userName: "Alice", amount: 10 },
        { userName: "Bob", amount: 50 },
        { userName: "Carol", amount: 30 },
      ];
      return expectEditToEqualDeleteAndReAdd({
        travellers: three,
        seed: (t) =>
          addExpense(
            t,
            buildExpense(t, {
              id: "target",
              amount: 90,
              splitType: "EXACT",
              splitList: [
                { userName: "Alice", amount: 30 },
                { userName: "Bob", amount: 30 },
                { userName: "Carol", amount: 30 },
              ],
            })
          )[0].id!,
        edit: (t, id) => editExpense(t, id, { splitList: shares }),
        reAdd: (t) =>
          addExpense(t, buildExpense(t, { amount: 90, splitType: "EXACT", splitList: shares })),
        expected: {
          balances: [
            { from: "Bob", to: "Alice", amount: 50 },
            { from: "Carol", to: "Alice", amount: 30 },
          ],
        },
      });
    });

    it("reorder the split list changes nothing", () =>
      expectEditToEqualDeleteAndReAdd({
        travellers: three,
        seed: (t) => addExpense(t, buildExpense(t, { id: "target", amount: 90 }))[0].id!,
        edit: (t, id) =>
          editExpense(t, id, { splitList: [...equalSplit(90, three)].reverse() }),
        reAdd: (t) => addExpense(t, buildExpense(t, { amount: 90 })),
        expected: {
          balances: [
            { from: "Bob", to: "Alice", amount: 30 },
            { from: "Carol", to: "Alice", amount: 30 },
          ],
        },
      }));
  });

  it("toggle Special expense changes nothing", async () => {
    const trip = makeTrip(["Alice", "Bob"]);
    const id = seedBase(trip);
    await editExpense(trip, id, { isSpecialExpense: true });
    expectSplitSummary(trip, { balances: [{ from: "Bob", to: "Alice", amount: 50 }] });
    await editExpense(trip, id, { isSpecialExpense: false });
    expectSplitSummary(trip, { balances: [{ from: "Bob", to: "Alice", amount: 50 }] });
  });

  it("toggle Paid back removes then restores the open Balance", async () => {
    const trip = makeTrip(["Alice", "Bob"]);
    const id = seedBase(trip);
    seedOther(trip);
    await editExpense(trip, id, { paidBack: paidBackStatus.paid });
    expectSplitSummary(trip, { balances: [{ from: "Alice", to: "Bob", amount: 10 }] });
    await editExpense(trip, id, { paidBack: paidBackStatus.notPaid });
    expectSplitSummary(trip, { balances: [{ from: "Bob", to: "Alice", amount: 40 }] });
  });

  it("Edit resumption: saving a restored draft equals delete + re-add", () => {
    const snapshot = makeExpenseFormSnapshot({
      amountValue: "80",
      startDateIso: "2026-01-15",
      endDateIso: "2026-01-15",
      userName: "Alice",
      whoPaid: "Bob",
      listEQUAL: ["Alice", "Bob"],
      splitList: equalSplit(80, ["Alice", "Bob"]),
    });
    const draft = buildExpenseData(snapshot);
    return expectEditToEqualDeleteAndReAdd({
      seed: seedBase,
      edit: (t, id) => editExpense(t, id, draft, { replace: true }),
      reAdd: (t) => addExpense(t, buildExpense(t, { amount: 80, whoPaid: "Bob" })),
      expected: { balances: [{ from: "Alice", to: "Bob", amount: 40 }] },
    });
  });
});

describe("Split Summary: Ranged expense edits", () => {
  const range = (trip: SplitSummaryTrip, o: Partial<ExpenseData>, a: number, b: number) =>
    addRangedExpense(trip, o, day(a), day(b));
  const splitOpt = { duplOrSplit: DuplicateOption.split };
  const dupOpt = { duplOrSplit: DuplicateOption.duplicate };

  it("single-day Expense becomes a Ranged split", () =>
    expectEditToEqualDeleteAndReAdd({
      seed: seedBase,
      edit: (t, id) =>
        editExpense(t, id, {
          ...splitOpt,
          startDate: day(1),
          endDate: day(4),
          date: day(1),
          alreadyDividedAmountByDays: false,
        }),
      reAdd: (t) => range(t, { amount: 100, ...splitOpt }, 1, 4),
      expected: { balances: [{ from: "Bob", to: "Alice", amount: 50 }] },
    }));

  it("Ranged expense becomes a single-day Expense", () =>
    expectEditToEqualDeleteAndReAdd({
      seed: (t) => range(t, { amount: 90, ...splitOpt }, 1, 3)[0].id!,
      edit: (t, id) =>
        editExpense(t, id, {
          amount: 90,
          splitList: equalSplit(90, ["Alice", "Bob"]),
          startDate: day(2),
          endDate: day(2),
          date: day(2),
          duplOrSplit: DuplicateOption.null,
        }),
      reAdd: (t) => addExpense(t, buildExpense(t, { amount: 90 })),
      expected: { balances: [{ from: "Bob", to: "Alice", amount: 45 }] },
    }));

  it("change the date range of a Ranged split (3 days -> 5 days keeps the total)", () =>
    expectEditToEqualDeleteAndReAdd({
      seed: (t) => range(t, { amount: 90, ...splitOpt }, 1, 3)[0].id!,
      edit: (t, id) =>
        editExpense(t, id, {
          endDate: day(5),
          amount: 90,
          splitList: equalSplit(90, ["Alice", "Bob"]),
          alreadyDividedAmountByDays: false,
        }),
      reAdd: (t) => range(t, { amount: 90, ...splitOpt }, 1, 5),
      expected: { balances: [{ from: "Bob", to: "Alice", amount: 45 }] },
    }));

  it("change the date range of a Ranged duplicate (3 days -> 5 days repeats the amount)", () =>
    expectEditToEqualDeleteAndReAdd({
      seed: (t) => range(t, { amount: 90, ...dupOpt }, 1, 3)[0].id!,
      edit: (t, id) => editExpense(t, id, { endDate: day(5) }),
      reAdd: (t) => range(t, { amount: 90, ...dupOpt }, 1, 5),
      expected: { balances: [{ from: "Bob", to: "Alice", amount: 225 }] },
    }));

  it("switch Ranged split -> Ranged duplicate", () =>
    expectEditToEqualDeleteAndReAdd({
      seed: (t) => range(t, { amount: 90, ...splitOpt }, 1, 3)[0].id!,
      // Form shows per-day 30; switching to duplicate keeps that per-day amount.
      edit: (t, id) => editExpense(t, id, { ...dupOpt }),
      reAdd: (t) => range(t, { amount: 30, ...dupOpt }, 1, 3),
      expected: { balances: [{ from: "Bob", to: "Alice", amount: 45 }] },
    }));

  it("switch Ranged duplicate -> Ranged split of the same total", () =>
    expectEditToEqualDeleteAndReAdd({
      seed: (t) => range(t, { amount: 30, ...dupOpt }, 1, 3)[0].id!,
      edit: (t, id) =>
        editExpense(t, id, {
          ...splitOpt,
          amount: 90,
          splitList: equalSplit(90, ["Alice", "Bob"]),
          alreadyDividedAmountByDays: false,
        }),
      reAdd: (t) => range(t, { amount: 90, ...splitOpt }, 1, 3),
      expected: { balances: [{ from: "Bob", to: "Alice", amount: 45 }] },
    }));

  it("editing one day or any other day edits the whole range", async () => {
    for (const index of [0, 1, 2]) {
      await expectEditToEqualDeleteAndReAdd({
        seed: (t) => range(t, { amount: 90, ...splitOpt }, 1, 3)[index].id!,
        edit: (t, id) =>
          editExpense(t, id, { whoPaid: "Bob", amount: 45, splitList: equalSplit(45, ["Alice", "Bob"]) }),
        reAdd: (t) => range(t, { amount: 135, whoPaid: "Bob", ...splitOpt }, 1, 3),
        expected: { balances: [{ from: "Alice", to: "Bob", amount: 67.5 }] },
      });
    }
  });

  it("change Who paid and Split type of a whole range leaves no stale days", async () => {
    const trip = makeTrip(["Alice", "Bob"]);
    const [first] = range(trip, { amount: 90, ...splitOpt }, 1, 3);
    await editExpense(trip, first.id!, {
      splitType: "EXACT",
      splitList: [
        { userName: "Alice", amount: 10 },
        { userName: "Bob", amount: 20 },
      ],
    });
    // 3 days x Bob 20.
    expectSplitSummary(trip, { balances: [{ from: "Bob", to: "Alice", amount: 60 }] });
  });

  it("toggle Special expense and Paid back on a Ranged expense", async () => {
    const trip = makeTrip(["Alice", "Bob"]);
    const [first] = range(trip, { amount: 90, ...splitOpt }, 1, 3);
    await editExpense(trip, first.id!, { isSpecialExpense: true });
    expectSplitSummary(trip, { balances: [{ from: "Bob", to: "Alice", amount: 45 }] });
    await editExpense(trip, first.id!, { paidBack: paidBackStatus.paid });
    expectSplitSummary(trip, { balances: [] });
  });

  it("changing the Expense currency of a Ranged split", () =>
    expectEditToEqualDeleteAndReAdd({
      seed: (t) => range(t, { amount: 90, ...splitOpt }, 1, 3)[0].id!,
      edit: (t, id) =>
        editExpense(
          t,
          id,
          {
            currency: "USD",
            amount: 33,
            splitList: equalSplit(33, ["Alice", "Bob"]),
          },
          { rate: 1.1 }
        ),
      // 3 days x 33 USD = 99 USD = 90 EUR.
      reAdd: (t) =>
        addRangedExpense(
          t,
          {
            currency: "USD",
            amount: 99,
            calcAmount: 90,
            splitList: equalSplit(99, ["Alice", "Bob"]),
            ...splitOpt,
          },
          day(1),
          day(3)
        ),
      expected: { balances: [{ from: "Bob", to: "Alice", amount: 45 }] },
    }));
});

describe("Split Summary: rates per Expense", () => {
  it("two Expenses in the same foreign Expense currency keep their own rates", () => {
    const trip = makeTrip(["Alice", "Bob"]);
    addExpense(
      trip,
      buildExpense(trip, {
        currency: "USD",
        amount: 110,
        calcAmount: 100,
        splitList: equalSplit(110, ["Alice", "Bob"]),
      })
    );
    addExpense(
      trip,
      buildExpense(trip, {
        currency: "USD",
        amount: 120,
        calcAmount: 100,
        splitList: equalSplit(120, ["Alice", "Bob"]),
      })
    );
    expectSplitSummary(trip, { balances: [{ from: "Bob", to: "Alice", amount: 100 }] });
  });
});

describe("Split Summary: offline edit and concurrent edit", () => {
  it("an edit made offline is not applied twice when the server copy is merged after sync", async () => {
    const trip = makeTrip(["Alice", "Bob"]);
    const id = seedBase(trip);
    trip.expenses = trip.expenses.map((e) => ({ ...e, serverTimestamp: 1000 }));
    const old = trip.expenses[0];

    await editExpense(trip, id, { amount: 60, splitList: equalSplit(60, ["Alice", "Bob"]) }, { isOnline: false });
    const afterEdit = computeSplitSummary(trip);
    expectSplitSummary(trip, { balances: [{ from: "Bob", to: "Alice", amount: 30 }] });

    // Fetch returns the old server copy first, then the synced edit.
    trip.expenses = expensesReducer(trip.expenses, { type: "MERGE", payload: [old] });
    expect(computeSplitSummary(trip)).toEqual(afterEdit);
    const synced = { ...trip.expenses[0], serverTimestamp: 2000 };
    trip.expenses = expensesReducer(trip.expenses, { type: "MERGE", payload: [synced] });
    trip.expenses = expensesReducer(trip.expenses, { type: "MERGE", payload: [synced] });
    expect(computeSplitSummary(trip)).toEqual(afterEdit);
    expect(trip.expenses).toHaveLength(1);
  });

  it("concurrent edit by another Traveller: last write wins, no orphaned split rows of the replaced range", () => {
    const trip = makeTrip(["Alice", "Bob"]);
    const added = addRangedExpense(
      trip,
      { amount: 90, duplOrSplit: DuplicateOption.split },
      day(1),
      day(3)
    );
    trip.expenses = trip.expenses.map((e) => ({ ...e, serverTimestamp: 1000 }));

    // Another Traveller (Bob) replaced the range: old days tombstoned, 2 new days.
    const tombstones = added.map((e) => ({
      ...e,
      isDeleted: true,
      serverTimestamp: 3000,
      editedTimestamp: 3000,
    }));
    const replacement = [day(1), day(2)].map((date, i) => ({
      ...added[0],
      id: `remote-${i}`,
      rangeId: "r2",
      date,
      whoPaid: "Bob",
      amount: 45,
      calcAmount: 45,
      splitList: equalSplit(45, ["Alice", "Bob"]),
      serverTimestamp: 3000,
      editedTimestamp: 3000,
    }));
    trip.expenses = expensesReducer(trip.expenses, {
      type: "MERGE",
      payload: [...tombstones, ...replacement],
    });

    // 2 days x Alice owes Bob 22.5.
    expectSplitSummary(trip, { balances: [{ from: "Alice", to: "Bob", amount: 45 }] });
  });
});
