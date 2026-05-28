import { StyleSheet, Text, View } from "react-native";
import React, { useCallback, useContext, useRef, useState } from "react";
import ExpenseCategories from "./ExpenseStatistics/ExpenseCategories";
import ExpenseGraph from "./ExpenseStatistics/ExpenseGraph";
import { GlobalStyles } from "../../constants/styles";
import * as Haptics from "expo-haptics";
import { i18n } from "../../i18n/i18n";

import { UserContext } from "../../store/user-context";
import PropTypes from "prop-types";
import ExpenseCountries from "./ExpenseStatistics/ExpenseCountries";
import ExpenseTravellers from "./ExpenseStatistics/ExpenseTravellers";
import ExpenseCurrencies from "./ExpenseStatistics/ExpenseCurrencies";
import Animated, {
  FadeInLeft,
  FadeInRight,
  FadeInUp,
  FadeOutDown,
  FadeOutLeft,
  FadeOutRight,
} from "react-native-reanimated";
import { TripContext } from "../../store/trip-context";
import { dynamicScale } from "../../util/scalingUtil";
import { useSwipe } from "../Hooks/useSwipe";
import IconButton from "../UI/IconButton";

const PIE_CHART_TYPE_COUNT = 4;

const ExpensesOverview = ({ navigation, expenses, periodName }) => {
  const tripCtx = useContext(TripContext);
  const pieChartTitles = [
    i18n.t("categories"),
    i18n.t("travellers"),
    i18n.t("countries"),
    i18n.t("currencies"),
  ];
  const realPeriodNumber = useRef(7);
  const [periodRangeNumber] = useState(realPeriodNumber.current);

  const userCtx = useContext(UserContext);
  const isGraphNotPie = userCtx.isShowingGraph;
  const [toggleGraphEnum, setToggleGraphEnum] = useState(0);
  const [longerPeriodNum] = useState(0);
  const [startingPoint] = useState(0);

  const contentsMaxIndex = PIE_CHART_TYPE_COUNT - 1;

  const nextPieChartType = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setToggleGraphEnum((current) =>
      current === contentsMaxIndex ? 0 : current + 1
    );
  }, [contentsMaxIndex]);

  const previousPieChartType = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setToggleGraphEnum((current) =>
      current === 0 ? contentsMaxIndex : current - 1
    );
  }, [contentsMaxIndex]);

  const { onTouchStart, onTouchEnd } = useSwipe(
    nextPieChartType,
    previousPieChartType,
    6
  );

  let titleString = "";
  switch (periodName) {
    case "total":
      titleString = i18n.t("overview");
      break;
    default:
      titleString = `${i18n.t("last")} ${periodRangeNumber + longerPeriodNum}${
        startingPoint != 0 ? `+${-startingPoint}` : ""
      } ${i18n.t(periodName + "s")}`;
      break;
  }

  const chartTitleHeader = isGraphNotPie ? (
    <View style={styles.chartTitleHeader}>
      <Animated.View
        style={styles.titleContainer}
        entering={FadeInUp}
        exiting={FadeOutDown}
      >
        <Text style={styles.titleText}>{titleString}</Text>
      </Animated.View>
    </View>
  ) : (
    <View style={styles.chartTitleHeader}>
      <Animated.View
        entering={FadeInLeft}
        exiting={FadeOutLeft}
        style={styles.chevronContainer}
      >
        <IconButton
          icon={"chevron-back-outline"}
          size={24}
          onPress={previousPieChartType}
          color={GlobalStyles.colors.primaryGrayed}
        />
      </Animated.View>
      <Animated.View entering={FadeInUp} exiting={FadeOutDown}>
        <Text style={styles.titleText}>
          {pieChartTitles[toggleGraphEnum]}
        </Text>
      </Animated.View>
      <Animated.View
        entering={FadeInRight}
        exiting={FadeOutRight}
        style={styles.chevronContainer}
      >
        <IconButton
          icon={"chevron-forward-outline"}
          size={24}
          onPress={nextPieChartType}
          color={GlobalStyles.colors.primaryGrayed}
        />
      </Animated.View>
    </View>
  );

  return (
    <View
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      style={styles.container}
    >
      {chartTitleHeader}
      <View style={styles.chartBody}>
        {isGraphNotPie && (
          <ExpenseGraph
            navigation={navigation}
            periodName={periodName}
            tripCtx={tripCtx}
            longerPeriodNum={longerPeriodNum}
            startingPoint={startingPoint}
          />
        )}
        {!isGraphNotPie && toggleGraphEnum == 0 && (
          <ExpenseCategories
            expenses={expenses}
            periodName={periodName}
            navigation={navigation}
          />
        )}
        {!isGraphNotPie && toggleGraphEnum == 1 && (
          <ExpenseTravellers
            expenses={expenses}
            periodName={periodName}
            navigation={navigation}
          />
        )}
        {!isGraphNotPie && toggleGraphEnum == 2 && (
          <ExpenseCountries
            expenses={expenses}
            periodName={periodName}
            navigation={navigation}
          />
        )}
        {!isGraphNotPie && toggleGraphEnum == 3 && (
          <ExpenseCurrencies
            expenses={expenses}
            periodName={periodName}
            navigation={navigation}
          />
        )}
      </View>
    </View>
  );
};

export default ExpensesOverview;

const areEqual = (prevProps, nextProps) => {
  return (
    prevProps.expenses?.length === nextProps.expenses?.length &&
    prevProps.periodName === nextProps.periodName &&
    prevProps.dateTimeString === nextProps.dateTimeString
  );
};

export const MemoizedExpensesOverview = React.memo(ExpensesOverview, areEqual);

ExpensesOverview.propTypes = {
  expenses: PropTypes.array.isRequired,
  periodName: PropTypes.string.isRequired,
  navigation: PropTypes.object.isRequired,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "visible",
  },
  chartTitleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    elevation: 10,
    backgroundColor: GlobalStyles.colors.backgroundColor,
    paddingTop: dynamicScale(4, true),
    paddingBottom: dynamicScale(4, true),
  },
  chartBody: {
    flex: 1,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  chevronContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  titleText: {
    minWidth: dynamicScale(200),
    maxWidth: dynamicScale(200),
    textAlign: "center",
    fontSize: dynamicScale(22, false, 0.5),
    fontWeight: "bold",
    fontStyle: "italic",
    color: GlobalStyles.colors.gray700,
    marginHorizontal: dynamicScale(6),
  },
});
