import Purchases, { CustomerInfo } from "react-native-purchases";
import { PREMIUM } from "../../confApp";
import { Alert } from "react-native";
/*
 The API key for your app from the RevenueCat dashboard: https://app.revenuecat.com
 */
export const API_KEY = "appl_whxTjURHsRibiuipBsnAoEGCckd";

/*
  The entitlement ID from the RevenueCat dashboard that is activated upon successful in-app purchase for the duration of the purchase.
  */
export const ENTITLEMENT_ID = "PremiumSubscriptionTestA1";

export async function isPremiumMember() {
  // dev const is set
  if (PREMIUM) return true;
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
    console.error(e);
    Alert.alert(
      "Error fetching premium status",
      "Please try again later or contact support."
    );
  }
}
