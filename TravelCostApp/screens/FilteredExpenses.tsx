import { StyleSheet, Text, View } from "react-native";
import React from "react";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr, ru } from "../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

import ExpensesOutput from "../components/ExpensesOutput/ExpensesOutput";
import FlatButton from "../components/UI/FlatButton";
import { GlobalStyles } from "../constants/styles";
import Toast from "react-native-toast-message";
import PropTypes from "prop-types";
import BackButton from "../components/UI/BackButton";

const FilteredExpenses = ({
  route,
  navigation,
  expensesAsArg,
  dayStringAsArg,
}) => {
  const { expenses, dayString, showSumForTravellerName } = expensesAsArg
    ? {
        expenses: expensesAsArg,
        dayString: dayStringAsArg,
        showSumForTravellerName: false,
      }
    : route.params;
  const withArgs = expensesAsArg ? true : false;

  if (!expenses || expenses.length < 1) {
    Toast.show({
      type: "error",
      text1: `${i18n.t("noExpensesText")} ${dayString}`,
      visibilityTime: 1000,
    });
    navigation.pop();
    return <></>;
  }
  return (
    <View style={styles.container}>
      {!withArgs && (
        <>
          <View style={styles.titleContainer}>
            <BackButton
              style={{ marginTop: -14, marginBottom: 0, padding: 4 }}
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
      {!withArgs && (
        <FlatButton onPress={() => navigation.pop()}>
          {i18n.t("back")}
        </FlatButton>
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
