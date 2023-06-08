import { Pressable, StyleSheet, Text, View } from "react-native";
import React, { useContext, useEffect, useRef, useState } from "react";
import ExpenseCategories from "./ExpenseStatistics/ExpenseCategories";
import ExpenseGraph from "./ExpenseStatistics/ExpenseGraph";
import { GlobalStyles } from "../../constants/styles";
import * as Haptics from "expo-haptics";
//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr, ru } from "../../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

import ToggleButton from "../../assets/SVG/toggleButton";
import { TourGuideZone } from "rn-tourguide";
import { UserContext } from "../../store/user-context";
import PropTypes from "prop-types";
import ExpenseCountries from "./ExpenseStatistics/ExpenseCountries";
import ExpenseTravellers from "./ExpenseStatistics/ExpenseTravellers";
import IconButton from "../UI/IconButton";
import { FadeInRight, FadeOutLeft } from "react-native-reanimated";
import ExpenseCurrencies from "./ExpenseStatistics/ExpenseCurrencies";
import Animated, {
  FadeInLeft,
  FadeInUp,
  FadeOutDown,
  FadeOutRight,
} from "react-native-reanimated";
import {
  DEBUG_POLLING_INTERVAL,
  MAX_PERIOD_RANGE,
  MIN_PERIOD_RANGE,
} from "../../confAppConstants";
import { async } from "../../util/http";
import { useInterval } from "../Hooks/useInterval";
import { BlurView } from "expo-blur";
import { TripContext } from "../../store/trip-context";
import { ExpensesContext } from "../../store/expenses-context";

const ExpensesOverview = ({ navigation, expenses, periodName }) => {
  console.log("rerender ExpensesOverview - 1");
  const expenseCtx = useContext(ExpensesContext);
  const tripCtx = useContext(TripContext);
  // const periodRangeNumber = useRef(7);
  // periodRangeNumber useState is used to rerender the component when the periodRangeNumber changes
  const realPeriodNumber = useRef(7);
  const [periodRangeNumber, setPeriodRangeNumber] = useState(
    realPeriodNumber.current
  );

  const [isGraphNotPie, setToggleGraph] = useState(true);
  // enum =>  0 = categories, 1 = traveller, 2 = country, 3 = currency
  const [toggleGraphEnum, setToggleGraphEnum] = useState(0);
  const userCtx = useContext(UserContext);

  async function toggleContent() {
    const isPremium = await userCtx.checkPremium();
    // if (!isPremium) {
    //   navigation.navigate("Paywall");
    //   return;
    // }
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
      // TODO: convert day into days etc. for localization
      titleString = `${i18n.t("last")} ${periodRangeNumber} ${i18n.t(
        periodName + "s"
      )}`;
      break;
  }

  const [autoIncrement, setAutoIncrement] = useState<NodeJS.Timer>(null);

  const startAutoIncrement = async () => {
    // TODO: add a state variable and a useInterval, if the state is set to true, call rightNavButtonHandler
    console.log("startAutoIncrement ~ startAutoIncrement:");
    rightNavButtonHandler();
    const interval = setInterval(() => {
      console.log("startAutoIncrement ~ interval tick");
      rightNavButtonHandler();
    }, 600);
    setAutoIncrement(interval);
    return;
  };
  const stopAutoIncrement = () => {
    console.log("stopAutoIncrement ~ stopAutoIncrement");
    // setAutoIncrement(false);
    clearInterval(autoIncrement);
    return;
  };

  const rightNavButtonHandler = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // const isPremium = await userCtx.checkPremium();
    // if (!isPremium) {
    //   navigation.navigate("Paywall");
    //   return;
    // }
    console.log("pressed right button");
    if (isGraphNotPie) {
      realPeriodNumber.current =
        realPeriodNumber.current == MAX_PERIOD_RANGE
          ? MAX_PERIOD_RANGE
          : realPeriodNumber.current + 1;
      setPeriodRangeNumber(realPeriodNumber.current);
    } else {
      setToggleGraphEnum(toggleGraphEnum == 3 ? 0 : toggleGraphEnum + 1);
    }
  };

  const titleContainerJSX = (
    <BlurView style={styles.titleContainerBlur}>
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
          size={24}
          onPress={async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const isPremium = await userCtx.checkPremium();

            // if (!isPremium) {
            //   navigation.navigate("Paywall");
            //   return;
            // }
            if (isGraphNotPie) {
              realPeriodNumber.current = MIN_PERIOD_RANGE;
              setPeriodRangeNumber(realPeriodNumber.current);
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
          <Text style={styles.titleText}> Travellers </Text>
        </Animated.View>
      )}
      {!isGraphNotPie && toggleGraphEnum == 2 && (
        <Animated.View entering={FadeInUp} exiting={FadeOutDown}>
          <Text style={styles.titleText}> Countries </Text>
        </Animated.View>
      )}
      {!isGraphNotPie && toggleGraphEnum == 3 && (
        <Animated.View entering={FadeInUp} exiting={FadeOutDown}>
          <Text style={styles.titleText}> Currencies </Text>
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
          size={24}
          onPressIn={startAutoIncrement}
          onPressOut={stopAutoIncrement}
          // onPress={rightNavButtonHandler}
          color={GlobalStyles.colors.primaryGrayed}
        ></IconButton>
      </Animated.View>
    </BlurView>
  );

  return (
    <View style={styles.container}>
      {isGraphNotPie && (
        <ExpenseGraph
          navigation={navigation}
          expenses={expenses}
          periodName={periodName}
          periodRangeNumber={periodRangeNumber}
          expenseCtx={expenseCtx}
          tripCtx={tripCtx}
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
        style={
          [
            // styles.toggleButton
          ]
        }
      >
        <TourGuideZone
          text={i18n.t("walk4")}
          tooltipBottomOffset={66}
          maskOffset={60}
          zone={4}
        >
          <Pressable
            onPress={toggleContent}
            style={({ pressed }) => [
              styles.toggleButton,
              GlobalStyles.shadowGlowPrimary,
              pressed && GlobalStyles.pressedWithShadow,
            ]}
          >
            <ToggleButton></ToggleButton>
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
    prevProps.periodName === nextProps.periodName
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    width: "100%",
    paddingBottom: "2%",
    // height: "5%",
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  chevronContainer: {
    marginTop: "4%",
    justifyContent: "center",
    alignItems: "center",
  },
  pressed: {
    opacity: 0.65,
  },
  titleText: {
    marginTop: "2%",
    minWidth: 200,
    maxWidth: 200,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "bold",
    fontStyle: "italic",
    color: GlobalStyles.colors.gray700,
    marginLeft: "2%",
  },
  toggleButton: {
    flex: 0,
    borderRadius: 999,
    marginHorizontal: 150,
    marginBottom: "-2%",
    marginTop: "-20%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
});
