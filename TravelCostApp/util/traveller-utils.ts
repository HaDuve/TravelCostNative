/**
 * Utility functions for standardizing traveller data formats
 * This ensures consistent handling of traveller data across the app
 */

export interface TravellerObject {
  userName: string;
  uid?: string;
  [key: string]: any;
}

export type TravellerData =
  | string[]
  | TravellerObject[]
  | { [key: string]: TravellerObject };

/**
 * Converts any traveller data format to a standardized object array format
 * @param travellers - Traveller data in any supported format
 * @returns Array of traveller objects with userName property
 */
export function normalizeTravellers(
  travellers: TravellerData
): TravellerObject[] {
  if (!travellers) {
    return [];
  }

  // Handle array of strings
  if (
    Array.isArray(travellers) &&
    travellers.length > 0 &&
    typeof travellers[0] === "string"
  ) {
    return travellers.map(userName => ({ userName }));
  }

  // Handle array of objects
  if (Array.isArray(travellers)) {
    return travellers
      .map(traveller => {
        if (typeof traveller === "string") {
          return { userName: traveller };
        }
        if (traveller && typeof traveller === "object" && traveller.userName) {
          return { userName: traveller.userName, ...traveller };
        }
        console.warn(
          "normalizeTravellers: Invalid traveller object:",
          traveller
        );
        return null;
      })
      .filter(Boolean);
  }

  // Handle object map format
  if (typeof travellers === "object" && !Array.isArray(travellers)) {
    return Object.values(travellers)
      .map(traveller => {
        if (traveller && typeof traveller === "object" && traveller.userName) {
          return { userName: traveller.userName, ...traveller };
        }
        console.warn(
          "normalizeTravellers: Invalid traveller in object map:",
          traveller
        );
        return null;
      })
      .filter(Boolean);
  }

  console.warn(
    "normalizeTravellers: Unsupported traveller data format:",
    travellers
  );
  return [];
}

/**
 * Converts traveller data to string array format
 * @param travellers - Traveller data in any supported format
 * @returns Array of user names as strings
 */
export function travellersToStringArray(travellers: TravellerData): string[] {
  return normalizeTravellers(travellers).map(t => t.userName);
}

/**
 * Converts traveller data to object array format (for UI components)
 * @param travellers - Traveller data in any supported format
 * @returns Array of traveller objects with userName property
 */
export function travellersToObjectArray(
  travellers: TravellerData
): TravellerObject[] {
  return normalizeTravellers(travellers);
}

/**
 * Validates traveller data format
 * @param travellers - Traveller data to validate
 * @returns True if data is in a valid format
 */
export function isValidTravellerData(travellers: any): boolean {
  if (!travellers) return true; // Empty is valid

  if (Array.isArray(travellers)) {
    return travellers.every(
      t => typeof t === "string" || (typeof t === "object" && t && t.userName)
    );
  }

  if (typeof travellers === "object" && !Array.isArray(travellers)) {
    return Object.values(travellers).every(
      t => typeof t === "object" && t && (t as any).userName
    );
  }

  return false;
}
