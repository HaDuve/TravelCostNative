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

  it("excludes deleted expenses from the active ledger view", () => {
    const ledger = activeExpenses([
      makeExpense({ id: "active" }),
      makeExpense({ id: "gone", isDeleted: true }),
    ]);

    expect(ledger.map((expense) => expense.id)).toEqual(["active"]);
  });
});
