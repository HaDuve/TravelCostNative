import { Alert, FlatList, Button } from "react-native";

import ExpenseItem from "./ExpenseItem";

import React, { Component, useContext } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { RectButton } from "react-native-gesture-handler";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { GlobalStyles } from "../../constants/styles";
import { deleteExpense } from "../../util/http";
import { TripContext } from "../../store/trip-context";
import { AuthContext } from "../../store/auth-context";
import { ExpensesContext } from "../../store/expenses-context";
import IconButton from "../UI/IconButton";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de } from "../../i18n/supportedLanguages";
const i18n = new I18n({ en, de });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;

// GLOBALS across all expenseItems
var tripid = "";
var expenseCtx = {};
let row = [];
let prevOpenedRow;

function renderExpenseItem(itemData) {
  // swipe left to delete
  const renderRightActions = (progress, dragX, onClick) => {
    return (
      <View
        style={{
          margin: 0,
          alignContent: "flex-end",
          justifyContent: "center",
          width: 90,
          backgroundColor: GlobalStyles.colors.error500,
        }}
      >
        <IconButton
          icon="trash"
          color={GlobalStyles.colors.backgroundColor}
          size={24}
          onPress={onClick}
          buttonStyle={{ marginLeft: 30 }}
        />
      </View>
    );
  };
  const index = itemData.index;
  return (
    <Swipeable
      renderRightActions={(progress, dragX) =>
        renderRightActions(progress, dragX, onClick.bind(this, itemData))
      }
      onSwipeableOpen={closeRow.bind(this, index)}
      ref={(ref) => (row[index] = ref)}
      rightOpenValue={-100}
      overshootFriction={8}
    >
      <ExpenseItem {...itemData.item} />
    </Swipeable>
  );
}

function onClick({ item, index }) {
  const editedExpenseId = item.id;
  const uid = item.uid;

  async function deleteExpenseHandler() {
    async function deleteExp() {
      try {
        await deleteExpense(tripid, uid, editedExpenseId);
        expenseCtx.deleteExpense(editedExpenseId);
      } catch (error) {
        console.log(i18n.t("deleteError"), error);
      }
    }
    Alert.alert(i18n.t("sure"), i18n.t("sureExt"), [
      // The "No" button
      // Does nothing but dismiss the dialog when tapped
      {
        text: i18n.t("no"),
        onPress: forceCloseRow(index),
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
  deleteExpenseHandler();
}

function closeRow(index) {
  if (prevOpenedRow && prevOpenedRow !== row[index]) {
    prevOpenedRow.close();
  }
  prevOpenedRow = row[index];
}
function forceCloseRow(index) {
  row[index].close();
}

// Displays a list of all expenses.
function ExpensesList({ expenses }) {
  const tripCtx = useContext(TripContext);
  expenseCtx = useContext(ExpensesContext);

  tripid = tripCtx.tripid;

  return (
    <FlatList
      data={expenses}
      renderItem={renderExpenseItem}
      keyExtractor={(item) => item.id}
    />
  );
}

export default ExpensesList;

const styles = StyleSheet.create({
  rightAction: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  actionText: {
    color: GlobalStyles.colors.backgroundColor,
    fontSize: 16,
    //TODO: find another way to describe transparent, might cause android crash
    // backgroundColor: "transparent",
    padding: 10,
  },
});
