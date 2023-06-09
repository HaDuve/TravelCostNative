import Purchases from "react-native-purchases";
import { FORCE_PREMIUM } from "../../confAppConstants";
import Toast from "react-native-toast-message";
import { CAT_API_KEY } from "@env";
/*
 The API key for your app from the RevenueCat dashboard: https://app.revenuecat.com
 */
export const REVCAT_API_KEY = "appl_whxTjURHsRibiuipBsnAoEGCckd";

/*
  The entitlement ID from the RevenueCat dashboard that is activated upon successful in-app purchase for the duration of the purchase.
  */
export const ENTITLEMENT_ID = "Premium";

export async function isPremiumMember() {
  // dev const is set
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
    Toast.show({
      type: "error",
      text1: "Error fetching premium status",
      text2: e.message,
    });
  }
}
