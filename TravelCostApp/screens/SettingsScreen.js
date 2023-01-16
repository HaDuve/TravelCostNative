import { Alert, StyleSheet, Text, View } from "react-native";
import React, { useContext } from "react";
import { importExcelFile } from "../components/ImportExport/OpenXLSXPicker";
import { TripContext } from "../store/trip-context";
import { UserContext } from "../store/user-context";
import { AuthContext } from "../store/auth-context";
import { ExpensesContext } from "../store/expenses-context";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de } from "../../TravelCostApp/i18n/supportedLanguages";
import Button from "../components/UI/Button";
import { OpenGoogleXlsxPicker } from "../components/ImportExport/ImportFromGoogleXlsx";
const i18n = new I18n({ en, de });
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

  function joinInviteHandler() {
    navigation.navigate("Join");
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
    <View
      style={{
        flex: 1,
        padding: "4%",
      }}
    >
      <Button style={styles.settingsButton} onPress={logoutHandler}>
        Logout
      </Button>
      <Button style={styles.settingsButton} onPress={joinInviteHandler}>
        {i18n.t("invitationText")}
      </Button>
      <Button
        onPress={importExcelFile.bind(this, uid, tripid, userName, addExpense)}
        style={styles.settingsButton}
      >
        Importiere Kosten aus GehMalReisen Excel Tabelle
      </Button>
      <Button onPress={OpenGoogleXlsxPicker} style={styles.settingsButton}>
        Importiere Kosten aus FoodForNomads GSheets Tabelle
      </Button>
    </View>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  settingsButton: {
    paddingVertical: "2%",
  },
});
