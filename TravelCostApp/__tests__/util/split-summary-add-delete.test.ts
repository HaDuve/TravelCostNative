import { DuplicateOption, paidBackStatus } from "../../util/expense";
import { buildFastExpenseData } from "../../util/expense-form-submit";
import {
  collectUserDeleteTargets,
  clearPendingUndoDelete,
  deleteUserExpenses,
} from "../../util/user-delete-expense";
import { buildTemplateExpenseData } from "../../util/expense-template";
import { settleTrip } from "../../util/settlement";
import { calcSplitList } from "../../util/split";
import { makeExpenseFormSnapshot } from "../fixtures/expense-form";
import {
  addExpense,
  buildExpense,
  computeSplitSummary,
  equalSplit,
  expectSplitSummary,
  expenseCtxFor,
  makeTrip,
  markPaidBack,
  resetHarnessIds,
  type SplitSummaryTrip,
} from "../fixtures/split-summary";
import Toast from "react-native-toast-message";

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
}));

const day = (d: number) => new Date(Date.UTC(2026, 0, d, 12));

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2026-01-15T12:00:00.000Z"));
  resetHarnessIds();
  (Toast.show as jest.Mock).mockClear();
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

async function userUndo() {
  const call = (Toast.show as jest.Mock).mock.calls.find(
    ([arg]) => arg.type === "deletedExpense"
  );
  await call[0].props.onUndo();
}

describe("Split Summary: add Expense flows", () => {
  it("Fast expense with the default equal Split: Bob owes Alice half", () => {
    const trip = makeTrip(["Alice", "Bob"]);
    const snapshot = makeExpenseFormSnapshot({
      amountValue: "100",
      userName: "Alice",
      lastCurrency: "EUR",
      listEQUAL: ["Alice", "Bob"],
      splitList: calcSplitList("EQUAL", 100, "Alice", ["Alice", "Bob"]),
    });
    addExpense(trip, buildFastExpenseData(snapshot));

    expectSplitSummary(trip, {
      balances: [{ from: "Bob", to: "Alice", amount: 50 }],
    });
  });

  it("Advanced expense: exact, percentage and equal Splits, other Who paid, subset of Travellers", () => {
    const trip = makeTrip(["Alice", "Bob", "Carol", "Dave"]);
    // Alice pays 100, exact: Bob 30, Carol 20, Alice 50.
    addExpense(
      trip,
      buildExpense(trip, {
        id: "x1",
        whoPaid: "Alice",
        splitType: "EXACT",
        splitList: [
          { userName: "Alice", amount: 50 },
          { userName: "Bob", amount: 30 },
          { userName: "Carol", amount: 20 },
        ],
      })
    );
    // Bob pays 200, percent: Alice 25%, Bob 25%, Dave 50% (amounts as stored).
    addExpense(
      trip,
      buildExpense(trip, {
        id: "x2",
        amount: 200,
        whoPaid: "Bob",
        splitType: "PERCENT",
        splitList: [
          { userName: "Alice", amount: 50 },
          { userName: "Bob", amount: 50 },
          { userName: "Dave", amount: 100 },
        ],
      })
    );
    // Carol pays 90, equal between Carol and Dave only.
    addExpense(
      trip,
      buildExpense(trip, {
        id: "x3",
        amount: 90,
        whoPaid: "Carol",
        splitList: equalSplit(90, ["Carol", "Dave"]),
        listEQUAL: ["Carol", "Dave"],
      })
    );

    // Net: Alice +50 -50 = 0 owed? Alice is owed 30+20, owes Bob 50 -> Alice 0 with Bob.
    // Pairs: Bob->Alice 30 vs Alice->Bob 50 => Alice->Bob 20.
    // Carol->Alice 20. Dave->Bob 100. Dave->Carol 45.
    expectSplitSummary(trip, {
      balances: [
        { from: "Alice", to: "Bob", amount: 20 },
        { from: "Carol", to: "Alice", amount: 20 },
        { from: "Dave", to: "Bob", amount: 100 },
        { from: "Dave", to: "Carol", amount: 45 },
      ],
    });
  });

  it("Balances do not depend on the order Expenses were added", () => {
    const names = ["Alice", "Bob", "Carol"];
    const specs = [
      { whoPaid: "Alice", amount: 100, among: ["Alice", "Bob"] },
      { whoPaid: "Bob", amount: 60, among: names },
      { whoPaid: "Carol", amount: 30, among: ["Bob", "Carol"] },
    ];
    const summaries = [specs, [...specs].reverse()].map((order) => {
      const trip = makeTrip(names);
      order.forEach((s) =>
        addExpense(
          trip,
          buildExpense(trip, {
            whoPaid: s.whoPaid,
            amount: s.amount,
            splitList: equalSplit(s.amount, s.among),
          })
        )
      );
      return trip;
    });
    // Hand-computed: Bob->Alice 50 vs Alice->Bob 20 => Bob->Alice 30;
    // Carol->Bob 20 vs Bob->Carol 15 => Carol->Bob 5.
    const expected = {
      balances: [
        { from: "Bob", to: "Alice", amount: 30 },
        { from: "Carol", to: "Bob", amount: 5 },
      ],
    };
    summaries.forEach((trip) => expectSplitSummary(trip, expected));
  });

  it("foreign Expense currency is converted to Trip currency", () => {
    const trip = makeTrip(["Alice", "Bob"], "EUR");
    // 110 USD = 100 EUR (rate 1.1), split equally.
    addExpense(
      trip,
      buildExpense(trip, {
        currency: "USD",
        amount: 110,
        calcAmount: 100,
        splitList: equalSplit(110, ["Alice", "Bob"]),
      })
    );

    expectSplitSummary(trip, {
      balances: [{ from: "Bob", to: "Alice", amount: 50 }],
    });
  });

  it("Ranged split spreads the cost across days; total Balance equals the total cost share", () => {
    const trip = makeTrip(["Alice", "Bob"]);
    addExpense(trip, buildExpense(trip, { amount: 90, duplOrSplit: DuplicateOption.split }), {
      dates: [day(1), day(2), day(3)],
      rangeId: "r1",
    });

    expect(trip.expenses).toHaveLength(3);
    expectSplitSummary(trip, {
      balances: [{ from: "Bob", to: "Alice", amount: 45 }],
    });
  });

  it("Ranged duplicate repeats the full amount on each day", () => {
    const trip = makeTrip(["Alice", "Bob"]);
    addExpense(
      trip,
      buildExpense(trip, { amount: 90, duplOrSplit: DuplicateOption.duplicate }),
      { dates: [day(1), day(2), day(3)], rangeId: "r1" }
    );

    expectSplitSummary(trip, {
      balances: [{ from: "Bob", to: "Alice", amount: 135 }],
    });
  });

  it("Template expense adds a new ledger row prefilled from a prior Expense", () => {
    const trip = makeTrip(["Alice", "Bob"]);
    const [original] = addExpense(trip, buildExpense(trip, { amount: 4.5 }));
    // Template path (AddExpenseButton.handleSelectTemplate).
    const fields = buildTemplateExpenseData(original, day(20));
    addExpense(trip, fields);

    expect(trip.expenses).toHaveLength(2);
    expectSplitSummary(trip, {
      balances: [{ from: "Bob", to: "Alice", amount: 4.5 }],
    });
  });

  it("Special expense still counts towards Balances", () => {
    const trip = makeTrip(["Alice", "Bob"]);
    addExpense(trip, buildExpense(trip, { amount: 60, isSpecialExpense: true }));

    expectSplitSummary(trip, {
      balances: [{ from: "Bob", to: "Alice", amount: 30 }],
    });
  });
});

describe("Split Summary: delete flows", () => {
  it("a Deleted expense no longer affects Balances", async () => {
    const trip = makeTrip(["Alice", "Bob"]);
    addExpense(trip, buildExpense(trip, { id: "keep", amount: 100 }));
    addExpense(trip, buildExpense(trip, { id: "gone", amount: 40, whoPaid: "Bob" }));
    expectSplitSummary(trip, {
      balances: [{ from: "Bob", to: "Alice", amount: 30 }],
    });

    await userDelete(trip, "gone");

    expectSplitSummary(trip, {
      balances: [{ from: "Bob", to: "Alice", amount: 50 }],
    });
  });

  it("deleting a Ranged expense deletes the whole range", async () => {
    const trip = makeTrip(["Alice", "Bob"]);
    const added = addExpense(
      trip,
      buildExpense(trip, { amount: 90, duplOrSplit: DuplicateOption.split }),
      { dates: [day(1), day(2), day(3)], rangeId: "r1" }
    );
    addExpense(trip, buildExpense(trip, { id: "other", amount: 20 }));

    await userDelete(trip, added[1].id);

    expectSplitSummary(trip, {
      balances: [{ from: "Bob", to: "Alice", amount: 10 }],
    });
  });

  it("Undo restores the exact prior summary (single and ranged)", async () => {
    const trip = makeTrip(["Alice", "Bob", "Carol"]);
    const [first] = addExpense(trip, buildExpense(trip, { amount: 90, whoPaid: "Alice" }));
    const ranged = addExpense(
      trip,
      buildExpense(trip, { amount: 60, whoPaid: "Bob", duplOrSplit: DuplicateOption.split }),
      { dates: [day(1), day(2)], rangeId: "r1" }
    );
    const before = computeSplitSummary(trip);

    await userDelete(trip, first.id);
    expect(computeSplitSummary(trip)).not.toEqual(before);
    await userUndo();
    expect(computeSplitSummary(trip)).toEqual(before);

    (Toast.show as jest.Mock).mockClear();
    await userDelete(trip, ranged[0].id);
    await userUndo();
    expect(computeSplitSummary(trip)).toEqual(before);
  });
});

describe("Split Summary: Paid back, Settlement, Balance simplification", () => {
  it("marking an Expense Paid back removes it from open Balances", () => {
    const trip = makeTrip(["Alice", "Bob"]);
    addExpense(trip, buildExpense(trip, { id: "a", amount: 100 }));
    addExpense(trip, buildExpense(trip, { id: "b", amount: 40 }));

    markPaidBack(trip, "a");

    expect(trip.expenses.find((e) => e.id === "a")?.paidBack).toBe(
      paidBackStatus.paid
    );
    expectSplitSummary(trip, {
      balances: [{ from: "Bob", to: "Alice", amount: 20 }],
    });
  });

  it("Settlement clears Balances; Expenses added or edited afterwards stay open", () => {
    const trip = makeTrip(["Alice", "Bob"]);
    addExpense(trip, buildExpense(trip, { amount: 100, editedTimestamp: 1000 }));
    trip.isPaidTimestamp = settleTrip({ tripid: "t1", tripCurrency: trip.tripCurrency }, 5000).isPaidTimestamp;
    expectSplitSummary(trip, { balances: [] });

    addExpense(trip, buildExpense(trip, { amount: 30, whoPaid: "Bob", editedTimestamp: 6000 }));
    expectSplitSummary(trip, {
      balances: [{ from: "Alice", to: "Bob", amount: 15 }],
    });
  });
});
