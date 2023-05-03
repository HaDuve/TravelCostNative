import axios from "axios";
import { Alert } from "react-native";
import { DEBUG_FORCE_OFFLINE } from "../confAppConstants";
import {
  asyncStoreGetObject,
  asyncStoreSetObject,
} from "../store/async-storage";

export async function getRate(base: string, target: string) {
  if (base === target) {
    return 1;
  }
  // TODO: add a cache here, and only call the request again after 1 hour
  const requestURL = "https://api.exchangerate.host/latest?base=" + base;
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
    } else {
      // offline get from asyncstore
      return getOfflineRate(base, target);
    }
    return rates[target];
  } catch (error) {
    console.log("getRate ~ error");
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
    return -1;
  }
}
