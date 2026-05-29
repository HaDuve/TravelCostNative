import {
  activeExpenses,
  expensesReducer,
  mergeExpenseLists,
} from "../../store/expenses-context";
import { makeExpense } from "../fixtures/expense";

describe("deleted expense tombstones in expenses state", () => {
  it("marks an expense isDeleted instead of removing it from state", () => {
    const expense = makeExpense({ id: "e1" });
    let state = expensesReducer([], { type: "ADD", payload: expense });
    state = expensesReducer(state, { type: "DELETE", payload: "e1" });

    expect(state).toHaveLength(1);
    expect(state[0].id).toBe("e1");
    expect(state[0].isDeleted).toBe(true);
  });

  it("keeps a tombstone when sync merges a server-side deleted expense", () => {
    const expense = makeExpense({
      id: "e1",
      serverTimestamp: 1,
      editedTimestamp: 1,
    });
    let state = expensesReducer([], { type: "ADD", payload: expense });
    state = mergeExpenseLists(state, [
      makeExpense({
        id: "e1",
        isDeleted: true,
        serverTimestamp: 2,
        editedTimestamp: 2,
      }),
    ]);

    expect(state).toHaveLength(1);
    expect(state[0].id).toBe("e1");
    expect(state[0].isDeleted).toBe(true);
  });

  it("removes draft temp rows from state instead of tombstoning them", () => {
    const expense = makeExpense({ id: "temp" });
    let state = expensesReducer([], { type: "ADD", payload: expense });
    state = expensesReducer(state, { type: "DELETE", payload: "temp" });

    expect(state).toHaveLength(0);
  });

  it("adds a tombstone when sync merges a deleted expense not yet on device", () => {
    const state = mergeExpenseLists([], [
      makeExpense({
        id: "remote-deleted",
        isDeleted: true,
        serverTimestamp: 2,
      }),
    ]);

    expect(state).toHaveLength(1);
    expect(state[0].id).toBe("remote-deleted");
    expect(state[0].isDeleted).toBe(true);
  });

  it("preserves local tombstone when server refresh omits the deleted expense", () => {
    let state = expensesReducer([], {
      type: "ADD",
      payload: makeExpense({ id: "e1" }),
    });
    state = expensesReducer(state, { type: "DELETE", payload: "e1" });
    state = mergeExpenseLists(state, [makeExpense({ id: "e2" })]);

    const tombstone = state.find((expense) => expense.id === "e1");
    expect(tombstone?.isDeleted).toBe(true);
    expect(state).toHaveLength(2);
  });

  it("preserves local tombstone when sync merges a stale active server row", () => {
    const deleteTime = 2_000;
    jest.spyOn(Date, "now").mockReturnValue(deleteTime);

    let state = expensesReducer([], {
      type: "ADD",
      payload: makeExpense({
        id: "e1",
        editedTimestamp: 100,
        serverTimestamp: 100,
      }),
    });
    state = expensesReducer(state, { type: "DELETE", payload: "e1" });
    state = mergeExpenseLists(state, [
      makeExpense({
        id: "e1",
        isDeleted: false,
        editedTimestamp: 100,
        serverTimestamp: 150,
      }),
    ]);

    expect(state).toHaveLength(1);
    expect(state[0].isDeleted).toBe(true);
    expect(state[0].editedTimestamp).toBe(deleteTime);

    jest.restoreAllMocks();
  });

  it("clears isDeleted when a deleted expense is restored", () => {
    const deleteTime = 2_000;
    jest.spyOn(Date, "now").mockReturnValue(deleteTime);

    let state = expensesReducer([], {
      type: "ADD",
      payload: makeExpense({ id: "e1" }),
    });
    state = expensesReducer(state, { type: "DELETE", payload: "e1" });
    state = expensesReducer(state, { type: "RESTORE", payload: "e1" });

    expect(state).toHaveLength(1);
    expect(state[0].isDeleted).toBe(false);
    expect(state[0].editedTimestamp).toBe(deleteTime);
    expect(state[0].serverTimestamp).toBe(deleteTime);
    expect(activeExpenses(state).map((expense) => expense.id)).toEqual(["e1"]);

    jest.restoreAllMocks();
  });

  it("restores multiple deleted expenses", () => {
    let state = expensesReducer([], {
      type: "ADD",
      payload: makeExpense({ id: "e1" }),
    });
    state = expensesReducer(state, {
      type: "ADD",
      payload: makeExpense({ id: "e2" }),
    });
    state = expensesReducer(state, { type: "DELETE", payload: "e1" });
    state = expensesReducer(state, { type: "DELETE", payload: "e2" });
    state = expensesReducer(state, { type: "RESTORE", payload: "e1" });
    state = expensesReducer(state, { type: "RESTORE", payload: "e2" });

    expect(activeExpenses(state).map((expense) => expense.id).sort()).toEqual([
      "e1",
      "e2",
    ]);
  });

  it("excludes deleted expenses from the active ledger view", () => {
    const ledger = activeExpenses([
      makeExpense({ id: "active" }),
      makeExpense({ id: "gone", isDeleted: true }),
    ]);

    expect(ledger.map((expense) => expense.id)).toEqual(["active"]);
  });
});
