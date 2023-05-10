import React, { useContext, useEffect, useState } from "react";
import DropDownPicker from "react-native-dropdown-picker";
import { ExpensesContext } from "../store/expenses-context";
import { UserContext } from "../store/user-context";
import { StyleSheet, Text, View } from "react-native";
import ExpensesSummary from "../components/ExpensesOutput/ExpensesSummary";
import { GlobalStyles } from "../constants/styles";
import ExpensesOverview from "../components/ExpensesOutput/ExpensesOverview";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr } from "../i18n/supportedLanguages";
import { DateTime } from "luxon";
import { _toShortFormat } from "../util/dateTime";
import { useFocusEffect } from "@react-navigation/native";
import PropTypes from "prop-types";
import Toast from "react-native-toast-message";
import { NetworkContext } from "../store/network-context";
import { useInterval } from "../components/Hooks/useInterval";
import { DEBUG_POLLING_INTERVAL } from "../confAppConstants";
const i18n = new I18n({ en, de, fr });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

const OverviewScreen = ({ navigation }) => {
  const expensesCtx = useContext(ExpensesContext);
  const userCtx = useContext(UserContext);
  const netCtx = useContext(NetworkContext);

  const [open, setOpen] = useState(false);
  const [PeriodValue, setPeriodValue] = useState(userCtx.periodName);

  const [dateTimeString, setDateTimeString] = useState("");
  // strong connection state
  const [offlineString, setOfflineString] = useState("");
  // set in useEffect
  useEffect(() => {
    if (netCtx.isConnected && netCtx.strongConnection) {
      setOfflineString("");
    } else {
      if (netCtx.isConnected && !netCtx.strongConnection) {
        setOfflineString(" - Slow Connection");
      } else setOfflineString(" - Offline Mode");
    }
  }, [netCtx.isConnected, netCtx.strongConnection]);

  useInterval(
    React.useCallback(() => {
      setDateTimeString(_toShortFormat(DateTime.now()));
    }, []),
    DEBUG_POLLING_INTERVAL * 13,
    true
  );

  const [items, setItems] = useState([
    { label: i18n.t("todayLabel"), value: "day" },
    { label: i18n.t("weekLabel"), value: "week" },
    { label: i18n.t("monthLabel"), value: "month" },
    { label: i18n.t("yearLabel"), value: "year" },
    { label: i18n.t("totalLabel"), value: "total" },
  ]);

  const recentExpenses = expensesCtx.getRecentExpenses(PeriodValue);

  return (
    <View style={styles.container}>
      <View style={styles.dateHeader}>
        <Text style={styles.dateString}>
          {dateTimeString}
          {offlineString}
        </Text>
      </View>
      <View style={styles.header}>
        <DropDownPicker
          open={open}
          value={PeriodValue}
          items={items}
          modalProps={{
            animationType: "slide",
          }}
          setOpen={setOpen}
          setValue={setPeriodValue}
          setItems={setItems}
          containerStyle={styles.dropdownContainer}
          customItemLabelStyle={styles.dropdownItemLabel}
          style={styles.dropdown}
          textStyle={styles.dropdownTextStyle}
        />
        <ExpensesSummary expenses={recentExpenses} periodName={PeriodValue} />
      </View>
      <View style={styles.tempGrayBar1}></View>

      <ExpensesOverview
        navigation={navigation}
        expenses={recentExpenses}
        periodName={PeriodValue}
      />
    </View>
  );
};

export default OverviewScreen;

OverviewScreen.propTypes = {
  navigation: PropTypes.object.isRequired,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GlobalStyles.colors.backgroundColor,
    // justifyContent: "flex-start",
  },
  dateHeader: {
    marginVertical: "4%",
    marginLeft: "6%",
    marginBottom: "-6%",
  },
  dateString: {
    fontSize: 12,
    fontStyle: "italic",
    color: GlobalStyles.colors.gray700,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    zIndex: 10,
    marginTop: "6%",
    paddingHorizontal: "4%",
    marginBottom: "4%",
  },
  dropdownContainer: {
    maxWidth: "50%",
    marginTop: "2%",
    elevation: 2,
    shadowColor: GlobalStyles.colors.textColor,
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
  },
  dropdown: {
    borderRadius: 10,
    borderWidth: 0,
  },
  dropdownTextStyle: {
    fontSize: i18n.locale == "fr" ? 20 : 34,
    fontWeight: "bold",
  },
  zBehind: {
    zIndex: 10,
  },
  addButton: {
    backgroundColor: GlobalStyles.colors.primary400,
    flex: 0,
    borderRadius: 100,
    minHeight: 55,
    minWidth: 30,
    marginHorizontal: 160,
    marginTop: -40,
    marginBottom: -15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  tempGrayBar1: {
    borderTopWidth: 1,
    borderBottomWidth: 0,
    borderTopColor: GlobalStyles.colors.gray600,
    borderBottomColor: GlobalStyles.colors.gray600,
    minHeight: 1,
    backgroundColor: GlobalStyles.colors.backgroundColor,
    elevation: 2,
    shadowColor: GlobalStyles.colors.textColor,
    shadowOffset: { width: 1, height: 2.5 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
    zIndex: 0,
  },
});
