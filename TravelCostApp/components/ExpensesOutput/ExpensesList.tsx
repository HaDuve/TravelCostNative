import { Alert, Dimensions, Platform } from "react-native";

import ExpenseItem from "./ExpenseItem";
import React, { memo, useContext, useEffect, useMemo } from "react";
import { View } from "react-native";

import Swipeable from "react-native-gesture-handler/Swipeable";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { GlobalStyles } from "../../constants/styles";
import { getAllExpenses, touchAllTravelers } from "../../util/http";
import { TripContext } from "../../store/trip-context";
import { ExpensesContext } from "../../store/expenses-context";
import IconButton from "../UI/IconButton";
import Animated, { Layout } from "react-native-reanimated";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr, ru } from "../../i18n/supportedLanguages";
import {
  deleteExpenseOnlineOffline,
  OfflineQueueManageExpenseItem,
} from "../../util/offline-queue";
import { UserContext } from "../../store/user-context";
import { ExpenseData, Expense } from "../../util/expense";
import PropTypes from "prop-types";
import { NetworkContext } from "../../store/network-context";
import { Toast } from "react-native-toast-message/lib/src/Toast";
import { useNavigation, useScrollToTop } from "@react-navigation/native";
import { useState } from "react";
import LoadingBarOverlay from "../UI/LoadingBarOverlay";
import { Text } from "react-native-paper";
import { formatExpenseWithCurrency } from "../../util/string";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;

// GLOBALS across all expenseItems
let tripid = "";
let expenseCtx;
let filtered = false;
let navigation;
const row = [];
let prevOpenedRow;
let travellerName = "";
// swipe left to delete
const renderRightActions = (progress, dragX, onClick) => {
  return (
    <View
      style={{
        marginBottom: 2,
        paddingTop: 14,
        paddingLeft: 10,
        alignContent: "center",
        justifyContent: "center",
        width: 55,
        backgroundColor: GlobalStyles.colors.error500,
      }}
    >
      {/* <Text>test</Text> */}
      <IconButton
        icon="trash"
        color={GlobalStyles.colors.backgroundColor}
        size={36}
        onPress={onClick}
        buttonStyle={{
          marginBottom: "0%",
          marginTop: "-30%",
          marginLeft: "-20%",
        }}
      />
    </View>
  );
};

function renderExpenseItem(isOnline: boolean, itemData) {
  const index = itemData.index;
  if (Platform.OS === "android")
    return (
      <View style={{ height: 55, width: "100%" }}>
        <GestureHandlerRootView>
          <Swipeable
            renderLeftActions={(progress, dragX) =>
              renderRightActions(
                progress,
                dragX,
                onClick.bind(this, itemData, isOnline)
              )
            }
            onSwipeableOpen={closeRow.bind(this, index)}
            ref={(ref) => (row[index] = ref)}
            overshootFriction={8}
          >
            <ExpenseItem
              showSumForTravellerName={travellerName}
              filtered={filtered}
              {...itemData.item}
            />
          </Swipeable>
        </GestureHandlerRootView>
      </View>
    );
  return (
    <View style={{ height: 55, width: "100%" }}>
      <Swipeable
        renderRightActions={(progress, dragX) =>
          renderRightActions(
            progress,
            dragX,
            onClick.bind(this, itemData, isOnline)
          )
        }
        onSwipeableOpen={closeRow.bind(this, index)}
        ref={(ref) => (row[index] = ref)}
        rightOpenValue={-100}
        disableLeftSwipe={true}
        overshootFriction={8}
      >
        <ExpenseItem
          showSumForTravellerName={travellerName}
          filtered={filtered}
          {...itemData.item}
        />
      </Swipeable>
    </View>
  );
}

function onClick({ item, index }, isOnline) {
  // console.log("onClick ~ isOnline", isOnline);
  // console.log("onClick ~ index", index);
  // console.log("onClick ~ item", item);
  const editedExpenseId = item.id;
  const uid = item.uid;
  console.log("onClick ~ uid", uid);
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
      for (let i = 0; i < allExpenses.length; i++) {
        const expense = allExpenses[i];
        if (expense?.rangeId == item?.rangeId) {
          const queueItem: OfflineQueueManageExpenseItem = {
            type: "delete",
            expense: {
              tripid: tripid,
              uid: uid,
              id: expense.id,
            },
          };
          expenseCtx?.deleteExpense(expense.id);
          await deleteExpenseOnlineOffline(queueItem, isOnline);
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
    if (item.rangeId) {
      // do you want to delete one or all expenses with this rangeId?
      Alert.alert(
        `Delete grouped range expenses?`,
        `This will delete all entries that belong to ${
          item.description
        } for ${formatExpenseWithCurrency(
          Number(item.calcAmount),
          item.currency
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
      // single id
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
    }
  }
  async function deleteExpenseHandler() {
    Alert.alert(i18n.t("sure"), i18n.t("sureExt"), [
      // The "No" button
      // Does nothing but dismiss the dialog when tapped
      {
        text: i18n.t("no"),
        onPress: () => forceCloseRow(index),
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

  setTimeout(() => {
    forceCloseRow(index);
  }, 1500);
}

function forceCloseRow(index) {
  try {
    row[index].close();
  } catch (error) {
    console.log("forceCloseRow ~ error", error);
  }
}

// Displays a list of all expenses.
function ExpensesList({
  expenses,
  refreshControl,
  showSumForTravellerName,
  isFiltered,
}) {
  navigation = useNavigation();

  const netCtx = useContext(NetworkContext);
  const isOnline = netCtx.isConnected && netCtx.strongConnection;
  const tripCtx = useContext(TripContext);
  expenseCtx = useContext(ExpensesContext);
  const layoutAnim = Layout.damping(50).stiffness(300).overshootClamping(1);
  tripid = tripCtx.tripid;
  travellerName = showSumForTravellerName;
  if (isFiltered) filtered = true;

  return (
    <Animated.View
      style={{
        paddingLeft: 0,
        backgroundColor: GlobalStyles.colors.backgroundColor,
        height: Dimensions.get("window").height,
      }}
    >
      <View
        style={{
          position: "absolute",
          width: Dimensions.get("window").width,
          height: 60,
          alignItems: "center",
          justifyContent: "center",
          paddingTop: 4,
          marginTop: -60,
        }}
      >
        <LoadingBarOverlay></LoadingBarOverlay>
      </View>
      <Animated.FlatList
        // ref={flatListRef}
        scrollEnabled={true}
        itemLayoutAnimation={layoutAnim}
        data={expenses}
        // ref={listRef}
        // onEndReached={onScrollHandler}
        // onEndReachedThreshold={0.5}
        renderItem={renderExpenseItem.bind(this, isOnline)}
        ListFooterComponent={
          <View style={{ height: Dimensions.get("screen").height / 1.8 }} />
        }
        keyExtractor={(item: Expense) => item.id}
        refreshControl={refreshControl}
        getItemLayout={(data, index) => ({
          length: 55,
          offset: 55 * index,
          index,
        })}
      />
    </Animated.View>
  );
}

export default ExpensesList;

ExpensesList.propTypes = {
  expenses: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      amount: PropTypes.number.isRequired,
      date: PropTypes.instanceOf(Date).isRequired,
      currency: PropTypes.string.isRequired,
      category: PropTypes.string.isRequired,
      uid: PropTypes.string.isRequired,
    })
  ).isRequired,
  refreshControl: PropTypes.object,
  showSumForTravellerName: PropTypes.string,
  isFiltered: PropTypes.bool,
};
