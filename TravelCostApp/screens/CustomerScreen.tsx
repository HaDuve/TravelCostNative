import { StyleSheet, Text, View } from "react-native";
import React, { useEffect, useState } from "react";
import Purchases, { CustomerInfo } from "react-native-purchases";
import { ScrollView } from "react-native-gesture-handler";
import { DateTime } from "luxon";

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
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.label}>User ID:</Text>
        <Text style={styles.info}>{originalAppUserID}</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Active Subscriptions:</Text>
        <Text style={styles.info}>{activeSubscriptions}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Manage Subscription:</Text>
        <Text style={styles.info}>{managementURL}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Expiration Date:</Text>
        <Text style={styles.info}>{expirationDate}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Latest Purchase Date:</Text>
        <Text style={styles.info}>{latestPurchaseDate}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Original Purchase Date:</Text>
        <Text style={styles.info}>{originalPurchaseDate}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Period Type:</Text>
        <Text style={styles.info}>{periodType}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Will Renew:</Text>
        <Text style={styles.info}>{willRenew}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Store:</Text>
        <Text style={styles.info}>{store}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Request Date:</Text>
        <Text style={styles.info}>{reqDate}</Text>
      </View>
    </ScrollView>
  );
};

export default CustomerScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  info: {
    fontSize: 14,
  },
});
