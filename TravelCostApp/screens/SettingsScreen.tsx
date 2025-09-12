import {
  Alert,
  StyleSheet,
  View,
  Text,
  Linking,
  TouchableOpacity,
  Platform,
} from "react-native";
import React, { useContext, useState } from "react";
import Purchases from "react-native-purchases";
import { TripContext } from "../store/trip-context";
import { UserContext } from "../store/user-context";
import { AuthContext } from "../store/auth-context";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr, ru } from "../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale =
  Localization.getLocales()[0] && Localization.getLocales()[0].languageCode
    ? Localization.getLocales()[0].languageCode.slice(0, 2)
    : "en";
i18n.enableFallback = true;
// i18n.locale = "en";

import { ScrollView } from "react-native-gesture-handler";
import { GlobalStyles } from "../constants/styles";
import LinkingButton from "../components/UI/LinkButton";
import { DEVELOPER_MODE } from "../confAppConstants";
import { useFocusEffect } from "@react-navigation/native";
import { resetTour } from "../util/tourUtil";
import { reloadApp } from "../util/appState";
import { ENTITLEMENT_ID } from "../components/Premium/PremiumConstants";
import PropTypes from "prop-types";
import GradientButton from "../components/UI/GradientButton";
import SettingsSection from "../components/UI/SettingsSection";
import Toast from "react-native-toast-message";
import { useEffect } from "react";
import LoadingBarOverlay from "../components/UI/LoadingBarOverlay";
import { secureStoreGetItem } from "../store/secure-storage";
import IconButton from "../components/UI/IconButton";
import { BlurView } from "expo-blur";
import { NetworkContext } from "../store/network-context";
import safeLogError from "../util/error";
import { canOpenURL } from "expo-linking";
import DevContent from "../components/Settings/DevContent";
import CurrencyExchangeInfo from "../components/UI/CurrencyExchangeInfo";
import { dynamicScale } from "../util/scalingUtil";

const SettingsScreen = ({ navigation }) => {
  const authCtx = useContext(AuthContext);
  const userCtx = useContext(UserContext);
  const tripCtx = useContext(TripContext);
  const netCtx = useContext(NetworkContext);
  const isConnected = netCtx.isConnected;
  const [isRestoringPurchases, setIsRestoringPurchases] = useState(false);
  const multiTraveller =
    (tripCtx.travellers && tripCtx.travellers?.length > 1) ?? false;

  const [emailString, setEmailString] = useState("");

  async function getEmail() {
    const email = await secureStoreGetItem("ENCM");
    if (email) {
      setEmailString(email);
    }
  }
  useEffect(() => {
    getEmail();
  }, []);

  const [premiumStatus, setPremiumStatus] = useState(false);
  const buttonstring1 = i18n.t("youArePremium");
  const buttonstring2 = i18n.t("becomePremium");
  const premiumButtonString = premiumStatus ? buttonstring1 : buttonstring2;

  useFocusEffect(
    React.useCallback(() => {
      async function setPremiumNow() {
        const isPremium = await userCtx.checkPremium();
        setPremiumStatus(isPremium);
      }
      setPremiumNow();
    }, [userCtx.userName])
  );

  function deleteAccountHandler() {
    return Alert.alert(i18n.t("sure"), i18n.t("sureDeleteAccount"), [
      // The "No" button
      // Does nothing but dismiss the dialog when tapped
      {
        text: i18n.t("back"),
      },
      // The "Yes" button
      // delete mode red
      {
        text: i18n.t("delete"),
        style: "destructive",
        onPress: () => {
          if (!isConnected) {
            Alert.alert(i18n.t("noConnection"), i18n.t("checkConnectionError"));
            return;
          }
          // console.log("deleteAccountHandler ~ deleteAccountHandler");
          authCtx.deleteAccount();
        },
      },
    ]);
  }

  async function restorePurchases() {
    setIsRestoringPurchases(true);
    try {
      const restore = await Purchases.restorePurchases();
      // ... check restored purchaserInfo to see if entitlement is now active
      // console.log("restorePurchases ~ restore:", restore);
      if (restore.entitlements.all[ENTITLEMENT_ID].isActive) {
        // ... grant user entitlement
        // console.log("restorePurchases ~ restore.entitlements.all:", restore);
        await userCtx.checkPremium();
        navigation.pop();
        Toast.show({
          type: "success",
          text1: i18n.t("premiumNomad"),
          text2: i18n.t("premiumNomadActiveNow"),
        });
      }
    } catch (e) {
      Toast.show({
        type: "error",
        text1: i18n.t("premiumNomad"),
        text2: i18n.t("premiumNomadError"),
      });
      // console.log("restorePurchases ~ e:", e);
    }
    setIsRestoringPurchases(false);
  }
  const isAndroid = Platform.OS === "android";

  return (
    <ScrollView
      scrollEnabled={true}
      stickyHeaderIndices={[0]}
      style={{
        flex: 1,
        paddingHorizontal: dynamicScale(15),
        backgroundColor: GlobalStyles.colors.backgroundColor,
        ...Platform.select({
          ios: {
            padding: 0,
          },
          android: {
            paddingTop: dynamicScale(18, true),
          },
        }),
      }}
    >
      <BlurView
        intensity={isAndroid ? 280 : 90}
        style={{
          flexDirection: "row",
        }}
      >
        {/* Back button */}
        <TouchableOpacity
          onPress={() => {
            navigation.goBack();
          }}
        >
          <IconButton
            badge={null}
            badgeText={null}
            badgeStyle={null}
            onPressIn={null}
            onPressOut={null}
            onLongPress={null}
            category={null}
            icon="arrow-back-outline"
            size={dynamicScale(36, false, 0.5)}
            color={GlobalStyles.colors.textColor}
            buttonStyle={styles.backButton}
            onPress={() => navigation.goBack()}
          ></IconButton>
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>{i18n.t("settingsTitle")}</Text>
        </View>
      </BlurView>
      {DEVELOPER_MODE && <DevContent navigation={navigation} />}

      <SettingsSection multiTraveller={multiTraveller}></SettingsSection>

      <GradientButton
        style={styles.settingsButton}
        buttonStyle={{}}
        onPress={async () => {
          await resetTour();
          await reloadApp();
        }}
      >
        {i18n.t("resetAppIntroductionLabel")}
      </GradientButton>
      <LinkingButton
        style={styles.settingsButton}
        URL="https://foodfornomads.com/"
      >
        {i18n.t("visitFoodForNomadsLabel")}
      </LinkingButton>
      <GradientButton
        style={styles.settingsButton}
        buttonStyle={{}}
        darkText
        colors={GlobalStyles.gradientColorsButton}
        onPress={() => {
          if (!isConnected) {
            Alert.alert(i18n.t("noConnection"), i18n.t("checkConnectionError"));
            return;
          }
          // console.log("pressed premium button");
          if (premiumStatus) {
            // Toast.show({
            //   type: "success",
            //   text1: "Premium Nomad", //i18n.t("premiumToastTitle"),
            //   text2: "You are a premium Nomad already!", //i18n.t("premiumToastText"),
            // });
            navigation.navigate("Customer");
          } else navigation.navigate("Paywall");
        }}
      >
        {premiumButtonString}
      </GradientButton>
      <CurrencyExchangeInfo />
      {!isRestoringPurchases && (
        <TouchableOpacity onPress={() => restorePurchases()}>
          <Text style={[styles.textButton]}>{i18n.t("restorePurchases")}</Text>
        </TouchableOpacity>
      )}
      {isRestoringPurchases && (
        <LoadingBarOverlay
          customText={i18n.t("restorePurchases") + "..."}
        ></LoadingBarOverlay>
      )}
      {emailString && (
        <TouchableOpacity onPress={() => deleteAccountHandler()}>
          <Text style={[styles.textButton]}>
            {i18n.t("deleteAccount")} {emailString}
          </Text>
        </TouchableOpacity>
      )}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: "4%",
        }}
      ></View>
      <View style={{ flex: 1, minHeight: dynamicScale(100, true) }}></View>
    </ScrollView>
  );
};

export default SettingsScreen;

SettingsScreen.propTypes = {
  navigation: PropTypes.object.isRequired,
};

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginLeft: "30%",
    paddingVertical: "3%",
  },
  backButton: { marginBottom: "-14%" },
  titleText: {
    fontSize: dynamicScale(22, false, 0.5),
    fontWeight: "bold",
    fontStyle: "italic",
    color: GlobalStyles.colors.gray700,
    marginLeft: "2%",
  },
  settingsButton: {
    marginVertical: "2%",
    marginHorizontal: "8%",
    borderRadius: 16,
  },
  textButton: {
    marginTop: "8%",
    paddingVertical: "2%",
    paddingHorizontal: "8%",
    borderRadius: 16,
    textAlign: "center",
    fontSize: dynamicScale(16, false, 0.5),
    fontWeight: "bold",
    fontStyle: "italic",
    color: GlobalStyles.colors.gray700,
    marginLeft: "2%",
  },
});
