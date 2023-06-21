import { StyleSheet, Text, View } from "react-native";
import React, { useContext } from "react";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr, ru } from "../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

import GradientButton from "../components/UI/GradientButton";
import { TripContext } from "../store/trip-context";
import { useNavigation } from "@react-navigation/native";
import { UserContext } from "../store/user-context";
import Image from "react-native";
import { Ionicons } from "@expo/vector-icons";
import CategoryProgressBar from "../components/ExpensesOutput/ExpenseStatistics/CategoryProgressBar";
import { GlobalStyles } from "../constants/styles";
import { ExpensesContext } from "../store/expenses-context";

const FinancialScreen = () => {
  const navigation = useNavigation();
  const tripCtx = useContext(TripContext);
  const userCtx = useContext(UserContext);
  const expCtx = useContext(ExpensesContext);
  const totalBudgetNum = Number(tripCtx.totalBudget);
  const expensesSum = expCtx.expenses.reduce((sum, expense) => {
    // only sum expenses up to today
    if (expense.date > new Date()) return sum;
    return sum + expense.calcAmount;
  }, 0);
  const startDate = new Date(tripCtx.startDate);
  const endDate = new Date(tripCtx.endDate);
  const today = new Date();
  const daysInTrip =
    (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24);
  const daysFromStartToToday = (
    (today.getTime() - startDate.getTime()) /
    (1000 * 3600 * 24)
  ).toFixed(0);

  // calculate total budget // number of days in the trip * number of days from the beginning to today
  console.log("expensesSum ~ expensesSum:", expensesSum);

  const restCash =
    Number(daysFromStartToToday) * Number(tripCtx.dailyBudget) - expensesSum;
  tripCtx.setTotalSum(expensesSum);
  const multiTraveller =
    tripCtx.travellers && tripCtx.travellers.length > 1 ? true : false;
  // if (restCash < 0) restCash = 0;
  console.log("FinancialScreen ~ restCash:", restCash);
  return (
    <View style={styles.container}>
      <Text>Financial Overview</Text>
      <View style={styles.progressBar}>
        <CategoryProgressBar
          cat="Gönner Geld"
          color={GlobalStyles.colors.primaryGrayed}
          totalCost={totalBudgetNum}
          catCost={restCash}
          iconOverride="fast-food-outline"
        />
      </View>

      {/* <Ionicons name="wallet-outline" size={200} color="black" /> */}

      <GradientButton
        colors={GlobalStyles.gradientAccentButton}
        darkText
        onPress={async () => {
          navigation.navigate("SplitSummary", { tripid: tripCtx.tripid });
        }}
        style={styles.button}
      >
        {i18n.t("simplifySplitsLabel")}
      </GradientButton>
    </View>
  );
};

export default FinancialScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 20,
    // justifyContent: "center",
    alignItems: "center",
  },
  button: {
    margin: 20,
  },
  progressBar: {
    width: "100%",
    height: 100,
    marginVertical: 20,
  },
});
