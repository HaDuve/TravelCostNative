import { StyleSheet, Text, View } from "react-native";
import React, { useState } from "react";
import ExpenseCategories from "./ExpenseStatistics/ExpenseCategories";
import IconButton from "../UI/IconButton";
import ExpenseGraph from "./ExpenseStatistics/ExpenseGraph";
import { GlobalStyles } from "../../constants/styles";

const ExpensesOverview = ({ expenses, periodName }) => {
  const [toggleGraph, setToggleGraph] = useState(false);
  function toggleContent() {
    setToggleGraph(!toggleGraph);
  }

  let titleString = "";
  switch (periodName) {
    case "total":
      titleString = "Overview";
      break;
    default:
      titleString = `Last ${periodName}s`;
      break;
  }

  return (
    <View style={styles.container}>
      <View>
        {!toggleGraph && <Text style={styles.titleText}> {titleString}</Text>}
        {toggleGraph && <Text style={styles.titleText}> Categories </Text>}
      </View>
      <View style={styles.toggleButton}>
        <IconButton
          icon="toggle"
          size={48}
          color={GlobalStyles.colors.primary700}
          onPress={toggleContent}
          rotate={toggleGraph ? true : false}
        />
      </View>
      {toggleGraph && (
        <ExpenseCategories expenses={expenses} periodName={periodName} />
      )}
      {!toggleGraph && (
        <ExpenseGraph expenses={expenses} periodName={periodName} />
      )}
    </View>
  );
};

export default ExpensesOverview;

const styles = StyleSheet.create({
  container: {
    marginTop: 36,
    flex: 1,
    padding: 4,
    marginHorizontal: 18,
  },
  toggleButton: {
    marginTop: -50,
    flexDirection: "row-reverse",
    justifyContent: "flex-start",
  },
  titleText: {
    paddingTop: 20,
    paddingRight: 20,
    textAlign: "center",
    fontSize: 30,
    fontWeight: "bold",
  },
});
