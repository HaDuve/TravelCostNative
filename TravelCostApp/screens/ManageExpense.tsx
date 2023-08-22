import { useContext, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import React from "react";
import { ScrollView } from "react-native";
import ExpenseForm from "../components/ManageExpense/ExpenseForm";

import IconButton from "../components/UI/IconButton";
import LoadingOverlay from "../components/UI/LoadingOverlay";
import { AuthContext } from "../store/auth-context";
import { ExpensesContext } from "../store/expenses-context";
import { TripContext } from "../store/trip-context";
import { getAllExpenses, touchAllTravelers } from "../util/http";
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
import { en, de, fr, ru } from "../i18n/supportedLanguages";
import { getCatString } from "../util/category";
import PropTypes from "prop-types";
import { ExpenseData } from "../util/expense";
import { useEffect } from "react";
import LoadingBarOverlay from "../components/UI/LoadingBarOverlay";
import { NetworkContext } from "../store/network-context";
import { Toast } from "react-native-toast-message/lib/src/Toast";
import * as Haptics from "expo-haptics";
import { setMMKVObject } from "../store/mmkv";
import { formatExpenseWithCurrency } from "../util/string";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

const ManageExpense = ({ route, navigation }) => {
  const { pickedCat, tempValues, newCat, iconName } = route.params;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const expenseCtx = useContext(ExpensesContext);
  const authCtx = useContext(AuthContext);
  const tripCtx = useContext(TripContext);
  const netCtx = useContext(NetworkContext);
  const [isOnline, setIsOnline] = useState(
    netCtx.isConnected && netCtx.strongConnection
  );
  // console.log("ManageExpense ~ isOnline:", isOnline);
  const [progress, setProgress] = useState(-1);
  const [progressAt, setProgressAt] = useState(0);
  const [progressMax, setProgressMax] = useState(0);

  const tripid = tripCtx.tripid;
  // console.log("ManageExpense ~ tripid:", tripid);
  const uid = authCtx.uid;
  // console.log("ManageExpense ~ uid:", uid);

  const editedExpenseId = route.params?.expenseId;
  const isEditing = !!editedExpenseId;

  const selectedExpense: ExpenseData = expenseCtx.expenses.find(
    (expense) => expense.id === editedExpenseId
  );
  console.log(
    "ManageExpense ~ selectedExpense?.rangeId:",
    selectedExpense?.rangeId
  );
  const selectedExpenseAuthorUid = selectedExpense?.uid;

  useEffect(() => {
    const updateIsOnline = async () => {
      const isOnline = netCtx.isConnected && netCtx.strongConnection;
      setIsOnline(isOnline);
    };
    updateIsOnline();
  }, [netCtx.isConnected, netCtx.strongConnection]);

  async function deleteExpenseHandler() {
    async function deleteAllExpenses() {
      try {
        navigation?.popToTop();
        Toast.show({
          type: "loading",
          text1: i18n.t("toastDeleting1"),
          text2: i18n.t("toastDeleting2"),
          autoHide: false,
        });
        const allExpenses = await getAllExpenses(tripid);

        const rangedExpenses = allExpenses.filter(
          (expense) => expense?.rangeId == selectedExpense?.rangeId
        );
        const countRangedExpensesMax = rangedExpenses.length;
        console.log(
          "deleteAllExpenses ~ countRangedExpensesMax:",
          countRangedExpensesMax
        );
        let expCounter = 0;
        for (let i = 0; i < allExpenses.length; i++) {
          const expense: ExpenseData = allExpenses[i];
          if (expense?.rangeId == selectedExpense?.rangeId) {
            expCounter++;
            const queueItem: OfflineQueueManageExpenseItem = {
              type: "delete",
              expense: {
                tripid: tripid,
                uid: expense.uid,
                id: expense.id,
              },
            };
            expenseCtx?.deleteExpense(expense.id);
            await deleteExpenseOnlineOffline(queueItem, isOnline);
            console.log("deleted expense nr: " + expCounter, expense.id);
            Toast.hide();
            console.log(
              "progress / countRangedExpensesMax",
              expCounter / countRangedExpensesMax
            );
            Toast.show({
              type: "loading",
              text1: i18n.t("toastDeleting1"),
              text2: i18n.t("toastDeleting2"),
              autoHide: false,
              props: {
                progress: expCounter / countRangedExpensesMax,
              },
            });
          }
        }
        await touchAllTravelers(tripid, true);
        Toast.hide();
      } catch (error) {
        console.log("delete All Error:", error);
        Toast.show({
          text1: i18n.t("error"),
          text2: i18n.t("error2"),
          type: "error",
        });
      }
    }

    async function deleteExp() {
      // setIsSubmitting(true);
      try {
        Toast.show({
          type: "loading",
          text1: i18n.t("toastDeleting1"),
          text2: i18n.t("toastDeleting2"),
          autoHide: false,
        });
        const item: OfflineQueueManageExpenseItem = {
          type: "delete",
          expense: {
            tripid: tripid,
            uid: selectedExpenseAuthorUid,
            id: editedExpenseId,
          },
        };
        expenseCtx.deleteExpense(editedExpenseId);
        await deleteExpenseOnlineOffline(item, isOnline);
        await touchAllTravelers(tripid, true);
        Toast.hide();
      } catch (error) {
        // setError("Could not delete expense - please try again later!");
        console.error(error);
        // setIsSubmitting(false);
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
        onPress: async () => {
          if (selectedExpense?.rangeId) {
            // do you want to delete one or all expenses with this rangeId?
            Alert.alert(
              `Delete grouped range expenses?`,
              `This will delete all entries that belong to ${
                selectedExpense?.description
              } for ${formatExpenseWithCurrency(
                Number(selectedExpense?.calcAmount),
                selectedExpense?.currency
              )}!`,
              [
                //i18n.t("deleteAllExpenses"), i18n.t("deleteAllExpensesExt")
                // The "No" button
                // Does nothing but dismiss the dialog when tapped
                {
                  text: i18n.t("no"),
                  onPress: async () => {
                    try {
                      navigation?.popToTop();
                      Toast.show({
                        type: "loading",
                        text1: i18n.t("toastDeleting1"),
                        text2: i18n.t("toastDeleting2"),
                        autoHide: false,
                      });
                      const item: OfflineQueueManageExpenseItem = {
                        type: "delete",
                        expense: {
                          tripid: tripid,
                          uid: uid,
                          id: editedExpenseId,
                        },
                      };
                      expenseCtx?.deleteExpense(editedExpenseId);
                      await deleteExpenseOnlineOffline(item, isOnline);
                      await touchAllTravelers(tripid, true);
                      Toast.hide();
                    } catch (error) {
                      console.log(i18n.t("deleteError"), error);
                      Toast.show({
                        text1: i18n.t("error"),
                        text2: i18n.t("error2"),
                        type: "error",
                      });
                    }
                  },
                },
                // The "Yes" button
                {
                  text: i18n.t("yes"),
                  onPress: async () => {
                    await deleteAllExpenses();
                    return;
                  },
                },
              ]
            );
          } else {
            navigation.popToTop();
            await deleteExp();
          }
        },
      },
    ]);
  }

  function cancelHandler() {
    navigation.goBack();
  }

  const creatingNormalData = async (expenseData) => {
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
    const id = await storeExpenseOnlineOffline(item, isOnline);
    expenseCtx.addExpense({ ...expenseData, id: id });
  };

  const creatingRangedData = async (expenseData) => {
    console.log("ranged Data detected");
    // the date.now() is used as a rangeId to identify all the expenses that belong to the same range
    const rangeId =
      Date.now().toString() + Math.random().toString(36).substring(2, 15);
    console.log("creatingRangedData ~ rangeId:", rangeId);
    expenseData.rangeId = rangeId;

    // get number of days
    const day1 = new Date(expenseData.startDate);
    const day2 = new Date(expenseData.endDate);
    const days = daysBetween(day2, day1);

    // get correct amount
    if (expenseData.duplOrSplit !== 1 && expenseData.duplOrSplit !== 2) {
      Alert.alert("wrong duplOrSplit value");
      return;
    }
    // 0 is null, 1 is dupl (default), 2 is split
    if (expenseData.duplOrSplit === 2) {
      const splitCalcAmount = expenseData.calcAmount / (days + 1);
      expenseData.calcAmount = Number(splitCalcAmount.toFixed(2));
      const splitDaysAmount = expenseData.amount / (days + 1);
      expenseData.amount = Number(splitDaysAmount.toFixed(2));
    }

    // iterate over number of days between and change date and endDate to the first date + iterator
    setProgressMax(days);
    for (let i = 0; i <= days; i++) {
      console.log("day nr: ", i);
      setProgressAt(i);
      setProgress(i / days);
      Toast.show({
        type: "loading",
        text1: i18n.t("toastSaving1"),
        text2: i18n.t("toastSaving2") + " " + (i + 1) + "/" + (days + 1),
        autoHide: false,
        props: {
          progress: i / days,
          progressAt: i,
          progressMax: days,
          size: "small",
        },
      });
      console.log("progress", i / days);
      const newDate = getDatePlusDays(day1, i);
      newDate.setHours(new Date().getHours(), new Date().getMinutes());
      // expenseData.startDate =
      // expenseData.endDate =
      expenseData.date = newDate;
      // console.log("expenseData.date: ", expenseData.date);
      // console.log("expenseData.startDate: ", expenseData.startDate);
      // console.log("expenseData.endDate: ", expenseData.endDate);

      const item: OfflineQueueManageExpenseItem = {
        type: "add",
        expense: {
          tripid: tripid,
          uid: uid,
          expenseData: expenseData,
        },
      };
      const id = await storeExpenseOnlineOffline(item, isOnline);
      expenseCtx.addExpense({ ...expenseData, id: id });
    }
  };

  const editingNormalData = async (expenseData) => {
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
    await updateExpenseOnlineOffline(item, isOnline);
  };

  const editingRangedData = async (expenseData) => {
    console.log("ranged Data detected");
    // find all the expenses that have the same identifying rangeId
    const expensesInRange = expenseCtx.expenses.filter(
      (expense) =>
        expense.rangeId && expense.rangeId === selectedExpense?.rangeId
    );
    // if we dont find any expenses, it must have been a non-ranged expense, so update it to a ranged expense
    if (expensesInRange.length === 0) {
      console.log("no expenses in range found");
      await creatingRangedData(expenseData);
      // delete the original expense
      const item: OfflineQueueManageExpenseItem = {
        type: "delete",
        expense: {
          tripid: tripid,
          uid: selectedExpenseAuthorUid,
          id: editedExpenseId,
        },
      };
      expenseCtx.deleteExpense(editedExpenseId);
      await deleteExpenseOnlineOffline(item, isOnline);
      return;
    }
    // sort the expenses by date, oldest expense first
    expensesInRange.sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
    // update the expenses one by one
    setProgressMax(expensesInRange.length);
    for (let i = 0; i < expensesInRange.length; i++) {
      setProgressAt(i);
      setProgress(i / expensesInRange.length);
      console.log("progress", i / expensesInRange.length);
      const expense = expensesInRange[i];
      // set the correct new date
      const newDate = getDatePlusDays(expenseData.startDate, i);
      newDate.setHours(new Date().getHours(), new Date().getMinutes());
      expenseData.date = newDate;
      // sanity fix
      expenseData.rangeId = expense.rangeId;
      const item: OfflineQueueManageExpenseItem = {
        type: "update",
        expense: {
          tripid: tripid,
          uid: selectedExpenseAuthorUid,
          expenseData: expenseData,
          id: expense.id,
        },
      };
      expenseCtx.updateExpense(expense.id, expenseData);
      await updateExpenseOnlineOffline(item, isOnline);
      console.log("updated expense nr: " + (i + 1), expense.rangeId);
    }
  };

  async function confirmHandler(expenseData: ExpenseData) {
    console.log("confirmHandler ~ expenseData:", expenseData);
    // setIsSubmitting(true);
    try {
      // set the category to the corresponting catstring
      expenseData.categoryString = getCatString(expenseData.category);

      // calc calcAmount from amount, currency and TripCtx.tripCurrency and add it to expenseData
      const base = tripCtx.tripCurrency;
      const target = expenseData.currency;
      const rate = await getRate(base, target);
      console.log("confirmHandler ~ rate:", rate);
      if (rate === -1) {
        Alert.alert("Error", "Something went wrong, please try again");
        return;
      }
      const calcAmount = expenseData.amount / rate;
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

      if (isEditing) {
        // editing the expense
        if (
          expenseData.startDate.toString().slice(0, 10) !==
          expenseData.endDate.toString().slice(0, 10)
        ) {
          // editing ranged Data
          await editingRangedData(expenseData);
        } else {
          // editing normal expense (no-ranged)
          await editingNormalData(expenseData);
        }
      } else {
        // adding a new expense (no-editing)
        // Check for ranged Expense
        if (
          expenseData.startDate.toString().slice(0, 10) !==
          expenseData.endDate.toString().slice(0, 10)
        ) {
          // adding a new ranged expense (no-editing)
          await creatingRangedData(expenseData);
        } else {
          // adding a new normal expense (no-editing, no-ranged)
          await creatingNormalData(expenseData);
        }
      }
      // await asyncStoreSetObject("expenses", expenseCtx.expenses);
      setMMKVObject("expenses", expenseCtx.expenses);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // setIsSubmitting(false);
      navigation.popToTop();
      if (isOnline) await touchAllTravelers(tripid, true);
    } catch (error) {
      // setError("Could not save data - please try again later!" + error);
      console.error(error);
      Toast.show({
        text1: i18n.t("toastSavingError1"),
        text2: i18n.t("error2"),
        type: "error",
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // setIsSubmitting(false);
      navigation.popToTop();
    }
  }

  // function errorHandler() {
  //   setError(null);
  // }

  // if (error && !isSubmitting) {
  //   return <ErrorOverlay message={error} onConfirm={errorHandler} />;
  // }

  // if (isSubmitting && progress >= 0 && progress <= 1) {
  //   return (
  //     <LoadingBarOverlay
  //       progress={progress}
  //       progressAt={progressAt}
  //       progressMax={progressMax}
  //     />
  //   );
  // }
  // if (isSubmitting) {
  //   return <LoadingOverlay customText="Saving your Expense!" />;
  // }

  return (
    <ScrollView style={styles.container}>
      <ExpenseForm
        onCancel={cancelHandler}
        onSubmit={confirmHandler}
        setIsSubmitting={setIsSubmitting}
        pickedCat={pickedCat}
        iconName={iconName}
        navigation={navigation}
        isEditing={isEditing}
        submitButtonLabel={isEditing ? i18n.t("update") : i18n.t("add")}
        defaultValues={tempValues ?? selectedExpense}
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
    </ScrollView>
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
    margin: "2%",
    marginTop: "-12%",
    alignItems: "center",
  },
});
