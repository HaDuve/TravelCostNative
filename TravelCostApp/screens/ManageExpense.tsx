import { useContext, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import React from "react";
import { ScrollView } from "react-native";
import ExpenseForm from "../components/ManageExpense/ExpenseForm";

import IconButton from "../components/UI/IconButton";
import { AuthContext } from "../store/auth-context";
import { ExpensesContext } from "../store/expenses-context";
import { TripContext } from "../store/trip-context";
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
import { en, de, fr, ru } from "../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale = ((Localization.getLocales()[0]&&Localization.getLocales()[0].languageCode)?Localization.getLocales()[0].languageCode.slice(0,2):'en');
i18n.enableFallback = true;
// i18n.locale = "en";

import { getCatString } from "../util/category";
import PropTypes from "prop-types";
import {
  deleteAllExpensesByRangedId,
  ExpenseData,
  Split,
} from "../util/expense";
import { NetworkContext } from "../store/network-context";
import { Toast } from "react-native-toast-message/lib/src/Toast";
import * as Haptics from "expo-haptics";
import { setMMKVObject } from "../store/mmkv";
import { formatExpenseWithCurrency } from "../util/string";
import { isSameDay } from "../util/dateTime";
import ToastComponent from "../components/UI/ToastComponent";
import safeLogError from "../util/error";
import LoadingOverlay from "../components/UI/LoadingOverlay";
import {
  isConnectionFastEnough,
  isConnectionFastEnoughAsBool,
} from "../util/connectionSpeed";

const ManageExpense = ({ route, navigation }) => {
  const { pickedCat, tempValues, newCat, iconName, dateISO } = route.params;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const expenseCtx = useContext(ExpensesContext);
  const authCtx = useContext(AuthContext);
  const tripCtx = useContext(TripContext);
  const { isConnected, strongConnection } = useContext(NetworkContext);
  const isOnline = isConnected && strongConnection;
  const [progress, setProgress] = useState(-1);
  const [progressAt, setProgressAt] = useState(0);
  const [progressMax, setProgressMax] = useState(0);

  const tripid = tripCtx.tripid;
  const uid = authCtx.uid;

  const editedExpenseId = route.params?.expenseId;
  const isEditing = !!editedExpenseId;

  let selectedExpense: ExpenseData;
  let expenseError = false;

  try {
    selectedExpense = expenseCtx.expenses.find(
      (expense) => expense.id === editedExpenseId
    );
  } catch (error) {
    expenseError = true;
  }

  if (expenseError || (isEditing && !selectedExpense)) {
    navigation.popToTop();
    Toast.show({
      type: "error",
      text1: i18n.t("exceptionError"),
      text2: i18n.t("toastErrorUpdateExp"),
    });
    return <LoadingOverlay></LoadingOverlay>;
  }

  const selectedExpenseAuthorUid = selectedExpense?.uid;

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
        await deleteAllExpensesByRangedId(
          tripid,
          selectedExpense,
          isOnline,
          expenseCtx
        );
        Toast.hide();
        await touchAllTravelers(tripid, true);
        Toast.hide();
      } catch (error) {
        // console.log("delete All Error:", error);
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
        Toast.show({
          text1: i18n.t("error"),
          text2: i18n.t("deleteError"),
          type: "error",
        });
        safeLogError(error);
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
                      // console.log(i18n.t("deleteError"), error);
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

  const createSingleData = async (expenseData: ExpenseData) => {
    // console.log("no ranged Data detected");
    // hotfix the date clock bug
    expenseData.date = expenseData.startDate;
    expenseData.editedTimestamp = Date.now();
    const item: OfflineQueueManageExpenseItem = {
      type: "add",
      expense: {
        tripid: tripid,
        uid: uid,
        expenseData: expenseData,
      },
    };
    const id = await storeExpenseOnlineOffline(item, isOnline);
    expenseCtx.addExpense({ ...expenseData, id: id ?? "" });
  };

  const createRangedData = async (expenseData) => {
    // rangeId to identify all the expenses that belong to the same range
    const rangeId =
      Date.now().toString() + Math.random().toString(36).substring(2, 15);

    // sanity check if the expenseData.date is unequal to expenseData.startDate and endDate
    // if so, set the date to the startDate
    if (isSameDay(expenseData.endDate, expenseData.startDate)) {
      // delete the rangeId field
      expenseData.rangeId = null;
    } else {
      expenseData.rangeId = rangeId;
    }

    // get number of days
    const day1 = new Date(expenseData.startDate);
    const day2 = new Date(expenseData.endDate);
    const days = daysBetween(day2, day1);

    // 0 is null, 1 is dupl (default), 2 is split
    if (
      expenseData.duplOrSplit === 2 &&
      !expenseData.alreadyDividedAmountByDays
    ) {
      // split the amount and calcAmount by the number of days for split
      const splitCalcAmount = expenseData.calcAmount / (days + 1);
      expenseData.calcAmount = Number(splitCalcAmount.toFixed(2));
      const splitDaysAmount = expenseData.amount / (days + 1);
      expenseData.amount = Number(splitDaysAmount.toFixed(2));
      // also split the splits by the number of days for split
      expenseData.splitList.forEach((split: Split) => {
        split.amount = Number((split.amount / (days + 1)).toFixed(2));
      });
    }

    // iterate over number of days between and change date and endDate to the first date + iterator
    setProgressMax(days);
    for (let i = 0; i <= days; i++) {
      // console.log("day nr: ", i);
      setProgressAt(i);
      setProgress(i / days);
      Toast.show({
        type: "loading",
        text1: i18n.t("toastSaving1"),
        text2: i18n.t("toastSaving2"), //+ " " + (i + 1) + "/" + (days + 1)
        autoHide: false,
        props: {
          progress: i / days,
          progressAt: i,
          progressMax: days,
          size: "small",
        },
      });
      // console.log("progress", i / days);
      const newDate = getDatePlusDays(day1, i);
      newDate.setHours(new Date().getHours(), new Date().getMinutes());
      // expenseData.startDate =
      // expenseData.endDate =
      expenseData.date = newDate;
      expenseData.editedTimestamp = Date.now();
      // console.log(
      //   "expenseData.date: ",
      //   expenseData.date,
      //   typeof expenseData.date
      // );
      // console.log(
      //   "expenseData.startDate: ",
      //   expenseData.startDate,
      //   typeof expenseData.startDate
      // );
      // console.log(
      //   "expenseData.endDate: ",
      //   expenseData.endDate,
      //   typeof expenseData.endDate
      // );

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

  const editSingleData = async (expenseData: ExpenseData) => {
    expenseData.editedTimestamp = Date.now();
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

  const editRangedData = async (expenseData) => {
    // console.log("ranged Data detected");

    // find all the expenses that have the same identifying rangeId
    const expensesInRange = expenseCtx.expenses.filter(
      (expense) =>
        expense.rangeId && expense.rangeId === selectedExpense?.rangeId
    );
    // if we dont find any expenses, it must have been a non-ranged expense, so update it to a ranged expense
    if (expensesInRange?.length === 0) {
      // console.log("no expenses in range found");
      // delete the original expense
      expenseCtx.deleteExpense(editedExpenseId);
      const item: OfflineQueueManageExpenseItem = {
        type: "delete",
        expense: {
          tripid: tripid,
          uid: selectedExpenseAuthorUid,
          id: editedExpenseId,
        },
      };
      await deleteExpenseOnlineOffline(item, isOnline);
      await createRangedData(expenseData);
      return;
    }
    // sort the expenses by date, oldest expense first
    expensesInRange.sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    // check if the dates are the same, then update one by one or redo all
    // get the first and last day from expenses in range
    const oldStart = new Date(expensesInRange[0].date);
    const oldEnd = new Date(expensesInRange[expensesInRange?.length - 1].date);
    // get days from expenseData
    const newStart = new Date(expenseData.startDate);
    const newEnd = new Date(expenseData.endDate);
    const validDates =
      expensesInRange[0].date &&
      expensesInRange[expensesInRange?.length - 1].date &&
      expenseData.startDate &&
      expenseData.endDate;
    // console.log("editingRangedData ~ validDates:", validDates);
    const differentDates =
      !isSameDay(oldStart, newStart) || !isSameDay(oldEnd, newEnd);
    if (differentDates) {
      await createRangedData(expenseData);
      // redo all and delete old ones
      await deleteAllExpensesByRangedId(
        tripid,
        selectedExpense,
        isOnline,
        expenseCtx
      );
      return;
    }
    //else update the expenses one by one
    setProgressMax(expensesInRange?.length);
    for (let i = 0; i < expensesInRange?.length; i++) {
      setProgressAt(i);
      setProgress(i / expensesInRange?.length);
      // console.log("progress", i / expensesInRange?.length);
      Toast.show({
        type: "loading",
        text1: i18n.t("toastSaving1"),
        text2: i18n.t("toastSaving2"), //+ " " + (i + 1) + "/" + (expensesInRange?.length + 1)
        autoHide: false,
        props: {
          progress: i / expensesInRange?.length,
          progressAt: i,
          progressMax: expensesInRange?.length,
          size: "small",
        },
      });
      const expense = expensesInRange[i];
      // set the correct new date
      const newDate = getDatePlusDays(expenseData.startDate, i);
      newDate.setHours(new Date().getHours(), new Date().getMinutes());
      expenseData.date = newDate;
      expenseData.editedTimestamp = Date.now();
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
      // console.log("updated expense nr: " + (i + 1), expense.rangeId);
    }
  };

  async function confirmHandler(expenseData: ExpenseData) {
    // console.log("confirmHandler ~ expenseData:", expenseData);
    // setIsSubmitting(true);
    try {
      // set the category to the corresponting catstring
      expenseData.categoryString = getCatString(expenseData.category);

      // calc calcAmount from amount, currency and TripCtx.tripCurrency and add it to expenseData
      const base = tripCtx.tripCurrency;
      const target = expenseData.currency;
      const rate = await getRate(base, target);
      // console.log("confirmHandler ~ rate:", rate);
      if (rate === -1) {
        Alert.alert(
          "Error",
          "Could not find the latest exchangerates. Please try again later!"
        );
        return;
      }
      const calcAmount = expenseData.amount / rate;
      expenseData.calcAmount = calcAmount;

      // if expenseData has a splitlist, add the rate to each split
      if (expenseData.splitList && expenseData.splitList?.length > 0) {
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
            expenseData.endDate.toString().slice(0, 10) ||
          selectedExpense.rangeId
        ) {
          // editing ranged Data
          // console.log("deciding to edit ranged data");
          await editRangedData(expenseData);
        } else {
          // editing normal expense (no-ranged)
          // console.log("deciding to edit normal data");
          await editSingleData(expenseData);
        }
      } else {
        // adding a new expense (no-editing)
        // Check for ranged Expense
        if (
          expenseData.startDate.toString().slice(0, 10) !==
          expenseData.endDate.toString().slice(0, 10)
        ) {
          // adding a new ranged expense (no-editing)
          // console.log("deciding to create ranged data");
          await createRangedData(expenseData);
        } else {
          // adding a new normal expense (no-editing, no-ranged)
          // console.log("deciding to create normal data");
          await createSingleData(expenseData);
        }
      }
      // await asyncStoreSetObject("expenses", expenseCtx.expenses);
      setMMKVObject("expenses", expenseCtx.expenses);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // setIsSubmitting(false);
      navigation.popToTop();
      if (isOnline && (await isConnectionFastEnoughAsBool()))
        await touchAllTravelers(tripid, true);
    } catch (error) {
      safeLogError(error);
    }
    // no matter what happens, add one expense to the expenseCtx and remove it for refresh
    expenseCtx.addExpense({ ...expenseData, id: "temp" });
    expenseCtx.deleteExpense("temp");
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
        dateISO={dateISO}
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
    paddingTop: "4%",
    margin: "2%",
    marginTop: "-12%",
    alignItems: "center",
  },
});
