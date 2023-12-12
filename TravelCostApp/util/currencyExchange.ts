import axios from "axios";
import { DateTime } from "luxon";
import { Alert } from "react-native";
import { CACHE_NUM_HOURS, DEBUG_FORCE_OFFLINE } from "../confAppConstants";
import {
  asyncStoreGetItem,
  asyncStoreGetObject,
  asyncStoreSetItem,
  asyncStoreSetObject,
} from "../store/async-storage";
import { getMMKVString } from "../store/mmkv";
import { secureStoreGetItem } from "../store/secure-storage";
import safeLogError from "./error";

export async function getRate(base: string, target: string) {
  const response = await getRateAPI1(base, target);
  console.log("getRate ~ initialresponse:", response);
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
    console.log("getRateAPI2 ~ diff:", diff);
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
  console.log("getRateAPI2 ~ requestURL:", requestURL);
  try {
    const response = await axios.get(requestURL);
    const rate = response?.data?.data?.[target]?.value;
    if (!rate) throw new Error("No rate found");
    console.log("getRateAPI2 ~ rate:", rate);
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
  console.log("getRate ~ target:", target);
  console.log("getRate ~ base:", base);
  if (base === target) {
    return 1;
  }
  const lastUpdate = await asyncStoreGetObject("currencyExchange_lastUpdate");
  if (lastUpdate) {
    const lastUpdateDateTime = DateTime.fromISO(lastUpdate);
    const now = DateTime.now();
    const diff = now.diff(lastUpdateDateTime, "hours").hours;
    console.log("getRate ~ diff:", diff);
    if (diff < CACHE_NUM_HOURS) {
      // get from asyncstore
      return getOfflineRate(base, target);
    }
  }
  const apiKey = await secureStoreGetItem("EXCHANGE");
  if (!apiKey) {
    console.log("error ~ No API key for currency exchange");
    return -1;
  }
  console.log("getRate ~ apiKey:", apiKey);
  const requestURL =
    `http://api.exchangeratesapi.io/v1/latest?access_key=${apiKey}&base=` +
    base;
  // save in asyncstore

  try {
    const response = await axios.get(requestURL);
    const rates = response.data.rates;
    if (response) {
      if (DEBUG_FORCE_OFFLINE) {
        return getOfflineRate(base, target);
      }
      console.log(
        "\n\n!!! \n\n~~~~~~  storing rates in asyncstore",
        base,
        rates[target]
      );
      await asyncStoreSetObject("currencyExchange_base_" + base, rates);
      const timeStamp = DateTime.now().toISO();
      await asyncStoreSetObject("currencyExchange_lastUpdate", timeStamp);
    } else {
      // offline get from asyncstore
      console.log("getRate ~ offline get from asyncstore");
      return getOfflineRate(base, target);
    }
    return rates[target];
  } catch (error) {
    console.log("getRate ~ error", error);
    return getOfflineRate(base, target);
  }
}

export async function getOfflineRate(base: string, target: string) {
  // offline get from asyncstore
  const currencyExchange = await asyncStoreGetObject(
    "currencyExchange_base_" + base
  );
  if (currencyExchange) {
    console.log(
      "getOfflineRate ~ currencyExchange[target]:",
      currencyExchange[target]
    );
    return currencyExchange[target];
  } else {
    console.log("getOfflineRate ~ error ~ no currencyExchange rate stored!");
    return -1;
  }
}
