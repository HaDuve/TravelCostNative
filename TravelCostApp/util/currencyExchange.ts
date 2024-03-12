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
  setMMKVObject,
  setMMKVString,
} from "../store/mmkv";

export async function getRate(
  base: string,
  target: string,
  forceNewRate = false
): Promise<number> {
  const connectionInfo = await NetInfo.fetch();
  if (!connectionInfo || !connectionInfo.isInternetReachable) {
    return getOfflineRate(base, target);
  }
  const response = await getRateAPI1(base, target, forceNewRate);
  if (typeof response === "number" && response === -1) {
    try {
      return await getRateAPI2(base, target, forceNewRate);
    } catch (error) {
      safeLogError(error);
      return -1;
    }
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
    console.log("diff:", diff, " < ", CACHE_NUM_HOURS);
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
  // console.log("getRateAPI2 ~ requestURL:", requestURL);
  try {
    const response = await axios.get(requestURL);
    const rate = response?.data?.data?.[target]?.value;
    if (!rate) throw new Error("No rate found");
    // console.log("getRateAPI2 ~ rate:", rate);
    const timeStamp = DateTime.now().toISO();
    await asyncStoreSetItem("currencyExchangeAPI2_update", timeStamp);
    await asyncStoreSetItem("currencyExchangeAPI2_" + base + target, rate);
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
    : getMMKVString("currencyExchange_lastUpdate");
  if (lastUpdate) {
    const lastUpdateDateTime = DateTime.fromISO(lastUpdate);
    const now = DateTime.now();
    const diff = now.diff(lastUpdateDateTime, "hours").hours;
    if (diff < CACHE_NUM_HOURS) {
      // get from asyncstore
      return getOfflineRate(base, target);
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
        return getOfflineRate(base, target);
      }
      setMMKVObject("currencyExchange_base_" + base, rates);
      const timeStamp = DateTime.now().toISO();
      setMMKVString("currencyExchange_lastUpdate", timeStamp);
      return rates[target];
    } else {
      return getOfflineRate(base, target);
    }
  } catch (error) {
    return getOfflineRate(base, target);
  }
}

export function getOfflineRate(base: string, target: string) {
  // offline get from asyncstore
  const currencyExchange = getMMKVObject("currencyExchange_base_" + base);
  if (currencyExchange) {
    return currencyExchange[target];
  } else {
    safeLogError("Unable to get offline rate for " + base + " " + target);
    return -1;
  }
}
