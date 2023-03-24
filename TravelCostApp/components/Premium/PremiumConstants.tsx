import Purchases, { CustomerInfo } from "react-native-purchases";
/*
 The API key for your app from the RevenueCat dashboard: https://app.revenuecat.com
 */
export const API_KEY = "appl_whxTjURHsRibiuipBsnAoEGCckd";

/*
  The entitlement ID from the RevenueCat dashboard that is activated upon successful in-app purchase for the duration of the purchase.
  */
export const ENTITLEMENT_ID = "PremiumSubscriptionTestA1";

export async function isPremiumMember() {
  let customerInfo: CustomerInfo;
  try {
    // access latest customerInfo
    customerInfo = await Purchases.getCustomerInfo();
  } catch (e) {
    // Error fetching customer info
    console.error(e);
  }
  if (typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== "undefined") {
    // Grant user "pro" access
    return true;
  } else {
    return false;
  }
}
