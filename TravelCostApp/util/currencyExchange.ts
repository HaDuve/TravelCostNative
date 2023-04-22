import axios from "axios";
import { DEBUG_FORCE_OFFLINE } from "../confAppConstants";
import {
  asyncStoreGetObject,
  asyncStoreSetObject,
} from "../store/async-storage";

export async function getRate(base: string, target: string) {
  // TODO: add a cache here, and only call the request again after 1 hour
  const requestURL = "https://api.exchangerate.host/latest?base=" + base;
  // save in asyncstore

  try {
    const response = await axios.get(requestURL);
    const rates = response.data.rates;
    if (!DEBUG_FORCE_OFFLINE && response) {
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
  }
}
