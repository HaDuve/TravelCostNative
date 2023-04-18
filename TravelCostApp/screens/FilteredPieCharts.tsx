import { StyleSheet, Text, View } from "react-native";
import React from "react";
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
import { en, de, fr } from "../i18n/supportedLanguages";
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
const i18n = new I18n({ en, de, fr });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

const FilteredPieCharts = ({ navigation, route }) => {
  const { expenses, dayString } = route.params;
  const titleStrings = [
    i18n.t("categories"),
    "Travellers", // i18n.t("travellers"),
    "Countries", // i18n.t("countries"),
    "Currencies", // i18n.t("currencies"),
    "Expenses", // i18n.t("expenses"),
  ];

  // enum =>  0 = categories, 1 = traveller, 2 = country, 3 = currency
  const [toggleGraphEnum, setToggleGraphEnum] = useState(0);

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

  const nextHandler = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setToggleGraphEnum(
      toggleGraphEnum == CONTENTS_MAX_INDEX ? 0 : toggleGraphEnum + 1
    );
  };

  const previousHandler = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setToggleGraphEnum(
      toggleGraphEnum == 0 ? CONTENTS_MAX_INDEX : toggleGraphEnum - 1
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.firstTitleContainer}>
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
