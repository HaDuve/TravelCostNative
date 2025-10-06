import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { DateTime } from "luxon";
import PropTypes from "prop-types";
import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import { Toast } from "react-native-toast-message/lib/src/Toast";

import { MemoizedExpensesOverview } from "../components/ExpensesOutput/ExpensesOverview";
import ExpensesSummary from "../components/ExpensesOutput/ExpensesSummary";
import { GlobalStyles } from "../constants/styles";
import { de, en, fr, ru } from "../i18n/supportedLanguages";
import { ExpensesContext, RangeString } from "../store/expenses-context";
import { UserContext } from "../store/user-context";

//Localization

const i18n = new I18n({ en, de, fr, ru });
i18n.locale =
  Localization.getLocales()[0] && Localization.getLocales()[0].languageCode
    ? Localization.getLocales()[0].languageCode.slice(0, 2)
    : "en";
i18n.enableFallback = true;
// i18n.locale = "en";

import { useInterval } from "../components/Hooks/useInterval";
import { DEBUG_POLLING_INTERVAL } from "../confAppConstants";
import { NetworkContext } from "../store/network-context";
import { OnboardingFlags } from "../types/onboarding";
import { _toShortFormat } from "../util/dateTime";
import { ExpenseData } from "../util/expense";

import * as Haptics from "expo-haptics";

import { SettingsContext } from "../store/settings-context";
import { TripContext } from "../store/trip-context";
import { constantScale, dynamicScale } from "../util/scalingUtil";
import { formatExpenseWithCurrency, truncateString } from "../util/string";

import { useFocusEffect } from "@react-navigation/native";

import { showBanner } from "../components/UI/ToastComponent";
import { OrientationContext } from "../store/orientation-context";

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
    ? ` - ${lastConnectionSpeedInMbps?.toFixed(
        2
      )} ${i18n.t("megaBytePerSecond")}`
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
        setOfflineString(`${connectionSpeedString}`);
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
      const now = DateTime.now();
      setDateTimeString(_toShortFormat(now));
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
  const isLongNumber = expensesSumString?.length > 10;
  const { fontScale } = useWindowDimensions();
  const { isPortrait, isTablet } = useContext(OrientationContext);
  const isScaledUp = fontScale > 1;
  const useMoreSpace = (isScaledUp || isLongNumber) && !isTablet;
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
      <View
        style={[
          styles.header,
          useMoreSpace && {
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "center",
          },
          !isPortrait && styles.landscapeHeader,
        ]}
      >
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
          setValue={(value: any) =>
            userCtx.setPeriodString(value as RangeString)
          }
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
          textStyle={[
            styles.dropdownTextStyle,
            isScaledUp && styles.scaledUpTextStyle,
          ]}
        />
        <ExpensesSummary
          useMoreSpace={useMoreSpace}
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
    backgroundColor: GlobalStyles.colors.backgroundColor,
    flex: 1,
  },
  customSummaryStyle: {
    marginTop: dynamicScale(-10, true, 0.3),
  },
  dateHeader: {
    marginBottom: dynamicScale(-4, true),
    marginLeft: dynamicScale(18),
    marginTop: dynamicScale(12, true),
  },
  dateString: {
    color: GlobalStyles.colors.gray700,
    fontSize: dynamicScale(12, false, 0.5),
    fontStyle: "italic",
  },
  dropdown: {
    borderRadius: 10,
    borderWidth: 0,
  },
  dropdownContainer: {
    marginTop: dynamicScale(2, true),
    maxWidth: dynamicScale(170, false, 0.5),
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
  dropdownTextStyle: {
    fontSize:
      i18n.locale == "fr"
        ? dynamicScale(20, false, 0.5)
        : dynamicScale(34, false, 0.5),
    fontWeight: "bold",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginBottom: dynamicScale(12, true),
    marginTop: dynamicScale(18, true),
    paddingHorizontal: dynamicScale(12),
    zIndex: 10,
  },
  landscapeBar: {
    marginBottom: dynamicScale(-12, true),
    marginTop: dynamicScale(12, true),
  },
  landscapeBarTablet: {
    marginBottom: dynamicScale(4, true),
    marginTop: dynamicScale(52, true, 1),
  },
  landscapeDateHeader: {
    alignSelf: "center",
    marginBottom: dynamicScale(-24, true),
    marginTop: dynamicScale(4, true),
  },
  landscapeHeader: {
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: dynamicScale(-12, true),
    marginHorizontal: dynamicScale(12),
    marginTop: dynamicScale(12, true),
    zIndex: 10,
  },
  scaledUpTextStyle: {
    fontSize: dynamicScale(24, false, 0.5),
  },

  tabletDateHeader: {
    alignSelf: "center",
    marginBottom: dynamicScale(-8, true),
    marginTop: dynamicScale(4, true),
  },
  tabletPaddingTop: {
    paddingTop: constantScale(12, 0.5),
  },
  tempGrayBar1: {
    backgroundColor: GlobalStyles.colors.backgroundColor,
    borderBottomColor: GlobalStyles.colors.gray600,
    borderBottomWidth: 0,
    borderTopColor: GlobalStyles.colors.gray600,
    borderTopWidth: 1,
    elevation: 2,
    minHeight: 1,
    shadowColor: GlobalStyles.colors.textColor,
    shadowOffset: { width: 1, height: 2.5 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
    zIndex: 0,
  },
  zBehind: {
    zIndex: 10,
  },
});
