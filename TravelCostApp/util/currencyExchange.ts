import axios from "axios";
import { DateTime } from "luxon";
import { CACHE_NUM_HOURS, DEBUG_FORCE_OFFLINE } from "../confAppConstants";
import {
  asyncStoreGetItem,
  asyncStoreGetObject,
  asyncStoreSetItem,
  asyncStoreSetObject,
} from "../store/async-storage";
import { secureStoreGetItem } from "../store/secure-storage";
import safeLogError from "./error";

export async function getRate(base: string, target: string) {
  const response = await getRateAPI1(base, target);
  // console.log("getRate ~ initialresponse:", response);
  if (typeof response === "number" && response === -1) {
    try {
      return await getRateAPI2(base, target);
    } catch (error) {
      safeLogError(error);
      return -1;
    }
  }
  return response;
}

export async function getRateAPI2(base: string, target: string) {
  const lastUpdate = await asyncStoreGetItem("currencyExchangeAPI2_update");
  if (lastUpdate) {
    const lastUpdateDateTime = DateTime.fromISO(lastUpdate);
    const now = DateTime.now();
    const diff = now.diff(lastUpdateDateTime, "hours").hours;
    // console.log("getRateAPI2 ~ diff:", diff);
    // this api is more restrictive, so we wait 4 hours
    if (diff < CACHE_NUM_HOURS * 4) {
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

export async function getRateAPI1(base: string, target: string) {
  if (base === target) {
    return 1;
  }
  const lastUpdate = await asyncStoreGetObject("currencyExchange_lastUpdate");
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
    if (response) {
      if (DEBUG_FORCE_OFFLINE) {
        return getOfflineRate(base, target);
      }
      await asyncStoreSetObject("currencyExchange_base_" + base, rates);
      const timeStamp = DateTime.now().toISO();
      await asyncStoreSetObject("currencyExchange_lastUpdate", timeStamp);
    } else {
      return getOfflineRate(base, target);
    }
    return rates[target];
  } catch (error) {
    return getOfflineRate(base, target);
  }
}

export async function getOfflineRate(base: string, target: string) {
  // offline get from asyncstore
  const currencyExchange = await asyncStoreGetObject(
    "currencyExchange_base_" + base
  );
  if (currencyExchange) {
    return currencyExchange[target];
  } else {
    safeLogError("Unable to get offline rate for " + base + " " + target);
    return -1;
  }
}
