import { StyleSheet, Text, View } from "react-native";
import React, { useContext, useEffect, useRef, useState } from "react";
import DatePickerModal from "../components/UI/DatePickerModal";
import DatePickerContainer from "../components/UI/DatePickerContainer";
import { getFormattedDate, toShortFormat } from "../util/date";
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
import { Searchbar } from "react-native-paper";
import GradientButton from "../components/UI/GradientButton";
import { ExpensesContext } from "../store/expenses-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import BackButton from "../components/UI/BackButton";
import { Checkbox } from "react-native-paper";
import {
  asyncStoreGetItem,
  asyncStoreGetObject,
  asyncStoreSetItem,
  asyncStoreSetObject,
} from "../store/async-storage";
import { GlobalStyles } from "../constants/styles";
import IconButton from "../components/UI/IconButton";
import { get } from "react-native/Libraries/TurboModule/TurboModuleRegistry";
import { UserContext } from "../store/user-context";
import { Toast } from "react-native-toast-message/lib/src/Toast";
import { BlurView } from "expo-blur";
import Animated from "react-native-reanimated";
import BlurPremium from "../components/Premium/BlurPremium";

const FinderScreen = () => {
  const navigation = useNavigation();
  const expenseCtx = useContext(ExpensesContext);
  const userCtx = useContext(UserContext);

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
  // console.log("FinderScreen ~ checkedQuery:", checkedQuery);
  const [checkedDate, setCheckedDate] = React.useState(false);
  // console.log("FinderScreen ~ checkedDate:", checkedDate);

  const [showDatePickerRange, setShowDatePickerRange] = useState(false);
  const [startDate, setStartDate] = useState(getFormattedDate(DateTime.now()));
  const [endDate, setEndDate] = useState(getFormattedDate(DateTime.now()));
  const dateOtherThanToday = startDate !== getFormattedDate(DateTime.now());
  const openDatePickerRange = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowDatePickerRange(true);
  };
  const onCancelRange = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowDatePickerRange(false);
  };
  const onConfirmRange = (output) => {
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
  };
  const datepickerJSX = DatePickerModal({
    showDatePickerRange,
    onCancelRange,
    onConfirmRange,
  });
  const dateIsRanged =
    startDate?.toString().slice(0, 10) !== endDate?.toString().slice(0, 10);
  const [searchQuery, setSearchQuery] = React.useState("");
  // const [debouncedSearchQuery] = useDebounce(searchQuery, 500, {
  //   leading: true,
  // });

  const onChangeSearch = (query) => {
    setSearchQuery(query);
    setCheckedQuery(true);
    if (query === "") {
      setCheckedQuery(false);
    }
  };

  const expenses = expenseCtx.expenses;
  const filteredExpenses = expenses.filter((expense) => {
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
        expenseCurrencyIsInSearchQuery ||
        expenseCountryIsInSearchQuery ||
        expenseTravellerIsInSearchQuery)
    );
  });

  const queryString = checkedQuery ? searchQuery : "";
  const dateString = checkedDate
    ? DateTime.fromISO(startDate).toLocaleString() +
      " - " +
      DateTime.fromISO(endDate).toLocaleString()
    : "";

  const findPressedHandler = () => {
    console.log("find pressed");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("FilteredPieCharts", {
      expenses: filteredExpenses,
      dayString: queryString + " " + dateString,
    });
  };

  const numberOfResults = filteredExpenses?.length;
  const foundResults = filteredExpenses?.length > 0 ? true : false;

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
      } catch (err) {
        console.log(err);
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
      } catch (err) {
        console.log(err);
        setHasLoaded(true);
      }
    };
    loadData();
  }, []);
  const searchRef = useRef(null);

  return (
    <>
      {datepickerJSX}
      <View style={styles.container}>
        <View style={[styles.cardContainer, GlobalStyles.wideStrongShadow]}>
          <Text style={styles.titleText}>{i18n.t("finderTitle")}</Text>
          <View style={styles.rowContainer}>
            <View style={{ borderWidth: 1, borderRadius: 99, marginRight: 8 }}>
              <Checkbox
                status={checkedQuery ? "checked" : "unchecked"}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setCheckedQuery(!checkedQuery);
                }}
              />
            </View>
            <Searchbar
              placeholder={i18n.t("search")}
              ref={searchRef}
              onIconPress={() => {
                //focus searchbar
                searchRef.current.focus();
              }}
              onFocus={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              onChangeText={onChangeSearch}
              value={searchQuery}
              style={{ width: "80%" }}
            />
          </View>
          <View style={styles.rowContainer}>
            <View style={{ borderWidth: 1, borderRadius: 99, marginRight: -8 }}>
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
                buttonStyle={{ marginLeft: "8%" }}
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
      </View>
      <BlurPremium />
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
    backgroundColor: "white",
    borderRadius: 20,
    padding: "8%",
    justifyContent: "space-around",
  },

  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    minHeight: 90,
  },
  rowContainer: {
    flexDirection: "row",
    alignItems: "center",
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
  },
});
