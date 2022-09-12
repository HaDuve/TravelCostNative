import { StyleSheet, Text, View } from "react-native";
import React, { useState } from "react";
import ExpenseCategories from "./ExpenseStatistics/ExpenseCategories";
import IconButton from "../UI/IconButton";
import ExpenseGraph from "./ExpenseStatistics/ExpenseGraph";
import { GlobalStyles } from "../../constants/styles";

const ExpensesOverview = ({ expenses }) => {
  const [toggleGraph, setToggleGraph] = useState(false);
  function toggleContent() {
    setToggleGraph(!toggleGraph);
  }

  return (
    <View style={styles.container}>
      <View>
        {!toggleGraph && <Text style={styles.titleText}> Categories</Text>}
        {toggleGraph && <Text style={styles.titleText}> Last Months </Text>}
      </View>
      <View style={styles.toggleButton}>
        <IconButton
          icon="toggle"
          size={48}
          color={GlobalStyles.colors.primary500}
          onPress={toggleContent}
          rotate={toggleGraph ? true : false}
        />
      </View>
      {!toggleGraph && <ExpenseCategories expenses={expenses} />}
      {toggleGraph && <ExpenseGraph expenses={expenses} />}
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
