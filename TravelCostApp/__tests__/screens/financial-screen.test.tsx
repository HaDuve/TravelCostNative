import * as React from "react";

jest.mock("@react-navigation/native", () => {
  const actual = jest.requireActual("@react-navigation/native");
  return {
    ...actual,
    useNavigation: () => ({ navigate: jest.fn() }),
  };
});

jest.mock("../../util/vexo-tracking", () => ({
  trackEvent: jest.fn(),
}));

import FinancialScreen from "../../screens/FinancialScreen";
import { makeExpense } from "../fixtures/expense";
import { renderWithAppProviders } from "../fixtures/app-providers";

describe("Financial screen", () => {
  it("shows the financial overview and entry to Split Summary", () => {
    const pastDate = new Date("2026-01-10T12:00:00.000Z");
    const screen = renderWithAppProviders(<FinancialScreen />, {
      wrapNavigation: false,
      trip: {
        totalBudget: "5000",
        dailyBudget: "100",
        startDate: pastDate.toISOString(),
        endDate: new Date("2026-02-01T12:00:00.000Z").toISOString(),
        travellers: ["Alice", "Bob"],
      },
      expenses: {
        expenses: [makeExpense({ date: pastDate, calcAmount: 40 })],
      },
    });

    expect(screen.getByText("Financial Overview")).toBeTruthy();
    expect(screen.getByText("Balance summary")).toBeTruthy();
  });
});
