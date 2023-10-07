import axios from "axios";
import { DateTime } from "luxon";
import { Alert } from "react-native";
import { CACHE_NUM_HOURS, DEBUG_FORCE_OFFLINE } from "../confAppConstants";
import {
  asyncStoreGetObject,
  asyncStoreSetItem,
  asyncStoreSetObject,
} from "../store/async-storage";
import { getMMKVString } from "../store/mmkv";
import { secureStoreGetItem } from "../store/secure-storage";

export async function getRate(base: string, target: string) {
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
    Alert.alert("No API key for currency exchange");
    return -1;
  }
  console.log("getRate ~ apiKey:", apiKey);
  const requestURL =
    `http://api.exchangeratesapi.io/v1/latest?access_key=${apiKey}&base=` +
    base;
  // save in asyncstore

  try {
    const response = await axios.get(requestURL);
    console.log("getRate ~ response:", response);
    const rates = response.data.rates;
    console.log("getRate ~ rates:", rates);
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
