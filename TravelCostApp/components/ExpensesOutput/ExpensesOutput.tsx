import { Dimensions, StyleSheet, Text, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";

import { GlobalStyles } from "../../constants/styles";
import ExpensesList from "./ExpensesList";
import React from "react-native";
import Animated, { SlideOutLeft } from "react-native-reanimated";
import LoadingOverlay from "../UI/LoadingOverlay";
import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { EXPENSES_LOAD_TIMEOUT } from "../../confAppConstants";
import { memo } from "react";
import LoadingBarOverlay from "../UI/LoadingBarOverlay";

function ExpensesOutput({
  expenses,
  fallbackText,
  refreshControl,
  showSumForTravellerName,
  isFiltered,
}) {
  const [showLoading, setShowLoading] = useState(true);
  const [fallback, setFallback] = useState(true);
  useEffect(() => {
    setTimeout(() => setShowLoading(false), EXPENSES_LOAD_TIMEOUT);
  }, []);

  // const toggleLoading = () => setShowLoading((prev) => !prev);
  const loadingSpinner = (
    <View
      style={{
        position: "absolute",
        width: Dimensions.get("window").width,
        height: 60,
        alignItems: "center",
        justifyContent: "center",
        paddingTop: 4,
        marginTop: "12%",
      }}
    >
      <LoadingBarOverlay></LoadingBarOverlay>
    </View>
  );
  let content = (
    <Animated.View exiting={SlideOutLeft} style={styles.fallbackContainer}>
      <View style={styles.fallbackInnerContainer}>
        {showLoading && <LoadingOverlay></LoadingOverlay>}
        {!showLoading && <Text style={styles.infoText}>{fallbackText}</Text>}
      </View>
    </Animated.View>
  );
  if (expenses.length > 0) {
    setFallback(false);
    content = (
      <ExpensesList
        expenses={expenses}
        showSumForTravellerName={showSumForTravellerName}
        isFiltered={isFiltered}
      />
    );
  }
  return (
    <View style={{ flex: 1 }}>
      {loadingSpinner}
      <ScrollView style={styles.container} refreshControl={refreshControl}>
        <View>{content}</View>
      </ScrollView>
    </View>
  );
}

export default ExpensesOutput;
export const MemoizedExpensesOutput = memo(ExpensesOutput);

ExpensesOutput.propTypes = {
  expenses: PropTypes.array,
  fallbackText: PropTypes.string,
  refreshControl: PropTypes.object,
  showSumForTravellerName: PropTypes.string,
  isFiltered: PropTypes.bool,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 0,
    paddingBottom: 0,
    // backgroundColor: GlobalStyles.colors.backgroundColor,
    // borderWidth: 1,
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    // borderWidth: 1,
    margin: "10%",
  },
  fallbackInnerContainer: {
    backgroundColor: GlobalStyles.colors.backgroundColor,
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
