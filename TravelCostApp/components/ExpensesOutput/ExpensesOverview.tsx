import * as Haptics from "expo-haptics";
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import PropTypes from "prop-types";
import React, { useContext, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  FadeInRight,
  FadeInUp,
  FadeOutDown,
  FadeOutRight,
} from "react-native-reanimated";
import { TourGuideZone } from "rn-tourguide";

import ToggleButton from "../../assets/SVG/toggleButton";
import { MAX_PERIOD_RANGE } from "../../confAppConstants";
import { GlobalStyles } from "../../constants/styles";
import ExpenseCategories from "./ExpenseStatistics/ExpenseCategories";
import ExpenseCountries from "./ExpenseStatistics/ExpenseCountries";
import ExpenseGraph from "./ExpenseStatistics/ExpenseGraph";
//Localization

import { de, en, fr, ru } from "../../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale =
  Localization.getLocales()[0] && Localization.getLocales()[0].languageCode
    ? Localization.getLocales()[0].languageCode.slice(0, 2)
    : "en";
i18n.enableFallback = true;
// i18n.locale = "en";

import { UserContext } from "../../store/user-context";

import ExpenseTravellers from "./ExpenseStatistics/ExpenseTravellers";

import IconButton from "../UI/IconButton";

import ExpenseCurrencies from "./ExpenseStatistics/ExpenseCurrencies";

import { BlurView } from "expo-blur";

import { OrientationContext } from "../../store/orientation-context";
import { TripContext } from "../../store/trip-context";
import { constantScale, dynamicScale } from "../../util/scalingUtil";
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
      } ${i18n.t(`${periodName}s`)}`;
      break;
  }

  const [autoIncrement, setAutoIncrement] = useState<number | null>(null);

  const startAutoIncrement = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    rightNavButtonHandler();
    const interval = setInterval(() => {
      rightNavButtonHandler();
    }, 600);
    setAutoIncrement(interval as any);
    return;
  };
  const stopAutoIncrement = () => {
    clearInterval(autoIncrement);
    return;
  };

  const rightNavButtonHandler = () => {
    if (isGraphNotPie) {
      realPeriodNumber.current =
        realPeriodNumber.current == MAX_PERIOD_RANGE
          ? MAX_PERIOD_RANGE
          : realPeriodNumber.current + 1;
      setPeriodRangeNumber(realPeriodNumber.current);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setToggleGraphEnum(toggleGraphEnum == 3 ? 0 : toggleGraphEnum + 1);
    }
  };

  const isAndroid = Platform.OS === "android";

  const titleContainerJSX = (
    <BlurView
      intensity={isAndroid ? 100 : 90}
      style={styles.titleContainerBlur}
    >
      <Animated.View
        // entering={FadeInLeft}
        // exiting={FadeOutLeft}
        style={styles.chevronContainer}
      >
        {/* "remove-outline" */}
        <IconButton
          icon={
            isGraphNotPie ? "play-skip-back-outline" : "chevron-back-outline"
          }
          size={dynamicScale(24, false, 0.5)}
          onPress={async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (isGraphNotPie) {
              realPeriodNumber.current = 7;
              setPeriodRangeNumber(realPeriodNumber.current);
              setLongerPeriodNum(0);
              setStartingPoint(0);
              stopAutoIncrement();
            } else {
              setToggleGraphEnum(
                toggleGraphEnum == 0 ? 3 : toggleGraphEnum - 1
              );
            }
          }}
          color={GlobalStyles.colors.primaryGrayed}
        ></IconButton>
      </Animated.View>

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

      <Animated.View
        entering={FadeInRight}
        exiting={FadeOutRight}
        style={styles.chevronContainer}
      >
        <IconButton
          icon={
            isGraphNotPie ? "add-circle-outline" : "chevron-forward-outline"
          }
          size={dynamicScale(24, false, 0.5)}
          onPress={rightNavButtonHandler}
          onPressIn={startAutoIncrement}
          onPressOut={stopAutoIncrement}
          color={GlobalStyles.colors.primaryGrayed}
        ></IconButton>
      </Animated.View>
    </BlurView>
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
          expenses={expenses}
          periodName={periodName}
          periodRangeNumber={periodRangeNumber}
          tripCtx={tripCtx}
          longerPeriodNum={longerPeriodNum}
          setLongerPeriodNum={setLongerPeriodNum}
          startingPoint={startingPoint}
          setStartingPoint={setStartingPoint}
        />
      )}
      {!isGraphNotPie && toggleGraphEnum == 0 && (
        <ExpenseCategories
          expenses={expenses}
          periodName={periodName}
          navigation={navigation}
          forcePortraitFormat={false}
        />
      )}
      {!isGraphNotPie && toggleGraphEnum == 1 && (
        <ExpenseTravellers
          expenses={expenses}
          periodName={periodName}
          navigation={navigation}
          forcePortraitFormat={false}
        ></ExpenseTravellers>
      )}
      {!isGraphNotPie && toggleGraphEnum == 2 && (
        <ExpenseCountries
          expenses={expenses}
          periodName={periodName}
          navigation={navigation}
          forcePortraitFormat={false}
        ></ExpenseCountries>
      )}
      {!isGraphNotPie && toggleGraphEnum == 3 && (
        <ExpenseCurrencies
          expenses={expenses}
          periodName={periodName}
          navigation={navigation}
          forcePortraitFormat={false}
        ></ExpenseCurrencies>
      )}
      {titleContainerJSX}
      <View style={!isPortrait && styles.landscapeToggleButtonContainer}>
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
  chevronContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: dynamicScale(12, true),
  },
  container: {
    flex: 1,
    overflow: "visible",
  },
  landscapeToggleButtonContainer: {
    // marginLeft: dynamicScale(-1100, false, 2),
    // marginBottom: dynamicScale(6, true),
    position: "absolute",
    left: -280,
    bottom: 1,
  },
  pressed: {
    opacity: 0.65,
  },
  titleContainer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  titleContainerBlur: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    paddingBottom: dynamicScale(6, true),
    position: "absolute",
    width: "100%",
  },
  titleText: {
    color: GlobalStyles.colors.gray700,
    fontSize: dynamicScale(22, false, 0.5),
    fontStyle: "italic",
    fontWeight: "bold",
    marginLeft: dynamicScale(6),
    marginTop: dynamicScale(6, true),
    maxWidth: dynamicScale(200),
    minWidth: dynamicScale(200),
    textAlign: "center",
  },
  toggleButton: {
    flex: 1,
    // borderRadius: 10,
    // marginHorizontal:dynamicScale(120),
    marginBottom: dynamicScale(-6, true),
    marginTop: dynamicScale(-66, true),
    marginHorizontal: "50%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
    elevation: 0,
  },
});
