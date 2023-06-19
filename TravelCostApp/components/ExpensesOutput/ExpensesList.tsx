import { Alert, Dimensions } from "react-native";

import ExpenseItem from "./ExpenseItem";
import React, { memo, useContext, useEffect, useMemo } from "react";
import { View } from "react-native";

import Swipeable from "react-native-gesture-handler/Swipeable";
import { GlobalStyles } from "../../constants/styles";
import { touchAllTravelers } from "../../util/http";
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
  async function deleteExp() {
    try {
      navigation?.popToTop();
      Toast.show({
        type: "loading",
        text1: "Deleting",
        text2: "Please leave the app open...",
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
        text1: "Error",
        text2: "Could not delete expense, sorry!",
        type: "error",
      });
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
  periodValue,
  showSumForTravellerName,
  isFiltered,
  listRef,
}) {
  // const uniqueData = expenses;
  // useEffect(() => {
  //   setPage(1);
  //   setData(uniqueData.slice(0, 10));
  // }, [uniqueData]);

  // //add pagination
  // const [page, setPage] = useState(0);
  // const [data, setData] = useState(uniqueData.slice(0, page * 10));

  // function addExpensesToData(page) {
  //   const newExpenses = [];
  //   for (let i = page * 10; i < (page + 1) * 10; i++) {
  //     if (uniqueData[i]) {
  //       newExpenses.push(uniqueData[i]);
  //     }
  //   }
  //   setData([...data, ...newExpenses]);
  // }

  // function onScrollHandler() {
  //   console.log("onScrollHandler ~ page before:", page);
  //   setPage(page + 1);
  //   addExpensesToData(page);
  // }

  // console.log("rerender ExpensesList - C");
  navigation = useNavigation();

  // const flatListRef = useRef(null);
  const netCtx = useContext(NetworkContext);
  const isOnline = netCtx.isConnected && netCtx.strongConnection;
  const tripCtx = useContext(TripContext);
  expenseCtx = useContext(ExpensesContext);
  const layoutAnim = Layout.damping(50).stiffness(300).overshootClamping(1);
  tripid = tripCtx.tripid;
  travellerName = showSumForTravellerName;
  if (isFiltered) filtered = true;
  // // find the index of the first item in expenses with the date === new Date()
  // // this is used to scroll to the current day
  // useLayoutEffect(() => {
  //   console.log("useEffect ~ flatListRef", flatListRef);
  //   if (!flatListRef.current) {
  //     return;
  //   }
  //   console.log("useEffect");
  //   // Scroll to the today item after the component is rendered
  //   const today = new Date();
  //   const todayIndex = expenses.findIndex(
  //     (expense) =>
  //       expense.date.getDate() === today.getDate() &&
  //       expense.date.getMonth() === today.getMonth() &&
  //       expense.date.getFullYear() === today.getFullYear()
  //   );
  //   // if todayIndex is -1, then there are no expenses for today
  //   // so we scroll to the first expense
  //   flatListRef.current.scrollToIndex({ index: todayIndex, animated: true });
  // }, [periodValue]);

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
          marginTop: -60,
        }}
      >
        <LoadingBarOverlay></LoadingBarOverlay>
      </View>
      <Animated.FlatList
        // ref={flatListRef}
        scrollEnabled={false}
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
  refreshControl: PropTypes.element,
  periodValue: PropTypes.string.isRequired,
  showSumForTravellerName: PropTypes.string,
  isFiltered: PropTypes.bool,
};
