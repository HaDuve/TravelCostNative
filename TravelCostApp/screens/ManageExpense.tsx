import { useContext, useEffect, useLayoutEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, StyleSheet, View } from "react-native";
import React from "react";
import { ScrollView } from "react-native";
import ExpenseForm from "../components/ManageExpense/ExpenseForm";

import IconButton from "../components/UI/IconButton";
import LoadingOverlay from "../components/UI/LoadingOverlay";
import { AuthContext } from "../store/auth-context";
import { ExpensesContext } from "../store/expenses-context";
import { TripContext } from "../store/trip-context";
import { UserContext } from "../store/user-context";
import { touchAllTravelers } from "../util/http";
import { GlobalStyles } from "../constants/styles";
import { getRate } from "../util/currencyExchange";
import { daysBetween, getDatePlusDays } from "../util/date";
import {
  deleteExpenseOnlineOffline,
  OfflineQueueManageExpenseItem,
  storeExpenseOnlineOffline,
  updateExpenseOnlineOffline,
} from "../util/offline-queue";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr } from "../i18n/supportedLanguages";
import { getCatString } from "../util/category";
import PropTypes from "prop-types";
const i18n = new I18n({ en, de, fr });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

const ManageExpense = ({ route, navigation }) => {
  const { pickedCat, tempValues, newCat } = route.params;

  const [isSubmitting, setIsSubmitting] = useState(false);
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
    const checkOnline = async () => await userCtx.checkConnectionUpdateUser();
    checkOnline();
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
        const item: OfflineQueueManageExpenseItem = {
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
    console.log("confirmHandler ~ expenseData:", expenseData);
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

      // if expenseData has a splitlist, add the rate to each split
      if (expenseData.splitList && expenseData.splitList.length > 0) {
        expenseData.splitList.forEach((split) => {
          split.rate = rate;
        });
      }

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
        if (
          expenseData.startDate.toString().slice(0, 10) !==
          expenseData.endDate.toString().slice(0, 10)
        ) {
          console.log("ranged Data detected");
          Alert.alert(
            "Ranged Dates",
            "Updating Expenses over multiple days is not supported yet."
          );
          setIsSubmitting(false);
          return;
        }
        const item: OfflineQueueManageExpenseItem = {
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
        if (
          expenseData.startDate.toString().slice(0, 10) !==
          expenseData.endDate.toString().slice(0, 10)
        ) {
          console.log("ranged Data detected");
          // get number of days
          const day1 = new Date(expenseData.startDate);
          const day2 = new Date(expenseData.endDate);
          const days = daysBetween(day2, day1);

          // get correct amount
          if (expenseData.duplOrSplit === 0) {
            Alert.alert("wrong duplOrSplit value");
            return;
          }
          // 0 is null, 1 is dupl (default), 2 is split
          if (expenseData.duplOrSplit === 2) {
            const splitCalcAmount = expenseData.calcAmount / (days + 1);
            expenseData.calcAmount = Number(splitCalcAmount).toFixed(2);
            const splitAmount = expenseData.amount / (days + 1);
            expenseData.amount = Number(splitAmount).toFixed(2);
          }

          // iterate over number of days between and change date and endDate to the first date + iterator
          for (let i = 0; i <= days; i++) {
            console.log("day nr: ", i);
            const newDate = getDatePlusDays(day1, i);
            newDate.setHours(new Date().getHours(), new Date().getMinutes());
            expenseData.startDate =
              expenseData.date =
              expenseData.endDate =
                newDate;
            const id = await storeExpenseOnlineOffline(item, userCtx.isOnline);
            expenseCtx.addExpense({ ...expenseData, id: id });
          }
        } else {
          console.log("no ranged Data detected");
          // hotfix the date clock bug
          expenseData.date = expenseData.startDate;

          const item: OfflineQueueManageExpenseItem = {
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
      if (userCtx.isOnline) await touchAllTravelers(tripid, true);
      await expenseCtx.saveExpensesInStorage(expenseCtx.expenses);
      navigation.navigate("RecentExpenses");
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

ManageExpense.propTypes = {
  navigation: PropTypes.object,
  route: PropTypes.object,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GlobalStyles.colors.backgroundColor,
  },
  deleteContainer: {
    paddingTop: "2%",
    marginBottom: "15%",
    alignItems: "center",
  },
});