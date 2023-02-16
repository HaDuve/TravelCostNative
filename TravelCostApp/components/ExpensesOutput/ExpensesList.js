import { Alert } from "react-native";

import ExpenseItem from "./ExpenseItem";

import React, {
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { View } from "react-native";

import Swipeable from "react-native-gesture-handler/Swipeable";
import { GlobalStyles } from "../../constants/styles";
import { deleteExpense } from "../../util/http";
import { TripContext } from "../../store/trip-context";
import { ExpensesContext } from "../../store/expenses-context";
import IconButton from "../UI/IconButton";
import Animated, {
  FadeInRight,
  FadeOutLeft,
  FadingTransition,
  Layout,
} from "react-native-reanimated";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de } from "../../i18n/supportedLanguages";
import { deleteExpenseOnlineOffline } from "../../util/offline-queue";
import { FlatList } from "react-native-gesture-handler";
const i18n = new I18n({ en, de });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;

// GLOBALS across all expenseItems
var tripid = "";
var expenseCtx = {};
let row = [];
let prevOpenedRow;
// swipe left to delete
const renderLeftActions = (progress, dragX, onClick) => {
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
      <IconButton
        icon="trash"
        color={GlobalStyles.colors.backgroundColor}
        size={36}
        onPress={onClick}
        buttonStyle={{ marginRight: 30 }}
      />
    </View>
  );
};
function renderExpenseItem(itemData) {
  const index = itemData.index;

  return (
    <View style={{ height: 55, width: "100%" }}>
      <Swipeable
        renderLeftActions={(progress, dragX) =>
          renderLeftActions(progress, dragX, onClick.bind(this, itemData))
        }
        onSwipeableOpen={closeRow.bind(this, index)}
        ref={(ref) => (row[index] = ref)}
        leftOpenValue={-100}
        disableRightSwipe={true}
        overshootFriction={8}
      >
        <ExpenseItem {...itemData.item} />
      </Swipeable>
    </View>
  );
}

function onClick({ item, index }) {
  const editedExpenseId = item.id;
  const uid = item.uid;
  async function deleteExp() {
    try {
      const item = {
        type: "delete",
        expense: {
          tripid: tripid,
          uid: uid,
          id: editedExpenseId,
        },
      };
      await deleteExpenseOnlineOffline(item);
      expenseCtx.deleteExpense(editedExpenseId);
    } catch (error) {
      console.log(i18n.t("deleteError"), error);
    }
  }
  async function deleteExpenseHandler() {
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

  setTimeout(() => {
    forceCloseRow(index);
  }, 1500);
}

function forceCloseRow(index) {
  row[index].close();
}

// Displays a list of all expenses.
function ExpensesList({ expenses, refreshControl, periodValue }) {
  // const flatListRef = useRef(null);
  const tripCtx = useContext(TripContext);
  expenseCtx = useContext(ExpensesContext);
  const layoutAnim = Layout.damping(50).stiffness(300).overshootClamping(true);
  tripid = tripCtx.tripid;

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
        marginRight: 20,
        backgroundColor: GlobalStyles.colors.backgroundColor,
      }}
    >
      <Animated.FlatList
        // ref={flatListRef}
        itemLayoutAnimation={layoutAnim}
        data={expenses}
        renderItem={renderExpenseItem}
        ListFooterComponent={<View style={{ height: 100 }} />}
        keyExtractor={(item) => item.id}
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
