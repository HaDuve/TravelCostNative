import React from "react";
import { View, Text, Pressable, Alert, StyleSheet } from "react-native";
import Purchases from "react-native-purchases";
import { ENTITLEMENT_ID } from "../Premium/PremiumConstants";
import branch, { BranchEvent } from "react-native-branch";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr, ru } from "../../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

import { GlobalStyles } from "../../constants/styles";
import PropTypes from "prop-types";
import Toast from "react-native-toast-message";
import Discount from "./Discount";

const PackageItem = ({ purchasePackage, setIsPurchasing, navigation }) => {
  const {
    product: { title, description, priceString, subscriptionPeriod },
  } = purchasePackage;

  const isMonthly = subscriptionPeriod === "P1M";
  const isYearly = subscriptionPeriod === "P1Y";
  const isLifetime = !isMonthly && !isYearly;

  const subscriptionPeriodString = isMonthly
    ? " monthly"
    : isYearly
    ? " yearly"
    : "";
  const subscriptionCalcPriceString = priceString;
  const onSelection = async () => {
    setIsPurchasing(true);

    try {
      const { customerInfo, productIdentifier } =
        await Purchases.purchasePackage(purchasePackage);

      console.log("onSelection ~ customerInfo:", customerInfo);
      console.log("onSelection ~ productIdentifier:", productIdentifier);
      if (
        typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== "undefined"
      ) {
        navigation.pop();
        Toast.show({
          type: "success",
          text1: i18n.t("toastPurchaseSuccess1"),
          text2: i18n.t("toastPurchaseSuccess2"),
        });
        const branchEvent = isLifetime
          ? BranchEvent.Purchase
          : BranchEvent.StartTrial;
        const event = new BranchEvent(branchEvent);
        event.logEvent();
      }
    } catch (e) {
      if (!e.userCancelled) {
        Alert.alert(
          i18n.t("errorPurchasePackage"),
          i18n.t("errorPurchasePackageText")
        );
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  const discountJSX = isYearly && (
    <Discount discountPercentage={40} style={styles.discountStyle}></Discount>
  );

  return (
    <Pressable
      onPress={onSelection}
      style={({ pressed }) => [
        pressed && GlobalStyles.pressed,
        styles.container,
        GlobalStyles.strongShadow,
      ]}
    >
      {discountJSX}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.terms}>{description}</Text>
      <Text style={styles.title}>
        {subscriptionCalcPriceString}
        {subscriptionPeriodString}
      </Text>
    </Pressable>
  );
};

export default PackageItem;

PackageItem.propTypes = {
  purchasePackage: PropTypes.object.isRequired,
  setIsPurchasing: PropTypes.func.isRequired,
  navigation: PropTypes.object.isRequired,
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "space-between",
    alignItems: "center",
    padding: "4%",
    // paddingHorizontal: "10%",
    backgroundColor: GlobalStyles.colors.backgroundColor,
    borderRadius: 10,
    margin: "2%",
    marginHorizontal: "4%",
  },
  title: {
    color: GlobalStyles.colors.textColor,
    fontSize: 16,
    fontWeight: "bold",
  },
  discountStyle: {},
  terms: {
    color: "darkgrey",
  },
});
