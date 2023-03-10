import React, { memo, useContext, useEffect, useState } from "react";
import DropDownPicker from "react-native-dropdown-picker";

import ErrorOverlay from "../components/UI/ErrorOverlay";
import LoadingOverlay from "../components/UI/LoadingOverlay";
import { AuthContext } from "../store/auth-context";
import { ExpensesContext } from "../store/expenses-context";
import { TripContext } from "../store/trip-context";
import { UserContext } from "../store/user-context";
import { toShortFormat } from "../util/date";
import { getAllExpenses } from "../util/http";

import { StyleSheet, Text, View } from "react-native";
import ExpensesSummary from "../components/ExpensesOutput/ExpensesSummary";
import { GlobalStyles } from "../constants/styles";
import ExpensesOverview from "../components/ExpensesOutput/ExpensesOverview";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de } from "../i18n/supportedLanguages";
import { DateTime } from "luxon";
import { _toShortFormat } from "../util/dateTime";
import { useFocusEffect } from "@react-navigation/native";
const i18n = new I18n({ en, de });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

const OverviewScreen = ({ navigation }) => {
  const expensesCtx = useContext(ExpensesContext);
  const userCtx = useContext(UserContext);

  const [open, setOpen] = useState(false);
  const [PeriodValue, setPeriodValue] = useState(userCtx.periodName);

  const [dateTimeString, setDateTimeString] = useState("");

  useFocusEffect(
    React.useCallback(() => {
      setDateTimeString(_toShortFormat(DateTime.now()));
    }, [])
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
        <Text style={styles.dateString}>{dateTimeString}</Text>
      </View>
      <View style={styles.header}>
        <DropDownPicker
          open={open}
          value={PeriodValue}
          items={items}
          setOpen={setOpen}
          setValue={setPeriodValue}
          setItems={setItems}
          containerStyle={styles.dropdownContainer}
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
    paddingBottom: "4%",

    borderBottomWidth: 0,
    borderBottomColor: GlobalStyles.colors.gray600,
  },
  dropdownContainer: {
    maxWidth: 160,
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
    fontSize: 34,
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
