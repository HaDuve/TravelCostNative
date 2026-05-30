import * as React from "react";

jest.mock("@react-navigation/native", () => {
  const actual = jest.requireActual("@react-navigation/native");
  return {
    ...actual,
    useNavigation: () => ({ pop: jest.fn(), navigate: jest.fn() }),
  };
});

const mockExpensesOutput = jest.fn(() => null);
jest.mock("../../components/ExpensesOutput/ExpensesOutput", () => ({
  __esModule: true,
  default: (props: unknown) => {
    mockExpensesOutput(props);
    return null;
  },
}));

import FilteredExpenses from "../../screens/FilteredExpenses";
import { renderWithAppProviders } from "../fixtures/app-providers";
import { makeExpense } from "../fixtures/expense";
import { toExpenseNavigationDtos } from "../../util/expense-navigation-dto";
import { i18n } from "../../i18n/i18n";

describe("FilteredExpenses route params", () => {
  beforeEach(() => {
    mockExpensesOutput.mockClear();
  });

  it("hydrates serializable expense DTOs from route params for list rendering", () => {
    const expenses = [
      makeExpense({
        id: "older",
        date: new Date("2026-01-01T00:00:00.000Z"),
      }),
      makeExpense({
        id: "newer",
        date: new Date("2026-01-15T00:00:00.000Z"),
      }),
    ];

    renderWithAppProviders(
      <FilteredExpenses
        route={{
          params: {
            expenses: toExpenseNavigationDtos(expenses),
            dayString: "Jan 2026",
            showSumForTravellerName: "Alice",
          },
        }}
      />
    );

    expect(mockExpensesOutput).toHaveBeenCalledWith(
      expect.objectContaining({
        isFiltered: true,
        showSumForTravellerName: "Alice",
        expenses: expect.arrayContaining([
          expect.objectContaining({
            id: "older",
            date: new Date("2026-01-01T00:00:00.000Z"),
          }),
          expect.objectContaining({
            id: "newer",
            date: new Date("2026-01-15T00:00:00.000Z"),
          }),
        ]),
      })
    );

    expect(
      mockExpensesOutput.mock.calls[0][0].expenses.map(
        (exp: { id: string }) => exp.id
      )
    ).toEqual(["older", "newer"]);
  });

  it("renders an empty filtered list when route params omit expenses", () => {
    renderWithAppProviders(
      <FilteredExpenses
        route={{
          params: {
            dayString: "Empty",
          },
        }}
      />
    );

    expect(mockExpensesOutput).toHaveBeenCalledWith(
      expect.objectContaining({
        isFiltered: true,
        expenses: [],
      })
    );
  });

  it("uses the earliest hydrated expense date for add-expense-here", () => {
    const expenses = [
      makeExpense({
        id: "later",
        date: new Date("2026-03-20T00:00:00.000Z"),
      }),
      makeExpense({
        id: "earlier",
        date: new Date("2026-03-05T00:00:00.000Z"),
      }),
    ];

    const screen = renderWithAppProviders(
      <FilteredExpenses
        route={{
          params: {
            expenses: toExpenseNavigationDtos(expenses),
            dayString: "Mar 2026",
          },
        }}
      />
    );

    expect(
      screen.getByText(new RegExp(i18n.t("addExp"), "i"))
    ).toBeTruthy();
  });
});
