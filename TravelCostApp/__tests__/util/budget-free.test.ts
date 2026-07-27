import {
  hasDailyBudget,
  hasTotalBudget,
  isBudgetFree,
  periodProgressApplies,
} from "../../util/budget-free";
import { MAX_JS_NUMBER } from "../../confAppConstants";

describe("budget-free", () => {
  describe("hasTotalBudget", () => {
    it("treats missing, empty, zero, and MAX_JS_NUMBER as unset", () => {
      expect(hasTotalBudget({})).toBe(false);
      expect(hasTotalBudget({ totalBudget: "" })).toBe(false);
      expect(hasTotalBudget({ totalBudget: "0" })).toBe(false);
      expect(hasTotalBudget({ totalBudget: MAX_JS_NUMBER.toString() })).toBe(
        false
      );
    });

    it("treats a positive total as set", () => {
      expect(hasTotalBudget({ totalBudget: "3000" })).toBe(true);
    });
  });

  describe("hasDailyBudget", () => {
    it("treats missing, empty, and zero as unset", () => {
      expect(hasDailyBudget({})).toBe(false);
      expect(hasDailyBudget({ dailyBudget: "" })).toBe(false);
      expect(hasDailyBudget({ dailyBudget: "0" })).toBe(false);
    });

    it("treats a positive daily as set", () => {
      expect(hasDailyBudget({ dailyBudget: "50" })).toBe(true);
    });
  });

  describe("isBudgetFree", () => {
    it("is true when neither total nor daily is set", () => {
      expect(
        isBudgetFree({ totalBudget: "0", dailyBudget: "0" })
      ).toBe(true);
    });

    it("is false when only daily is set", () => {
      expect(
        isBudgetFree({ totalBudget: "0", dailyBudget: "40" })
      ).toBe(false);
    });

    it("is false when only total is set", () => {
      expect(
        isBudgetFree({ totalBudget: "2000", dailyBudget: "0" })
      ).toBe(false);
    });
  });

  describe("periodProgressApplies", () => {
    it("hides all periods when budget-free", () => {
      const trip = { totalBudget: "0", dailyBudget: "0" };
      expect(periodProgressApplies(trip, "month")).toBe(false);
      expect(periodProgressApplies(trip, "total")).toBe(false);
    });

    it("daily-only: period cues yes, total progress no", () => {
      const trip = { totalBudget: "0", dailyBudget: "40" };
      expect(periodProgressApplies(trip, "day")).toBe(true);
      expect(periodProgressApplies(trip, "month")).toBe(true);
      expect(periodProgressApplies(trip, "total")).toBe(false);
    });

    it("total-only: total progress yes, period/daily bars no", () => {
      const trip = { totalBudget: "2000", dailyBudget: "0" };
      expect(periodProgressApplies(trip, "total")).toBe(true);
      expect(periodProgressApplies(trip, "month")).toBe(false);
      expect(periodProgressApplies(trip, "day")).toBe(false);
    });
  });
});
