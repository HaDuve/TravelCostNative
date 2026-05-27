import { calcOpenSplitsTable } from "../../util/split";
import { makeExpense } from "../fixtures/expense";

describe("Open Balance rollup (calcOpenSplitsTable)", () => {
  it("rolls up open Balances from fixture expenses with splitList in trip currency", async () => {
    const expenses = [
      makeExpense({
        whoPaid: "Alice",
        amount: 100,
        calcAmount: 100,
        currency: "EUR",
        splitList: [
          { userName: "Alice", amount: 50 },
          { userName: "Bob", amount: 50 },
        ],
      }),
    ];

    const openBalances = await calcOpenSplitsTable("t1", "EUR", expenses, 0);

    expect(openBalances).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          userName: "Bob",
          whoPaid: "Alice",
          amount: 50,
        }),
      ])
    );
  });
});
