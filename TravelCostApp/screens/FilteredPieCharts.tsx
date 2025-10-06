import { useContext, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";

const i18n = new I18n({ en, de, fr, ru });
i18n.locale =
  Localization.getLocales()[0] && Localization.getLocales()[0].languageCode
    ? Localization.getLocales()[0].languageCode.slice(0, 2)
    : "en";
i18n.enableFallback = true;
// i18n.locale = "en";

import * as Haptics from "expo-haptics";
import Animated, {
  FadeInLeft,
  FadeInRight,
  FadeInUp,
  FadeOutDown,
  FadeOutLeft,
  FadeOutRight,
} from "react-native-reanimated";

import ExpenseCategories from "../components/ExpensesOutput/ExpenseStatistics/ExpenseCategories";
import ExpenseCountries from "../components/ExpensesOutput/ExpenseStatistics/ExpenseCountries";
import ExpenseCurrencies from "../components/ExpensesOutput/ExpenseStatistics/ExpenseCurrencies";
import ExpenseTravellers from "../components/ExpensesOutput/ExpenseStatistics/ExpenseTravellers";
import AddExpenseHereButton from "../components/UI/AddExpensesHereButton";
import BackButton from "../components/UI/BackButton";
import FlatButton from "../components/UI/FlatButton";
import IconButton from "../components/UI/IconButton";
import { GlobalStyles } from "../constants/styles";
import { de, en, fr, ru } from "../i18n/supportedLanguages";
import { OrientationContext } from "../store/orientation-context";
import { getEarliestDate } from "../util/date";
import { ExpenseData } from "../util/expense";
import { constantScale, dynamicScale } from "../util/scalingUtil";

import FilteredExpenses from "./FilteredExpenses";

const FilteredPieCharts = ({ navigation, route }) => {
  const { expenses, dayString, noList = false } = route.params;
  const [toggleGraphEnum, setToggleGraphEnum] = useState(0);

  const { isPortrait, isTablet } = useContext(OrientationContext);
  // contents and titleStrings have to match in legth and correspond!
  const titleStrings = [
    i18n.t("categories"),
    i18n.t("travellers"),
    i18n.t("countries"),
    i18n.t("currencies"),
    !noList && i18n.t("expenses"),
  ];
  const contents = [
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
        route={route}
        expensesAsArg={expenses}
        dayStringAsArg={dayString}
      ></FilteredExpenses>
    ),
  ];
  if (contents?.length !== titleStrings?.length)
    console.error("Lengths do not match");
  let contentsMaxIndex = titleStrings?.length - 1;
  if (noList) contentsMaxIndex = titleStrings?.length - 2;
  // console.log("FilteredPieCharts ~ CONTENTS_MAX_INDEX:", contentsMaxIndex);

  const nextHandler = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setToggleGraphEnum(
      toggleGraphEnum == contentsMaxIndex ? 0 : toggleGraphEnum + 1
    );
  };

  const previousHandler = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setToggleGraphEnum(
      toggleGraphEnum == 0 ? contentsMaxIndex : toggleGraphEnum - 1
    );
  };

  const earliestDate = getEarliestDate(
    expenses.map((exp: ExpenseData) => exp.date)
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

const styles = StyleSheet.create({
  chevronContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    flex: 1,
  },
  firstTitleContainer: {
    flexDirection: "row",
    marginVertical: "4%",
    ...Platform.select({
      android: {
        justifyContent: "center",
      },
    }),
  },
  firstTitleText: {
    color: GlobalStyles.colors.textColor,
    fontSize: dynamicScale(20, false, 0.5),
    fontWeight: "bold",
    textAlign: "center",
  },
  firstTitleTextContainer: {
    alignItems: "center",
    flex: 5,
    justifyContent: "center",
    paddingRight: dynamicScale(12, false, 0.5),
  },
  footerContainer: {
    alignItems: "center",
    backgroundColor: GlobalStyles.colors.backgroundColor,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: "5%",
  },
  landScapetitleText: {
    marginTop: dynamicScale(30, true),
  },
  landscapeTitleContainer: {
    backgroundColor: GlobalStyles.colors.backgroundColor,
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    marginTop: dynamicScale(-24, true),
    paddingHorizontal: dynamicScale(80, false, 0.5),
  },
  shadow: {
    backgroundColor: GlobalStyles.colors.backgroundColor,
    borderBottomColor: GlobalStyles.colors.gray600,
    borderBottomWidth: 0,
    borderTopColor: GlobalStyles.colors.gray600,
    borderTopWidth: 1,
    elevation: 2,
    minHeight: 1,
    shadowColor: GlobalStyles.colors.textColor,
    shadowOffset: { width: 1, height: 2.5 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
    zIndex: 2,
  },
  tabletContainer: {
    marginTop: 0,
    padding: constantScale(12, 0.5),
    paddingHorizontal: constantScale(12, 0.5),
  },
  tabletTitleText: {
    marginTop: constantScale(16, 0.5),
  },
  titleContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  titleText: {
    color: GlobalStyles.colors.gray700,
    fontSize: dynamicScale(22, false, 0.5),
    fontStyle: "italic",
    fontWeight: "bold",
    marginLeft: "2%",
    maxWidth: 200,
    minWidth: 200,
    textAlign: "center",
  },
});
