import { StyleSheet, Text, View } from "react-native";
import React, { useContext, useState } from "react";
import DatePickerModal from "../components/UI/DatePickerModal";
import DatePickerContainer from "../components/UI/DatePickerContainer";
import { getFormattedDate, toShortFormat } from "../util/date";
import { DateTime } from "luxon";
import * as Haptics from "expo-haptics";
import { Searchbar } from "react-native-paper";
import GradientButton from "../components/UI/GradientButton";
import { ExpensesContext } from "../store/expenses-context";
import uniqBy from "lodash.uniqby";
import { useNavigation } from "@react-navigation/native";
import BackButton from "../components/UI/BackButton";
import { Checkbox } from "react-native-paper";
import { useDebounce } from "use-debounce";

const FinderScreen = () => {
  const navigation = useNavigation();
  const expenseCtx = useContext(ExpensesContext);
  const [checkedQuery, setCheckedQuery] = React.useState(false);
  console.log("FinderScreen ~ checkedQuery:", checkedQuery);
  const [checkedDate, setCheckedDate] = React.useState(false);
  console.log("FinderScreen ~ checkedDate:", checkedDate);

  const [showDatePickerRange, setShowDatePickerRange] = useState(false);
  const [startDate, setStartDate] = useState(getFormattedDate(DateTime.now()));
  const [endDate, setEndDate] = useState(getFormattedDate(DateTime.now()));
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
  };
  const datepickerJSX = DatePickerModal({
    showDatePickerRange,
    onCancelRange,
    onConfirmRange,
  });
  const dateIsRanged =
    startDate?.toString().slice(0, 10) !== endDate?.toString().slice(0, 10);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [debouncedSearchQuery] = useDebounce(searchQuery, 750);

  const onChangeSearch = (query) => {
    setSearchQuery(query);
    setCheckedQuery(true);
    if (query === "") {
      setCheckedQuery(false);
    }
  };

  const expenses = uniqBy(expenseCtx.expenses, "id");
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
      .includes(debouncedSearchQuery?.toLowerCase());
    const expenseCategoryIsInSearchQuery = expense.category
      ?.toLowerCase()
      .includes(debouncedSearchQuery?.toLowerCase());
    const expenseCurrencyIsInSearchQuery = expense.currency
      ?.toLowerCase()
      .includes(debouncedSearchQuery?.toLowerCase());
    const expenseCountryIsInSearchQuery = expense.country
      ?.toLowerCase()
      .includes(debouncedSearchQuery?.toLowerCase());
    const expenseTravellerIsInSearchQuery =
      // return true if searchQuery?.toLowerCase() is in expense.splitList
      expense.splitList?.some((split) => {
        const travellerName = split.userName;
        return travellerName
          ?.toLowerCase()
          .includes(debouncedSearchQuery?.toLowerCase());
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
    navigation.navigate("FilteredPieCharts", {
      expenses: filteredExpenses,
      dayString: queryString + " " + dateString,
    });
  };

  const numberOfResults = filteredExpenses?.length;
  const foundResults = filteredExpenses?.length > 0 ? true : false;
  return (
    <>
      {datepickerJSX}
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <BackButton></BackButton>
          <Text style={styles.titleText}>Finder</Text>
        </View>
        <View style={styles.rowContainer}>
          <View style={{ borderWidth: 1, borderRadius: 99, marginRight: 8 }}>
            <Checkbox
              status={checkedQuery ? "checked" : "unchecked"}
              onPress={() => {
                setCheckedQuery(!checkedQuery);
              }}
            />
          </View>
          <Searchbar
            placeholder="Search"
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
                setCheckedDate(!checkedDate);
              }}
            />
          </View>
          {DatePickerContainer({
            openDatePickerRange,
            startDate,
            endDate,
            dateIsRanged,
          })}
        </View>
        <Text style={styles.queryText}>
          Finding :{queryString} {dateString}
        </Text>
        <GradientButton
          onPress={() => findPressedHandler()}
          style={styles.findButton}
        >
          {foundResults ? `Show ${numberOfResults} Results` : "No Results"}
        </GradientButton>
      </View>
    </>
  );
};

export default FinderScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: "4%",
    padding: "4%",
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
    fontSize: 24,
    marginLeft: "20%",
    fontWeight: "bold",
    marginBottom: "2%",
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
