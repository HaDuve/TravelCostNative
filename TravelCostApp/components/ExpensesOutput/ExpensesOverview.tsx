import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import React, { useContext, useRef, useState } from "react";
import ExpenseCategories from "./ExpenseStatistics/ExpenseCategories";
import ExpenseGraph from "./ExpenseStatistics/ExpenseGraph";
import { GlobalStyles } from "../../constants/styles";
import * as Haptics from "expo-haptics";
//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr, ru } from "../../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale =
  Localization.getLocales()[0] && Localization.getLocales()[0].languageCode
    ? Localization.getLocales()[0].languageCode.slice(0, 2)
    : "en";
i18n.enableFallback = true;
// i18n.locale = "en";

import ToggleButton from "../../assets/SVG/toggleButton";
import { TourGuideZone } from "rn-tourguide";
import { UserContext } from "../../store/user-context";
import PropTypes from "prop-types";
import ExpenseCountries from "./ExpenseStatistics/ExpenseCountries";
import ExpenseTravellers from "./ExpenseStatistics/ExpenseTravellers";
import IconButton from "../UI/IconButton";
import { FadeInRight } from "react-native-reanimated";
import ExpenseCurrencies from "./ExpenseStatistics/ExpenseCurrencies";
import Animated, {
  FadeInUp,
  FadeOutDown,
  FadeOutRight,
} from "react-native-reanimated";
import { MAX_PERIOD_RANGE } from "../../confAppConstants";
import { BlurView } from "expo-blur";
import { TripContext } from "../../store/trip-context";
import { constantScale, dynamicScale } from "../../util/scalingUtil";
import { OrientationContext } from "../../store/orientation-context";
import { useSwipe } from "../Hooks/useSwipe";

const ExpensesOverview = ({ navigation, expenses, periodName }) => {
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

  const [isGraphNotPie, setToggleGraph] = useState(true);
  // enum =>  0 = categories, 1 = traveller, 2 = country, 3 = currency
  const [toggleGraphEnum, setToggleGraphEnum] = useState(0);
  const userCtx = useContext(UserContext);
  const [longerPeriodNum, setLongerPeriodNum] = useState(0);
  const [startingPoint, setStartingPoint] = useState(0);

  async function toggleContent() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    userCtx.setIsShowingGraph(!isGraphNotPie);
    setToggleGraph(!isGraphNotPie);
  }

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
      <View
        style={[
          // styles.toggleButton
          !isPortrait && styles.landscapeToggleButtonContainer,
        ]}
      >
        <TourGuideZone
          text={i18n.t("walk4")}
          tooltipBottomOffset={constantScale(166, 0.5)}
          maskOffset={constantScale(60, 0.5)}
          zone={4}
          shape={"circle"}
        >
          <Pressable
            onPress={toggleContent}
            style={({ pressed }) => [
              GlobalStyles.shadowGlowPrimary,
              pressed && GlobalStyles.pressedWithShadow,
              styles.toggleButton,
            ]}
          >
            <ToggleButton toggled={isGraphNotPie}></ToggleButton>
          </Pressable>
        </TourGuideZone>
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
  toggleButton: {
    flex: 1,
    marginBottom: dynamicScale(-6, true),
    marginTop: dynamicScale(-66, true),
    marginHorizontal: "50%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
    elevation: 0,
  },
  landscapeToggleButtonContainer: {
    position: "absolute",
    left: -280,
    bottom: 1,
  },
});
