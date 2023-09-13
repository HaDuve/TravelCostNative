import {
  Alert,
  Dimensions,
  Platform,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

import { MemoizedExpenseItem } from "./ExpenseItem";
import React, {
  memo,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import { View } from "react-native";

import Swipeable from "react-native-gesture-handler/Swipeable";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { GlobalStyles } from "../../constants/styles";
import { getAllExpenses, touchAllTravelers } from "../../util/http";
import { TripContext } from "../../store/trip-context";
import { ExpensesContext } from "../../store/expenses-context";
import IconButton from "../UI/IconButton";
import Animated, {
  Easing,
  FadeInLeft,
  FadeInRight,
  FadeInUp,
  FadeOutLeft,
  FadeOutRight,
  FadeOutUp,
  Layout,
} from "react-native-reanimated";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr, ru } from "../../i18n/supportedLanguages";
import {
  deleteExpenseOnlineOffline,
  OfflineQueueManageExpenseItem,
} from "../../util/offline-queue";
import {
  ExpenseData,
  Expense,
  deleteAllExpensesByRangedId,
} from "../../util/expense";
import PropTypes from "prop-types";
import { NetworkContext } from "../../store/network-context";
import { Toast } from "react-native-toast-message/lib/src/Toast";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useState } from "react";
import LoadingBarOverlay from "../UI/LoadingBarOverlay";
import { Text } from "react-native-paper";
import { formatExpenseWithCurrency } from "../../util/string";
import { addShadowItemsToExpenses } from "./ExpenseListUtil";
import { UserContext } from "../../store/user-context";
import * as Haptics from "expo-haptics";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;

// Displays a list of all expenses.
function ExpensesList({
  expenses,
  refreshControl,
  showSumForTravellerName,
  isFiltered,
}) {
  // GLOBALS across all expenseItems
  let tripID = "";
  // let expenseCtx;
  let filtered = false;
  // let navigation;
  const row = useMemo(() => [], []);
  const prevOpenedRow = useRef(null);
  let travellerName = "";
  const navigation = useNavigation();
  // console.log("expenses: ", expenses.length);

  const { isConnected, strongConnection } = useContext(NetworkContext);
  const isOnline = isConnected && strongConnection;
  const { tripid } = useContext(TripContext);
  const { periodName } = useContext(UserContext);
  const expenseCtx = useContext(ExpensesContext);
  const layoutAnim = Layout.damping(50).stiffness(300).overshootClamping(1);
  tripID = tripid;
  travellerName = showSumForTravellerName;
  if (isFiltered) filtered = true;
  const [selectable, setSelectable] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  // autoscroll to the first item after the header
  const flatListRef = useRef(null);
  // for scroll to top
  const [contentVerticalOffset, setContentVerticalOffset] = useState(0);
  const CONTENT_OFFSET_THRESHOLD = 300;
  const showScrollToTop = contentVerticalOffset > CONTENT_OFFSET_THRESHOLD;

  if (expenses.length < 6) addShadowItemsToExpenses(expenses);

  const forceCloseRow = useCallback(
    (index) => {
      try {
        row[index].close();
      } catch (error) {
        console.log("forceCloseRow ~ error", error);
      }
    },
    [row]
  );
  const closeRow = useCallback(
    (index) => {
      if (prevOpenedRow.current && prevOpenedRow.current !== row[index]) {
        prevOpenedRow.current.close();
      }
      prevOpenedRow.current = row[index];

      setTimeout(() => {
        forceCloseRow(index);
      }, 1500);
    },
    [forceCloseRow, row]
  );

  const renderRightActions = useCallback((progress, dragX, onClick) => {
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
  }, []);
  const onClick = useCallback(({ item, index }, isOnline) => {
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
        const allExpenses = await getAllExpenses(tripID);
        for (let i = 0; i < allExpenses.length; i++) {
          const expense = allExpenses[i];
          if (expense?.rangeId == item?.rangeId) {
            const queueItem: OfflineQueueManageExpenseItem = {
              type: "delete",
              expense: {
                tripid: tripID,
                uid: expense.uid,
                id: expense.id,
              },
            };
            expenseCtx?.deleteExpense(expense.id);
            await deleteExpenseOnlineOffline(queueItem, isOnline);
          }
        }
        await touchAllTravelers(tripID, true);
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
                      tripid: tripID,
                      uid: uid,
                      id: editedExpenseId,
                    },
                  };
                  expenseCtx?.deleteExpense(editedExpenseId);
                  await deleteExpenseOnlineOffline(item, isOnline);
                  await touchAllTravelers(tripID, true);
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
              tripid: tripID,
              uid: uid,
              id: editedExpenseId,
            },
          };
          expenseCtx?.deleteExpense(editedExpenseId);
          await deleteExpenseOnlineOffline(item, isOnline);
          await touchAllTravelers(tripID, true);
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
  }, []);

  const renderExpenseItem = useCallback(
    (
      isOnline: boolean,
      selectable: boolean,
      selected: ExpenseData[],
      selectItem: (item: ExpenseData, id: object) => void,
      setSelectable: (selectable: boolean) => void,
      itemData
    ) => {
      if (itemData.item.id.includes("shadow"))
        return <View style={{ height: 55, width: "100%" }}></View>;
      const index = itemData.index;
      const selectableJSX = (
        <Animated.View
          entering={FadeInLeft}
          exiting={FadeOutLeft}
          style={{
            flex: 0,
            position: "absolute",
            top: -36,
            left: -46,
            zIndex: 1,
          }}
        >
          <IconButton
            icon={
              selected.includes(itemData.item.id)
                ? "ios-checkmark-circle"
                : "ellipse-outline"
            }
            color={
              selected.includes(itemData.item.id)
                ? GlobalStyles.colors.textColor
                : GlobalStyles.colors.gray700
            }
            size={16}
            onPress={selectItem.bind(this, itemData.item.id)}
            buttonStyle={{ padding: 48 }}
          ></IconButton>
        </Animated.View>
      );
      if (Platform.OS === "android")
        return (
          <View
            style={{
              height: 55,
              width: "100%",
              backgroundColor: GlobalStyles.colors.backgroundColor,
            }}
          >
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
                {selectable && selectableJSX}
                <MemoizedExpenseItem
                  showSumForTravellerName={travellerName}
                  filtered={filtered}
                  setSelectable={setSelectable}
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
            {selectable && selectableJSX}
            <MemoizedExpenseItem
              showSumForTravellerName={travellerName}
              filtered={filtered}
              {...itemData.item}
            />
          </Swipeable>
        </View>
      );
    },
    [closeRow, travellerName, filtered, renderRightActions, onClick, row]
  );

  const scrollTo = useCallback(
    (index: number, animated = true) => {
      if (!flatListRef.current || index > expenses.length + 1) return;
      if (flatListRef.current) {
        flatListRef.current.scrollToIndex({
          index: index,
          animated: animated,
        });
      }
    },
    [expenses.length]
  );
  const scrollToTopHandler = useCallback(() => {
    scrollTo(1);
  }, [scrollTo]);

  useEffect(() => {
    scrollTo(1);
  }, [scrollTo, periodName]);

  const selectItem = (item, id: object) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log("selectItem ~ item:", item, id);
    if (selected.includes(item)) {
      setSelected(selected.filter((newItem) => newItem !== item));
    } else {
      setSelected([...selected, item]);
    }
    console.log("selected", selected);
  };
  const selectAll = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    requestAnimationFrame(() => {
      if (selected.length === expenses.length) {
        setSelected([]);
      } else {
        setSelected(expenses.map((item) => item.id));
      }
    });
  }, [expenses.length, selected.length]);

  // function moveExpensesToTrip() {
  //   if (selected.length === 0) return;
  //   // TODO: finish this function
  // }
  // function editMultipleExpenses() {
  //   if (selected.length === 0) return;
  //   // TODO: finish this function
  // }

  const finderWithExpenses = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selected.length === 0) return;
    const finderExpenses = expenses.filter(
      (item) => selected.includes(item.id) && !item.id.includes("shadow")
    );
    navigation.navigate("FilteredPieCharts", {
      expenses: finderExpenses,
      dayString: `${finderExpenses.length} selected Expenses from ${periodName}`,
      noList: true,
    });
  }, [expenses.length, periodName, selected.length]);

  const deleteSelected = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selected.length === 0) return;
    Alert.alert(
      `Delete selected expenses?`,
      `This will delete all selected entries!`,
      [
        //i18n.t("deleteAllExpenses"), i18n.t("deleteAllExpensesExt")
        // The "No" button
        // Does nothing but dismiss the dialog when tapped
        {
          text: i18n.t("no"),
          onPress: () => {
            return;
          },
        },
        // The "Yes" button
        {
          text: i18n.t("yes"),
          onPress: async () => {
            try {
              navigation?.popToTop();
              setSelected([]);
              setSelectable(false);
              Toast.show({
                type: "loading",
                text1: i18n.t("toastDeleting1"),
                text2: i18n.t("toastDeleting2"),
                autoHide: false,
              });
              for (let i = 0; i < selected.length; i++) {
                const expenseItem = expenses.find(
                  (item) => item.id === selected[i]
                );
                if (expenseItem.rangeId) {
                  await deleteAllExpensesByRangedId(
                    tripID,
                    expenseItem,
                    isOnline,
                    expenseCtx
                  );
                }
                const item: OfflineQueueManageExpenseItem = {
                  type: "delete",
                  expense: {
                    tripid: tripID,
                    uid: expenseItem.uid,
                    id: expenseItem.id,
                  },
                };
                expenseCtx?.deleteExpense(expenseItem.id);
                await deleteExpenseOnlineOffline(item, isOnline);
              }
              await touchAllTravelers(tripID, true);
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
      ]
    );
  }, [expenses.length, isOnline, selected.length, tripID]);

  const selectPressHandler = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    requestAnimationFrame(() => {
      console.log("selectPressHandler ~ selectable", selectable);
      if (selectable) {
        setSelectable(false);
        setSelected([]);
        scrollTo(1);
      } else {
        setSelectable(true);
        scrollTo(0);
      }
    });
  }, [scrollTo, selectable]);

  const listHeaderJSX = useMemo(() => {
    return (
      <View
        style={{
          paddingRight: 20,
          marginTop: 12,
          alignItems: "center",
          justifyContent: "flex-end",
          flexDirection: "row",
        }}
      >
        {selectable && (
          <Animated.View entering={FadeInRight} exiting={FadeOutRight}>
            <IconButton
              icon={"ios-trash-outline"}
              size={24}
              color={
                selected.length > 0
                  ? GlobalStyles.colors.gray700
                  : GlobalStyles.colors.gray600
              }
              onPress={deleteSelected}
            ></IconButton>
          </Animated.View>
        )}
        {selectable && !isFiltered && (
          <Animated.View entering={FadeInRight} exiting={FadeOutRight}>
            <IconButton
              icon={"pie-chart-outline"}
              size={24}
              color={
                selected.length > 0
                  ? GlobalStyles.colors.gray700
                  : GlobalStyles.colors.gray600
              }
              onPress={finderWithExpenses}
            ></IconButton>
          </Animated.View>
        )}
        {selectable && (
          <Animated.View entering={FadeInRight} exiting={FadeOutRight}>
            <IconButton
              icon={
                selected.length > 0 ? "close-outline" : "checkmark-done-outline"
              }
              size={24}
              color={GlobalStyles.colors.gray700}
              onPress={selectAll}
            ></IconButton>
          </Animated.View>
        )}
        <IconButton
          icon={"ellipsis-horizontal-circle-outline"}
          size={24}
          color={GlobalStyles.colors.gray700}
          onPress={selectPressHandler}
        ></IconButton>
      </View>
    );
  }, [
    selectable,
    selected.length,
    deleteSelected,
    finderWithExpenses,
    selectAll,
    selectPressHandler,
    isFiltered,
  ]);

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
        scrollEnabled={true}
        onScroll={(event) => {
          setContentVerticalOffset(event.nativeEvent.contentOffset.y);
        }}
        data={expenses}
        ref={flatListRef}
        layout={layoutAnim}
        renderItem={renderExpenseItem.bind(
          this,
          isOnline,
          selectable,
          selected,
          selectItem,
          setSelectable
        )}
        ListFooterComponent={
          <View style={{ height: Dimensions.get("screen").height / 1.8 }} />
        }
        ListHeaderComponent={listHeaderJSX}
        keyExtractor={(item: Expense) => item.id}
        refreshControl={refreshControl}
        getItemLayout={(data, index) => ({
          length: 55,
          offset: 55 * index,
          index,
        })}
        initialScrollIndex={1}
        onScrollToIndexFailed={(info) => {
          const wait = new Promise((resolve) => setTimeout(resolve, 500));
          wait.then(() => {
            flatListRef.current?.scrollToIndex({
              index: info.index,
              animated: true,
            });
          });
        }}
      />
      {showScrollToTop && (
        <Animated.View
          entering={FadeInUp.duration(250).easing(Easing.linear)}
          exiting={FadeOutUp.duration(200).easing(Easing.linear)}
          style={[styles.scrollToTopButton, GlobalStyles.shadowPrimary]}
        >
          <TouchableOpacity
            onPress={() => {
              scrollToTopHandler();
            }}
          >
            <Text style={styles.scrollToTopText}>Scroll To Top</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </Animated.View>
  );
}

export default ExpensesList;
const areEqual = (prevProps, nextProps) => {
  return prevProps.expenses === nextProps.expenses;
};
export const MemoizedExpensesList = memo(ExpensesList, areEqual);

ExpensesList.propTypes = {
  expenses: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      description: PropTypes.string,
      amount: PropTypes.number,
      date: PropTypes.instanceOf(Date),
      currency: PropTypes.string,
      category: PropTypes.string,
      uid: PropTypes.string,
    })
  ).isRequired,
  refreshControl: PropTypes.object,
  showSumForTravellerName: PropTypes.string,
  isFiltered: PropTypes.bool,
};

const styles = StyleSheet.create({
  scrollToTopButton: {
    flex: 1,
    position: "absolute",
    top: 10,
    left: "35%",
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: GlobalStyles.colors.backgroundColor,
    borderRadius: 50,
    borderColor: GlobalStyles.colors.primaryGrayed,
    borderWidth: 1,
  },
  scrollToTopText: {
    color: GlobalStyles.colors.primary700,
    fontSize: 12,
    fontWeight: "bold",
  },
});
