/**
 * MMKV Storage Keys
 *
 * This file defines all allowed keys for MMKV storage with TypeScript safety.
 * Use these constants instead of hardcoded strings to prevent typos and ensure consistency.
 */

// Static keys - keys that are used directly
// TODO: Add all keys here and enforce them in the codebase.
export const MMKV_KEYS = {
  // Trip related
  CURRENT_TRIP: "currentTrip",
  TRIP_HISTORY: "tripHistory",

  // Expense related
  EXPENSES: "expenses",

  // Category related
  CATEGORY_LIST: "categoryList",

  // Currency related
  RECENT_CURRENCIES: "recentCurrencies",
  CURRENCY_EXCHANGE_LAST_UPDATE: "currencyExchange_lastUpdate",

  // UI/App state
  BANNER_TIME: "BannerTime",
  CHANGELOG_TXT: "changelog.txt",
  CURRENT_VERSION: "currentVersion",
  EXPO_PUSH_ASK: "expoPushAsk",
  EXPO_PUSH_TOKEN_STATUS: "expoPushTokenStatus",

  // Cache related
  ALL_TRIPS_AS_OBJECT: "allTripsAsObject",
  ALL_TRIPS_AS_OBJECT_CACHE_ISO_DATE: "allTripsAsObject_CacheISODate",
  OFFLINE_QUEUE: "offlineQueue",
} as const;

// Dynamic key patterns - keys that require parameters
export const MMKV_KEY_PATTERNS = {
  EXPENSE_CAT: (expenseId: string) => `expenseCat_${expenseId}`,
  EXPENSE_DRAFT: (expenseId: string) => `expenseDraft_${expenseId}`,
  TRIP_HISTORY_ITEM: (tripid: string) => `tripHistoryItem_${tripid}`,
} as const;

// Type for all static keys
export type MMKVKey = (typeof MMKV_KEYS)[keyof typeof MMKV_KEYS];

// Type guard to ensure a string is a valid MMKV key
export function isValidMMKVKey(key: string): key is MMKVKey {
  return Object.values(MMKV_KEYS).includes(key as MMKVKey);
}
