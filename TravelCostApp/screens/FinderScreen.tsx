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

const FinderScreen = () => {
  const navigation = useNavigation();
  const expenseCtx = useContext(ExpensesContext);
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

  const onChangeSearch = (query) => setSearchQuery(query);

  const expenses = uniqBy(expenseCtx.expenses, "id");
  const filteredExpenses = expenses.filter((expense) => {
    const expenseDate = expense.startDate;
    const expenseDateIsSameDay =
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
      (searchQuery === "" ||
        expenseDescriptionIsInSearchQuery ||
        expenseCategoryIsInSearchQuery ||
        expenseCurrencyIsInSearchQuery ||
        expenseCountryIsInSearchQuery ||
        expenseTravellerIsInSearchQuery)
    );
  });

  const dayStringFromDateQuery =
    (searchQuery ? searchQuery + " : " : "") +
    DateTime.fromISO(startDate).toLocaleString() +
    " - " +
    DateTime.fromISO(endDate).toLocaleString();

  const findPressedHandler = () => {
    console.log("find pressed");
    navigation.navigate("FilteredPieCharts", {
      expenses: filteredExpenses,
      dayString: dayStringFromDateQuery,
    });
  };

  const numberOfResults = filteredExpenses?.length;
  const foundResults = filteredExpenses?.length > 0 ? true : false;
  return (
    <View style={styles.container}>
      {datepickerJSX}
      <View style={{ flexDirection: "row", minHeight: "10%" }}>
        <BackButton></BackButton>
        <Text style={styles.titleText}>Finder</Text>
      </View>
      <Searchbar
        placeholder="Search"
        onChangeText={onChangeSearch}
        value={searchQuery}
      />
      {DatePickerContainer({
        openDatePickerRange,
        startDate,
        endDate,
        dateIsRanged,
      })}
      <GradientButton
        onPress={() => findPressedHandler()}
        style={styles.findButton}
      >
        {foundResults ? `Show ${numberOfResults} Results` : "No Results"}
      </GradientButton>
    </View>
  );
};

export default FinderScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: "4%",
    padding: "4%",
  },
  titleText: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: "2%",
    //center
    textAlign: "center",
  },
  findButton: {
    marginTop: "20%",
    marginHorizontal: "20%",
  },
});
