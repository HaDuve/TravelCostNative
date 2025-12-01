import { Platform, StyleSheet, Text, View } from "react-native";
import React, { useContext, useRef, useState, useCallback } from "react";
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
import Animated, { FadeInUp, FadeOutDown } from "react-native-reanimated";
import { MAX_PERIOD_RANGE } from "../../confAppConstants";
import { BlurView } from "expo-blur";
import { TripContext } from "../../store/trip-context";
import { constantScale, dynamicScale } from "../../util/scalingUtil";
import { OrientationContext } from "../../store/orientation-context";
import { useSwipe } from "../Hooks/useSwipe";
import { toDayMonthString } from "../../util/date";
import { useGlobalStyles } from "../../store/theme-context";

const ExpensesOverview = ({ navigation, expenses, periodName }) => {
  const GlobalStyles = useGlobalStyles();
  const styles = getStyles(GlobalStyles);
  const tripCtx = useContext(TripContext);
  const { isPortrait } = useContext(OrientationContext);
  // const periodRangeNumber = useRef(7);
  // periodRangeNumber useState is used to rerender the component when the periodRangeNumber changes
  const realPeriodNumber = useRef(7);
  const [periodRangeNumber, setPeriodRangeNumber] = useState(
    realPeriodNumber.current
  );

  const { onTouchStart, onTouchEnd } = useSwipe(onSwipeLeft, onSwipeRight, 6);

  function onSwipeLeft() {
    console.log("SWIPE_LEFT");
  }

  function onSwipeRight() {
    console.log("SWIPE_RIGHT");
  }

  const handleZoomStateChange = useCallback(
    (zoomState: {
      isLatestVisible: boolean;
      visiblePeriods: number;
      minDate: Date | null;
      maxDate: Date | null;
    }) => {
      setZoomState(zoomState);
    },
    []
  );

  const userCtx = useContext(UserContext);
  const isGraphNotPie = userCtx.isShowingGraph;
  // enum =>  0 = categories, 1 = traveller, 2 = country, 3 = currency
  const [toggleGraphEnum, setToggleGraphEnum] = useState(0);
  const [longerPeriodNum, setLongerPeriodNum] = useState(0);
  const [startingPoint, setStartingPoint] = useState(0);
  const [zoomState, setZoomState] = useState({
    isLatestVisible: true,
    visiblePeriods: 7,
    minDate: null as Date | null,
    maxDate: null as Date | null,
  });

  let titleString = "";
  switch (periodName) {
    case "total":
      titleString = i18n.t("overview");
      break;
    default:
      if (isGraphNotPie && zoomState.isLatestVisible) {
        // Show "Latest X Periods" when most recent data is visible
        titleString = `${i18n.t("latest")} ${zoomState.visiblePeriods} ${i18n.t(periodName + "s")}`;
      } else if (isGraphNotPie && zoomState.minDate && zoomState.maxDate) {
        // Show date range when zoomed to historical data
        const minDateStr = toDayMonthString(zoomState.minDate);
        const maxDateStr = toDayMonthString(zoomState.maxDate);
        titleString = `${minDateStr} - ${maxDateStr}`;
      } else {
        // Fallback to original logic for pie charts or when zoom state is not available
        titleString = `${i18n.t("last")} ${periodRangeNumber + longerPeriodNum}${
          startingPoint != 0 ? `+${-startingPoint}` : ""
        } ${i18n.t(periodName + "s")}`;
      }
      break;
  }

  const titleContainerJSX = (
    <View style={styles.titleContainerBlur}>
      {isGraphNotPie && (
        <Animated.View
          style={styles.titleContainer}
          entering={FadeInUp}
          exiting={FadeOutDown}
        >
          <Text style={styles.titleText}> {titleString} </Text>
        </Animated.View>
      )}

      {!isGraphNotPie && toggleGraphEnum == 0 && (
        <Animated.View entering={FadeInUp} exiting={FadeOutDown}>
          <Text style={styles.titleText}> {i18n.t("categories")} </Text>
        </Animated.View>
      )}
      {!isGraphNotPie && toggleGraphEnum == 1 && (
        <Animated.View entering={FadeInUp} exiting={FadeOutDown}>
          <Text style={styles.titleText}> {i18n.t("travellers")} </Text>
        </Animated.View>
      )}
      {!isGraphNotPie && toggleGraphEnum == 2 && (
        <Animated.View entering={FadeInUp} exiting={FadeOutDown}>
          <Text style={styles.titleText}> {i18n.t("countries")} </Text>
        </Animated.View>
      )}
      {!isGraphNotPie && toggleGraphEnum == 3 && (
        <Animated.View entering={FadeInUp} exiting={FadeOutDown}>
          <Text style={styles.titleText}> {i18n.t("currencies")} </Text>
        </Animated.View>
      )}
    </View>
  );

  return (
    <View
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      style={styles.container}
    >
      {isGraphNotPie && (
        <ExpenseGraph
          navigation={navigation}
          periodName={periodName}
          tripCtx={tripCtx}
          longerPeriodNum={longerPeriodNum}
          startingPoint={startingPoint}
          onZoomStateChange={handleZoomStateChange}
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
        ></ExpenseTravellers>
      )}
      {!isGraphNotPie && toggleGraphEnum == 2 && (
        <ExpenseCountries
          expenses={expenses}
          periodName={periodName}
          navigation={navigation}
        ></ExpenseCountries>
      )}
      {!isGraphNotPie && toggleGraphEnum == 3 && (
        <ExpenseCurrencies
          expenses={expenses}
          periodName={periodName}
          navigation={navigation}
        ></ExpenseCurrencies>
      )}
      {titleContainerJSX}
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

const getStyles = (GlobalStyles) =>
  StyleSheet.create({
  container: {
    flex: 1,
    overflow: "visible",
  },
  titleContainerBlur: {
    marginTop: dynamicScale(8, true, 0.5),
    alignSelf: "center",
    position: "absolute",
    width: "50%",
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: {
    marginTop: dynamicScale(6, true),
    minWidth: dynamicScale(200),
    maxWidth: dynamicScale(200),
    textAlign: "center",
    fontSize: dynamicScale(22, false, 0.5),
    fontWeight: "bold",
    fontStyle: "italic",
    color: GlobalStyles.colors.gray700,
    marginLeft: dynamicScale(6),
  },
});
