import { MAX_JS_NUMBER } from "../../confAppConstants";
import type { TripData } from "../../types/trip";
import { isPaidString } from "../../util/expense";
import { hydrateTrip } from "../../util/hydrate-trip";

function minimalTrip(overrides: Partial<TripData> = {}): TripData {
  return {
    tripid: "trip-1",
    tripName: "Trip",
    totalBudget: "100",
    dailyBudget: "10",
    tripCurrency: "EUR",
    travellers: [],
    ...overrides,
  };
}

describe("hydrateTrip", () => {
  it("migrates isPaidDate to isPaidTimestamp and sets isPaid to notPaid", () => {
    const paidDate = "2024-06-15T12:00:00.000Z";
    const raw = minimalTrip({
      isPaid: isPaidString.paid,
      isPaidDate: paidDate,
      isPaidTimestamp: undefined,
    });

    const hydrated = hydrateTrip(raw);

    expect(hydrated.isPaidTimestamp).toBe(new Date(paidDate).getTime());
    expect(hydrated.isPaid).toBe(isPaidString.notPaid);
  });

  it("drops deprecated totalSum without mutating the input", () => {
    const raw = {
      ...minimalTrip(),
      totalSum: 999,
    } as TripData & { totalSum: number };

    const hydrated = hydrateTrip(raw);

    expect("totalSum" in hydrated).toBe(false);
    expect("totalSum" in raw).toBe(true);
  });

  it("uses max-budget fallback when totalBudget is missing", () => {
    const hydrated = hydrateTrip(minimalTrip({ totalBudget: undefined }));

    expect(hydrated.totalBudget).toBe(MAX_JS_NUMBER.toString());
  });

  it("clamps negative dailyBudget to 0.0001", () => {
    const hydrated = hydrateTrip(minimalTrip({ dailyBudget: "-5" }));

    expect(hydrated.dailyBudget).toBe("0.0001");
  });

  it.each([
    ["empty isPaidDate", ""],
    ["invalid isPaidDate", "not-a-date"],
  ])("does not set isPaidTimestamp for %s", (_label, isPaidDate) => {
    const raw = minimalTrip({
      isPaid: isPaidString.paid,
      isPaidDate,
      isPaidTimestamp: undefined,
    });

    const hydrated = hydrateTrip(raw);

    expect(hydrated.isPaidTimestamp).toBeUndefined();
    expect(hydrated.isPaid).toBe(isPaidString.paid);
  });

  it("preserves isDynamicDailyBudget when set on raw trip", () => {
    const hydrated = hydrateTrip(
      minimalTrip({ isDynamicDailyBudget: true })
    );

    expect(hydrated.isDynamicDailyBudget).toBe(true);
  });
});
