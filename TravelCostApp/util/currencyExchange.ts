import axios from "axios";
import { DateTime } from "luxon";
import { CACHE_NUM_HOURS, DEBUG_FORCE_OFFLINE } from "../confAppConstants";
import { asyncStoreGetItem, asyncStoreSetItem } from "../store/async-storage";
import { secureStoreGetItem } from "../store/secure-storage";
import safeLogError from "./error";
import NetInfo from "@react-native-community/netinfo";
import {
  getMMKVObject,
  getMMKVString,
  MMKV_KEYS,
  MMKV_KEY_PATTERNS,
  setMMKVObject,
  setMMKVString,
} from "../store/mmkv";

function saveBaseRates(base: string, rates: Record<string, number>) {
  // Merge new rates into MMKV and refresh timestamp for offline reuse
  const existingRates =
    getMMKVObject(MMKV_KEY_PATTERNS.CURRENCY_EXCHANGE_BASE(base)) || {};
  setMMKVObject(MMKV_KEY_PATTERNS.CURRENCY_EXCHANGE_BASE(base), {
    ...existingRates,
    ...rates,
  });
  setMMKVString(MMKV_KEYS.CURRENCY_EXCHANGE_LAST_UPDATE, DateTime.now().toISO());
}

export async function getRate(
  base: string,
  target: string,
  forceNewRate = false
): Promise<number> {
  const connectionInfo = await NetInfo.fetch();
  const isOnline =
    connectionInfo &&
    connectionInfo.isInternetReachable &&
    !DEBUG_FORCE_OFFLINE;

  if (!isOnline) {
    // Truly offline - use offline rate with error logging but prefer cached data
    const offlineRate = await getOfflineRateAny(base, target);
    if (offlineRate !== -1) {
      return offlineRate;
    }
    return -1;
  }

  // Online - try API1 first
  const response = await getRateAPI1(base, target, forceNewRate);
  if (typeof response === "number" && response === -1) {
    // API1 failed, try API2
    try {
      const api2Response = await getRateAPI2(base, target, forceNewRate);
      if (api2Response !== -1) {
        return api2Response;
      }
    } catch (error) {
      safeLogError(error);
    }

    // Both APIs failed, try cached data as last resort
    const cachedRate = getCachedRate(base, target);
    if (cachedRate !== -1) {
      return cachedRate;
    }

    // No cached data available
    return -1;
  }

  return response;
}

export async function getRateAPI2(
  base: string,
  target: string,
  forceNewRate = false
) {
  const lastUpdate = forceNewRate
    ? false
    : await asyncStoreGetItem("currencyExchangeAPI2_update");
  if (lastUpdate) {
    const lastUpdateDateTime = DateTime.fromISO(lastUpdate);
    const now = DateTime.now();
    const diff = now.diff(lastUpdateDateTime, "hours").hours;
    if (diff < CACHE_NUM_HOURS) {
      // get from asyncstore
      const rate = await asyncStoreGetItem(
        "currencyExchangeAPI2_" + base + target
      );
      if (rate) {
        return rate;
      }
    }
  }
  const apiKey = await secureStoreGetItem("FREEEXCHANGE");
  const requestURL =
    "https://api.currencyapi.com/v3/latest?apikey=" +
    apiKey +
    "&currencies=" +
    target +
    "&base_currency=" +
    base;
  try {
    const response = await axios.get(requestURL);
    const rate = response?.data?.data?.[target]?.value;
    if (!rate) throw new Error("No rate found");
    const timeStamp = DateTime.now().toISO();
    await asyncStoreSetItem("currencyExchangeAPI2_update", timeStamp);
    await asyncStoreSetItem("currencyExchangeAPI2_" + base + target, rate);
    // Also persist to MMKV so offline mode can re-use last good rate
    saveBaseRates(base, { [target]: rate });
    return rate;
  } catch (error) {
    safeLogError(error);
    return -1;
  }
}

export async function getRateAPI1(
  base: string,
  target: string,
  forceNewRate = false
) {
  if (base === target) {
    return 1;
  }
  const lastUpdate = forceNewRate
    ? false
    : getMMKVString(MMKV_KEYS.CURRENCY_EXCHANGE_LAST_UPDATE);
  if (lastUpdate) {
    const lastUpdateDateTime = DateTime.fromISO(lastUpdate);
    const now = DateTime.now();
    const diff = now.diff(lastUpdateDateTime, "hours").hours;
    if (diff < CACHE_NUM_HOURS) {
      // get from cache - this is online but using cached data
      return getCachedRate(base, target);
    }
  }
  const apiKey = await secureStoreGetItem("EXCHANGE");
  if (!apiKey) {
    safeLogError("No apiKey found for currencyExchange");
    return -1;
  }
  const requestURL =
    `http://api.exchangeratesapi.io/v1/latest?access_key=${apiKey}&base=` +
    base;

  try {
    const response = await axios.get(requestURL);
    const rates = response.data.rates;
    if (response && rates && rates[target]) {
      if (DEBUG_FORCE_OFFLINE) {
        return getCachedRate(base, target);
      }
      saveBaseRates(base, rates);
      return rates[target];
    } else {
      // API succeeded but target currency not found - try fallback calculation
      return getFallbackRate(base, target, rates);
    }
  } catch (error) {
    // API failed - try cached data as fallback
    return getCachedRate(base, target);
  }
}

export function getCachedRate(base: string, target: string) {
  // Get cached rate without logging errors (used when online)
  const currencyExchange = getMMKVObject(
    MMKV_KEY_PATTERNS.CURRENCY_EXCHANGE_BASE(base)
  );
  if (currencyExchange && currencyExchange[target]) {
    const rate = currencyExchange[target];
    // Refresh timestamp so offline mode can still rely on this data
    saveBaseRates(base, { [target]: rate });
    return rate;
  }
  return -1;
}

export function getFallbackRate(
  base: string,
  target: string,
  rates?: Record<string, number> | null
) {
  // Try to calculate rate using USD as intermediate currency
  if (!rates || !rates.USD) {
    return -1;
  }

  const usdRate = rates.USD;
  const targetFromUsd = rates[target];

  if (targetFromUsd) {
    // Calculate: base -> USD -> target
    const calculatedRate = targetFromUsd / usdRate;
    return calculatedRate;
  }

  return -1;
}

export function getOfflineRate(base: string, target: string) {
  if (base === target) {
    return 1;
  }
  // offline get from asyncstore - only used when truly offline
  const currencyExchange = getMMKVObject(
    MMKV_KEY_PATTERNS.CURRENCY_EXCHANGE_BASE(base)
  );
  if (currencyExchange && currencyExchange[target]) {
    return currencyExchange[target];
  } else {
    // Only log error when truly offline - this prevents error spam when online
    safeLogError(
      "Unable to get offline rate for " + base + " " + target,
      "currencyExchange.ts",
      137
    );
  }
  return -1;
}

async function getOfflineRateAny(base: string, target: string) {
  if (base === target) {
    return 1;
  }

  // 1) Try MMKV
  const mmkvRate = getOfflineRate(base, target);
  if (mmkvRate !== -1) {
    return mmkvRate;
  }

  // 2) Try async storage (API2 cache)
  try {
    const api2Rate = await asyncStoreGetItem(
      "currencyExchangeAPI2_" + base + target
    );
    if (api2Rate !== undefined && api2Rate !== null) {
      const parsedRate =
        typeof api2Rate === "string" ? Number(api2Rate) : api2Rate;
      if (typeof parsedRate === "number" && !Number.isNaN(parsedRate)) {
        // Persist into MMKV for future use
        saveBaseRates(base, { [target]: parsedRate });
        return parsedRate;
      }
    }
  } catch (error) {
    safeLogError(error);
  }

  // 3) Nothing cached
  safeLogError(
    "Unable to get offline rate for " + base + " " + target,
    "currencyExchange.ts",
    137
  );
  return -1;
}
