import { StyleSheet, Text, View } from "react-native";

import { GlobalStyles } from "../../constants/styles";

import ExpensesList from "./ExpensesList";

//Localization
const i18n = new I18n({ en, de, fr, ru });
i18n.locale =
  Localization.getLocales()[0] && Localization.getLocales()[0].languageCode
    ? Localization.getLocales()[0].languageCode.slice(0, 2)
    : "en";
i18n.enableFallback = true;
// i18n.locale = "en";

import { useNavigation } from "@react-navigation/native";
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import PropTypes from "prop-types";
import { memo, useContext, useEffect, useMemo, useState } from "react";
import Animated, { SlideOutLeft } from "react-native-reanimated";
import { EXPENSES_LOAD_TIMEOUT } from "../../confAppConstants";
import { de, en, fr, ru } from "../../i18n/supportedLanguages";
import { ExpensesContext, RangeString } from "../../store/expenses-context";
import { TripContext } from "../../store/trip-context";
import { UserContext } from "../../store/user-context";
import { RootNavigationProp } from "../../types/navigation";
import { dynamicScale } from "../../util/scalingUtil";
import FlatButton from "../UI/FlatButton";
import LoadingOverlay from "../UI/LoadingOverlay";

function ExpensesOutput({
  expenses,
  fallbackText,
  refreshControl,
  refreshing,
  showSumForTravellerName,
  isFiltered,
}) {
  const { tripName } = useContext(TripContext);
  const [showLoading, setShowLoading] = useState(true);
  const [fallback, setFallback] = useState(true);
  const navigation = useNavigation<RootNavigationProp>();
  const expCtx = useContext(ExpensesContext);
  const userCtx = useContext(UserContext);
  const periodName = userCtx.periodName;
  const periodNameIsToday = periodName == RangeString.day;
  const yesterdayExpenses = expCtx.getDailyExpenses(1);
  const shouldShowExtraButtons = !isFiltered && periodNameIsToday;
  const showYesterday =
    yesterdayExpenses && yesterdayExpenses.length > 0 && shouldShowExtraButtons;
  const tomorrowExpenses = expCtx.getDailyExpenses(-1);
  const showTomorrow =
    tomorrowExpenses && tomorrowExpenses.length > 0 && shouldShowExtraButtons;
  useEffect(() => {
    setTimeout(() => {
      if (tripName) setShowLoading(false);
    }, EXPENSES_LOAD_TIMEOUT);
  }, [tripName]);

  useEffect(() => {
    if (tripName && expenses.length > 1) setShowLoading(false);
  }, [tripName, expenses.length]);

  const memoizedContent = useMemo(() => {
    if (expenses?.length > 0) {
      if (fallback) setFallback(false);
      return (
        <ExpensesList
          expenses={expenses}
          showSumForTravellerName={showSumForTravellerName}
          isFiltered={isFiltered}
          refreshControl={refreshControl}
          refreshing={refreshing}
        />
      );
    }
    return (
      <Animated.View exiting={SlideOutLeft} style={styles.fallbackContainer}>
        <View style={styles.fallbackInnerContainer}>
          {showLoading && <LoadingOverlay></LoadingOverlay>}
          {!showLoading && <Text style={styles.infoText}>{fallbackText}</Text>}
          {showYesterday && (
            <FlatButton
              textStyle={{ marginVertical: dynamicScale(4, false, 0.5) }}
              onPress={() => {
                navigation.navigate("FilteredExpenses", {
                  expenses: yesterdayExpenses,
                  dayString: i18n.t("yesterday"),
                });
              }}
            >
              {`${i18n.t("showXResults1")} ${i18n.t("yesterday")}`}
            </FlatButton>
          )}
          {showTomorrow && (
            <FlatButton
              textStyle={{ marginVertical: dynamicScale(4, false, 0.5) }}
              onPress={() => {
                navigation.navigate("FilteredExpenses", {
                  expenses: tomorrowExpenses,
                  dayString: i18n.t("tomorrow"),
                });
              }}
            >
              {`${i18n.t("showXResults1")} ${i18n.t("tomorrow")}`}
            </FlatButton>
          )}
        </View>
      </Animated.View>
    );
  }, [
    expenses,
    fallback,
    fallbackText,
    isFiltered,
    refreshControl,
    refreshing,
    showLoading,
    showSumForTravellerName,
  ]);

  return (
    <View style={styles.container}>
      <View>{memoizedContent}</View>
    </View>
  );
}

export default ExpensesOutput;

export const MemoizedExpensesOutput = memo(ExpensesOutput);

ExpensesOutput.propTypes = {
  expenses: PropTypes.array,
  fallbackText: PropTypes.string,
  refreshControl: PropTypes.object,
  refreshing: PropTypes.bool,
  showSumForTravellerName: PropTypes.string,
  isFiltered: PropTypes.bool,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 0,
    paddingHorizontal: 0,
    // backgroundColor: GlobalStyles.colors.backgroundColor,
    // borderWidth: 1,
  },
  fallbackContainer: {
    alignSelf: "center",
    margin: "10%",
    position: "absolute",
  },
  fallbackInnerContainer: {
    backgroundColor: GlobalStyles.colors.backgroundColor,
  },
  header: {
    flexDirection: "row",
    justifyContent: "center",
  },
  infoText: {
    color: GlobalStyles.colors.textColor,
    fontSize: dynamicScale(16, false, 0.5),
    marginVertical: dynamicScale(32, false, 0.5),
    textAlign: "center",
  },
});
