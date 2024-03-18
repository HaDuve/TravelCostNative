import { DateTime } from "luxon";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import DatePickerContainer from "../components/UI/DatePickerContainer";
import DatePickerModal from "../components/UI/DatePickerModal";
import { getFormattedDate } from "../util/date";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { de, en, fr, ru } from "../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

import { useFocusEffect, useNavigation } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { Checkbox } from "react-native-paper";
import Animated from "react-native-reanimated";
import { Toast } from "react-native-toast-message/lib/src/Toast";
import Autocomplete from "../components/UI/Autocomplete";
import GradientButton from "../components/UI/GradientButton";
import IconButton from "../components/UI/IconButton";
import { GlobalStyles, ListLayoutAnimation } from "../constants/styles";
import {
  asyncStoreGetItem,
  asyncStoreGetObject,
  asyncStoreSetItem,
  asyncStoreSetObject,
} from "../store/async-storage";
import { ExpensesContext } from "../store/expenses-context";
import { TripContext } from "../store/trip-context";
import { UserContext } from "../store/user-context";
import { DEFAULTCATEGORIES } from "../util/category";
import safeLogError from "../util/error";
import { ExpenseData } from "../util/expense";
import { formatExpenseWithCurrency } from "../util/string";
import { moderateScale, scale, verticalScale } from "../util/scalingUtil";
import { OrientationContext } from "../store/orientation-context";

const FinderScreen = () => {
  const navigation = useNavigation();
  const expCtx = useContext(ExpensesContext);
  const userCtx = useContext(UserContext);
  const tripCtx = useContext(TripContext);
  const { isPortrait } = useContext(OrientationContext);

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
        function isSearchFilter(_searchQuery: string) {
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
            .includes(_searchQuery?.toLowerCase());
          const expenseCategoryIsInSearchQuery = expense.category
            ?.toLowerCase()
            .includes(_searchQuery?.toLowerCase());
          const expenseCategoryIsInSearchQuery2 = expense.categoryString
            ?.toLowerCase()
            .includes(_searchQuery?.toLowerCase());
          const expenseCurrencyIsInSearchQuery = expense.currency
            ?.toLowerCase()
            .includes(_searchQuery?.toLowerCase());
          const expenseCountryIsInSearchQuery = expense.country
            ?.toLowerCase()
            .includes(_searchQuery?.toLowerCase());
          const expenseTravellerIsInSearchQuery =
            // return true if _searchQuery?.toLowerCase() is in expense.splitList
            expense.splitList?.some((split) => {
              const travellerName = split.userName;
              return travellerName
                ?.toLowerCase()
                .includes(_searchQuery?.toLowerCase());
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
        }
        const searchQuerySplit = searchQuery?.toLowerCase().trim().split(" ");

        // we want to return a combined boolean value for all the filters
        // return isSearchFilter(searchQuerySplit[0]);
        let isFiltered = isSearchFilter(searchQuerySplit[0]);
        if (searchQuerySplit && searchQuerySplit.length > 1) {
          for (const query of searchQuerySplit) {
            if (!query || query.length < 1) continue;
            isFiltered = isFiltered && isSearchFilter(query);
          }
        }
        return isFiltered;
      }),
    [
      expenses.length,
      checkedDate,
      startDate,
      endDate,
      searchQuery,
      checkedQuery,
    ]
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
    // console.log("find pressed");
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
      <Animated.ScrollView
        layout={ListLayoutAnimation}
        style={styles.container}
      >
        <View style={[styles.cardContainer, GlobalStyles.wideStrongShadow]}>
          <Text style={styles.titleText}>{i18n.t("finderTitle")}</Text>
          <Animated.ScrollView
            layout={ListLayoutAnimation}
            style={{ flex: 1, minHeight: "50% " }}
          >
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
                menuStyle={styles.autoCompleteMenuStyle}
              ></Autocomplete>
              {checkedQuery && (
                <IconButton
                  icon="close-outline"
                  size={moderateScale(26)}
                  color={GlobalStyles.colors.textColor}
                  buttonStyle={{ marginTop: verticalScale(14) }}
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
                  color={GlobalStyles.colors.textColor}
                  size={moderateScale(26)}
                  buttonStyle={{ marginTop: verticalScale(14) }}
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
      </Animated.ScrollView>
      {/* <BlurPremium /> */}
    </>
  );
};

export default FinderScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // margin: "4%",
    padding: scale(20),
    backgroundColor: GlobalStyles.colors.backgroundColor,
  },
  cardContainer: {
    flex: 1,
    backgroundColor: GlobalStyles.colors.backgroundColorLight,
    borderRadius: moderateScale(20),
    padding: scale(20),
    justifyContent: "space-around",
  },
  checkBoxContainer: {
    borderRadius: moderateScale(99),
    marginRight: scale(8),
    marginTop: verticalScale(20),
    ...Platform.select({
      ios: { borderWidth: 1 },
    }),
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    minHeight: verticalScale(90),
  },
  rowContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    minHeight: verticalScale(90),
  },
  titleText: {
    fontSize: moderateScale(32),
    fontWeight: "bold",
    paddingBottom: verticalScale(12),
    color: GlobalStyles.colors.textColor,
    // center
    textAlign: "center",
  },
  queryText: {
    fontSize: moderateScale(16),
    marginTop: verticalScale(65),

    marginBottom: verticalScale(18),
    //center
    textAlign: "center",
    // thin text
    fontWeight: "200",
    //cursive
    fontStyle: "italic",
  },
  findButton: {
    marginHorizontal: scale(65),
    borderRadius: 99,
  },
  queryContainer: {
    flex: 1,
    marginTop: verticalScale(10),

    marginLeft: scale(18),
    maxWidth: scale(180),
  },
  autoCompleteStyle: {
    // flex: 1,
    zIndex: 0,
    fontSize: moderateScale(16, 0.4),
    paddingVertical: moderateScale(2, 2),
    paddingHorizontal: scale(2),
    backgroundColor: GlobalStyles.colors.backgroundColorLight,
    borderRadius: moderateScale(5),
    // marginLeft: -8,
  },
  autoCompleteMenuStyle: {
    zIndex: 0,
    marginLeft: scale(8),
    marginBottom: verticalScale(-1),
  },
});
