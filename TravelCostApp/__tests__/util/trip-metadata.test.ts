import {
  hasPoisonedTripMetadata,
  tripMetadataFromLeaves,
  tripMetadataPatch,
} from "../../util/trip-metadata";
import { isPaidString } from "../../util/expense";

describe("tripMetadataFromLeaves", () => {
  it("drops true placeholders from non-boolean metadata so string fields never become true", () => {
    const trip = tripMetadataFromLeaves(
      {
        tripName: true,
        totalBudget: true,
        dailyBudget: true,
        tripCurrency: true,
        startDate: true,
        endDate: true,
        isPaidDate: true,
        isPaid: true,
        isPaidTimestamp: true,
        tripProgress: true,
        categories: true,
        isDynamicDailyBudget: true,
        isImplicitDefault: false,
      },
      { keyA: { uid: "uid-alice", userName: "Alice", touched: false } }
    );

    expect(trip.tripName).toBeUndefined();
    expect(trip.totalBudget).toBeUndefined();
    expect(trip.dailyBudget).toBeUndefined();
    expect(trip.tripCurrency).toBeUndefined();
    expect(trip.startDate).toBeUndefined();
    expect(trip.endDate).toBeUndefined();
    expect(trip.isPaid).toBeUndefined();
    expect(trip.isPaidDate).toBeUndefined();
    expect(trip.isPaidTimestamp).toBeUndefined();
    expect(trip.tripProgress).toBeUndefined();
    expect(trip.categories).toBeUndefined();
    expect(trip.isDynamicDailyBudget).toBe(true);
    expect(trip.isImplicitDefault).toBe(false);
    expect(trip.travellers).toEqual([
      expect.objectContaining({ uid: "uid-alice", userName: "Alice" }),
    ]);
  });

  it("keeps real scalar metadata from leaf payloads", () => {
    const trip = tripMetadataFromLeaves(
      {
        tripName: "Bali",
        totalBudget: "5000",
        dailyBudget: "100",
        tripCurrency: "EUR",
        startDate: "2026-01-01",
        endDate: "2026-01-31",
        isPaid: isPaidString.notPaid,
        isDynamicDailyBudget: false,
        isImplicitDefault: false,
      },
      []
    );

    expect(trip).toMatchObject({
      tripName: "Bali",
      totalBudget: "5000",
      dailyBudget: "100",
      tripCurrency: "EUR",
      startDate: "2026-01-01",
      endDate: "2026-01-31",
      isDynamicDailyBudget: false,
    });
  });
});

describe("hasPoisonedTripMetadata", () => {
  it("detects shallow true stubs on string metadata fields", () => {
    expect(
      hasPoisonedTripMetadata({ tripCurrency: true as unknown as string })
    ).toBe(true);
    expect(hasPoisonedTripMetadata({ tripCurrency: "EUR" })).toBe(false);
    expect(hasPoisonedTripMetadata({ isDynamicDailyBudget: true })).toBe(false);
  });
});

describe("tripMetadataPatch", () => {
  it("never PATCHes shallow true placeholders onto non-boolean metadata fields", () => {
    const patch = tripMetadataPatch({
      tripName: true as unknown as string,
      totalBudget: true as unknown as string,
      tripCurrency: true as unknown as string,
      startDate: true as unknown as string,
      isDynamicDailyBudget: true,
      isImplicitDefault: false,
      categories: true as unknown as string,
    });

    expect(patch).toEqual({
      isDynamicDailyBudget: true,
      isImplicitDefault: false,
    });
    expect(patch).not.toHaveProperty("tripName");
    expect(patch).not.toHaveProperty("totalBudget");
    expect(patch).not.toHaveProperty("tripCurrency");
    expect(patch).not.toHaveProperty("startDate");
    expect(patch).not.toHaveProperty("categories");
  });
});
