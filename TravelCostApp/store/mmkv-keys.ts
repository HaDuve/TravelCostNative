/**
 * MMKV Storage Keys
 *
 * This file defines all allowed keys for MMKV storage with TypeScript safety.
 * Use these constants instead of hardcoded strings to prevent typos and ensure consistency.
 */

// Static keys - keys that are used directly
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
  VERSION_CHECK_TIMESTAMP: "versionCheckTimeStamp",

  // Cache related
  ALL_TRIPS_AS_OBJECT: "allTripsAsObject",
  ALL_TRIPS_AS_OBJECT_CACHE_ISO_DATE: "allTripsAsObject_CacheISODate",
  OFFLINE_QUEUE: "offlineQueue",
} as const;

// Dynamic key template types
export type ExpenseCatKey = `expenseCat_${string}`;
export type ExpenseDraftKey = `expenseDraft_${string}`;
export type TripHistoryItemKey = `tripHistoryItem_${string}`;
export type CurrencyExchangeBaseKey = `currencyExchange_base_${string}`;
export type TripCacheKey = `trip_${string}`;
export type TripLastUpdateIsoKey = `lastUpdateISO_trip_${string}`;
export type LastFetchKey = `lastFetch_${string}`;
export type LastUpdateAllExpensesTripKey = `lastUpdate_allExpenses_tripid_${string}`;
export type LastUpdateIsoAllExpensesTripKey =
  `lastUpdateISO_allExpenses_tripid${string}`;

// Dynamic key patterns - keys that require parameters
export const MMKV_KEY_PATTERNS = {
  EXPENSE_CAT: (expenseId: string): ExpenseCatKey =>
    `expenseCat_${expenseId}`,
  EXPENSE_DRAFT: (expenseId: string): ExpenseDraftKey =>
    `expenseDraft_${expenseId}`,
  TRIP_HISTORY_ITEM: (tripid: string): TripHistoryItemKey =>
    `tripHistoryItem_${tripid}`,
  CURRENCY_EXCHANGE_BASE: (base: string): CurrencyExchangeBaseKey =>
    `currencyExchange_base_${base}`,
  TRIP: (tripid: string): TripCacheKey => `trip_${tripid}`,
  TRIP_LAST_UPDATE_ISO: (tripid: string): TripLastUpdateIsoKey =>
    `lastUpdateISO_trip_${tripid}`,
  LAST_FETCH: (tripid: string): LastFetchKey => `lastFetch_${tripid}`,
  LAST_UPDATE_ALL_EXPENSES_TRIP: (
    tripid: string
  ): LastUpdateAllExpensesTripKey =>
    `lastUpdate_allExpenses_tripid_${tripid}`,
  LAST_UPDATE_ISO_ALL_EXPENSES_TRIP: (
    tripid: string
  ): LastUpdateIsoAllExpensesTripKey =>
    `lastUpdateISO_allExpenses_tripid${tripid}`,
} as const;

// Type for all static keys
export type MMKVStaticKey = (typeof MMKV_KEYS)[keyof typeof MMKV_KEYS];
export type MMKVDynamicKey =
  | ExpenseCatKey
  | ExpenseDraftKey
  | TripHistoryItemKey
  | CurrencyExchangeBaseKey
  | TripCacheKey
  | TripLastUpdateIsoKey
  | LastFetchKey
  | LastUpdateAllExpensesTripKey
  | LastUpdateIsoAllExpensesTripKey;
export type MMKVKey = MMKVStaticKey | MMKVDynamicKey;

// Type guard to ensure a string is a valid MMKV key
export function isValidMMKVKey(key: string): key is MMKVKey {
  if (Object.values(MMKV_KEYS).includes(key as MMKVStaticKey)) {
    return true;
  }

  return (
    key.startsWith("expenseCat_") ||
    key.startsWith("expenseDraft_") ||
    key.startsWith("tripHistoryItem_") ||
    key.startsWith("currencyExchange_base_") ||
    key.startsWith("trip_") ||
    key.startsWith("lastUpdateISO_trip_") ||
    key.startsWith("lastFetch_") ||
    key.startsWith("lastUpdate_allExpenses_tripid_") ||
    key.startsWith("lastUpdateISO_allExpenses_tripid")
  );
}
