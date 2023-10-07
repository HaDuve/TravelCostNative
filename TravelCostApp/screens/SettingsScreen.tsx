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
import { importExcelFile } from "../components/ImportExport/OpenXLSXPicker";
import { TripContext } from "../store/trip-context";
import { UserContext } from "../store/user-context";
import { AuthContext } from "../store/auth-context";
import { ExpensesContext } from "../store/expenses-context";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr, ru } from "../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

import Button from "../components/UI/Button";
import { exportAllExpensesToXLSX } from "../components/ImportExport/ExportToGoogleXlsx";
import { ScrollView } from "react-native-gesture-handler";
import { GlobalStyles } from "../constants/styles";
import LinkingButton from "../components/UI/LinkButton";
import { DEV } from "../confAppConstants";
import { useFocusEffect } from "@react-navigation/native";
import { DateTime } from "luxon";
import { resetTour } from "../util/tourUtil";
import { reloadApp } from "../util/appState";
import {
  ENTITLEMENT_ID,
  setAttributesAsync,
} from "../components/Premium/PremiumConstants";
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
import {
  initBranch,
  showBranchParams,
  trackPurchaseEvent,
} from "../components/Referral/branch";
import branch from "react-native-branch";
import { REACT_APP_CAT_API_KEY } from "@env";

const SettingsScreen = ({ navigation }) => {
  const expensesCtx = useContext(ExpensesContext);
  const authCtx = useContext(AuthContext);
  const userCtx = useContext(UserContext);
  const tripCtx = useContext(TripContext);
  const netCtx = useContext(NetworkContext);
  const isConnected = netCtx.isConnected && netCtx.strongConnection;
  const uid = authCtx.uid;
  const tripid = tripCtx.tripid;
  const userName = userCtx.userName;
  const addExpense = expensesCtx.addExpense;
  const [isRestoringPurchases, setIsRestoringPurchases] = useState(false);
  const [timeZoneString, setTimeZoneString] = useState("");
  const multiTraveller =
    (tripCtx.travellers && tripCtx.travellers?.length > 1) ?? false;
  const [DEBUG_tripid, setDEBUG_tripid] = useState("");
  const [DEBUG_uid, setDEBUG_uid] = useState("");

  useEffect(() => {
    setDEBUG_tripid(tripCtx.tripid);
    setDEBUG_uid(authCtx.uid);
  }, [tripCtx.tripid, authCtx.uid]);

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

  // Show detailed timezone info
  useFocusEffect(
    React.useCallback(() => {
      // Do something when the screen is focused
      console.log("SettingsScreen ~ useFocusEffect");

      // checking timezone in DEV MODE
      const timeZone =
        DateTime.now().setLocale(i18n.locale).toLocaleString({
          weekday: "short",
          month: "short",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }) +
        " " +
        DateTime.now().zoneName +
        " " +
        DateTime.now().toFormat("ZZZZ");
      setTimeZoneString(timeZone);
    }, [])
  );

  const [premiumStatus, setPremiumStatus] = useState(false);
  const buttonstring1 = i18n.t("youArePremium");
  const buttonstring2 = i18n.t("becomePremium");
  const premiumButtonString = premiumStatus ? buttonstring1 : buttonstring2;

  useFocusEffect(
    React.useCallback(() => {
      async function setPremiumNow() {
        const isPremium = await userCtx.checkPremium();
        // console.log("setPremiumNow ~ isPremium:", isPremium);
        setPremiumStatus(isPremium);
      }
      setPremiumNow();
    }, [])
  );

  const DEVCONTENT = DEV && (
    <View>
      {/* spacer View */}
      <View style={{ flex: 1, minHeight: 100 }}></View>
      <View style={styles.titleContainer}>
        <Text style={styles.titleText}>DEVCONTENT</Text>
      </View>
      <Text>DEBUG_tripid: {DEBUG_tripid}</Text>
      <Text>DEBUG_uid: {DEBUG_uid}</Text>
      <Text>{timeZoneString}</Text>

      <Button
        style={styles.settingsButton}
        onPress={async () => await initBranch()}
      >
        initBranch
      </Button>

      <Button
        style={styles.settingsButton}
        onPress={async () => await showBranchParams()}
      >
        showBranchParams
      </Button>

      <Button
        style={styles.settingsButton}
        onPress={async () => await trackPurchaseEvent()}
      >
        trackPurchaseEvent
      </Button>

      <LoadingBarOverlay
        progress={0.3}
        progressAt={3}
        progressMax={10}
      ></LoadingBarOverlay>

      <Button
        onPress={importExcelFile.bind(this, uid, tripid, userName, addExpense)}
        style={styles.settingsButton}
      >
        {/* aus der Excel .xlsm */}
        Import GehMalReisen
      </Button>
      <Button
        onPress={navigation.navigate.bind(this, "ImportGS", {
          uid,
          tripid,
          userName,
          addExpense,
        })}
        style={styles.settingsButton}
      >
        {/* aus der heruntergeladenen GoogleSheets als Xlsx */}
        Import FoodForNomads
      </Button>
      <Button
        onPress={exportAllExpensesToXLSX.bind(this, expensesCtx.expenses)}
        style={styles.settingsButton}
      >
        {/* in die heruntergeladene GoogleSheets als Xlsx */}
        {/* danach muss zurueck konvertiert werden  */}
        Export FoodForNomads
      </Button>
      <Button
        onPress={async () => {
          await tripCtx.fetchAndSettleCurrentTrip(true);
          navigation.pop();
        }}
        style={styles.settingsButton}
      >
        UnsettleAllSplits
      </Button>
    </View>
  );

  function joinInviteHandler() {
    navigation.navigate("Join");
  }

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
          console.log("deleteAccountHandler ~ deleteAccountHandler");
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
      console.log("restorePurchases ~ restore:", restore);
      if (restore.entitlements.all[ENTITLEMENT_ID].isActive) {
        // ... grant user entitlement
        console.log("restorePurchases ~ restore.entitlements.all:", restore);
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
      console.log("restorePurchases ~ e:", e);
    }
    setIsRestoringPurchases(false);
  }
  const isAndroid = Platform.OS === "android";
  const apikey = REACT_APP_CAT_API_KEY || "TEst";

  return (
    <ScrollView
      scrollEnabled={true}
      stickyHeaderIndices={[0]}
      style={{
        flex: 1,
        paddingHorizontal: "4%",
        backgroundColor: GlobalStyles.colors.backgroundColor,
        ...Platform.select({
          ios: {
            padding: 0,
          },
          android: {
            paddingTop: "6%",
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
            icon="arrow-back-outline"
            size={36}
            color={GlobalStyles.colors.textColor}
            buttonStyle={styles.backButton}
            onPress={() => navigation.goBack()}
          ></IconButton>
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>{i18n.t("settingsTitle")}</Text>
        </View>
      </BlurView>
      <SettingsSection multiTraveller={multiTraveller}></SettingsSection>

      <GradientButton
        style={styles.settingsButton}
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
        darkText
        colors={GlobalStyles.gradientColorsButton}
        onPress={() => {
          if (!isConnected) {
            Alert.alert(i18n.t("noConnection"), i18n.t("checkConnectionError"));
            return;
          }
          console.log("pressed premium button");
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
      {/* <TouchableOpacity onPress={() => navigation.navigate("CategoryMapTest")}>
        <Text style={[styles.textButton]}>CatMapTest</Text>
      </TouchableOpacity> */}
      <TouchableOpacity
        onPress={() => {
          const subject = "Budget For Nomads Support";
          const message = "Hi, I have a question about ...";
          Linking.openURL(
            `mailto:budgetfornomads@outlook.com?subject=${subject}&body=${message}`
          );
        }}
      >
        <Text style={[styles.textButton]}>Need Help?</Text>
      </TouchableOpacity>
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
      {DEVCONTENT}
      <View style={{ flex: 1, minHeight: 100 }}></View>
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
    fontSize: 22,
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
    fontSize: 16,
    fontWeight: "bold",
    fontStyle: "italic",
    color: GlobalStyles.colors.gray700,
    marginLeft: "2%",
  },
});
