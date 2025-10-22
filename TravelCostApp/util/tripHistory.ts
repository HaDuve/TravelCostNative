import safeLogError from "./error";
import { fetchTrip } from "./http";

export async function filterDeletedTrips(tripHistory: string[]) {
  if (!tripHistory || tripHistory.length === 0) return [];

  try {
    const validTrips: string[] = [];

    for (const tripid of tripHistory) {
      try {
        const trip = await fetchTrip(tripid);
        if (trip?.deleted !== true) {
          validTrips.push(tripid);
        }
      } catch (error) {
        // Trip doesn't exist or is inaccessible, skip it
        continue;
      }
    }
    return validTrips;
  } catch (error) {
    safeLogError(error);
    return tripHistory; // Return original if filtering fails
  }
}
