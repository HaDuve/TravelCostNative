import { StyleSheet, Text, View } from "react-native";
import React from "react";

import { i18n } from "../i18n/i18n";

import ExpensesOutput from "../components/ExpensesOutput/ExpensesOutput";
import { GlobalStyles } from "../constants/styles";
import PropTypes from "prop-types";
import BackButton from "../components/UI/BackButton";
import BlurPremium from "../components/Premium/BlurPremium";
import FlatButton from "../components/UI/FlatButton";
import { useNavigation } from "@react-navigation/native";
import AddExpenseHereButton from "../components/UI/AddExpensesHereButton";
import { getEarliestDate } from "../util/date";
import { ExpenseData } from "../util/expense";

const FilteredExpenses = ({ route, expensesAsArg, dayStringAsArg }) => {
  const { expenses, dayString, showSumForTravellerName } = expensesAsArg
    ? {
        expenses: expensesAsArg,
        dayString: dayStringAsArg,
        showSumForTravellerName: "",
      }
    : route.params;
  const withArgs = expensesAsArg ? true : false;
  const navigation = useNavigation();
  const earliestDate = getEarliestDate(
    expenses.map((exp: ExpenseData) => exp.date)
  );
  // ||new Date(dayString).toISOString();

  // if (!expenses || expenses?.length < 1) {
  //   Toast.show({
  //     type: "error",
  //     text1: `${i18n.t("noExpensesText")} ${dayString}`,
  //     visibilityTime: 1000,
  //   });
  //   navigation?.pop();
  //   return <>{}</>;
  // }
  return (
    <View style={styles.container}>
      {!withArgs && (
        <>
          <View style={styles.titleContainer}>
            <BackButton
              style={{ marginTop: -20, marginBottom: 0, padding: 4 }}
            ></BackButton>
            <Text style={styles.titleText}>{dayString}</Text>
          </View>

          <View style={styles.shadow}></View>
        </>
      )}
      <ExpensesOutput
        expenses={expenses}
        showSumForTravellerName={showSumForTravellerName}
        isFiltered
      />
      {/* <BlurPremium canBack /> */}
      {!withArgs && (
        <View style={{ flexDirection: "row" }}>
          <FlatButton onPress={() => navigation.pop()}>
            {i18n.t("back")}
          </FlatButton>
          <AddExpenseHereButton dayISO={earliestDate} />
        </View>
      )}
    </View>
  );
};

export default FilteredExpenses;

FilteredExpenses.propTypes = {
  route: PropTypes.object,
  navigation: PropTypes.object,
  showSumForTravellerName: PropTypes.string,
  expensesAsArg: PropTypes.array,
  dayStringAsArg: PropTypes.string,
};

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
    width: "80%",
  },
  titleContainer: {
    marginVertical: "4%",
    flexDirection: "row",
  },
  shadow: {
    borderTopWidth: 1,
    borderBottomWidth: 0,
    borderTopColor: GlobalStyles.colors.gray600,
    borderBottomColor: GlobalStyles.colors.gray600,
    minHeight: 1,
    backgroundColor: GlobalStyles.colors.backgroundColor,
    elevation: 2,
    shadowColor: GlobalStyles.colors.textColor,
    shadowOffset: { width: 1, height: 2.5 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
    zIndex: 2,
  },
});
