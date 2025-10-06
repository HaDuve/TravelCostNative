import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { useContext } from "react";
import { StyleSheet, Text, View } from "react-native";

//Localization

import CategoryProgressBar from "../components/ExpensesOutput/ExpenseStatistics/CategoryProgressBar";
import GradientButton from "../components/UI/GradientButton";
import { GlobalStyles } from "../constants/styles";
import { de, en, fr, ru } from "../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale =
  Localization.getLocales()[0] && Localization.getLocales()[0].languageCode
    ? Localization.getLocales()[0].languageCode.slice(0, 2)
    : "en";
i18n.enableFallback = true;
// i18n.locale = "en";

import { ExpensesContext } from "../store/expenses-context";
import { TripContext } from "../store/trip-context";

import { useNavigation } from "@react-navigation/native";

import { RootNavigationProp } from "../types/navigation";

const FinancialScreen = () => {
  const navigation = useNavigation<RootNavigationProp>();
  const tripCtx = useContext(TripContext);
  const expCtx = useContext(ExpensesContext);
  const totalBudgetNum = Number(tripCtx.totalBudget);
  const expensesSum = expCtx.expenses.reduce((sum, expense) => {
    // only sum expenses up to today
    if (expense.date > new Date()) return sum;
    return sum + expense.calcAmount;
  }, 0);
  const startDate = new Date(tripCtx.startDate);
  const today = new Date();
  const daysFromStartToToday = (
    (today.getTime() - startDate.getTime()) /
    (1000 * 3600 * 24)
  ).toFixed(0);

  const restCash =
    Number(daysFromStartToToday) * Number(tripCtx.dailyBudget) - expensesSum;
  tripCtx.setTotalSum(expensesSum);
  return (
    <View style={styles.container}>
      <Text>{i18n.t("financialOverview")}</Text>
      <View style={styles.progressBar}>
        <CategoryProgressBar
          cat="Gönner Geld"
          color={GlobalStyles.colors.primaryGrayed}
          totalCost={totalBudgetNum}
          catCost={restCash}
          iconOverride="fast-food-outline"
          iconJSXOverride={null}
        />
      </View>

      <GradientButton
        colors={GlobalStyles.gradientAccentButton}
        darkText
        onPress={async () => {
          navigation.navigate("SplitSummary", { tripid: tripCtx.tripid });
        }}
        style={styles.button}
        buttonStyle={{}}
      >
        {i18n.t("simplifySplitsLabel")}
      </GradientButton>
    </View>
  );
};

export default FinancialScreen;

const styles = StyleSheet.create({
  button: {
    margin: 20,
  },
  container: {
    flex: 1,
    marginTop: 20,
    // justifyContent: "center",
    alignItems: "center",
  },
  progressBar: {
    height: 100,
    marginVertical: 20,
    width: "100%",
  },
});
