import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { StyleSheet, Text, View } from "react-native";

//Localization

import ExpensesOutput from "../components/ExpensesOutput/ExpensesOutput";
import AddExpenseHereButton from "../components/UI/AddExpensesHereButton";
import BackButton from "../components/UI/BackButton";
import FlatButton from "../components/UI/FlatButton";
import { GlobalStyles } from "../constants/styles";
import { de, en, fr, ru } from "../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale =
  Localization.getLocales()[0] && Localization.getLocales()[0].languageCode
    ? Localization.getLocales()[0].languageCode.slice(0, 2)
    : "en";
i18n.enableFallback = true;
// i18n.locale = "en";

import { useNavigation } from "@react-navigation/native";

import { RootNavigationProp } from "../types/navigation";
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
  const navigation = useNavigation<RootNavigationProp>();
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
        fallbackText=""
        refreshControl={<></>}
        refreshing={false}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: "1%",
    // center the content
    justifyContent: "center",
  },
  shadow: {
    backgroundColor: GlobalStyles.colors.backgroundColor,
    borderBottomColor: GlobalStyles.colors.gray600,
    borderBottomWidth: 0,
    borderTopColor: GlobalStyles.colors.gray600,
    borderTopWidth: 1,
    elevation: 2,
    minHeight: 1,
    shadowColor: GlobalStyles.colors.textColor,
    shadowOffset: { width: 1, height: 2.5 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
    zIndex: 2,
  },
  titleContainer: {
    flexDirection: "row",
    marginVertical: "4%",
  },
  titleText: {
    fontSize: 20,
    fontWeight: "bold",
    color: GlobalStyles.colors.textColor,
    // center text
    textAlign: "center",
    width: "80%",
  },
});
