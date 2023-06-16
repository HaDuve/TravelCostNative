import React, { useContext, useEffect, useMemo, useState } from "react";
import DropDownPicker from "react-native-dropdown-picker";
import { ExpensesContext, RangeString } from "../store/expenses-context";
import { UserContext } from "../store/user-context";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import ExpensesSummary from "../components/ExpensesOutput/ExpensesSummary";
import { GlobalStyles } from "../constants/styles";
import ExpensesOverview, {
  MemoizedExpensesOverview,
} from "../components/ExpensesOutput/ExpensesOverview";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr, ru } from "../i18n/supportedLanguages";
import { DateTime } from "luxon";
import { _toShortFormat } from "../util/dateTime";
import PropTypes from "prop-types";
import { NetworkContext } from "../store/network-context";
import { useInterval } from "../components/Hooks/useInterval";
import { DEBUG_POLLING_INTERVAL } from "../confAppConstants";
import { ExpenseData } from "../util/expense";
import * as Haptics from "expo-haptics";
import { SettingsContext } from "../store/settings-context";
import { formatExpenseWithCurrency } from "../util/string";
import { TripContext } from "../store/trip-context";
import { useFocusEffect } from "@react-navigation/native";
import { Toast } from "react-native-toast-message/lib/src/Toast";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

const OverviewScreen = ({ navigation }) => {
  // console.log("rerender OverviewScreen - 0");
  const expensesCtx = useContext(ExpensesContext);
  const tripCtx = useContext(TripContext);
  const userCtx = useContext(UserContext);
  const netCtx = useContext(NetworkContext);
  const { settings } = useContext(SettingsContext);

  const [open, setOpen] = useState(false);
  const [PeriodValue, setPeriodValue] = useState<RangeString>(
    userCtx.periodName
  );

  const [dateTimeString, setDateTimeString] = useState("");
  // strong connection state
  const [offlineString, setOfflineString] = useState("");
  // set in useEffect
  const showInternetSpeed = settings.showInternetSpeed;
  const lastConnectionSpeedInMbps = netCtx.lastConnectionSpeedInMbps;
  const connectionSpeedString = showInternetSpeed
    ? " - " + lastConnectionSpeedInMbps?.toFixed(2) + " Mbps"
    : "";
  const isOnline = netCtx.isConnected && netCtx.strongConnection;

  useFocusEffect(
    React.useCallback(() => {
      if (userCtx.freshlyCreated) {
        Toast.show({
          type: "success",
          text1: "Welcome to Budget for Nomads",
          text2: "Please Create or Join a Trip to get started!",
        });
        navigation.navigate("Profile");
      }
    }, [userCtx.freshlyCreated, navigation])
  );

  useEffect(() => {
    if (isOnline) {
      setOfflineString(connectionSpeedString);
    } else {
      if (netCtx.isConnected && !netCtx.strongConnection) {
        setOfflineString(" - Slow Connection" + connectionSpeedString);
      } else setOfflineString(" - Offline Mode");
    }
  }, [
    isOnline,
    netCtx.isConnected,
    netCtx.strongConnection,
    connectionSpeedString,
  ]);
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

  const recentExpenses: Array<ExpenseData> = useMemo(
    () => expensesCtx.getRecentExpenses(PeriodValue),
    [PeriodValue, expensesCtx.expenses, dateTimeString]
  );
  const expensesSum = recentExpenses.reduce((sum, expense) => {
    if (isNaN(Number(expense.calcAmount))) return sum;
    return sum + Number(expense.calcAmount);
  }, 0);
  const expensesSumString = formatExpenseWithCurrency(
    expensesSum,
    tripCtx.tripCurrency
  );
  const isLongNumber = expensesSumString.length > 10;
  const { fontScale } = useWindowDimensions();
  const isScaledUp = fontScale > 1;
  const useMoreSpace = isScaledUp || isLongNumber;
  return (
    <View style={styles.container}>
      <View style={styles.dateHeader}>
        <Text style={styles.dateString}>
          {dateTimeString}
          {offlineString}
        </Text>
      </View>
      <View
        style={[
          styles.header,
          useMoreSpace && {
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <DropDownPicker
          open={open}
          value={PeriodValue}
          items={items}
          modalProps={{
            animationType: "slide",
          }}
          setOpen={setOpen}
          onOpen={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          onClose={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          onSelectItem={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          setValue={setPeriodValue}
          setItems={setItems}
          containerStyle={styles.dropdownContainer}
          // customItemLabelStyle={styles.dropdownItemLabel}
          style={styles.dropdown}
          textStyle={[
            styles.dropdownTextStyle,
            isScaledUp && styles.scaledUpTextStyle,
          ]}
        />
        <ExpensesSummary expenses={recentExpenses} periodName={PeriodValue} />
      </View>
      <View style={styles.tempGrayBar1}></View>

      <MemoizedExpensesOverview
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
  scaledUpTextStyle: {
    fontSize: 24,
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
