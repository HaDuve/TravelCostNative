import { notifyTravelersAfterRangedSync } from "../../util/notify-travelers-after-ranged-sync";

describe("notifyTravelersAfterRangedSync", () => {
  it("notifies travellers only after ranged background sync settles", async () => {
    let resolveSync!: () => void;
    const syncPromise = new Promise<void>((resolve) => {
      resolveSync = resolve;
    });
    const touchAllTravelers = jest.fn(async () => {});

    notifyTravelersAfterRangedSync(
      syncPromise,
      "trip-1",
      true,
      touchAllTravelers,
    );

    expect(touchAllTravelers).not.toHaveBeenCalled();

    resolveSync();
    await syncPromise;
    await Promise.resolve();

    expect(touchAllTravelers).toHaveBeenCalledTimes(1);
    expect(touchAllTravelers).toHaveBeenCalledWith("trip-1", true);
  });

  it("skips traveller notification when offline", async () => {
    const touchAllTravelers = jest.fn(async () => {});

    notifyTravelersAfterRangedSync(
      Promise.resolve(),
      "trip-1",
      false,
      touchAllTravelers,
    );

    await Promise.resolve();
    expect(touchAllTravelers).not.toHaveBeenCalled();
  });
});
