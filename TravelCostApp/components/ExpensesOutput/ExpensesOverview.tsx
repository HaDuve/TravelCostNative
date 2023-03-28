import { Pressable, StyleSheet, Text, View } from "react-native";
import React, { useContext, useState } from "react";
import ExpenseCategories from "./ExpenseStatistics/ExpenseCategories";
import ExpenseGraph from "./ExpenseStatistics/ExpenseGraph";
import { GlobalStyles } from "../../constants/styles";
import * as Haptics from "expo-haptics";
//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr } from "../../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr });
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
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInLeft,
  FadeInUp,
  FadeOut,
  FadeOutDown,
  FadeOutRight,
  FadeOutUp,
} from "react-native-reanimated";

const ExpensesOverview = ({ navigation, expenses, periodName }) => {
  const [toggleGraph, setToggleGraph] = useState(true);
  // enum =>  0 = categories, 1 = traveller, 2= country
  const [toggleGraphEnum, setToggleGraphEnum] = useState(0);
  const userCtx = useContext(UserContext);

  async function toggleContent() {
    const isPremium = await userCtx.checkPremium();
    // if (!isPremium) {
    //   navigation.navigate("Paywall");
    //   return;
    // }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setToggleGraph(!toggleGraph);
  }

  let titleString = "";
  switch (periodName) {
    case "total":
      titleString = i18n.t("overview");
      break;
    default:
      // convert day into days etc. for localization
      titleString = `${i18n.t("last")} ${i18n.t(periodName + "s")}`;
      break;
  }

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        {toggleGraph && (
          <Animated.View
            style={styles.chevronContainer}
            entering={FadeInUp}
            exiting={FadeOutDown}
          >
            <Text style={styles.titleText}> {titleString} </Text>
          </Animated.View>
        )}
        {!toggleGraph && (
          <Animated.View
            entering={FadeInLeft}
            exiting={FadeOutLeft}
            style={styles.chevronContainer}
          >
            <IconButton
              icon={"chevron-back-outline"}
              size={24}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setToggleGraphEnum(
                  toggleGraphEnum == 0 ? 2 : toggleGraphEnum - 1
                );
              }}
              color={GlobalStyles.colors.primaryGrayed}
            ></IconButton>
          </Animated.View>
        )}
        {!toggleGraph && toggleGraphEnum == 0 && (
          <Animated.View entering={FadeInUp} exiting={FadeOutDown}>
            <Text style={styles.titleText}> {i18n.t("categories")} </Text>
          </Animated.View>
        )}
        {!toggleGraph && toggleGraphEnum == 1 && (
          <Animated.View entering={FadeInUp} exiting={FadeOutDown}>
            <Text style={styles.titleText}> Travellers </Text>
          </Animated.View>
        )}
        {!toggleGraph && toggleGraphEnum == 2 && (
          <Animated.View entering={FadeInUp} exiting={FadeOutDown}>
            <Text style={styles.titleText}> Countries </Text>
          </Animated.View>
        )}
        {!toggleGraph && (
          <Animated.View
            entering={FadeInRight}
            exiting={FadeOutRight}
            style={styles.chevronContainer}
          >
            <IconButton
              icon={"chevron-forward-outline"}
              size={24}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

                setToggleGraphEnum(
                  toggleGraphEnum == 2 ? 0 : toggleGraphEnum + 1
                );
              }}
              color={GlobalStyles.colors.primaryGrayed}
            ></IconButton>
          </Animated.View>
        )}
      </View>

      {toggleGraph && (
        <ExpenseGraph
          navigation={navigation}
          expenses={expenses}
          periodName={periodName}
        />
      )}
      {!toggleGraph && toggleGraphEnum == 0 && (
        <ExpenseCategories
          expenses={expenses}
          periodName={periodName}
          navigation={navigation}
        />
      )}
      {!toggleGraph && toggleGraphEnum == 1 && (
        <ExpenseTravellers
          expenses={expenses}
          periodName={periodName}
          navigation={navigation}
        ></ExpenseTravellers>
      )}
      {!toggleGraph && toggleGraphEnum == 2 && (
        <ExpenseCountries
          expenses={expenses}
          periodName={periodName}
          navigation={navigation}
        ></ExpenseCountries>
      )}

      <View
        style={[
          styles.toggleButton,
          // styles.toggleButton
        ]}
      >
        <TourGuideZone
          text={i18n.t("walk4")}
          tooltipBottomOffset={66}
          maskOffset={60}
          zone={4}
        >
          <Pressable
            onPress={toggleContent}
            style={({ pressed }) => [pressed && styles.pressed]}
          >
            <ToggleButton></ToggleButton>
          </Pressable>
        </TourGuideZone>
      </View>
    </View>
  );
};

export default ExpensesOverview;

ExpensesOverview.propTypes = {
  expenses: PropTypes.array.isRequired,
  periodName: PropTypes.string.isRequired,
  navigation: PropTypes.object.isRequired,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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

    elevation: 2,
    shadowColor: GlobalStyles.colors.textColor,
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
  },
});
