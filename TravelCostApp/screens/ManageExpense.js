import { useContext, useEffect, useLayoutEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import React from "react";
import { ScrollView } from "react-native";
import ExpenseForm from "../components/ManageExpense/ExpenseForm";

import Button from "../components/UI/Button";
import ErrorOverlay from "../components/UI/ErrorOverlay";
import IconButton from "../components/UI/IconButton";
import LoadingOverlay from "../components/UI/LoadingOverlay";
import { AuthContext } from "../store/auth-context";
import { ExpensesContext } from "../store/expenses-context";
import { TripContext } from "../store/trip-context";
import { UserContext } from "../store/user-context";
import {
  deleteExpense,
  storeExpense,
  touchAllTravelers,
  updateExpense,
} from "../util/http";
import { GlobalStyles } from "./../constants/styles";
import { getRate } from "./../util/currencyExchange";
import { daysBetween, getDatePlusDays } from "../util/date";
import {
  deleteExpenseOnlineOffline,
  storeExpenseOnlineOffline,
  updateExpenseOnlineOffline,
} from "../util/offline-queue";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de } from "../i18n/supportedLanguages";
import { getCatString } from "../util/category";
const i18n = new I18n({ en, de });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

const ManageExpense = ({ route, navigation }) => {
  const { pickedCat, tempValues, newCat } = route.params;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState();
  const expenseCtx = useContext(ExpensesContext);
  const authCtx = useContext(AuthContext);
  const tripCtx = useContext(TripContext);
  const userCtx = useContext(UserContext);
  const tripid = tripCtx.tripid;
  const uid = authCtx.uid;

  const editedExpenseId = route.params?.expenseId;
  const isEditing = !!editedExpenseId;

  const selectedExpense = expenseCtx.expenses.find(
    (expense) => expense.id === editedExpenseId
  );
  const selectedExpenseAuthorUid = selectedExpense?.uid;
  //TODO: add tempValues to selected Expense

  useEffect(() => {
    const update = async () => await userCtx.checkConnectionUpdateUser();
    update();
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: isEditing ? i18n.t("editExp") : i18n.t("addExp"),
    });
  }, [navigation, isEditing]);

  async function deleteExpenseHandler() {
    async function deleteExp() {
      setIsSubmitting(true);
      try {
        const item = {
          type: "delete",
          expense: {
            tripid: tripid,
            uid: selectedExpenseAuthorUid,
            id: editedExpenseId,
          },
        };
        navigation.goBack();
        await deleteExpenseOnlineOffline(item, userCtx.isOnline);
        expenseCtx.deleteExpense(editedExpenseId);
        await touchAllTravelers(tripid, true);
      } catch (error) {
        // setError("Could not delete expense - please try again later!");
        console.error(error);
        setIsSubmitting(false);
      }
    }
    Alert.alert(i18n.t("sure"), i18n.t("sureExt"), [
      // The "No" button
      // Does nothing but dismiss the dialog when tapped
      {
        text: i18n.t("no"),
      },
      // The "Yes" button
      {
        text: i18n.t("yes"),
        onPress: () => {
          deleteExp();
        },
      },
    ]);
  }

  function cancelHandler() {
    navigation.goBack();
  }

  async function confirmHandler(expenseData) {
    setIsSubmitting(true);
    try {
      // set the category to the corresponting catstring
      expenseData.categoryString = getCatString(expenseData.category);

      // calc calcAmount from amount, currency and TripCtx.tripCurrency and add it to expenseData
      const base = expenseData.currency;
      const target = tripCtx.tripCurrency;
      const rate = await getRate(base, target);
      const calcAmount = expenseData.amount * rate;
      expenseData.calcAmount = calcAmount;

      // if splitType is SELF, set splitList to empty array []
      if (expenseData.splitType === "SELF") {
        expenseData.splitList = [];
      }

      // keep the splits in the original currency

      // expenseData.splitList?.forEach((split) => {
      //   const calcAmount = split.amount * rate;
      //   split.amount = calcAmount.toFixed(2);
      // });

      if (isEditing) {
        if (expenseData.date.toString() !== expenseData.endDate.toString()) {
          console.log("ranged Data detected");
          Alert.alert(
            "Ranged Data detected",
            "Updating Data with multiple days is not supported yet."
          );
          setIsSubmitting(false);
          return;
        }
        const item = {
          type: "update",
          expense: {
            tripid: tripid,
            uid: selectedExpenseAuthorUid,
            expenseData: expenseData,
            id: editedExpenseId,
          },
        };
        expenseCtx.updateExpense(editedExpenseId, expenseData);
        await updateExpenseOnlineOffline(item, userCtx.isOnline);
      } else {
        const item = {
          type: "add",
          expense: {
            tripid: tripid,
            uid: uid,
            expenseData: expenseData,
          },
        };
        // Check for ranged Expense
        if (expenseData.date.toString() !== expenseData.endDate.toString()) {
          console.log("ranged Data detected");
          // get number of days
          const day1 = new Date(expenseData.date);
          const day2 = new Date(expenseData.endDate);
          const days = daysBetween(day2, day1);
          // iterate over number of days between and change date and endDate to the first date + iterator
          for (let i = 0; i <= days; i++) {
            console.log("day nr: ", i);
            const newDate = getDatePlusDays(day1, i);
            newDate.setHours(new Date().getHours(), new Date().getMinutes());
            expenseData.date = expenseData.endDate = newDate;
            const id = await storeExpenseOnlineOffline(item, userCtx.isOnline);
            expenseCtx.addExpense({ ...expenseData, id: id });
          }
        } else {
          console.log("no ranged Data detected");
          const item = {
            type: "add",
            expense: {
              tripid: tripid,
              uid: uid,
              expenseData: expenseData,
            },
          };
          const id = await storeExpenseOnlineOffline(item, userCtx.isOnline);
          expenseCtx.addExpense({ ...expenseData, id: id });
        }
      }
      navigation.navigate("RecentExpenses");
      await touchAllTravelers(tripid, true);
    } catch (error) {
      // setError("Could not save data - please try again later!" + error);
      console.error(error);
      setIsSubmitting(false);
    }
  }

  // function errorHandler() {
  //   setError(null);
  // }

  // if (error && !isSubmitting) {
  //   return <ErrorOverlay message={error} onConfirm={errorHandler} />;
  // }

  if (isSubmitting) {
    return <LoadingOverlay />;
  }

  return (
    <KeyboardAvoidingView behavior={"height"} style={styles.container}>
      <ScrollView style={styles.container}>
        <>
          <ExpenseForm
            onCancel={cancelHandler}
            onSubmit={confirmHandler}
            pickedCat={pickedCat}
            navigation={navigation}
            isEditing={isEditing}
            submitButtonLabel={isEditing ? i18n.t("update") : i18n.t("add")}
            defaultValues={selectedExpense}
            editedExpenseId={editedExpenseId}
            newCat={newCat}
          />
          {isEditing && (
            <View style={styles.deleteContainer}>
              <IconButton
                icon="trash"
                color={GlobalStyles.colors.error500}
                size={36}
                onPress={deleteExpenseHandler}
              />
            </View>
          )}
        </>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ManageExpense;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GlobalStyles.colors.backgroundColor,
  },
  deleteContainer: {
    marginTop: 16,
    paddingTop: 8,
    marginBottom: "15%",
    alignItems: "center",
  },
});
