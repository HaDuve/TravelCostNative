import { StyleSheet, Text, View, ScrollView, Dimensions } from "react-native";

import { GlobalStyles } from "../../constants/styles";
import ExpensesList from "./ExpensesList";
import FilteredExpensesGrid from "./FilteredExpensesGrid";
import React from "react-native";
import Animated, { SlideOutLeft } from "react-native-reanimated";
import LoadingOverlay from "../UI/LoadingOverlay";
import { useContext, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";

import { i18n } from "../../i18n/i18n";

import { EXPENSES_LOAD_TIMEOUT } from "../../confAppConstants";
import { memo } from "react";
import { TripContext } from "../../store/trip-context";
import ActionRow from "../UI/ActionRow";
import { useNavigation } from "@react-navigation/native";
import { ExpensesContext, RangeString } from "../../store/expenses-context";
import { UserContext } from "../../store/user-context";
import { dynamicScale } from "../../util/scalingUtil";
import { toExpenseNavigationDtos } from "../../util/expense-navigation-dto";

function ExpensesOutput({
  expenses,
  fallbackText,
  refreshControl,
  refreshing,
  showSumForTravellerName,
  isFiltered,
  emptyCtaLabel,
  onEmptyCtaPress,
  awaitingTripFetch,
}) {
  const { tripName, tripid } = useContext(TripContext);
  const [showLoading, setShowLoading] = useState(true);
  const [fallback, setFallback] = useState(true);
  const navigation = useNavigation();
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
  const tripReady = Boolean(tripid || tripName);
  useEffect(() => {
    setTimeout(() => {
      if (tripReady) setShowLoading(false);
    }, EXPENSES_LOAD_TIMEOUT);
  }, [tripReady]);

  useEffect(() => {
    if (tripReady && expenses.length > 1) setShowLoading(false);
  }, [tripReady, expenses.length]);

  const deferEmptyState = showLoading || awaitingTripFetch;

  const memoizedContent = useMemo(() => {
    if (expenses?.length > 0) {
      if (fallback) setFallback(false);
      if (isFiltered) {
        return <FilteredExpensesGrid expenses={expenses} />;
      }
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
        <ScrollView
          style={styles.fallbackScrollView}
          contentContainerStyle={styles.fallbackScrollContent}
          refreshControl={refreshControl}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.fallbackInnerContainer}>
            {deferEmptyState && <LoadingOverlay></LoadingOverlay>}
            {!deferEmptyState && (
              <Text style={styles.infoText}>{fallbackText}</Text>
            )}
            {!deferEmptyState && emptyCtaLabel && onEmptyCtaPress && (
              <View testID="empty-expenses-cta" style={styles.emptyCta}>
                <ActionRow
                  tier="primary"
                  label={emptyCtaLabel}
                  icon="add-circle-outline"
                  onPress={onEmptyCtaPress}
                />
              </View>
            )}
            {showYesterday && (
              <ActionRow
                tier="secondary"
                label={`${i18n.t("showXResults1")} ${i18n.t("yesterday")}`}
                icon="calendar-outline"
                onPress={() => {
                  (navigation as any).navigate("FilteredExpenses", {
                    expenses: toExpenseNavigationDtos(yesterdayExpenses),
                    dayString: i18n.t("yesterday"),
                  });
                }}
              />
            )}
            {showTomorrow && (
              <ActionRow
                tier="secondary"
                label={`${i18n.t("showXResults1")} ${i18n.t("tomorrow")}`}
                icon="calendar-outline"
                onPress={() => {
                  (navigation as any).navigate("FilteredExpenses", {
                    expenses: toExpenseNavigationDtos(tomorrowExpenses),
                    dayString: i18n.t("tomorrow"),
                  });
                }}
              />
            )}
          </View>
        </ScrollView>
      </Animated.View>
    );
  }, [
    awaitingTripFetch,
    emptyCtaLabel,
    expenses,
    fallback,
    fallbackText,
    isFiltered,
    onEmptyCtaPress,
    refreshControl,
    refreshing,
    showLoading,
    showSumForTravellerName,
    showTomorrow,
    showYesterday,
    tomorrowExpenses,
    yesterdayExpenses,
    navigation,
  ]);

  return (
    <View style={styles.container}>
      {memoizedContent}
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
  emptyCtaLabel: PropTypes.string,
  onEmptyCtaPress: PropTypes.func,
  awaitingTripFetch: PropTypes.bool,
};

// Minimum height for empty state container as fraction of screen height
// Ensures empty state is visible without excessive whitespace
const EMPTY_STATE_MIN_HEIGHT_RATIO = 0.5;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 0,
    paddingBottom: 0,
    // backgroundColor: GlobalStyles.colors.backgroundColor,
    // borderWidth: 1,
  },
  fallbackContainer: {
    // Removed flex: 1 - was causing container to escape bounds and overlap separator
    // minHeight alone is sufficient to ensure visibility
    marginHorizontal: "10%",
    minHeight: Dimensions.get("window").height * EMPTY_STATE_MIN_HEIGHT_RATIO,
  },
  fallbackScrollView: {
    flex: 1,
  },
  fallbackScrollContent: {
    flexGrow: 1,
    justifyContent: "flex-start",
  },
  fallbackInnerContainer: {
    backgroundColor: GlobalStyles.colors.backgroundColor,
    paddingTop: dynamicScale(16, true, 0.3),
  },
  header: {
    flexDirection: "row",
    justifyContent: "center",
  },
  infoText: {
    color: GlobalStyles.colors.textColor,
    fontSize: dynamicScale(16, false, 0.5),
    textAlign: "center",
    marginVertical: dynamicScale(12, false, 0.3),
  },
  emptyCta: {
    marginTop: dynamicScale(8, true),
  },
});
