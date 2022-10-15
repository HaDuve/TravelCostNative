import { StyleSheet, Text, View } from "react-native";
import React, { useState } from "react";
import ExpenseCategories from "./ExpenseStatistics/ExpenseCategories";
import IconButton from "../UI/IconButton";
import ExpenseGraph from "./ExpenseStatistics/ExpenseGraph";
import { GlobalStyles } from "../../constants/styles";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de } from "../../i18n/supportedLanguages";
const i18n = new I18n({ en, de });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

const ExpensesOverview = ({ expenses, periodName }) => {
  const [toggleGraph, setToggleGraph] = useState(false);
  function toggleContent() {
    setToggleGraph(!toggleGraph);
  }

  let titleString = "";
  switch (periodName) {
    case "total":
      titleString = i18n.t("overview");
      break;
    default:
      // convert day into days etc. for localization
      titleString = `${i18n.t("last")} ${i18n.t(periodName + "s")}`;
      break;
  }

  return (
    <View style={styles.container}>
      <View>
        {!toggleGraph && <Text style={styles.titleText}> {titleString}</Text>}
        {toggleGraph && (
          <Text style={styles.titleText}> {i18n.t("categories")} </Text>
        )}
      </View>

      {toggleGraph && (
        <ExpenseCategories expenses={expenses} periodName={periodName} />
      )}
      {!toggleGraph && (
        <ExpenseGraph expenses={expenses} periodName={periodName} />
      )}
      <View style={[styles.addButton, styles.toggleButton]}>
        <IconButton
          icon="toggle"
          size={48}
          color={GlobalStyles.colors.primary700}
          onPress={toggleContent}
          rotate={toggleGraph ? true : false}
          imageNumber={1}
        />
      </View>
      <View style={styles.tempGrayBar2}></View>
    </View>
  );
};

export default ExpensesOverview;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toggleButton: {
    marginTop: -50,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: GlobalStyles.colors.backgroundColor,
    borderWidth: 2,
    borderColor: GlobalStyles.colors.gray500Accent,
    padding: 4,
  },
  titleText: {
    paddingTop: 20,
    paddingRight: 20,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold",
  },
  tempGrayBar2: {
    borderTopWidth: 1,
    borderTopColor: GlobalStyles.colors.gray600,
    minHeight: 16,
    backgroundColor: GlobalStyles.colors.gray500,
  },
  addButton: {
    // backgroundColor: GlobalStyles.colors.primary400,
    flex: 0,
    borderRadius: 999,
    marginHorizontal: 150,
    marginBottom: -16,
    marginTop: -48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
});
