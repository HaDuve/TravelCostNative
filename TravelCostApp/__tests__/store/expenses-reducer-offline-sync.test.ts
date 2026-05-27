import { expensesReducer, mergeExpenseLists } from "../../store/expenses-context";
import { makeExpense } from "../fixtures/expense";

describe("offline expense sync merge", () => {
  const editedTimestamp = 1_700_000_000_000;

  it("keeps one expense when server merge uses the same id as the offline-created expense", () => {
    const offlineExpense = makeExpense({
      id: "offline-client-id",
      editedTimestamp,
      amount: 42,
      description: "street food",
    });

    let state = expensesReducer([], { type: "ADD", payload: offlineExpense });
    state = mergeExpenseLists(state, [
      makeExpense({
        id: "offline-client-id",
        editedTimestamp,
        amount: 42,
        description: "street food",
        serverTimestamp: editedTimestamp + 1,
      }),
    ]);

    expect(state).toHaveLength(1);
    expect(state[0].id).toBe("offline-client-id");
    expect(state[0].serverTimestamp).toBe(editedTimestamp + 1);
  });

  it("reconciles offline and server rows when sync used a different expense id", () => {
    const offlineExpense = makeExpense({
      id: "local-offline-id",
      editedTimestamp,
      amount: 42,
      description: "street food",
    });

    let state = expensesReducer([], { type: "ADD", payload: offlineExpense });
    state = mergeExpenseLists(state, [
      makeExpense({
        id: "server-generated-id",
        editedTimestamp,
        amount: 42,
        description: "street food",
        serverTimestamp: editedTimestamp + 1,
      }),
    ]);

    expect(state).toHaveLength(1);
    expect(state[0].id).toBe("server-generated-id");
    expect(state.map((expense) => expense.id)).not.toContain("local-offline-id");
  });

  it("does not add a second row when add is called again with the same id", () => {
    const offlineExpense = makeExpense({
      id: "offline-client-id",
      editedTimestamp,
    });

    let state = expensesReducer([], { type: "ADD", payload: offlineExpense });
    state = expensesReducer(state, { type: "ADD", payload: offlineExpense });

    expect(state).toHaveLength(1);
  });
});
