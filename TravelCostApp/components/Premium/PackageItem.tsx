import React from "react";
import { View, Text, Pressable, Alert, StyleSheet } from "react-native";
import Purchases, { PurchasesPackage } from "react-native-purchases";
import { ENTITLEMENT_ID } from "../Premium/PremiumConstants";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr, ru } from "../../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale =
  Localization.getLocales()[0] && Localization.getLocales()[0].languageCode
    ? Localization.getLocales()[0].languageCode.slice(0, 2)
    : "en";
i18n.enableFallback = true;
// i18n.locale = "en";

import { GlobalStyles } from "../../constants/styles";
import PropTypes from "prop-types";
import Toast from "react-native-toast-message";
import Discount from "./Discount";
import { constantScale } from "../../util/scalingUtil";
import { trackEvent } from "../../util/vexo-tracking";
import { VexoEvents } from "../../util/vexo-constants";

const PackageItem = ({ purchasePackage, setIsPurchasing, navigation }) => {
  const {
    product: { title, description, priceString, subscriptionPeriod },
  } = purchasePackage;
  const purchasePack: PurchasesPackage = purchasePackage;
  const discount = purchasePack?.product?.introPrice;
  const hasAFreeTrial = discount?.price === 0;
  const freeNumberOfUnits = discount?.periodNumberOfUnits;
  const freeUnit = discount?.periodUnit;
  const freePeriodString =
    hasAFreeTrial &&
    `${freeNumberOfUnits} ${i18n.t(freeUnit?.toLowerCase())} ${i18n.t(
      "freeTrial"
    )}`;

  const isMonthly = subscriptionPeriod === "P1M";
  const isYearly = subscriptionPeriod === "P1Y";
  const isPopular = isYearly;
  const isLifetime = !isMonthly && !isYearly;

  const subscriptionPeriodString = isMonthly
    ? ` ${i18n.t("perMonth")}`
    : isYearly
    ? ` ${i18n.t("perYear")}`
    : "";
  const subscriptionCalcPriceString = priceString;
  const onSelection = async () => {
    setIsPurchasing(true);
    try {
      const { customerInfo } = await Purchases.purchasePackage(purchasePackage);

      if (
        typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== "undefined"
      ) {
        // Track package purchase
        const packageType = isMonthly
          ? VexoEvents.PACKAGE_MONTHLY_PURCHASED
          : isYearly
          ? VexoEvents.PACKAGE_YEARLY_PURCHASED
          : isLifetime
          ? VexoEvents.PACKAGE_LIFETIME_PURCHASED
          : VexoEvents.PACKAGE_PURCHASED;

        trackEvent(VexoEvents.PACKAGE_PURCHASED, {
          packageType: packageType,
          subscriptionPeriod: subscriptionPeriod,
          priceString: subscriptionCalcPriceString,
          hasFreeTrial: hasAFreeTrial,
        });

        // Also track specific package type
        if (packageType !== VexoEvents.PACKAGE_PURCHASED) {
          trackEvent(packageType, {
            subscriptionPeriod: subscriptionPeriod,
            priceString: subscriptionCalcPriceString,
            hasFreeTrial: hasAFreeTrial,
          });
        }

        navigation.pop();
        Toast.show({
          type: "success",
          text1: i18n.t("toastPurchaseSuccess1"),
          text2: i18n.t("toastPurchaseSuccess2"),
        });
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

  const isPopularLabel = isPopular && (
    <View
      style={{
        borderWidth: 1,
        borderColor: GlobalStyles.colors.cat2,
        backgroundColor: GlobalStyles.colors.cat2,
        borderRadius: 24,
        padding: constantScale(4, 0.5),
        paddingHorizontal: constantScale(16, 0.5),
        alignItems: "center",
        marginTop: "-10.5%",
        marginBottom: constantScale(4, 0.5),
      }}
    >
      <Text style={{ color: "white", fontSize: constantScale(14, 0.5) }}>
        {i18n.t("popular").toUpperCase()}
      </Text>
    </View>
  );

  return (
    <Pressable
      onPress={onSelection}
      style={({ pressed }) => [
        pressed && GlobalStyles.pressed,
        styles.container,
        isPopular && styles.isPopularContainer,
        GlobalStyles.strongShadow,
      ]}
    >
      {isPopularLabel}
      {/* {discountJSX} */}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.terms}>{description}</Text>
      {hasAFreeTrial && <Text style={styles.terms}>{freePeriodString}</Text>}
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
    paddingHorizontal: "4%",
    backgroundColor: GlobalStyles.colors.backgroundColor,
    borderRadius: 10,
    margin: "2%",
    marginHorizontal: "4%",
  },
  isPopularContainer: {
    borderWidth: 4,
    borderColor: GlobalStyles.colors.cat2,
  },
  title: {
    color: GlobalStyles.colors.textColor,
    fontSize: constantScale(16, 0.5),
    fontWeight: "bold",
  },
  discountStyle: {},
  terms: {
    color: "darkgrey",
    fontSize: constantScale(14, 0.5),
  },
});
