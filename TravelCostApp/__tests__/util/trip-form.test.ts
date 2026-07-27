import {
  buildTripFormSubmitData,
  hasOptionalTripFormValues,
  resolveTripFormMode,
  shouldConfirmCurrencyChange,
} from "../../util/trip-form";
import { resolvePeriodStartDate } from "../../util/budget-free";

describe("trip-form", () => {
  describe("resolveTripFormMode", () => {
    it("uses explicit promote / addAnother / edit modes", () => {
      expect(resolveTripFormMode({ mode: "promote", tripId: "t1" })).toBe(
        "promote"
      );
      expect(resolveTripFormMode({ mode: "addAnother" })).toBe("addAnother");
      expect(resolveTripFormMode({ mode: "edit", tripId: "t1" })).toBe("edit");
    });

    it("promotes when editing an implicit default trip without mode", () => {
      expect(
        resolveTripFormMode({ tripId: "t1" }, { isImplicitDefault: true })
      ).toBe("promote");
    });

    it("edits a named trip with tripId", () => {
      expect(resolveTripFormMode({ tripId: "t1" })).toBe("edit");
    });

    it("defaults to addAnother with no tripId", () => {
      expect(resolveTripFormMode({})).toBe("addAnother");
      expect(resolveTripFormMode(undefined)).toBe("addAnother");
    });
  });

  describe("buildTripFormSubmitData", () => {
    it("promote updates same trip id and clears isImplicitDefault", () => {
      const trip = buildTripFormSubmitData({
        mode: "promote",
        tripid: "implicit-1",
        tripName: "Home",
        tripCurrency: "EUR",
        totalBudget: "",
        dailyBudget: "",
        isDynamicDailyBudget: false,
      });

      expect(trip.tripid).toBe("implicit-1");
      expect(trip.isImplicitDefault).toBe(false);
      expect(trip.tripName).toBe("Home");
      expect(trip.startDate).toBeUndefined();
      expect(trip.endDate).toBeUndefined();
      expect(trip.totalBudget).toBe("0");
      expect(trip.dailyBudget).toBe("0");
    });

    it("addAnother creates a named trip without inventing dates", () => {
      const trip = buildTripFormSubmitData({
        mode: "addAnother",
        tripName: "Japan",
        tripCurrency: "JPY",
        totalBudget: "100000",
        dailyBudget: "",
        isDynamicDailyBudget: false,
      });

      expect(trip.isImplicitDefault).toBeUndefined();
      expect(trip.startDate).toBeUndefined();
      expect(trip.endDate).toBeUndefined();
      expect(trip.dailyBudget).toBe("0");
      expect(trip.totalBudget).toBe("100000");
    });

    it("does not invent daily from total when dates are unset", () => {
      const trip = buildTripFormSubmitData({
        mode: "edit",
        tripid: "t1",
        tripName: "Named",
        tripCurrency: "EUR",
        totalBudget: "700",
        dailyBudget: "",
        isDynamicDailyBudget: false,
      });

      expect(trip.dailyBudget).toBe("0");
    });

    it("derives daily from total only when both dates are set", () => {
      const trip = buildTripFormSubmitData({
        mode: "edit",
        tripid: "t1",
        tripName: "Named",
        tripCurrency: "EUR",
        totalBudget: "700",
        dailyBudget: "",
        isDynamicDailyBudget: false,
        startDate: "2026-01-01",
        endDate: "2026-01-07",
      });

      expect(trip.dailyBudget).toBe("100.00");
    });
  });

  describe("hasOptionalTripFormValues", () => {
    it("is false for budget-free with no dates", () => {
      expect(
        hasOptionalTripFormValues({
          totalBudget: "0",
          dailyBudget: "0",
        })
      ).toBe(false);
    });

    it("is true when any optional value is set", () => {
      expect(
        hasOptionalTripFormValues({ totalBudget: "100", dailyBudget: "0" })
      ).toBe(true);
      expect(
        hasOptionalTripFormValues({
          totalBudget: "0",
          dailyBudget: "0",
          startDate: "2026-01-01",
        })
      ).toBe(true);
    });
  });

  describe("resolvePeriodStartDate", () => {
    it("prefers trip startDate when set", () => {
      expect(resolvePeriodStartDate("2026-01-01", ["2026-01-10"])).toBe(
        "2026-01-01"
      );
    });

    it("falls back to earliest expense date when trip dates unset", () => {
      expect(
        resolvePeriodStartDate(undefined, [
          "2026-01-20",
          "2026-01-05",
          "2026-01-12",
        ])
      ).toBe("2026-01-05");
    });

    it("returns undefined when no trip start and no expenses (all-time)", () => {
      expect(resolvePeriodStartDate("", [])).toBeUndefined();
    });
  });

  describe("shouldConfirmCurrencyChange", () => {
    it("always confirms on edit", () => {
      expect(
        shouldConfirmCurrencyChange({ isEditing: true, expenseCount: 0 })
      ).toBe(true);
    });

    it("on create confirms only when expenses exist", () => {
      expect(
        shouldConfirmCurrencyChange({ isEditing: false, expenseCount: 0 })
      ).toBe(false);
      expect(
        shouldConfirmCurrencyChange({ isEditing: false, expenseCount: 3 })
      ).toBe(true);
    });
  });
});
