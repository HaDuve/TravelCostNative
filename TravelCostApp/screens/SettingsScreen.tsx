import {
  Alert,
  StyleSheet,
  View,
  Text,
  Linking,
  TouchableOpacity,
} from "react-native";
import React, { useContext, useState } from "react";
import Purchases, { PurchasesOffering } from "react-native-purchases";
import { importExcelFile } from "../components/ImportExport/OpenXLSXPicker";
import { TripContext } from "../store/trip-context";
import { UserContext } from "../store/user-context";
import { AuthContext } from "../store/auth-context";
import { ExpensesContext } from "../store/expenses-context";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr } from "../i18n/supportedLanguages";
import Button from "../components/UI/Button";
import { exportAllExpensesToXLSX } from "../components/ImportExport/ExportToGoogleXlsx";
import { ScrollView } from "react-native-gesture-handler";
import { GlobalStyles } from "../constants/styles";
import LinkingButton from "../components/UI/LinkButton";
import { DEV } from "../confAppConstants";
import { useFocusEffect } from "@react-navigation/native";
import { DateTime } from "luxon";
import { TourGuideZone, useTourGuideController } from "rn-tourguide";
import { asyncStoreGetItem } from "../store/async-storage";
import { resetTour, saveStoppedTour } from "../util/tourUtil";
import { reloadApp } from "../util/appState";
import { ENTITLEMENT_ID } from "../components/Premium/PremiumConstants";
import PropTypes from "prop-types";
import GradientButton from "../components/UI/GradientButton";
import SettingsSection from "../components/UI/SettingsSection";
import Toast from "react-native-toast-message";
import { useEffect } from "react";
import LoadingBarOverlay from "../components/UI/LoadingBarOverlay";
import LoadingOverlay from "../components/UI/LoadingOverlay";

const i18n = new I18n({ en, de, fr });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

const SettingsScreen = ({ navigation }) => {
  const expensesCtx = useContext(ExpensesContext);
  const authCtx = useContext(AuthContext);
  const userCtx = useContext(UserContext);
  const tripCtx = useContext(TripContext);
  const uid = authCtx.uid;
  const tripid = tripCtx.tripid;
  const userName = userCtx.userName;
  const addExpense = expensesCtx.addExpense;
  const [isDEV, setIsDEV] = useState(DEV);
  const [timeZoneString, setTimeZoneString] = useState("");
  const [shouldShowTour, setShouldShowTour] = useState(false);
  const multiTraveller = tripCtx.travellers.length > 1 ?? false;
  // // const soloTraveller = !multiTraveller;

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
  const buttonstring1 = "You are a Premium Nomad!";
  const buttonstring2 = "Become a Premium Nomad!";
  const premiumButtonString = premiumStatus ? buttonstring1 : buttonstring2;

  // useEffect setPremium status from userContext.isPremium
  useEffect(() => {
    async function setPremiumNow() {
      const isPremium = await userCtx.checkPremium();
      // console.log("setPremiumNow ~ isPremium:", isPremium);
      setPremiumStatus(isPremium);
    }
    setPremiumNow();
  }, [userCtx, userCtx.isPremium]);

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

  const DEVCONTENT = isDEV && (
    <View>
      <View style={styles.titleContainer}>
        <Text style={styles.titleText}>DEVCONTENT</Text>
      </View>
      <LoadingBarOverlay
        progress={0.3}
        progressAt={3}
        progressMax={10}
      ></LoadingBarOverlay>
      <LoadingOverlay></LoadingOverlay>

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
      <Text>{timeZoneString}</Text>
    </View>
  );

  function joinInviteHandler() {
    navigation.navigate("Join");
  }

  const [emailString, setEmailString] = useState("");
  useFocusEffect(() => {
    async function getEmail() {
      const email = await asyncStoreGetItem("ENCM");
      console.log("getEmail ~ email:", email);
      setEmailString(email);
    }
    getEmail();
  });
  useEffect(() => {
    async function getEmail() {
      const email = await asyncStoreGetItem("ENCM");
      console.log("getEmail ~ email:", email);
      setEmailString(email);
    }
    getEmail();
  }, []);

  function deleteAccountHandler() {
    return Alert.alert(i18n.t("sure"), i18n.t("deleteAccountAlertMess"), [
      // The "No" button
      // Does nothing but dismiss the dialog when tapped
      {
        text: i18n.t("no"),
      },
      // The "Yes" button
      {
        text: i18n.t("yes"),
        onPress: () => {
          console.log("deleteAccountHandler ~ deleteAccountHandler");
          authCtx.deleteAccount();
        },
      },
    ]);
  }

  function logoutHandler() {
    return Alert.alert(i18n.t("sure"), i18n.t("signOutAlertMess"), [
      // The "No" button
      // Does nothing but dismiss the dialog when tapped
      {
        text: i18n.t("no"),
      },
      // The "Yes" button
      {
        text: i18n.t("yes"),
        onPress: () => {
          authCtx.logout();
        },
      },
    ]);
  }

  return (
    <ScrollView
      scrollEnabled={true}
      style={{
        flex: 1,
        padding: "4%",
        backgroundColor: GlobalStyles.colors.backgroundColor,
      }}
    >
      <View style={styles.titleContainer}>
        <Text style={styles.titleText}>Settings</Text>
      </View>
      <SettingsSection multiTraveller={multiTraveller}></SettingsSection>
      {/* <GradientButton style={styles.settingsButton} onPress={logoutHandler}>
        {i18n.t("logoutLabel")}
      </GradientButton> */}
      <GradientButton style={styles.settingsButton} onPress={joinInviteHandler}>
        {i18n.t("joinTripLabel")}
      </GradientButton>

      {multiTraveller && (
        <GradientButton
          onPress={async () => {
            const isPremium = await userCtx.checkPremium();
            if (!isPremium) {
              navigation.navigate("Paywall");
              return;
            }
            navigation.navigate("SplitSummary", { tripid: tripCtx.tripid });
          }}
          style={styles.settingsButton}
        >
          {i18n.t("simplifySplitsLabel")}
        </GradientButton>
      )}
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
          console.log("pressed premium button");
          if (premiumStatus) {
            Toast.show({
              type: "success",
              text1: "Premium Nomad", //i18n.t("premiumToastTitle"),
              text2: "You are a premium Nomad already!", //i18n.t("premiumToastText"),
            });
          } else navigation.navigate("Paywall");
        }}
      >
        {premiumButtonString}
      </GradientButton>
      {emailString && (
        <TouchableOpacity onPress={() => deleteAccountHandler()}>
          <Text style={[styles.textButton]}>Delete Account {emailString}?</Text>
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
    paddingVertical: "2%",
    paddingHorizontal: "4%",
  },
  titleText: {
    fontSize: 22,
    fontWeight: "bold",
    fontStyle: "italic",
    color: GlobalStyles.colors.gray700,
    marginLeft: "2%",
  },
  settingsButton: {
    paddingVertical: "2%",
    paddingHorizontal: "8%",
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
