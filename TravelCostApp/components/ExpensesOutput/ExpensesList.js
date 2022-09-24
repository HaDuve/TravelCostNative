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
        }}
      >
        <Button color="red" onPress={onClick} title="DELETE"></Button>
      </View>
    );
  };

  return (
    <Swipeable
      renderRightActions={(progress, dragX) =>
        renderRightActions(progress, dragX, onClick.bind(this, itemData))
      }
      onSwipeableOpen={() => console.log("onSwipeableOpen")}
      ref={(ref) => ref}
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
        console.log("deleteExp ~ editedExpenseId", editedExpenseId);
        console.log("deleteExp ~ uid", uid);
        console.log("deleteExp ~ tripid", tripid);
        expenseCtx.deleteExpense(editedExpenseId);
      } catch (error) {
        console.log(
          "Could not delete expense - please try again later!",
          error
        );
      }
    }
    Alert.alert(
      "Are you sure?",
      "Are you sure you want to delete this expense?",
      [
        // The "No" button
        // Does nothing but dismiss the dialog when tapped
        {
          text: "No",
          onPress: () => {},
        },
        // The "Yes" button
        {
          text: "Yes",
          onPress: () => {
            deleteExp();
          },
        },
      ]
    );
  }
  deleteExpenseHandler();
}

// global variables across all expenseItems
var tripid = 0;
var expenseCtx = {};

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
