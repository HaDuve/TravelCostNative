/* eslint-disable react-hooks/exhaustive-deps */
import {
  Alert,
  Dimensions,
  Platform,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

import { MemoizedExpenseItem } from "./ExpenseItem";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { View } from "react-native";

import Swipeable from "react-native-gesture-handler/Swipeable";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { GlobalStyles, ListLayoutAnimation } from "../../constants/styles";
import {
  fetchTripName,
  getAllExpenses,
  touchAllTravelers,
} from "../../util/http";
import { TripContext } from "../../store/trip-context";
import { ExpensesContext } from "../../store/expenses-context";
import IconButton from "../UI/IconButton";
import Animated, {
  Easing,
  FadeIn,
  FadeInLeft,
  FadeInRight,
  FadeInUp,
  FadeOutLeft,
  FadeOutRight,
  FadeOutUp,
} from "react-native-reanimated";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr, ru } from "../../i18n/supportedLanguages";
import {
  deleteExpenseOnlineOffline,
  OfflineQueueManageExpenseItem,
  storeExpenseOnlineOffline,
} from "../../util/offline-queue";
import {
  ExpenseData,
  Expense,
  deleteAllExpensesByRangedId,
} from "../../util/expense";
import PropTypes from "prop-types";
import { NetworkContext } from "../../store/network-context";
import { Toast } from "react-native-toast-message/lib/src/Toast";
import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import LoadingBarOverlay from "../UI/LoadingBarOverlay";
import { Text } from "react-native-paper";
import { formatExpenseWithCurrency } from "../../util/string";
import { addShadowItemsToExpenses } from "./ExpenseListUtil";
import { UserContext } from "../../store/user-context";
import * as Haptics from "expo-haptics";
import { toShortFormat } from "../../util/date";
import {
  DEVELOPER_MODE,
  EXPENSES_LOAD_TIMEOUT,
  MAX_EXPENSES_RENDER,
} from "../../confAppConstants";
import { TripAsObject } from "../../screens/TripSummaryScreen";
import { Pressable } from "react-native";
import safeLogError from "../../util/error";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;

// Displays a list of all expenses.
function ExpensesList({ expenses, showSumForTravellerName, isFiltered }) {
  // GLOBALS across all expenseItems
  let tripID = "";
  // let expenseCtx;
  let filtered = false;
  // let navigation;
  const row = useMemo(() => [], []);
  const prevOpenedRow = useRef(null);
  let travellerName = "";
  const navigation = useNavigation();

  const { isConnected, strongConnection } = useContext(NetworkContext);
  const isOnline = isConnected && strongConnection;
  const { tripid, tripName } = useContext(TripContext);
  const { periodName } = useContext(UserContext);
  const expenseCtx = useContext(ExpensesContext);
  const userCtx = useContext(UserContext);
  tripID = tripid;
  travellerName = showSumForTravellerName;
  if (isFiltered) filtered = true;
  const multipleTripsInHistory =
    userCtx.tripHistory && userCtx.tripHistory.length > 1;

  const [selectable, setSelectable] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  // autoscroll to the first item after the header
  const flatListRef = useRef(null);
  // for scroll to top
  const [contentVerticalOffset, setContentVerticalOffset] = useState(0);
  const CONTENT_OFFSET_THRESHOLD = 300;
  const showScrollToTop = contentVerticalOffset > CONTENT_OFFSET_THRESHOLD;

  if (expenses?.length < 6) addShadowItemsToExpenses(expenses);

  const forceCloseRow = useCallback(
    (index) => {
      try {
        row[index].close();
      } catch (error) {
        // console.log("forceCloseRow ~ error", error);
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
    const editedExpenseId = item.id;
    const uid = item.uid;
    async function deleteAllExpenses() {
      try {
        navigation?.popToTop();
        Toast.show({
          type: "loading",
          text1: i18n.t("toastDeleting1"),
          text2: i18n.t("toastDeleting2"),
          autoHide: false,
        });
        const allExpenses = isOnline
          ? await getAllExpenses(tripID)
          : expenseCtx?.expenses;
        for (let i = 0; i < allExpenses?.length; i++) {
          const expense = allExpenses[i];
          if (expense?.rangeId == item?.rangeId) {
            // console.log("found a ranged id match", expense?.rangeId);
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
        // console.log("delete All Error:", error);
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
          // console.log(i18n.t("deleteError"), error);
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
      expensesLength: number,
      itemData
    ) => {
      const id = itemData.item.id || null;
      if (
        id &&
        itemData.item.id[0] === "s" &&
        itemData.item.id[1] === "h" &&
        itemData.item.id[2] === "a" &&
        itemData.item.id[3] === "d" &&
        itemData.item.id[4] === "o" &&
        itemData.item.id[5] === "w"
      )
        return <View style={{ height: 55, width: "100%" }}></View>;
      const index = itemData.index;
      const navigateToExpense = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        navigation.navigate("ManageExpense", {
          expenseId: itemData.item.id,
        });
      };
      if (expensesLength > MAX_EXPENSES_RENDER) {
        // show cheap JSX
        return (
          <View>
            <TouchableOpacity
              style={styles.fastExpenseContainer}
              onPress={() => navigateToExpense()}
            >
              <View>
                {/* {selectable && cheapSelectableJSX} */}
                <Text style={styles.descriptionText}>
                  {itemData.item?.description}
                </Text>
                <Text style={styles.secondaryText}>
                  {toShortFormat(itemData.item?.date)}{" "}
                </Text>
              </View>
              <Text style={styles.fastExpenseText}>
                {formatExpenseWithCurrency(
                  itemData.item?.amount || 0,
                  itemData.item?.currency
                )}
              </Text>
            </TouchableOpacity>
          </View>
        );
      }
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
      //else platform ios
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
      if (!flatListRef.current || index > expenses?.length + 1) return;
      if (flatListRef.current) {
        flatListRef.current.scrollToIndex({
          index: index,
          animated: animated,
        });
      }
    },
    [expenses?.length]
  );
  const scrollToTopHandler = useCallback(() => {
    scrollTo(1);
  }, [scrollTo]);

  useEffect(() => {
    scrollTo(1);
  }, [scrollTo, periodName]);

  const selectItem = (item) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selected.includes(item)) {
      setSelected(selected.filter((newItem) => newItem !== item));
    } else {
      setSelected([...selected, item]);
    }
    // console.log("selected", selected);
  };
  const selectAll = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    requestAnimationFrame(() => {
      if (selected?.length === expenses?.length) {
        setSelected([]);
      } else {
        setSelected(expenses.map((item) => item.id));
      }
    });
  }, [expenses?.length, selected?.length]);

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
      dayString: `${finderExpenses?.length} selected Expenses from ${periodName}`,
      noList: true,
    });
  }, [expenses?.length, periodName, selected?.length]);

  const [allTrips, setAllTrips] = useState<TripAsObject[]>([]);
  useEffect(() => {
    async function asyncSetAllTrips() {
      if (!userCtx.tripHistory) return;
      const allTripsAsObjects: TripAsObject[] = [];

      for (let i = 0; i < userCtx.tripHistory.length; i++) {
        const tripid = userCtx.tripHistory[i];
        const tripName = await fetchTripName(tripid);
        allTripsAsObjects.push({
          tripid: tripid,
          tripname: tripName,
          selected: true,
        });
      }
      setAllTrips(allTripsAsObjects);
    }
    asyncSetAllTrips();
  }, [userCtx.tripHistory?.length]);

  const handleEditMultipleExpenses = useCallback(async () => {
    if (!selected || selected.length === 0) return;
    if (selected.length === 1) {
      navigation.navigate("ManageExpense", { expenseId: selected[0] });
    }
    // else we have an array of expenseIds which we want to simultaneously edit
    // TODO: implement this in ManageMultipleExpenses.tsx and App.tsx
    // navigation.navigate("ManageMultipleExpenses", { multipleIds: selected });
  }, [selected.length]);

  const handleMoveToTripPress = useCallback(
    async (_tripid, _tripname) => {
      // console.log("handleMoveToTripPress ~ tripid", _tripid);
      // console.log("handleMoveToTripPress ~ tripname", _tripname);
      Toast.show({
        type: "loading",
        text1: `Moving ${selected?.length} expenses`,
        text2: `from ${tripName} to ${_tripname}!`,
        autoHide: false,
      });
      navigation?.popToTop();

      for (let i = 0; i < selected?.length; i++) {
        const expenseData = expenses.find((item) => item.id === selected[i]);
        try {
          const expenseUid = expenseData.uid;
          const expenseId = expenseData.id;
          expenseData.date = expenseData.startDate;
          const itemToCreate: OfflineQueueManageExpenseItem = {
            type: "add",
            expense: {
              tripid: _tripid,
              uid: expenseUid,
              expenseData: expenseData,
            },
          };
          const itemToDelete: OfflineQueueManageExpenseItem = {
            type: "delete",
            expense: {
              tripid: tripID,
              uid: expenseUid,
              id: expenseId,
            },
          };
          await storeExpenseOnlineOffline(itemToCreate, isOnline, _tripid);
          expenseCtx?.deleteExpense(expenseId);
          await deleteExpenseOnlineOffline(itemToDelete, isOnline);
          await touchAllTravelers(tripID, true);
          await touchAllTravelers(_tripid, true);
          Toast.hide();
        } catch (error) {
          safeLogError(error);
          Toast.show({
            text1: i18n.t("error"),
            text2: i18n.t("error2"),
            type: "error",
          });
        }
      }
      setSelected([]);
      setSelectable(false);
    },
    [selected.length, expenses?.length, tripID, tripName]
  );

  const moveSelectedToTrip = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selected?.length === 0) return;
    const buttonTripList = allTrips.map((trip) => {
      if (trip.tripid === tripID)
        return {
          text: i18n.t("cancel"),
          onPress: () => {
            return;
          },
          style: "cancel",
        };
      return {
        text: trip.tripname,
        onPress: handleMoveToTripPress.bind(this, trip.tripid, trip.tripname),
      };
    });
    // TODO: fix this for android, we cant seem to have multiple buttons in alert
    Alert.alert(
      `Move selected expenses to another trip?`,
      `This will move them to another trip!`,
      [
        // add all the triplistbuttons
        ...buttonTripList,
      ]
    );
  }, [expenses?.length, isOnline, selected?.length, tripID]);

  const deleteSelected = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selected?.length === 0) return;
    Alert.alert(
      `Delete selected expenses?`,
      `This will delete ${selected.length} selected entries!`,
      [
        //i18n.t("deleteAllExpenses"), i18n.t("deleteAllExpensesExt")
        // The "No" button
        // Does nothing but dismiss the dialog when tapped
        {
          text: i18n.t("cancel"),
          onPress: () => {
            return;
          },
        },
        // The "Yes" button
        {
          text: i18n.t("delete"),
          style: "destructive",
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
              for (let i = 0; i < selected?.length; i++) {
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
              // console.log(i18n.t("deleteError"), error);
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
  }, [expenses?.length, isOnline, selected?.length, tripID]);

  const selectPressHandler = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    requestAnimationFrame(() => {
      // console.log("selectPressHandler ~ selectable", selectable);
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
      expenses?.length < MAX_EXPENSES_RENDER && (
        <View
          style={{
            paddingRight: 20,
            marginTop: 12,
            alignItems: "center",
            justifyContent: "flex-end",
            flexDirection: "row",
          }}
        >
          {/* hide until production ready */}
          {selectable && DEVELOPER_MODE && (
            <Animated.View entering={FadeInRight} exiting={FadeOutRight}>
              <IconButton
                icon={"document-outline"}
                size={24}
                color={
                  selected?.length > 0
                    ? GlobalStyles.colors.gray700
                    : GlobalStyles.colors.gray600
                }
                onPress={handleEditMultipleExpenses}
              ></IconButton>
            </Animated.View>
          )}
          {selectable && (
            <Animated.View entering={FadeInRight} exiting={FadeOutRight}>
              <IconButton
                icon={"ios-trash-outline"}
                size={24}
                color={
                  selected?.length > 0
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
                  selected?.length > 0
                    ? GlobalStyles.colors.gray700
                    : GlobalStyles.colors.gray600
                }
                onPress={finderWithExpenses}
              ></IconButton>
            </Animated.View>
          )}
          {selectable && multipleTripsInHistory && (
            <Animated.View entering={FadeInRight} exiting={FadeOutRight}>
              <IconButton
                icon={"md-arrow-undo-outline"}
                size={24}
                color={
                  selected?.length > 0
                    ? GlobalStyles.colors.gray700
                    : GlobalStyles.colors.gray600
                }
                onPress={moveSelectedToTrip}
              ></IconButton>
            </Animated.View>
          )}
          {selectable && (
            <Animated.View entering={FadeInRight} exiting={FadeOutRight}>
              <IconButton
                icon={
                  selected?.length > 0
                    ? "close-outline"
                    : "checkmark-done-outline"
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
      )
    );
  }, [
    selectable,
    selected?.length,
    deleteSelected,
    finderWithExpenses,
    selectAll,
    selectPressHandler,
    isFiltered,
  ]);

  return (
    <Animated.View
      entering={FadeIn.delay(isFiltered ? 0 : EXPENSES_LOAD_TIMEOUT).duration(
        isFiltered ? 0 : 400
      )}
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
          marginTop: -50,
        }}
      >
        {!isFiltered && <LoadingBarOverlay></LoadingBarOverlay>}
      </View>
      <Animated.FlatList
        scrollEnabled={true}
        onScroll={(event) => {
          setContentVerticalOffset(event.nativeEvent.contentOffset.y);
        }}
        data={expenses}
        ref={flatListRef}
        layout={ListLayoutAnimation}
        renderItem={renderExpenseItem.bind(
          this,
          isOnline,
          selectable,
          selected,
          selectItem,
          setSelectable,
          expenses?.length
        )}
        ListFooterComponent={
          <View style={{ height: Dimensions.get("screen").height / 1.8 }} />
        }
        ListHeaderComponent={listHeaderJSX}
        keyExtractor={(item: Expense) => item.id}
        // refreshControl={refreshControl}
        getItemLayout={(data, index) => ({
          length: 55,
          offset: 55 * index,
          index,
        })}
        initialScrollIndex={1}
        windowSize={8}
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
          <Pressable
            style={({ pressed }) => [pressed && GlobalStyles.pressedWithShadow]}
            onPress={() => {
              scrollToTopHandler();
            }}
          >
            <Text style={styles.scrollToTopText}>⬆️ Scroll To Top</Text>
          </Pressable>
        </Animated.View>
      )}
    </Animated.View>
  );
}

export default ExpensesList;

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
    alignSelf: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: GlobalStyles.colors.backgroundColor,
    borderRadius: 50,
    borderColor: GlobalStyles.colors.primaryGrayed,
    borderWidth: 1,
  },
  scrollToTopText: {
    color: GlobalStyles.colors.primary700,
    fontSize: 14,
    fontWeight: "bold",
  },
  fastExpenseContainer: {
    height: 55,
    width: "100%",
    flexDirection: "row",
    alignContent: "center",
    justifyContent: "space-between",
    alignItems: "center",
    paddingLeft: "4%",
    paddingRight: "2%",
  },
  fastExpenseText: {
    color: GlobalStyles.colors.textColor,
    fontSize: 14,
    fontWeight: "300",
    paddingHorizontal: 10,
  },
  descriptionText: {
    // flex: 1,
    // width: "110%",
    fontStyle: "italic",
    fontWeight: "300",
    fontSize: 15,
    zIndex: 2,
    flexWrap: "wrap",
    flexDirection: "row",
  },
  secondaryText: {
    color: GlobalStyles.colors.gray700,
    fontSize: 13,
    zIndex: 1,
  },
});
