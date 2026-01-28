import React, { useContext, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
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
import { isPaidString } from "../util/expense";
import {
  deleteExpenseOnlineOffline,
  OfflineQueueManageExpenseItem,
  storeExpenseOnlineOffline,
  updateExpenseOnlineOffline,
} from "../util/offline-queue";

import { i18n } from "../i18n/i18n";

import { getCatLocalized } from "../util/category";
import PropTypes from "prop-types";
import {
  deleteAllExpensesByRangedId,
  ExpenseData,
  Split,
} from "../util/expense";
import { NetworkContext } from "../store/network-context";
import { Toast } from "react-native-toast-message/lib/src/Toast";
import * as Haptics from "expo-haptics";
import { clearExpenseDraft, MMKV_KEYS, setMMKVObject } from "../store/mmkv";
import { formatExpenseWithCurrency } from "../util/string";
import { isSameDay } from "../util/dateTime";
import safeLogError from "../util/error";
import LoadingOverlay from "../components/UI/LoadingOverlay";
import { trackEvent } from "../util/vexo-tracking";
import { isConnectionFastEnoughAsBool } from "../util/connectionSpeed";
import { dynamicScale } from "../util/scalingUtil";
import { VexoEvents } from "../util/vexo-constants";
import { DateTime } from "luxon";

interface ManageExpenseProps {
  route: {
    params?: {
      pickedCat?: string;
      tempValues?: any; // ExpenseData type
      newCat?: boolean;
      iconName?: string;
      dateISO?: string;
      expenseId?: string;
    };
  };
  navigation: any;
}

export const TEMP_EXPENSE_ID = "TEMP_EXPENSE_ID";

const ManageExpense = ({ route, navigation }: ManageExpenseProps) => {
  const { pickedCat, tempValues, newCat, iconName, dateISO } =
    route.params || {};
  const expenseCtx = useContext(ExpensesContext);
  const authCtx = useContext(AuthContext);
  const tripCtx = useContext(TripContext);
  const { isConnected, strongConnection } = useContext(NetworkContext);
  const isOnline = isConnected && strongConnection;

  const tripid = tripCtx.tripid;
  const uid = authCtx.uid;

  const isEditing = !!route.params?.expenseId;
  const editedExpenseId = route.params?.expenseId || TEMP_EXPENSE_ID;

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
        Toast.show({
          text1: i18n.t("error"),
          text2: i18n.t("error2"),
          type: "error",
        });
      }
    }

    async function deleteExp() {
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

        // Track expense deleted
        trackEvent(VexoEvents.EXPENSE_DELETED, {
          expenseId: editedExpenseId,
          tripId: tripid,
          isRanged: selectedExpense?.rangeId ? true : false,
        });

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

    // start of function deleteExpenseHandler
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
    trackEvent(VexoEvents.EXPENSE_CANCEL_PRESSED, {
      isEditing: isEditing,
    });
    navigation.goBack();
  }

  const createSingleData = async (expenseData: ExpenseData) => {
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
    const expenseToAdd = { ...expenseData, id: id ?? "" };
    expenseCtx.addExpense(expenseToAdd);
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
    for (let i = 0; i <= days; i++) {
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
      const newDate = getDatePlusDays(day1, i);
      if (newDate instanceof Date) {
        newDate.setHours(new Date().getHours(), new Date().getMinutes());
      } else if (newDate instanceof DateTime) {
        newDate.set({
          hour: new Date().getHours(),
          minute: new Date().getMinutes(),
        });
      }
      expenseData.date = newDate;
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
    // find all the expenses that have the same identifying rangeId
    const expensesInRange = expenseCtx.expenses.filter(
      (expense) =>
        expense.rangeId && expense.rangeId === selectedExpense?.rangeId
    );
    // if we dont find any expenses, it must have been a non-ranged expense, so update it to a ranged expense
    if (expensesInRange?.length === 0) {
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
    const differentDates =
      !isSameDay(oldStart, newStart) || !isSameDay(oldEnd, newEnd);
    if (differentDates) {
      // Delete old expenses FIRST
      await deleteAllExpensesByRangedId(
        tripid,
        selectedExpense,
        isOnline,
        expenseCtx
      );
      // Then create new expenses
      await createRangedData(expenseData);
      return;
    }
    //else update the expenses one by one
    for (let i = 0; i < expensesInRange?.length; i++) {
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
      if (newDate instanceof Date) {
        newDate.setHours(new Date().getHours(), new Date().getMinutes());
      } else if (newDate instanceof DateTime) {
        newDate.set({
          hour: new Date().getHours(),
          minute: new Date().getMinutes(),
        });
      }
      // IMPORTANT: don't mutate the shared expenseData object inside the loop.
      // Mutating can cause stale/incorrect state during rerenders (and can lead to loops),
      // especially when toggling fields like isPaid on ranged expenses.
      const updatedExpenseData: ExpenseData = {
        ...expenseData,
        date: newDate,
        editedTimestamp: Date.now(),
        // sanity fix
        rangeId: expense.rangeId,
      };
      const item: OfflineQueueManageExpenseItem = {
        type: "update",
        expense: {
          tripid: tripid,
          uid: selectedExpenseAuthorUid,
          expenseData: updatedExpenseData,
          id: expense.id,
        },
      };
      expenseCtx.updateExpense(expense.id, updatedExpenseData);
      await updateExpenseOnlineOffline(item, isOnline);
    }
  };

  async function confirmHandler(expenseData: ExpenseData): Promise<void> {
    try {
      // set the category to the corresponting catstring
      expenseData.categoryString = getCatLocalized(expenseData.category);

      // calc calcAmount from amount, currency and TripCtx.tripCurrency and add it to expenseData
      const base = tripCtx.tripCurrency;
      const target = expenseData.currency;
      const rate = await getRate(base, target);
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
          await editRangedData(expenseData);
        } else {
          // editing normal expense (no-ranged)
          await editSingleData(expenseData);
        }

        // Track expense edited
        trackEvent(VexoEvents.EXPENSE_EDITED, {
          expenseId: editedExpenseId,
          amount: expenseData.amount,
          currency: expenseData.currency,
          category: expenseData.categoryString,
          tripId: tripid,
        });
      } else {
        // adding a new expense (no-editing)
        // Auto-unsettle trip if currently settled (new expenses break settlement)
        if (tripCtx.isPaid === isPaidString.paid) {
          await tripCtx.setTripUnsettled();
        }

        // Check for ranged Expense
        if (
          expenseData.startDate.toString().slice(0, 10) !==
          expenseData.endDate.toString().slice(0, 10)
        ) {
          // adding a new ranged expense (no-editing)
          await createRangedData(expenseData);
        } else {
          // adding a new normal expense (no-editing, no-ranged)
          await createSingleData(expenseData);
        }

        // Track expense created
        trackEvent(VexoEvents.EXPENSE_CREATED, {
          amount: expenseData.amount,
          currency: expenseData.currency,
          category: expenseData.categoryString,
          isRanged:
            expenseData.startDate.toString().slice(0, 10) !==
            expenseData.endDate.toString().slice(0, 10),
          tripId: tripid,
        });
      }
      // await asyncStoreSetObject("expenses", expenseCtx.expenses);
      setMMKVObject(MMKV_KEYS.EXPENSES, expenseCtx.expenses);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Clear draft data after successful submission
      clearExpenseDraft(editedExpenseId);
      navigation.popToTop();
      if (isOnline && (await isConnectionFastEnoughAsBool()))
        await touchAllTravelers(tripid, true);
    } catch (error) {
      safeLogError(error);
      return Promise.reject(error);
    }
    // no matter what happens, add one expense to the expenseCtx and remove it for refresh
    expenseCtx.addExpense({ ...expenseData, id: "temp" });
    expenseCtx.deleteExpense("temp");
    return Promise.resolve();
  }

  return (
    <ScrollView style={styles.container}>
      <ExpenseForm
        onCancel={cancelHandler}
        onSubmit={confirmHandler}
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

const styles = StyleSheet.create({
  container: {
    backgroundColor: GlobalStyles.colors.backgroundColor,
    height: "100%",
  },
  deleteContainer: {
    padding: dynamicScale(16, true, 0.5),
    marginTop: dynamicScale(-46, false, 0.5),
    alignItems: "center",
  },
});
