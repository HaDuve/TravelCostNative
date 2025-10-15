import React, { useContext, useEffect, useMemo, useState } from "react";
import DropDownPicker from "react-native-dropdown-picker";
import { ExpensesContext, RangeString } from "../store/expenses-context";
import { UserContext } from "../store/user-context";
import { Platform, StyleSheet, Text, View } from "react-native";
import ExpensesSummary from "../components/ExpensesOutput/ExpensesSummary";
import { GlobalStyles } from "../constants/styles";
import { MemoizedExpensesOverview } from "../components/ExpensesOutput/ExpensesOverview";

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

import { DateTime } from "luxon";
import { _toShortFormat } from "../util/dateTime";
import PropTypes from "prop-types";
import { NetworkContext } from "../store/network-context";
import { useInterval } from "../components/Hooks/useInterval";
import { DEBUG_POLLING_INTERVAL } from "../confAppConstants";
import { ExpenseData } from "../util/expense";
import * as Haptics from "expo-haptics";
import { SettingsContext } from "../store/settings-context";
import { formatExpenseWithCurrency, truncateString } from "../util/string";
import { TripContext } from "../store/trip-context";
import { useFocusEffect } from "@react-navigation/native";
import { Toast } from "react-native-toast-message/lib/src/Toast";
import { showBanner } from "../components/UI/ToastComponent";
import { constantScale, dynamicScale } from "../util/scalingUtil";
import { OrientationContext } from "../store/orientation-context";
import { OnboardingFlags } from "../types/onboarding";

const OverviewScreen = ({ navigation }) => {
  const expensesCtx = useContext(ExpensesContext);
  const tripCtx = useContext(TripContext);
  const userCtx = useContext(UserContext);
  const netCtx = useContext(NetworkContext);
  const { settings } = useContext(SettingsContext);

  const [open, setOpen] = useState(false);

  const [dateTimeString, setDateTimeString] = useState("");
  // strong connection state
  const [offlineString, setOfflineString] = useState("");
  const PeriodValue = userCtx.periodName;

  // set in useEffect
  const showInternetSpeed = settings.showInternetSpeed;
  const lastConnectionSpeedInMbps = netCtx.lastConnectionSpeedInMbps ?? 0;
  const connectionSpeedString = showInternetSpeed
    ? " - " +
      lastConnectionSpeedInMbps?.toFixed(2) +
      ` ${i18n.t("megaBytePerSecond")}`
    : "";
  const isOnline = netCtx.isConnected && netCtx.strongConnection;

  useFocusEffect(
    React.useCallback(() => {
      if (userCtx.freshlyCreated) {
        Toast.show({
          type: "success",
          text1: i18n.t("welcomeToBudgetForNomads"),
          text2: i18n.t("pleaseCreateTrip"),
        });
        navigation.navigate("Profile");
      }
    }, [userCtx.freshlyCreated, navigation])
  );

  useFocusEffect(
    React.useCallback(() => {
      if (!userCtx.freshlyCreated) {
        const onboardingFlags: OnboardingFlags = {
          freshlyCreated: userCtx.freshlyCreated,
          needsTour: userCtx.needsTour,
        };
        showBanner(navigation, onboardingFlags);
      }
    }, [navigation, userCtx.freshlyCreated, userCtx.needsTour])
  );

  useEffect(() => {
    if (isOnline) {
      setOfflineString(connectionSpeedString);
    } else {
      if (netCtx.isConnected && !netCtx.strongConnection) {
        setOfflineString(`` + connectionSpeedString);
      } else setOfflineString(` - ${i18n.t("offlineMode")}`);
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
  const { isPortrait, isTablet } = useContext(OrientationContext);
  return (
    <View style={[styles.container, isTablet && styles.tabletPaddingTop]}>
      <View
        style={[
          styles.dateHeader,
          !isPortrait && styles.landscapeDateHeader,
          isTablet && styles.tabletDateHeader,
        ]}
      >
        <Text style={styles.dateString}>
          {truncateString(tripCtx.tripName, dynamicScale(23, false, 0.5))} -{" "}
          {dateTimeString}
          {offlineString}
        </Text>
      </View>
      <View style={[styles.header, !isPortrait && styles.landscapeHeader]}>
        <DropDownPicker
          open={open}
          value={PeriodValue}
          items={items}
          showTickIcon={false}
          placeholder={""}
          modalProps={{
            animationType: "slide",
          }}
          setOpen={() => {
            requestAnimationFrame(() => {
              setOpen(!open);
              Toast.hide();
            });
          }}
          onOpen={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          onClose={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          onSelectItem={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          setValue={userCtx.setPeriodString}
          setItems={setItems}
          containerStyle={styles.dropdownContainer}
          dropDownContainerStyle={styles.dropdownContainerDropdown}
          itemProps={{
            style: {
              height: dynamicScale(50, false, 0.5),
              padding: dynamicScale(4, false, 0.5),
              marginLeft: dynamicScale(4),
            },
          }}
          // customItemLabelStyle={styles.dropdownItemLabel}
          style={styles.dropdown}
          textStyle={styles.dropdownTextStyle}
        />
        <ExpensesSummary
          expenses={recentExpenses}
          periodName={PeriodValue}
          style={styles.customSummaryStyle}
        />
      </View>
      {
        <View
          style={[
            styles.tempGrayBar1,
            !isPortrait && styles.landscapeBar,
            !isPortrait && isTablet && styles.landscapeBarTablet,
          ]}
        ></View>
      }

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
  },
  tabletPaddingTop: {
    paddingTop: constantScale(12, 0.5),
  },
  dateHeader: {
    marginTop: dynamicScale(12, true),
    marginLeft: dynamicScale(18),
    marginBottom: dynamicScale(-4, true),
  },
  landscapeDateHeader: {
    marginTop: dynamicScale(4, true),
    marginBottom: dynamicScale(-24, true),
    alignSelf: "center",
  },
  tabletDateHeader: {
    marginTop: dynamicScale(4, true),
    marginBottom: dynamicScale(-8, true),
    alignSelf: "center",
  },
  dateString: {
    fontSize: dynamicScale(12, false, 0.5),
    fontStyle: "italic",
    color: GlobalStyles.colors.gray700,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    zIndex: 10,
    marginTop: dynamicScale(18, true),
    paddingHorizontal: dynamicScale(12),
    marginBottom: dynamicScale(12, true),
  },
  landscapeHeader: {
    marginTop: dynamicScale(12, true),
    marginBottom: dynamicScale(-12, true),
    zIndex: 10,
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: dynamicScale(12),
  },
  dropdownContainer: {
    maxWidth: dynamicScale(170, false, 0.5),
    marginTop: dynamicScale(2, true),
    ...Platform.select({
      ios: {
        shadowColor: GlobalStyles.colors.textColor,
        shadowOffset: { width: 1, height: 1 },
        shadowOpacity: 0.35,
        shadowRadius: 4,
      },
      android: {
        // marginTop: "2%",
        elevation: 8,
        borderRadius: 12,
      },
    }),
  },
  dropdownContainerDropdown: {
    maxHeight: dynamicScale(600, true),
  },
  dropdown: {
    borderRadius: 10,
    borderWidth: 0,
  },
  dropdownTextStyle: {
    fontSize:
      i18n.locale == "fr"
        ? dynamicScale(20, false, 0.5)
        : dynamicScale(34, false, 0.5),
    fontWeight: "bold",
  },
  scaledUpTextStyle: {
    fontSize: dynamicScale(24, false, 0.5),
  },
  zBehind: {
    zIndex: 10,
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
  landscapeBar: {
    marginTop: dynamicScale(12, true),
    marginBottom: dynamicScale(-12, true),
  },
  landscapeBarTablet: {
    marginTop: dynamicScale(52, true, 1),
    marginBottom: dynamicScale(4, true),
  },
  customSummaryStyle: {
    marginTop: dynamicScale(-10, true, 0.3),
  },
});
