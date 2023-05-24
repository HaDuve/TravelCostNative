import { StyleSheet, Text, View } from "react-native";
import React, { useEffect, useState } from "react";
import Purchases, { CustomerInfo } from "react-native-purchases";
import { ScrollView } from "react-native-gesture-handler";

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
  const reqDate = customerInfo?.requestDate;
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
  const latestPurchaseDate = entitlementInfo?.latestPurchaseDate;
  const originalPurchaseDateEntitlement = entitlementInfo?.originalPurchaseDate;
  const expirationDate = entitlementInfo?.expirationDate;
  const store = entitlementInfo?.store;
  const isSandbox = entitlementInfo?.isSandbox;
  const unsubscribeDetectedAt = entitlementInfo?.unsubscribeDetectedAt;
  const billingIssueDetectedAt = entitlementInfo?.billingIssueDetectedAt;

  return (
    <ScrollView>
      <Text>CustomerScreen</Text>
      <Text>req Date: {reqDate}</Text>
      <Text>originalAppUserID: {originalAppUserID}</Text>
      <Text>firstSeen: {firstSeen}</Text>
      <Text>originalAppVersion: {originalAppVersion}</Text>
      <Text>originalPurchaseDate: {originalPurchaseDate}</Text>
      <Text>managementURL: {managementURL}</Text>
      <Text>
        allPurchasedProductIdentifiers: {allPurchasedProductIdentifiers}
      </Text>
      <Text>activeSubscriptions: {activeSubscriptions}</Text>

      <Text>identifier: {identifier}</Text>
      <Text>productIdentifier: {productIdentifier}</Text>
      <Text>isActive: {isActive}</Text>
      <Text>willRenew: {willRenew}</Text>
      <Text>periodType: {periodType}</Text>
      <Text>latestPurchaseDate: {latestPurchaseDate}</Text>
      <Text>
        originalPurchaseDateEntitlement: {originalPurchaseDateEntitlement}
      </Text>
      <Text>expirationDate: {expirationDate}</Text>
      <Text>store: {store}</Text>
      <Text>isSandbox: {isSandbox}</Text>
      <Text>unsubscribeDetectedAt: {unsubscribeDetectedAt}</Text>
      <Text>billingIssueDetectedAt: {billingIssueDetectedAt}</Text>
    </ScrollView>
  );
};

export default CustomerScreen;

const styles = StyleSheet.create({});
