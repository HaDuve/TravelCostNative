import { Platform, StyleSheet, Text, View } from "react-native";
import React, { useContext } from "react";
import { useState } from "react";
import PropTypes from "prop-types";
import Animated, {
  FadeInLeft,
  FadeInUp,
  FadeOutDown,
  FadeOutLeft,
  FadeOutRight,
} from "react-native-reanimated";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr, ru } from "../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

import IconButton from "../components/UI/IconButton";
import * as Haptics from "expo-haptics";
import { GlobalStyles } from "../constants/styles";
import { FadeInRight } from "react-native-reanimated";
import ExpenseCategories from "../components/ExpensesOutput/ExpenseStatistics/ExpenseCategories";
import ExpenseTravellers from "../components/ExpensesOutput/ExpenseStatistics/ExpenseTravellers";
import ExpenseCountries from "../components/ExpensesOutput/ExpenseStatistics/ExpenseCountries";
import ExpenseCurrencies from "../components/ExpensesOutput/ExpenseStatistics/ExpenseCurrencies";
import FlatButton from "../components/UI/FlatButton";
import FilteredExpenses from "./FilteredExpenses";
import { UserContext } from "../store/user-context";
import BackButton from "../components/UI/BackButton";

const FilteredPieCharts = ({ navigation, route }) => {
  const { expenses, dayString } = route.params;
  const userCtx = useContext(UserContext);
  const [toggleGraphEnum, setToggleGraphEnum] = useState(0);
  // contents and titleStrings have to match in legth and correspond!
  const titleStrings = [
    i18n.t("categories"),
    i18n.t("travellers"),
    i18n.t("countries"),
    i18n.t("currencies"),
    i18n.t("expenses"),
  ];
  const contents = [
    <ExpenseCategories
      key={0}
      expenses={expenses}
      periodName={dayString}
      navigation={navigation}
    />,
    <ExpenseTravellers
      key={1}
      expenses={expenses}
      periodName={dayString}
      navigation={navigation}
    ></ExpenseTravellers>,
    <ExpenseCountries
      key={2}
      expenses={expenses}
      periodName={dayString}
      navigation={navigation}
    ></ExpenseCountries>,
    <ExpenseCurrencies
      key={3}
      expenses={expenses}
      periodName={dayString}
      navigation={navigation}
    ></ExpenseCurrencies>,
    <FilteredExpenses
      key={4}
      expensesAsArg={expenses}
      dayStringAsArg={dayString}
    ></FilteredExpenses>,
  ];
  if (contents.length !== titleStrings.length)
    throw new Error("Lengths do not match");
  const CONTENTS_MAX_INDEX = titleStrings.length - 1;

  const nextHandler = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setToggleGraphEnum(
      toggleGraphEnum == CONTENTS_MAX_INDEX ? 0 : toggleGraphEnum + 1
    );
  };

  const previousHandler = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setToggleGraphEnum(
      toggleGraphEnum == 0 ? CONTENTS_MAX_INDEX : toggleGraphEnum - 1
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.firstTitleContainer}>
        <BackButton style={{ marginTop: -16 }}></BackButton>
        <Text style={styles.firstTitleText}>{dayString}</Text>
      </View>

      <View style={styles.titleContainer}>
        <Animated.View
          entering={FadeInLeft}
          exiting={FadeOutLeft}
          style={styles.chevronContainer}
        >
          {/* "remove-outline" */}
          <IconButton
            icon={"chevron-back-outline"}
            size={24}
            onPress={previousHandler}
            color={GlobalStyles.colors.primaryGrayed}
          ></IconButton>
        </Animated.View>
        <Animated.View entering={FadeInUp} exiting={FadeOutDown}>
          <Text style={styles.titleText}>
            {" "}
            {titleStrings[toggleGraphEnum]}{" "}
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
            onPress={nextHandler}
            color={GlobalStyles.colors.primaryGrayed}
          ></IconButton>
        </Animated.View>
      </View>
      <View style={styles.shadow}></View>
      {contents[toggleGraphEnum]}
      <FlatButton onPress={() => navigation.pop()}>{i18n.t("back")}</FlatButton>
    </View>
  );
};

export default FilteredPieCharts;
FilteredPieCharts.propTypes = {
  navigation: PropTypes.object.isRequired,
  route: PropTypes.object.isRequired,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  firstTitleText: {
    fontSize: 20,
    fontWeight: "bold",
    color: GlobalStyles.colors.textColor,
    // center text
    textAlign: "center",
  },
  firstTitleContainer: {
    marginVertical: "4%",
    flexDirection: "row",
    ...Platform.select({
      android: {
        paddingLeft: "5%",
        paddingTop: "5%",
      },
    }),
  },
  shadow: {
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
    zIndex: 2,
  },
  titleContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  titleText: {
    minWidth: 200,
    maxWidth: 200,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "bold",
    fontStyle: "italic",
    color: GlobalStyles.colors.gray700,
    marginLeft: "2%",
  },
  chevronContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
});
