import { Platform, StyleSheet, Text, View } from "react-native";
import React, { useCallback, useContext, useMemo, useState } from "react";
import PropTypes from "prop-types";
import Animated, {
  FadeInLeft,
  FadeInUp,
  FadeOutDown,
  FadeOutLeft,
  FadeOutRight,
} from "react-native-reanimated";

import { i18n } from "../i18n/i18n";

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
import BackButton from "../components/UI/BackButton";
import AddExpenseHereButton from "../components/UI/AddExpensesHereButton";
import { ExpenseData } from "../util/expense";
import { getEarliestDate } from "../util/date";
import { constantScale, dynamicScale } from "../util/scalingUtil";
import { OrientationContext } from "../store/orientation-context";

const FilteredPieCharts = ({ navigation, route }) => {
  const { expenses, dayString, noList = false } = route.params;
  const [toggleGraphEnum, setToggleGraphEnum] = useState(0);

  const { isPortrait, isTablet } = useContext(OrientationContext);
  // contents and titleStrings have to match in legth and correspond!
  const titleStrings = useMemo(
    () => [
      i18n.t("categories"),
      i18n.t("travellers"),
      i18n.t("countries"),
      i18n.t("currencies"),
      !noList && i18n.t("expenses"),
    ],
    [noList, i18n.locale]
  );
  const contents = useMemo(
    () => [
      <ExpenseCategories
        key={0}
        expenses={expenses}
        periodName={dayString}
        navigation={navigation}
        forcePortraitFormat
      />,
      <ExpenseTravellers
        key={1}
        expenses={expenses}
        periodName={dayString}
        navigation={navigation}
        forcePortraitFormat
      ></ExpenseTravellers>,
      <ExpenseCountries
        key={2}
        expenses={expenses}
        periodName={dayString}
        navigation={navigation}
        forcePortraitFormat
      ></ExpenseCountries>,
      <ExpenseCurrencies
        key={3}
        expenses={expenses}
        periodName={dayString}
        navigation={navigation}
        forcePortraitFormat
      ></ExpenseCurrencies>,
      !noList && (
        <FilteredExpenses
          key={4}
          expensesAsArg={expenses}
          dayStringAsArg={dayString}
        ></FilteredExpenses>
      ),
    ],
    [dayString, expenses, navigation, noList]
  );
  if (contents?.length !== titleStrings?.length)
    console.error("Lengths do not match");
  const contentsMaxIndex = useMemo(() => {
    if (noList) return titleStrings.length - 2;
    return titleStrings.length - 1;
  }, [noList, titleStrings.length]);

  const nextHandler = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setToggleGraphEnum((current) =>
      current == contentsMaxIndex ? 0 : current + 1
    );
  }, [contentsMaxIndex]);

  const previousHandler = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setToggleGraphEnum((current) =>
      current == 0 ? contentsMaxIndex : current - 1
    );
  }, [contentsMaxIndex]);

  const earliestDate = useMemo(
    () => getEarliestDate(expenses.map((exp: ExpenseData) => exp.date)),
    [expenses]
  );

  return (
    <View style={styles.container}>
      <View
        style={[
          !isPortrait && styles.landscapeTitleContainer,
          isTablet && styles.tabletContainer,
        ]}
      >
        <View style={styles.firstTitleContainer}>
          <BackButton
            style={{ marginTop: dynamicScale(-16, false, 0.5) }}
          ></BackButton>
          <View style={styles.firstTitleTextContainer}>
            <Text numberOfLines={1} style={styles.firstTitleText}>
              {dayString}
            </Text>
          </View>
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
            <Text
              style={[
                styles.titleText,
                !isPortrait && styles.landScapetitleText,
                isTablet && styles.tabletTitleText,
              ]}
            >
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
      </View>
      <View style={styles.shadow}></View>
      {contents[toggleGraphEnum]}
      <View style={styles.footerContainer}>
        <FlatButton onPress={() => navigation.pop()}>
          {i18n.t("back")}
        </FlatButton>
        <AddExpenseHereButton dayISO={earliestDate}></AddExpenseHereButton>
      </View>
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
  firstTitleTextContainer: {
    flex: 5,
    paddingRight: dynamicScale(12, false, 0.5),
    justifyContent: "center",
    alignItems: "center",
  },
  firstTitleText: {
    fontSize: dynamicScale(20, false, 0.5),
    fontWeight: "bold",
    color: GlobalStyles.colors.textColor,
    textAlign: "center",
  },
  landscapeTitleContainer: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    paddingHorizontal: dynamicScale(80, false, 0.5),
    marginTop: dynamicScale(-24, true),
    backgroundColor: GlobalStyles.colors.backgroundColor,
  },
  tabletContainer: {
    marginTop: 0,
    padding: constantScale(12, 0.5),
    paddingHorizontal: constantScale(12, 0.5),
  },
  firstTitleContainer: {
    marginVertical: "4%",
    flexDirection: "row",
    ...Platform.select({
      android: {
        justifyContent: "center",
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
    fontSize: dynamicScale(22, false, 0.5),
    fontWeight: "bold",
    fontStyle: "italic",
    color: GlobalStyles.colors.gray700,
    marginLeft: "2%",
  },
  landScapetitleText: {
    marginTop: dynamicScale(30, true),
  },
  tabletTitleText: {
    marginTop: constantScale(16, 0.5),
  },
  chevronContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  footerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: "5%",
    backgroundColor: GlobalStyles.colors.backgroundColor,
  },
});
