import { StyleSheet, Text, View } from "react-native";
import React from "react";
import ExpensesOutput from "../components/ExpensesOutput/ExpensesOutput";
import FlatButton from "../components/UI/FlatButton";
import { GlobalStyles } from "../constants/styles";

const FilteredExpenses = ({ route, navigation }) => {
  const { expenses, dayString } = route.params;
  console.log("FilteredExpenses ~ expenses", expenses);
  // show fallback if no data is passed
  if (!expenses || expenses.length < 1) {
    return (
      <View style={styles.container}>
        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>No expenses - {dayString}</Text>
        </View>
        <FlatButton onPress={() => navigation.pop()}>Back</FlatButton>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.titleText}>{dayString}</Text>
      </View>
      <ExpensesOutput expenses={expenses}></ExpensesOutput>
      <FlatButton onPress={() => navigation.pop()}>Back</FlatButton>
    </View>
  );
};

export default FilteredExpenses;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: "1%",
    // center the content
    justifyContent: "center",
  },
  titleText: {
    fontSize: 20,
    fontWeight: "bold",
    color: GlobalStyles.colors.textColor,
    // center text
    textAlign: "center",
  },
  titleContainer: {
    marginVertical: "4%",
  },
});