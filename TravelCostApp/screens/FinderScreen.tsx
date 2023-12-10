import { Platform, StyleSheet, Text, View } from "react-native";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import DatePickerModal from "../components/UI/DatePickerModal";
import DatePickerContainer from "../components/UI/DatePickerContainer";
import { getFormattedDate } from "../util/date";
import { DateTime } from "luxon";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr, ru } from "../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

import * as Haptics from "expo-haptics";
import GradientButton from "../components/UI/GradientButton";
import { ExpensesContext } from "../store/expenses-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Checkbox } from "react-native-paper";
import {
  asyncStoreGetItem,
  asyncStoreGetObject,
  asyncStoreSetItem,
  asyncStoreSetObject,
} from "../store/async-storage";
import { GlobalStyles, ListLayoutAnimation } from "../constants/styles";
import IconButton from "../components/UI/IconButton";
import { UserContext } from "../store/user-context";
import { Toast } from "react-native-toast-message/lib/src/Toast";
import Animated from "react-native-reanimated";
import { formatExpenseWithCurrency } from "../util/string";
import { TripContext } from "../store/trip-context";
import safeLogError from "../util/error";
import Autocomplete from "../components/UI/Autocomplete";
import { DEFAULTCATEGORIES } from "../util/category";
import { ExpenseData } from "../util/expense";

const FinderScreen = () => {
  const navigation = useNavigation();
  const expCtx = useContext(ExpensesContext);
  const userCtx = useContext(UserContext);
  const tripCtx = useContext(TripContext);

  useFocusEffect(
    React.useCallback(() => {
      if (userCtx.freshlyCreated) {
        Toast.show({
          type: "success",
          text1: i18n.t("welcomeToBudgetForNomads"),
          text2: i18n.t("pleaseCreateTrip"),
        });
        navigation.navigate("Profile");
      }
    }, [userCtx.freshlyCreated, navigation])
  );

  const [checkedQuery, setCheckedQuery] = React.useState(false);
  const [checkedDate, setCheckedDate] = React.useState(false);

  const [showDatePickerRange, setShowDatePickerRange] = useState(false);
  const [startDate, setStartDate] = useState(getFormattedDate(DateTime.now()));
  const [endDate, setEndDate] = useState(getFormattedDate(DateTime.now()));
  const openDatePickerRange = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowDatePickerRange(true);
  };
  const onCancelRange = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowDatePickerRange(false);
  }, []);
  const onConfirmRange = useCallback((output) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowDatePickerRange(false);
    // hotfixing datebug for asian countries
    const startDate = DateTime.fromJSDate(output.startDate).toJSDate();
    const endDate = DateTime.fromJSDate(output.endDate).toJSDate();
    const startDateFormat = getFormattedDate(startDate);
    const endDateFormat = getFormattedDate(endDate);
    setStartDate(startDateFormat);
    setEndDate(endDateFormat);
    setCheckedDate(true);
  }, []);
  const datepickerJSX = DatePickerModal({
    showDatePickerRange,
    onCancelRange,
    onConfirmRange,
  });
  const dateIsRanged =
    startDate?.toString().slice(0, 10) !== endDate?.toString().slice(0, 10);
  const [searchQuery, setSearchQuery] = React.useState("");

  const onChangeSearch = (query) => {
    setSearchQuery(query);
    setCheckedQuery(true);
    if (query === "") {
      setCheckedQuery(false);
    }
  };

  const expenses = expCtx.expenses;
  const filteredExpenses = useMemo(
    () =>
      expenses.filter((expense: ExpenseData) => {
        const expenseDate = expense.startDate;
        const expenseDateIsSameDay =
          !checkedDate ||
          expenseDate?.toString().slice(0, 10) ===
            startDate?.toString().slice(0, 10) ||
          DateTime.fromJSDate(expense.date).toString()?.slice(0, 10) ===
            startDate?.toString().slice(0, 10);
        const expenseDateIsInRange =
          expenseDateIsSameDay ||
          (expenseDate >= startDate && expenseDate <= endDate) ||
          (DateTime.fromJSDate(expense.date).toString() >= startDate &&
            DateTime.fromJSDate(expense.date).toString() <= endDate);
        const expenseDescriptionIsInSearchQuery = expense.description
          ?.toLowerCase()
          .includes(searchQuery?.toLowerCase());
        const expenseCategoryIsInSearchQuery = expense.category
          ?.toLowerCase()
          .includes(searchQuery?.toLowerCase());
        const expenseCategoryIsInSearchQuery2 = expense.categoryString
          ?.toLowerCase()
          .includes(searchQuery?.toLowerCase());
        const expenseCurrencyIsInSearchQuery = expense.currency
          ?.toLowerCase()
          .includes(searchQuery?.toLowerCase());
        const expenseCountryIsInSearchQuery = expense.country
          ?.toLowerCase()
          .includes(searchQuery?.toLowerCase());
        const expenseTravellerIsInSearchQuery =
          // return true if searchQuery?.toLowerCase() is in expense.splitList
          expense.splitList?.some((split) => {
            const travellerName = split.userName;
            return travellerName
              ?.toLowerCase()
              .includes(searchQuery?.toLowerCase());
          });

        return (
          expenseDateIsInRange &&
          (!checkedQuery ||
            expenseDescriptionIsInSearchQuery ||
            expenseCategoryIsInSearchQuery ||
            expenseCategoryIsInSearchQuery2 ||
            expenseCurrencyIsInSearchQuery ||
            expenseCountryIsInSearchQuery ||
            expenseTravellerIsInSearchQuery)
        );
      }),
    [expenses, checkedDate, startDate, endDate, searchQuery, checkedQuery]
  );

  const queryString = checkedQuery ? searchQuery : "";
  const dateString = checkedDate
    ? DateTime.fromISO(startDate).toLocaleString() +
      " - " +
      DateTime.fromISO(endDate).toLocaleString()
    : "";
  const allEpensesQueryString =
    queryString === "" && dateString === "" ? "All Expenses" : "";

  const findPressedHandler = useCallback(() => {
    console.log("find pressed");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("FilteredPieCharts", {
      expenses: filteredExpenses,
      dayString: allEpensesQueryString + queryString + " " + dateString,
    });
  }, [
    navigation,
    filteredExpenses,
    allEpensesQueryString,
    queryString,
    dateString,
  ]);

  const numberOfResults = filteredExpenses?.length;
  const foundResults = filteredExpenses?.length > 0 ? true : false;
  const sumOfResults = filteredExpenses?.reduce(
    (sum, expense) => sum + expense.calcAmount,
    0
  );

  const [hasLoaded, setHasLoaded] = useState(false);
  // save all state variables into async storage
  useEffect(() => {
    const saveData = async () => {
      console.log(
        "saveData ~ saveData:",
        checkedQuery,
        checkedDate,
        startDate,
        endDate,
        searchQuery
      );
      try {
        await asyncStoreSetObject("FINDER_checkedQuery", checkedQuery);
        await asyncStoreSetObject("FINDER_checkedDate", checkedDate);
        await asyncStoreSetItem("FINDER_startDate", startDate);
        await asyncStoreSetItem("FINDER_endDate", endDate);
        await asyncStoreSetItem("FINDER_searchQuery", searchQuery);
      } catch (error) {
        safeLogError(error);
      }
    };
    if (hasLoaded) saveData();
  }, [checkedQuery, checkedDate, startDate, endDate, searchQuery]);
  // load all state variables from async storage
  useEffect(() => {
    const loadData = async () => {
      try {
        const checkedQuery = await asyncStoreGetObject("FINDER_checkedQuery");
        const checkedDate = await asyncStoreGetObject("FINDER_checkedDate");
        const startDate = await asyncStoreGetItem("FINDER_startDate");
        const endDate = await asyncStoreGetItem("FINDER_endDate");
        const searchQuery = await asyncStoreGetItem("FINDER_searchQuery");
        if (checkedQuery) setCheckedQuery(checkedQuery);
        if (checkedDate) setCheckedDate(checkedDate);
        if (startDate) setStartDate(startDate);
        if (endDate) setEndDate(endDate);
        if (searchQuery) setSearchQuery(searchQuery);
        setHasLoaded(true);
      } catch (error) {
        safeLogError(error);
        setHasLoaded(true);
      }
    };
    loadData();
  }, []);

  const last500Daysexpenses = useMemo(
    () =>
      expCtx.expenses.filter(
        (expense) =>
          expense.date > DateTime.now().minus({ days: 500 }).toJSDate()
      ),
    [expCtx.expenses?.length]
  );
  // extract suggestions from all the descriptions of expense state into an array of strings
  const suggestionData: string[] = last500Daysexpenses.map(
    (expense) => expense.description
  );
  const cats = DEFAULTCATEGORIES.map((cat) => {
    if (cat.cat !== "newCat") return cat.catString;
  });
  const travellers = tripCtx.travellers;

  const suggestions = searchQuery
    ? [...travellers, ...cats, ...suggestionData]
    : [
        ...travellers.slice(0, 1),
        ...cats.slice(0, 1),
        ...suggestionData.slice(0, 1),
      ];

  return (
    <>
      {datepickerJSX}
      <Animated.View layout={ListLayoutAnimation} style={styles.container}>
        <View style={[styles.cardContainer, GlobalStyles.wideStrongShadow]}>
          <Text style={styles.titleText}>{i18n.t("finderTitle")}</Text>
          <Animated.ScrollView layout={ListLayoutAnimation} style={{ flex: 1 }}>
            <View style={styles.rowContainer}>
              <View style={styles.checkBoxContainer}>
                <Checkbox
                  status={checkedQuery ? "checked" : "unchecked"}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setCheckedQuery(!checkedQuery);
                  }}
                />
              </View>
              <Autocomplete
                value={searchQuery}
                onChange={onChangeSearch}
                data={suggestions}
                showOnEmpty
                // placeholder="Search for descriptions, categories, traveller names..."
                label="Search"
                containerStyle={[
                  styles.queryContainer,
                  GlobalStyles.shadowGlowPrimary,
                ]}
                style={styles.autoCompleteStyle}
                menuStyle={[styles.autoCompleteMenuStyle]}
              ></Autocomplete>
              {checkedQuery && (
                <IconButton
                  icon="close-outline"
                  size={26}
                  buttonStyle={{ marginTop: "7%" }}
                  onPressStyle={{
                    backgroundColor: GlobalStyles.colors.gray500,
                    borderRadius: 99,
                  }}
                  onPress={() => {
                    setSearchQuery("");
                    setCheckedQuery(false);
                  }}
                ></IconButton>
              )}
            </View>
            <View style={styles.rowContainer}>
              <View style={styles.checkBoxContainer}>
                <Checkbox
                  status={checkedDate ? "checked" : "unchecked"}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setCheckedDate(!checkedDate);
                  }}
                />
              </View>
              {DatePickerContainer({
                openDatePickerRange,
                startDate,
                endDate,
                dateIsRanged,
                narrow: true,
              })}
              {checkedDate && (
                <IconButton
                  icon="close-outline"
                  size={26}
                  buttonStyle={{ marginTop: "7%" }}
                  onPressStyle={{
                    backgroundColor: GlobalStyles.colors.gray500,
                    borderRadius: 99,
                  }}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setCheckedDate(false);
                    setStartDate(getFormattedDate(DateTime.now()));
                    setEndDate(getFormattedDate(DateTime.now()));
                  }}
                ></IconButton>
              )}
            </View>
            <Text style={styles.queryText}>
              {(queryString || dateString) && i18n.t("finding")} :{queryString}{" "}
              {dateString}
            </Text>
          </Animated.ScrollView>
          <Text style={styles.queryText}>
            {foundResults && "Sum of the Results: "}
            {foundResults &&
              formatExpenseWithCurrency(
                sumOfResults,
                tripCtx.tripCurrency
              )}{" "}
          </Text>
          <GradientButton
            onPress={() => findPressedHandler()}
            style={styles.findButton}
          >
            {foundResults
              ? `${i18n.t("showXResults1")} ${numberOfResults} ${i18n.t(
                  "showXResults2"
                )}`
              : i18n.t("noResults")}
          </GradientButton>
        </View>
      </Animated.View>
      {/* <BlurPremium /> */}
    </>
  );
};

export default FinderScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // margin: "4%",
    padding: "8%",
    backgroundColor: GlobalStyles.colors.backgroundColor,
  },
  cardContainer: {
    flex: 1,
    backgroundColor: GlobalStyles.colors.backgroundColorLight,
    borderRadius: 20,
    padding: "8%",
    justifyContent: "space-around",
  },
  checkBoxContainer: {
    borderRadius: 99,
    marginRight: 8,
    marginTop: "8%",
    ...Platform.select({
      ios: { borderWidth: 1 },
    }),
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    minHeight: 90,
  },
  rowContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    minHeight: 90,
  },
  titleText: {
    fontSize: 32,
    fontWeight: "bold",
    paddingBottom: 12,
    color: GlobalStyles.colors.textColor,
    // center
    textAlign: "center",
  },
  queryText: {
    fontSize: 16,
    marginTop: "20%",

    marginBottom: "5%",
    //center
    textAlign: "center",
    // thin text
    fontWeight: "200",
    //cursive
    fontStyle: "italic",
  },
  findButton: {
    marginHorizontal: "20%",
    borderRadius: 99,
  },
  queryContainer: {
    flex: 1,
    marginTop: "3%",

    // marginHorizontal: "3.5%",
    marginLeft: "5%",
    maxWidth: "60%",
  },
  autoCompleteStyle: {
    // flex: 1,
    zIndex: 0,

    backgroundColor: GlobalStyles.colors.backgroundColorLight,
    borderRadius: 5,
    // marginLeft: -8,
  },
  autoCompleteMenuStyle: {
    zIndex: 0,
    marginLeft: 8,
    marginBottom: -1,
  },
});
