import Purchases from "react-native-purchases";
import { FORCE_PREMIUM } from "../../confAppConstants";
// Branch.io removed
import {
  secureStoreGetItem,
  secureStoreSetItem,
} from "../../store/secure-storage";
import { fetchServerInfo } from "../../util/http";
import { isConnectionFastEnough } from "../../util/connectionSpeed";
import safeLogError from "../../util/error";

/*
  The entitlement ID from the RevenueCat dashboard that is activated upon successful in-app purchase for the duration of the purchase.
  */
export const ENTITLEMENT_ID = "Premium";

export async function isPremiumMember() {
  if (FORCE_PREMIUM) return true;
  try {
    // access latest customerInfo
    const customerInfo = await Purchases.getCustomerInfo();
    if (
      typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== "undefined"
    ) {
      // Grant user "pro" access
      return true;
    } //else
    return false;
  } catch (e) {
    // Error fetching customer info
    safeLogError(e);
    return false;
  }
}

export async function setAttributesAsync(emailString = "", userName = "") {
  if (emailString && typeof emailString == "string")
    await Purchases.setEmail(emailString);
  if (userName && typeof userName == "string")
    await Purchases.setDisplayName(userName);
  try {
    // Branch.io removed - no campaign tracking
  } catch (error) {
    safeLogError(error, "PremiumConstants.tsx", 74);
  }
}

export interface Keys {
  REVCAT_G: string;
  REVCAT_A: string;
  OPENAI: string;
  EXCHANGE: string;
  FREEEXCHANGE: string;
  BRAN: string;
  VEXO: string;
}

let cachedKeys: Keys | null = null;

export async function loadKeys(): Promise<Keys> {
  if (cachedKeys) {
    return cachedKeys;
  }

  const { isFastEnough } = await isConnectionFastEnough();
  // fetch revcat api key
  let REVCAT_G = await secureStoreGetItem("REVCAT_G");
  let REVCAT_A = await secureStoreGetItem("REVCAT_A");
  let OPENAI = await secureStoreGetItem("OPENAI");
  let EXCHANGE = await secureStoreGetItem("EXCHANGE");
  let FREEEXCHANGE = await secureStoreGetItem("FREEEXCHANGE");
  let BRAN = await secureStoreGetItem("BRAN");
  let VEXO = await secureStoreGetItem("VEXO");
  if (!isFastEnough) {
    cachedKeys = {
      REVCAT_G,
      REVCAT_A,
      OPENAI,
      EXCHANGE,
      FREEEXCHANGE,
      BRAN,
      VEXO,
    };
    return cachedKeys;
  }

  const data = await fetchServerInfo();
  if (!data) {
    cachedKeys = {
      REVCAT_G,
      REVCAT_A,
      OPENAI,
      EXCHANGE,
      FREEEXCHANGE,
      BRAN,
      VEXO,
    };
    return cachedKeys;
  }

  await secureStoreSetItem("REVCAT_G", data.REVCAT_G);
  await secureStoreSetItem("REVCAT_A", data.REVCAT_A);
  await secureStoreSetItem("OPENAI", data.OPENAI);
  await secureStoreSetItem("EXCHANGE", data.EXCHANGE);
  await secureStoreSetItem("FREEEXCHANGE", data.FREEEXCHANGE);
  await secureStoreSetItem("BRAN", data.BRAN);
  await secureStoreSetItem("VEXO", data.VEXO);
  REVCAT_G = data.REVCAT_G;
  REVCAT_A = data.REVCAT_A;
  OPENAI = data.OPENAI;
  EXCHANGE = data.EXCHANGE;
  FREEEXCHANGE = data.FREEEXCHANGE;
  BRAN = data.BRAN;
  VEXO = data.VEXO;

  cachedKeys = {
    REVCAT_G,
    REVCAT_A,
    OPENAI,
    EXCHANGE,
    FREEEXCHANGE,
    BRAN,
    VEXO,
  };

  return cachedKeys;
}
