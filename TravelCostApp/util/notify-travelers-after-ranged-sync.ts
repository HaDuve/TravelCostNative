import safeLogError from "./error";

export function notifyTravelersAfterRangedSync(
  syncPromise: Promise<void>,
  tripid: string,
  isOnline: boolean,
  touchAllTravelers: (tripid: string, notify: boolean) => Promise<void>,
): void {
  if (!isOnline) {
    return;
  }

  void syncPromise
    .finally(() => touchAllTravelers(tripid, true))
    .catch(safeLogError);
}
