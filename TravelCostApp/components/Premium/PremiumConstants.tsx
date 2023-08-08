import Purchases from "react-native-purchases";
import { FORCE_PREMIUM } from "../../confAppConstants";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr, ru } from "../../i18n/supportedLanguages";
import branch from "react-native-branch";
import {
  secureStoreGetItem,
  secureStoreSetItem,
} from "../../store/secure-storage";
import { fetchServerInfo } from "../../util/http";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

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
      console.log("User is premium member");
      return true;
    } //else
    console.log("User is not premium member");
    return false;
  } catch (e) {
    // Error fetching customer info
    console.error(e);
  }
}

export async function setAttributesAsync(emailString = "", userName = "") {
  if (emailString) await Purchases.setEmail(emailString);
  if (userName) await Purchases.setDisplayName(userName);
  const referrer = await branch.getLatestReferringParams();
  if (referrer) await Purchases.setCampaign(referrer["~channel"]);
}

export interface RevCatKeys {
  REVCAT_G: string;
  REVCAT_A: string;
}

export async function loadRevCatKeys(): Promise<RevCatKeys> {
  // fetch revcat api key
  let REVCAT_G = await secureStoreGetItem("REVCAT_G");
  let REVCAT_A = await secureStoreGetItem("REVCAT_A");
  if (!REVCAT_G || !REVCAT_A) {
    const data = await fetchServerInfo();
    await secureStoreSetItem("REVCAT_G", data.REVCAT_G);
    await secureStoreSetItem("REVCAT_A", data.REVCAT_A);
    REVCAT_G = data.REVCAT_G;
    REVCAT_A = data.REVCAT_A;
  }
  return { REVCAT_G, REVCAT_A };
}
