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
import { expandRangedExpense } from "../util/expand-ranged-expense";
import {
  buildRangedExpenseDatesFromSpan,
  planNonRangedToRangedInstances,
  planRangedExpenseInPlaceUpdates,
  planRangedExpenseReplacement,
  shouldReplaceRangedExpenseInstances,
} from "../util/plan-ranged-expense-edit";
import { isPaidString } from "../util/expense";
import {
  deleteExpenseOnlineOffline,
  OfflineQueueManageExpenseItem,
  storeExpenseOnlineOffline,
  updateExpenseOnlineOffline,
} from "../util/offline-queue";
import { deleteUserExpenses } from "../util/user-delete-expense";

import { i18n } from "../i18n/i18n";

import { getCatLocalized } from "../util/category";
import PropTypes from "prop-types";
import {
  deleteAllExpensesByRangedId,
  ExpenseData,
} from "../util/expense";
import type { ExpenseFormSubmitPayload } from "../util/expense-form-submit";
import { NetworkContext } from "../store/network-context";
import { Toast } from "react-native-toast-message/lib/src/Toast";
import * as Haptics from "expo-haptics";
import { clearExpenseDraft } from "../store/mmkv";
import { formatExpenseWithCurrency } from "../util/string";
import { isSameDay } from "../util/dateTime";
import safeLogError from "../util/error";
import LoadingOverlay from "../components/UI/LoadingOverlay";
import { trackEvent } from "../util/vexo-tracking";
import { isConnectionFastEnoughAsBool } from "../util/connectionSpeed";
import { dynamicScale } from "../util/scalingUtil";
import { VexoEvents } from "../util/vexo-constants";

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
        await deleteAllExpensesByRangedId(
          tripid,
          selectedExpense,
          isOnline,
          expenseCtx
        );
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
        await deleteUserExpenses({
          tripid,
          targets: [
            {
              tripid,
              uid: selectedExpenseAuthorUid,
              id: editedExpenseId,
            },
          ],
          isOnline,
          expenseCtx,
        });

        trackEvent(VexoEvents.EXPENSE_DELETED, {
          expenseId: editedExpenseId,
          tripId: tripid,
          isRanged: selectedExpense?.rangeId ? true : false,
        });
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
                      await deleteUserExpenses({
                        tripid,
                        targets: [
                          {
                            tripid,
                            uid: uid,
                            id: editedExpenseId,
                          },
                        ],
                        isOnline,
                        expenseCtx,
                      });
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

  const newRangeId = () =>
    Date.now().toString() + Math.random().toString(36).substring(2, 15);

  const persistNewRangedInstances = async (instances: ExpenseData[]) => {
    const progressMax = Math.max(instances.length - 1, 0);

    for (let i = 0; i < instances.length; i++) {
      Toast.show({
        type: "loading",
        text1: i18n.t("toastSaving1"),
        text2: i18n.t("toastSaving2"),
        autoHide: false,
        props: {
          progress: progressMax === 0 ? 0 : i / progressMax,
          progressAt: i,
          progressMax,
          size: "small",
        },
      });

      const expenseToPersist = {
        ...instances[i],
        editedTimestamp: Date.now(),
      };

      const item: OfflineQueueManageExpenseItem = {
        type: "add",
        expense: {
          tripid: tripid,
          uid: uid,
          expenseData: expenseToPersist,
        },
      };
      const id = await storeExpenseOnlineOffline(item, isOnline);
      expenseCtx.addExpense({ ...expenseToPersist, id: id ?? "" });
    }
  };

  const createRangedData = async (expenseData: ExpenseData) => {
    const rangeId = newRangeId();
    const dates = buildRangedExpenseDatesFromSpan(
      expenseData.startDate,
      expenseData.endDate
    );
    const isSingleDay = isSameDay(expenseData.endDate, expenseData.startDate);
    const instances = expandRangedExpense(expenseData, {
      rangeId: isSingleDay ? null : rangeId,
      dates,
    });

    await persistNewRangedInstances(instances);
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

  const editRangedData = async (expenseData: ExpenseData) => {
    const expensesInRange = expenseCtx.expenses.filter(
      (expense) =>
        expense.rangeId && expense.rangeId === selectedExpense?.rangeId
    );

    if (expensesInRange.length === 0) {
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

      const instances = planNonRangedToRangedInstances(expenseData, newRangeId());
      await persistNewRangedInstances(instances);
      return;
    }

    if (shouldReplaceRangedExpenseInstances(expensesInRange, expenseData)) {
      await deleteAllExpensesByRangedId(
        tripid,
        selectedExpense,
        isOnline,
        expenseCtx,
        { showUndoToast: false },
      );

      const instances = planRangedExpenseReplacement(expenseData, newRangeId());
      await persistNewRangedInstances(instances);
      return;
    }

    const updates = planRangedExpenseInPlaceUpdates(expenseData, expensesInRange);
    const progressMax = updates.length;

    for (let i = 0; i < updates.length; i++) {
      Toast.show({
        type: "loading",
        text1: i18n.t("toastSaving1"),
        text2: i18n.t("toastSaving2"),
        autoHide: false,
        props: {
          progress: i / progressMax,
          progressAt: i,
          progressMax,
          size: "small",
        },
      });

      const { id, expenseData: updatedExpenseData } = updates[i];
      const item: OfflineQueueManageExpenseItem = {
        type: "update",
        expense: {
          tripid: tripid,
          uid: selectedExpenseAuthorUid,
          expenseData: updatedExpenseData,
          id,
        },
      };
      expenseCtx.updateExpense(id, updatedExpenseData);
      await updateExpenseOnlineOffline(item, isOnline);
    }
  };

  async function confirmHandler(payload: ExpenseFormSubmitPayload): Promise<void> {
    const expenseData = payload;
    try {
      // Normalize localized category label and trip-currency calcAmount (FX) on every submit path.
      expenseData.categoryString = getCatLocalized(expenseData.category);

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
    <ScrollView
      keyboardShouldPersistTaps="always"
      style={styles.container}
    >
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
