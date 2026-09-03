import {
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";
import Purchases, { CustomerInfo } from "react-native-purchases";
import { ActivityIndicator } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";

import BackButton from "../components/UI/BackButton";
import BackgroundGradient from "../components/UI/BackgroundGradient";
import ActionRow from "../components/UI/ActionRow";
import { trackEvent } from "../util/vexo-tracking";
import { VexoEvents } from "../util/vexo-constants";
import { i18n } from "../i18n/i18n";
import { GlobalStyles } from "../constants/styles";
import {
  buildPremiumStatusViewModel,
  PREMIUM_STATUS_FEATURE_KEYS,
} from "../util/premium-status";
import { constantScale, dynamicScale } from "../util/scalingUtil";

const HANNES_PHOTO = require("../assets/hannes-premium.jpg");

const CustomerScreen = () => {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    async function getCustomerInfo() {
      try {
        const info = await Purchases.getCustomerInfo();
        setCustomerInfo(info);
        setLoadFailed(false);
        trackEvent(VexoEvents.CUSTOMER_SCREEN_PRESSED);
      } catch (e) {
        setCustomerInfo(null);
        setLoadFailed(true);
      } finally {
        setIsLoading(false);
      }
    }
    getCustomerInfo();
  }, []);

  const status = buildPremiumStatusViewModel(customerInfo);

  const openManageSubscription = () => {
    if (!status.managementURL) return;
    Linking.openURL(status.managementURL).catch(() => {});
  };

  const periodLabelKey =
    status.periodKind === "lifetime"
      ? "premiumStatusNeverExpires"
      : status.periodKind === "expiring"
        ? "premiumStatusExpiresOn"
        : "premiumStatusRenewsOn";

  return (
    <BackgroundGradient style={styles.gradient}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <ActivityIndicator
            size="large"
            color={GlobalStyles.colors.primary700}
            style={styles.loader}
          />
        ) : loadFailed ? (
          <View style={styles.headerBlock}>
            <Text style={styles.subtitle}>{i18n.t("premiumStatusLoadError")}</Text>
          </View>
        ) : !status.isPremium ? (
          <View style={styles.headerBlock}>
            <Text style={styles.title}>{i18n.t("premiumNomadInactive")}</Text>
          </View>
        ) : (
          <>
            <View style={styles.headerBlock}>
              <Text style={styles.title}>{i18n.t("premiumStatusTitle")}</Text>
              <Text style={styles.subtitle}>
                {i18n.t("premiumStatusSubtitle")}
              </Text>
            </View>

            <View style={styles.personalCard}>
              <Image
                source={HANNES_PHOTO}
                style={styles.portrait}
                accessibilityLabel={i18n.t("premiumStatusPersonalSignature")}
              />
              <Text style={styles.personalNote}>
                {i18n.t("premiumStatusPersonalNote")}
              </Text>
              <Text style={styles.signature}>
                — {i18n.t("premiumStatusPersonalSignature")}
              </Text>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>
                {i18n.t("premiumStatusFeaturesTitle")}
              </Text>
              {PREMIUM_STATUS_FEATURE_KEYS.map((featureKey) => (
                <View key={featureKey} style={styles.featureRow}>
                  <View style={styles.featureIconWrap}>
                    <Ionicons
                      name="sparkles"
                      size={constantScale(16, 0.5)}
                      color={GlobalStyles.colors.accent500}
                    />
                  </View>
                  <Text style={styles.featureText}>{i18n.t(featureKey)}</Text>
                </View>
              ))}
            </View>

            <View style={styles.sectionCard}>
              {status.memberSinceLabel ? (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>
                    {i18n.t("premiumStatusMemberSince")}
                  </Text>
                  <Text style={styles.detailValue}>{status.memberSinceLabel}</Text>
                </View>
              ) : null}

              {status.periodKind === "lifetime" ? (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>
                    {i18n.t("premiumStatusRenewsOn")}
                  </Text>
                  <Text style={styles.detailValue}>
                    {i18n.t("premiumStatusNeverExpires")}
                  </Text>
                </View>
              ) : status.periodDateLabel ? (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{i18n.t(periodLabelKey)}</Text>
                  <Text style={styles.detailValue}>{status.periodDateLabel}</Text>
                </View>
              ) : null}
            </View>

            {status.managementURL ? (
              <ActionRow
                testID="premium-manage-subscription"
                tier="gradient"
                label={i18n.t("premiumStatusManageSubscription")}
                hint={i18n.t("premiumStatusManageHint")}
                icon="card-outline"
                onPress={openManageSubscription}
                style={styles.manageButton}
              />
            ) : null}
          </>
        )}

        <BackButton />
      </ScrollView>
    </BackgroundGradient>
  );
};

export default CustomerScreen;

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: dynamicScale(20, false, 0.5),
    paddingTop:
      Platform.OS === "ios"
        ? dynamicScale(24, true, 0.5)
        : dynamicScale(40, true, 0.5),
    paddingBottom: dynamicScale(32, true, 0.5),
  },
  headerBlock: {
    marginBottom: dynamicScale(20, true, 0.5),
  },
  title: {
    color: GlobalStyles.colors.primary800,
    fontSize: constantScale(30, 0.5),
    fontWeight: "800",
    marginBottom: dynamicScale(8, true, 0.5),
    textAlign: "center",
  },
  subtitle: {
    color: GlobalStyles.colors.textColor,
    fontSize: dynamicScale(16, false, 0.5),
    lineHeight: dynamicScale(24, false, 0.5),
    textAlign: "center",
  },
  loader: {
    marginVertical: dynamicScale(40, true, 0.5),
  },
  personalCard: {
    backgroundColor: "rgba(255, 255, 255, 0.88)",
    borderRadius: constantScale(20, 0.5),
    padding: dynamicScale(20, false, 0.5),
    marginBottom: dynamicScale(16, true, 0.5),
    alignItems: "center",
  },
  portrait: {
    width: constantScale(120, 0.5),
    height: constantScale(120, 0.5),
    borderRadius: constantScale(60, 0.5),
    marginBottom: dynamicScale(16, true, 0.5),
    borderWidth: 3,
    borderColor: GlobalStyles.colors.primary200,
  },
  personalNote: {
    color: GlobalStyles.colors.textColor,
    fontSize: dynamicScale(15, false, 0.5),
    lineHeight: dynamicScale(22, false, 0.5),
    textAlign: "center",
  },
  signature: {
    marginTop: dynamicScale(12, true, 0.5),
    color: GlobalStyles.colors.primary700,
    fontSize: dynamicScale(16, false, 0.5),
    fontWeight: "700",
    fontStyle: "italic",
  },
  sectionCard: {
    backgroundColor: "rgba(255, 255, 255, 0.82)",
    borderRadius: constantScale(18, 0.5),
    padding: dynamicScale(18, false, 0.5),
    marginBottom: dynamicScale(16, true, 0.5),
  },
  sectionTitle: {
    color: GlobalStyles.colors.primary800,
    fontSize: dynamicScale(18, false, 0.5),
    fontWeight: "700",
    marginBottom: dynamicScale(12, true, 0.5),
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: dynamicScale(10, true, 0.5),
  },
  featureIconWrap: {
    width: constantScale(28, 0.5),
    alignItems: "center",
    marginRight: dynamicScale(8, false, 0.5),
  },
  featureText: {
    flex: 1,
    color: GlobalStyles.colors.textColor,
    fontSize: dynamicScale(15, false, 0.5),
    lineHeight: dynamicScale(21, false, 0.5),
  },
  detailRow: {
    marginBottom: dynamicScale(10, true, 0.5),
  },
  detailLabel: {
    color: GlobalStyles.colors.primaryGrayed,
    fontSize: dynamicScale(13, false, 0.5),
    marginBottom: dynamicScale(2, true, 0.5),
    textTransform: "uppercase",
    letterSpacing: 0.6,
    fontWeight: "600",
  },
  detailValue: {
    color: GlobalStyles.colors.textColor,
    fontSize: dynamicScale(17, false, 0.5),
    fontWeight: "600",
  },
  manageButton: {
    marginBottom: dynamicScale(8, true, 0.5),
  },
});
