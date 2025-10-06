import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { DateTime } from "luxon";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, Platform } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { Card } from "react-native-paper";
import Purchases, { CustomerInfo } from "react-native-purchases";

import BackButton from "../components/UI/BackButton";

//Localization

import { en, de, fr, ru } from "../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale =
  Localization.getLocales()[0] && Localization.getLocales()[0].languageCode
    ? Localization.getLocales()[0].languageCode.slice(0, 2)
    : "en";
i18n.enableFallback = true;

const CustomerScreen = () => {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>(null);
  useEffect(() => {
    async function getCustomerInfo() {
      try {
        const customerInfo = await Purchases.getCustomerInfo();
        setCustomerInfo(customerInfo);
        // access latest customerInfo
      } catch (e) {
        // Error fetching customer info
      }
    }
    getCustomerInfo();
  }, []);
  const reqDate = DateTime.fromISO(customerInfo?.requestDate).toLocaleString();
  const originalAppUserID = customerInfo?.originalAppUserId;
  const firstSeen = customerInfo?.firstSeen;
  const originalAppVersion = customerInfo?.originalApplicationVersion;
  const originalPurchaseDate = customerInfo?.originalPurchaseDate;
  const managementURL = customerInfo?.managementURL;
  const allPurchasedProductIdentifiers =
    customerInfo?.allPurchasedProductIdentifiers;
  const activeSubscriptions = customerInfo?.activeSubscriptions;
  //   const entitlements = customerInfo?.entitlements;
  const entitlementInfo = customerInfo?.entitlements.active["Premium"];
  const identifier = entitlementInfo?.identifier;
  const productIdentifier = entitlementInfo?.productIdentifier;
  const isActive = entitlementInfo?.isActive;
  const willRenew = entitlementInfo?.willRenew;
  const periodType = entitlementInfo?.periodType;
  const latestPurchaseDate = DateTime.fromISO(
    entitlementInfo?.latestPurchaseDate
  ).toLocaleString();
  const originalPurchaseDateEntitlement = entitlementInfo?.originalPurchaseDate;
  const expirationDate = DateTime.fromISO(
    entitlementInfo?.expirationDate
  ).toLocaleString();
  const store = entitlementInfo?.store;
  const isSandbox = entitlementInfo?.isSandbox;
  const unsubscribeDetectedAt = entitlementInfo?.unsubscribeDetectedAt;
  const billingIssueDetectedAt = entitlementInfo?.billingIssueDetectedAt;

  return (
    <Card style={styles.container}>
      <ScrollView>
        {/* <View style={styles.section}>
          <Text style={styles.label}>User ID:</Text>
          <Text style={styles.info}>{originalAppUserID}</Text>
        </View> */}
        <View style={styles.section}>
          <Text style={styles.label}>{i18n.t("activeSubscription")}</Text>
          <Text style={styles.info}>{activeSubscriptions}</Text>
        </View>
        {/*
        <View style={styles.section}>
          <Text style={styles.label}>Manage Subscription:</Text>
          <Text style={styles.info}>{managementURL}</Text>
        </View> */}

        <View style={styles.section}>
          <Text style={styles.label}>{i18n.t("expirationDate")}</Text>
          <Text style={styles.info}>{expirationDate}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>{i18n.t("latestPurchaseDate")}</Text>
          <Text style={styles.info}>{latestPurchaseDate}</Text>
        </View>

        {/* <View style={styles.section}>
          <Text style={styles.label}>Original Purchase Date:</Text>
          <Text style={styles.info}>{originalPurchaseDate}</Text>
        </View> */}

        <View style={styles.section}>
          <Text style={styles.label}>{i18n.t("periodType")}</Text>
          <Text style={styles.info}>{periodType}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>{i18n.t("willRenew")}</Text>
          <Text style={styles.info}>
            {willRenew ? i18n.t("yesValue") : i18n.t("noValue")}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>{i18n.t("store")}</Text>
          <Text style={styles.info}>{store}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>{i18n.t("requestDate")}</Text>
          <Text style={styles.info}>{reqDate}</Text>
        </View>
        <BackButton style={{}}></BackButton>
      </ScrollView>
    </Card>
  );
};

export default CustomerScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 24,
    marginTop: Platform.OS === "ios" ? 24 : 40,
    padding: 16,
    paddingTop: Platform.OS === "ios" ? 16 : 24,
  },
  info: {
    fontSize: 14,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  section: {
    marginBottom: 16,
  },
});
