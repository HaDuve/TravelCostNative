import { rollupOpenBalances } from "../../util/split";
import { makeExpense } from "../fixtures/expense";

describe("Open Balance rollup (rollupOpenBalances)", () => {
  it("rolls up open Balances from fixture expenses with splitList in trip currency", () => {
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

    const openBalances = rollupOpenBalances(expenses, "EUR", 0);

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

  it("converts split amounts to trip currency when expense currency differs", () => {
    const expenses = [
      makeExpense({
        whoPaid: "Alice",
        // 110 USD total equals 100 EUR calcAmount -> rate 1.1 USD/EUR
        amount: 110,
        calcAmount: 100,
        currency: "USD",
        splitList: [
          { userName: "Alice", amount: 55 },
          { userName: "Bob", amount: 55 },
        ],
      }),
    ];

    const openBalances = rollupOpenBalances(expenses, "EUR", 0);

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

  it("keeps an expense open when edited after the settlement timestamp", () => {
    const expenses = [
      makeExpense({
        whoPaid: "Alice",
        amount: 100,
        calcAmount: 100,
        currency: "EUR",
        editedTimestamp: 2000,
        splitList: [
          { userName: "Alice", amount: 50 },
          { userName: "Bob", amount: 50 },
        ],
      }),
    ];

    const openBalances = rollupOpenBalances(expenses, "EUR", 1000);

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
