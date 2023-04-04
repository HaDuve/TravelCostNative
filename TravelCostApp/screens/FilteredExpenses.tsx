import { StyleSheet, Text, View } from "react-native";
import React from "react";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr } from "../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

import ExpensesOutput from "../components/ExpensesOutput/ExpensesOutput";
import FlatButton from "../components/UI/FlatButton";
import { GlobalStyles } from "../constants/styles";
import Toast from "react-native-toast-message";
import PropTypes from "prop-types";

const FilteredExpenses = ({ route, navigation }) => {
  const { expenses, dayString, showSumForTravellerName } = route.params;
  // show error Toast if no data is passed
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
      <View style={styles.titleContainer}>
        <Text style={styles.titleText}>{dayString}</Text>
      </View>
      <View style={styles.shadow}></View>
      <ExpensesOutput
        expenses={expenses}
        showSumForTravellerName={showSumForTravellerName}
      />
      <FlatButton onPress={() => navigation.pop()}>{i18n.t("back")}</FlatButton>
    </View>
  );
};

export default FilteredExpenses;

FilteredExpenses.propTypes = {
  route: PropTypes.object.isRequired,
  navigation: PropTypes.object.isRequired,
  showSumForTravellerName: PropTypes.string,
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
  },
  titleContainer: {
    marginVertical: "4%",
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