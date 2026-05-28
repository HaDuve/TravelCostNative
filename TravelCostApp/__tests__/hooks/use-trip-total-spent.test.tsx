import React from "react";
import { Text } from "react-native";
import { render } from "@testing-library/react-native";

import { ExpensesContext } from "../../store/expenses-context";
import { sumForTrip } from "../../util/expenseTotals";
import { useTripTotalSpent } from "../../hooks/useTripTotalSpent";
import { makeExpense } from "../fixtures/expense";

function TotalSpent() {
  const total = useTripTotalSpent();
  return <Text testID="total">{String(total)}</Text>;
}

describe("useTripTotalSpent", () => {
  it("returns sumForTrip(expenses)", () => {
    const expenses = [
      makeExpense({ id: "e1", calcAmount: 30, splitList: [] }),
      makeExpense({ id: "e2", calcAmount: 20, splitList: [] }),
    ];

    const screen = render(
      <ExpensesContext.Provider value={{ expenses } as any}>
        <TotalSpent />
      </ExpensesContext.Provider>
    );

    expect(screen.getByTestId("total").props.children).toBe(
      String(sumForTrip(expenses))
    );
  });

  it("updates when expenses change", () => {
    const initial = [makeExpense({ id: "e1", calcAmount: 10, splitList: [] })];
    const updated = [
      makeExpense({ id: "e1", calcAmount: 10, splitList: [] }),
      makeExpense({ id: "e2", calcAmount: 25, splitList: [] }),
    ];

    const screen = render(
      <ExpensesContext.Provider value={{ expenses: initial } as any}>
        <TotalSpent />
      </ExpensesContext.Provider>
    );

    expect(screen.getByTestId("total").props.children).toBe(
      String(sumForTrip(initial))
    );

    screen.rerender(
      <ExpensesContext.Provider value={{ expenses: updated } as any}>
        <TotalSpent />
      </ExpensesContext.Provider>
    );

    expect(screen.getByTestId("total").props.children).toBe(
      String(sumForTrip(updated))
    );
  });

  it("excludes deleted expenses", () => {
    const expenses = [
      makeExpense({ id: "e1", calcAmount: 100, isDeleted: true, splitList: [] }),
      makeExpense({ id: "e2", calcAmount: 40, splitList: [] }),
    ];

    const screen = render(
      <ExpensesContext.Provider value={{ expenses } as any}>
        <TotalSpent />
      </ExpensesContext.Provider>
    );

    expect(screen.getByTestId("total").props.children).toBe(
      String(sumForTrip(expenses))
    );
  });
});

