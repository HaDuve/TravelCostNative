import {
  calculateDailyAverage,
  computeDynamicDailyBudget,
  getBudgetColor,
} from "../../util/budget";
import { makeExpense } from "../fixtures/expense";
import { GlobalStyles } from "../../constants/styles";

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2026-01-15T12:00:00.000Z"));
});

afterEach(() => {
  jest.useRealTimers();
});

describe("util/budget", () => {
  describe("computeDynamicDailyBudget", () => {
    it("computes remaining total budget divided by days left", () => {
      expect(
        computeDynamicDailyBudget({
          totalBudget: 2000,
          tripTotalSpent: 500,
          endDate: new Date("2026-01-20T00:00:00.000Z"),
          now: new Date("2026-01-15T12:00:00.000Z"),
        })
      ).toBeCloseTo(300, 6); // (2000-500) / 5 days
    });

    it("uses daysLeft=1 on the last day", () => {
      expect(
        computeDynamicDailyBudget({
          totalBudget: 2000,
          tripTotalSpent: 1900,
          endDate: new Date("2026-01-15T23:59:59.000Z"),
          now: new Date("2026-01-15T12:00:00.000Z"),
        })
      ).toBeCloseTo(100, 6);
    });

    it("clamps overspent trips to 0", () => {
      expect(
        computeDynamicDailyBudget({
          totalBudget: 100,
          tripTotalSpent: 150,
          endDate: new Date("2026-01-20T00:00:00.000Z"),
          now: new Date("2026-01-15T12:00:00.000Z"),
        })
      ).toBe(0);
    });

    it("returns 0 when daysLeft is 0 or negative", () => {
      expect(
        computeDynamicDailyBudget({
          totalBudget: 2000,
          tripTotalSpent: 500,
          endDate: new Date("2026-01-15T12:00:00.000Z"),
          now: new Date("2026-01-15T12:00:00.000Z"),
        })
      ).toBe(0);
    });
  });

  describe("getBudgetColor (traffic light)", () => {
    it("returns green when under budget", () => {
      expect(getBudgetColor(90, 100, 0, 0, true)).toBe(
        GlobalStyles.colors.primary500
      );
    });

    it("returns orange when over budget but average is under daily budget", () => {
      expect(getBudgetColor(110, 100, 9, 10, true)).toBe(
        GlobalStyles.colors.accent500
      );
    });

    it("returns red when over budget and average is over daily budget", () => {
      expect(getBudgetColor(110, 100, 11, 10, true)).toBe(
        GlobalStyles.colors.error300
      );
    });
  });

  describe("calculateDailyAverage", () => {
    it('computes "total" as trip total spent divided by days since trip start', () => {
      const expenses = [
        makeExpense({ calcAmount: 100, date: new Date("2026-01-15T12:00:00Z") }),
        makeExpense({
          id: "e2",
          calcAmount: 50,
          date: new Date("2026-01-14T12:00:00Z"),
        }),
      ];

      expect(
        calculateDailyAverage(
          "total",
          new Date("2026-01-15T12:00:00.000Z"),
          expenses,
          { startDate: "2026-01-10T00:00:00.000Z", dailyBudget: 10 },
          false
        )
      ).toBeCloseTo(150 / 5, 6);
    });
  });
});

