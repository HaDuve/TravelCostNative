/**
 * Day buckets are LOCAL calendar days (the modal renders them as such), and a
 * date-less expense must never throw on the save path (#438 review).
 */
process.env.TZ = "Europe/Berlin";

import { buildSplitHistoryEntry } from "../../util/split-history";
import { buildExpense, makeTrip, resetHarnessIds } from "../fixtures/split-summary";

const author = { uid: "u1", userName: "Alice" };

beforeEach(() => resetHarnessIds());

function ranged(trip: ReturnType<typeof makeTrip>, dates: (Date | undefined)[]) {
  return dates.map((date, i) => ({
    ...buildExpense(trip, { amount: 10, whoPaid: "Alice", description: "Hostel" }),
    id: `e${i}`,
    rangeId: "r1",
    date,
  })) as any[];
}

describe("split history day buckets", () => {
  it("runs under a non-UTC zone (jest-expo pins its own TZ)", () => {
    expect(new Date(2026, 0, 1).getTimezoneOffset()).not.toBe(0);
  });

  it("buckets local-midnight dates on their local day", () => {
    const trip = makeTrip(["Alice", "Bob"]);
    const after = ranged(trip, [new Date(2026, 0, 1), new Date(2026, 0, 2), new Date(2026, 0, 3)]);
    const entry = buildSplitHistoryEntry({
      kind: "added", description: "Hostel", before: [], after,
      tripCurrency: "EUR", author,
    });
    expect(entry?.range).toMatchObject({ startDate: "2026-01-01", endDate: "2026-01-03" });
    expect(entry?.days?.map((d) => d.date)).toEqual(["2026-01-01", "2026-01-02", "2026-01-03"]);
  });

  it("does not throw when a ranged expense has no valid date", () => {
    const trip = makeTrip(["Alice", "Bob"]);
    const after = ranged(trip, [new Date(2026, 0, 1), undefined]);
    after[1].startDate = undefined;
    const build = () =>
      buildSplitHistoryEntry({
        kind: "added", description: "Hostel", before: [], after,
        tripCurrency: "EUR", author,
      });
    expect(build).not.toThrow();
    expect(build()?.range?.startDate).toBe("2026-01-01");
  });

  it("does not throw when no expense has a valid date", () => {
    const trip = makeTrip(["Alice", "Bob"]);
    const after = ranged(trip, [undefined, undefined]);
    after.forEach((e) => (e.startDate = "garbage"));
    expect(() =>
      buildSplitHistoryEntry({
        kind: "added", description: "Hostel", before: [], after,
        tripCurrency: "EUR", author,
      })
    ).not.toThrow();
  });
});
