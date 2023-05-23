import { StyleSheet, Text, View } from "react-native";
import React, { useContext, useState } from "react";
import DatePickerModal from "../components/UI/DatePickerModal";
import DatePickerContainer from "../components/UI/DatePickerContainer";
import { getFormattedDate } from "../util/date";
import { DateTime } from "luxon";
import * as Haptics from "expo-haptics";
import { Searchbar } from "react-native-paper";
import GradientButton from "../components/UI/GradientButton";
import { ExpensesContext } from "../store/expenses-context";
import uniqBy from "lodash.uniqby";
import { useNavigation } from "@react-navigation/native";

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
    const expenseDateIsInRange =
      expenseDate >= startDate && expenseDate <= endDate;
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
    const expenseTravellerIsInSearchQuery = expense.traveller
      ?.toLowerCase()
      .includes(searchQuery?.toLowerCase());

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

  const findPressedHandler = () => {
    console.log("find pressed");
    navigation.navigate("FilteredPieCharts", {
      expenses: filteredExpenses,
      dayString: "Finder",
    });
  };

  console.log("FinderScreen ~ expenses:", expenses?.length);
  console.log("filteredExpenses ~ filteredExpenses:", filteredExpenses?.length);

  return (
    <View style={styles.container}>
      {datepickerJSX}
      <Text style={styles.titleText}>Finder</Text>
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
        FIND
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
