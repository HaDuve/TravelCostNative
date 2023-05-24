import { StyleSheet, Text, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";

import { GlobalStyles } from "../../constants/styles";
import ExpensesList from "./ExpensesList";
import React from "react-native";
import Animated, { SlideOutLeft } from "react-native-reanimated";
import LoadingOverlay from "../UI/LoadingOverlay";
import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { EXPENSES_LOAD_TIMEOUT } from "../../confAppConstants";

function ExpensesOutput({
  expenses,
  fallbackText,
  refreshControl,
  periodValue,
  showSumForTravellerName,
  isFiltered,
}) {
  // console.log("rerender ExpensesOutput - B");
  const [showLoading, setShowLoading] = useState(true);
  useEffect(() => {
    setTimeout(toggleLoading, EXPENSES_LOAD_TIMEOUT);
  }, []);

  const toggleLoading = () => setShowLoading((prev) => !prev);

  let content = (
    <Animated.View exiting={SlideOutLeft} style={styles.fallbackContainer}>
      {showLoading && <LoadingOverlay></LoadingOverlay>}
      {!showLoading && <Text style={styles.infoText}>{fallbackText}</Text>}
    </Animated.View>
  );
  if (expenses.length > 0) {
    content = (
      <ExpensesList
        periodValue={periodValue}
        expenses={expenses}
        showSumForTravellerName={showSumForTravellerName}
        isFiltered={isFiltered}
      />
    );
  }
  return (
    <ScrollView style={styles.container} refreshControl={refreshControl}>
      <View>{content}</View>
    </ScrollView>
  );
}

export default ExpensesOutput;

ExpensesOutput.propTypes = {
  expenses: PropTypes.array,
  fallbackText: PropTypes.string,
  refreshControl: PropTypes.object,
  periodValue: PropTypes.string,
  showSumForTravellerName: PropTypes.string,
  isFiltered: PropTypes.bool,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 0,
    paddingBottom: 0,
    backgroundColor: GlobalStyles.colors.backgroundColor,
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: "12%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "center",
  },
  infoText: {
    color: GlobalStyles.colors.textColor,
    fontSize: 16,
    textAlign: "center",
    marginTop: 32,
  },
});
