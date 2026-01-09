import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { i18n } from "../i18n/i18n";

import {
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import ErrorOverlay from "../components/UI/ErrorOverlay";
import FlatButton from "../components/UI/FlatButton";
import MiniSyncIndicator from "../components/UI/MiniSyncIndicator";
import { GlobalStyles } from "../constants/styles";
import { TripContext } from "../store/trip-context";
import {
  areSplitListsEqual,
  calcOpenSplitsTable,
  simplifySplits,
} from "../util/split";
import PropTypes from "prop-types";
import { UserContext } from "../store/user-context";
import GradientButton from "../components/UI/GradientButton";
import { ExpensesContext } from "../store/expenses-context";
import {
  ExpenseData,
  Split,
  isPaidString,
  getEffectiveIsPaid,
} from "../util/expense";
import Animated from "react-native-reanimated";
import { formatExpenseWithCurrency } from "../util/string";
import { useFocusEffect } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { Pressable, ScrollView } from "react-native";
import { dynamicScale } from "../util/scalingUtil";
import { OrientationContext } from "../store/orientation-context";
import safeLogError from "../util/error";
import { trackEvent } from "../util/vexo-tracking";
import { VexoEvents } from "../util/vexo-constants";

const SplitSummaryScreen = ({ navigation }) => {
  const {
    tripid,
    tripCurrency,
    fetchAndSettleCurrentTrip,
    isPaid,
    isPaidTimestamp,
  } = useContext(TripContext);
  const { freshlyCreated, userName } = useContext(UserContext);
  const { expenses } = useContext(ExpensesContext);
  // avoid rerenders
  useFocusEffect(
    React.useCallback(() => {
      if (freshlyCreated) {
        Toast.show({
          type: "success",
          text1: i18n.t("welcomeToBudgetForNomads"),
          text2: i18n.t("pleaseCreateTrip"),
        });
        navigation.navigate("Profile");
      }
    }, [freshlyCreated, navigation])
  );

  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState();
  const { isPortrait } = useContext(OrientationContext);

  const [splits, setSplits] = useState<Split[]>([]);
  const hasOpenSplits = splits?.length > 0;
  const [showSimplify, setShowSimplify] = useState(true);
  const isTripSettled = isPaid === isPaidString.paid;

  const titleTextOriginal = i18n.t("splitSummaryTitle");
  const titleTextSimplified = i18n.t("splitSummaryTitleSimplified");

  const [titleText, setTitleText] = useState(titleTextOriginal);

  const totalPaidBackTextOriginal = i18n.t("yourMoneyBackWithColon");
  const [totalPaidBackText, setTotalPaidBackText] = useState(
    totalPaidBackTextOriginal
  );
  const totalPayBackTextOriginal = i18n.t("youStillOweWithColon");
  const [totalPayBackText, setTotalPayBackText] = useState(
    totalPayBackTextOriginal
  );

  const getOpenSplits = useCallback(async () => {
    if (!tripid || expenses?.length === 0) return;
    setIsFetching(true);
    try {
      const response = await calcOpenSplitsTable(
        tripid,
        tripCurrency,
        expenses,
        isPaidTimestamp
      );
      const formattedSplits = [];
      let userGetsBack = 0;
      let userHasToPay = 0;
      for (let i = 0; i < response?.length; i++) {
        const split: Split = response[i];
        const tempObj = {
          userName: split.userName,
          whoPaid: split.whoPaid,
          amount: Number(split.amount).toFixed(2),
        };
        formattedSplits.push(tempObj);
        userGetsBack +=
          split.whoPaid === userName ? Number(split.amount) : Number(0);
        userHasToPay +=
          split.userName === userName ? Number(split.amount) : Number(0);
      }
      setSplits(formattedSplits);
      // When trip is settled, all expenses are paid, so clear totals
      // Otherwise show calculated totals
      const isSettled = isPaid === isPaidString.paid;
      if (isSettled) {
        setTotalPaidBackText(
          totalPaidBackTextOriginal + formatExpenseWithCurrency(0, tripCurrency)
        );
        setTotalPayBackText(
          totalPayBackTextOriginal + formatExpenseWithCurrency(0, tripCurrency)
        );
      } else {
        setTotalPaidBackText(
          totalPaidBackTextOriginal +
            formatExpenseWithCurrency(userGetsBack, tripCurrency)
        );
        setTotalPayBackText(
          totalPayBackTextOriginal +
            formatExpenseWithCurrency(userHasToPay, tripCurrency)
        );
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: i18n.t("error"),
        text2: i18n.t("fetchError"),
        visibilityTime: 2000,
      });
      safeLogError("Could not fetch splits from the web database! " + error);
    }
    setIsFetching(false);
  }, [
    totalPaidBackTextOriginal,
    totalPayBackTextOriginal,
    isPaid,
    isPaidTimestamp,
    tripCurrency,
    tripid,
    userName,
    expenses,
  ]);
  const simpleSplits = useCallback(() => simplifySplits(splits), [splits])();
  const sameList = useMemo(
    () => areSplitListsEqual(splits, simpleSplits),
    [splits, simpleSplits]
  );
  const noSimpleSplits = !simpleSplits || simpleSplits?.length < 1 || sameList;

  // Pre-compute filtered expenses for each split to avoid O(N*M) filtering on every render
  const splitExpensesMap = useMemo(() => {
    const map = new Map<string, ExpenseData[]>();

    if (!splits || splits.length === 0) {
      return map;
    }

    // Create a key for each split and pre-filter expenses
    splits.forEach((split) => {
      const key = `${split.userName}-${split.whoPaid}`;

      // Only compute if not already computed
      if (!map.has(key)) {
        const expensesList = expenses.filter((expense: ExpenseData) => {
          // Skip paid expenses
          if (
            getEffectiveIsPaid(expense, isPaidTimestamp) === isPaidString.paid
          ) {
            return false;
          }

          const splitList = expense?.splitList;
          const splitListLength = splitList?.length;
          for (let i = 0; i < splitListLength; i++) {
            const expenseSplit = splitList[i];
            if (
              (expenseSplit.userName === split.userName &&
                expenseSplit.whoPaid === split.whoPaid) ||
              expenseSplit.userName === split.whoPaid ||
              expenseSplit.whoPaid === split.userName
            ) {
              return true;
            }
          }
          return false;
        });

        map.set(key, expensesList);
      }
    });

    return map;
  }, [splits, expenses, isPaidTimestamp]);

  useEffect(() => {
    if (isFetching || !tripid) return;
    getOpenSplits();
  }, [getOpenSplits, isFetching, tripid]);

  const handleSimpflifySplits = useCallback(async () => {
    try {
      // Track simplify splits
      trackEvent(VexoEvents.SIMPLIFY_SPLITS_PRESSED, {
        splitsCount: splits?.length || 0,
      });

      if (noSimpleSplits) {
        // Alert.alert("No Splits to Simplify");
        Toast.show({
          type: "error",
          text1: i18n.t("noSplitsToSimplify"),
          visibilityTime: 2000,
        });
        navigation.pop();
      }
      if (simpleSplits.some((split) => split.whoPaid === "Error")) {
        setTitleText(titleTextSimplified);
        setShowSimplify(false);
        Toast.show({
          type: "error",
          text1: i18n.t("couldNotSimplifySplits"),
          text2: i18n.t("somethingWentWrongSorry"),
          visibilityTime: 2000,
        });
        return;
      }
      setSplits(simpleSplits);
      setShowSimplify(false);
      setTitleText(titleTextSimplified);
    } catch (error) {
      safeLogError(error, "SplitSummaryScreen.tsx", 204);
    }
  }, [
    navigation,
    noSimpleSplits,
    simpleSplits,
    splits?.length,
    titleTextSimplified,
  ]);

  function errorHandler() {
    setError(null);
  }

  const settleSplitsHandler = useCallback(async () => {
    setIsFetching(true);
    try {
      await fetchAndSettleCurrentTrip();
      setSplits([]);
      setShowSimplify(false);
      setTitleText(titleTextOriginal);
      setTotalPaidBackText("");
      setTotalPayBackText("");
    } catch (error) {
      safeLogError(error, "SplitSummaryScreen.tsx", 224);
    }
    setIsFetching(false);
    navigation.popToTop();
  }, [fetchAndSettleCurrentTrip, navigation, titleTextOriginal]);

  const renderSplitItem = useCallback(
    (itemData) => {
      // Use pre-computed filtered expenses from memoized map instead of filtering on every render
      const key = `${itemData.item.userName}-${itemData.item.whoPaid}`;
      const expensesList = splitExpensesMap.get(key) || [];

      const item = itemData.item;
      return (
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.navigate("FilteredExpenses", {
              expenses: expensesList,
              dayString: `${item.userName} ${i18n.t("owes")} ${
                item.whoPaid
              } ${formatExpenseWithCurrency(item.amount, tripCurrency)}`,
            });
          }}
          style={({ pressed }) => [
            styles.splitContainer,
            GlobalStyles.strongShadow,
            pressed && GlobalStyles.pressedWithShadow,
          ]}
        >
          <Text style={styles.splitText}>
            <Text style={styles.userText}>{item.userName} </Text>
            <Text style={styles.normalText}>{i18n.t("owes")} </Text>
            <Text style={styles.userText}>{item.whoPaid} </Text>
            <Text style={styles.amountText}>
              {formatExpenseWithCurrency(item.amount, tripCurrency)}
            </Text>
          </Text>
        </Pressable>
      );
    },
    [tripCurrency, splitExpensesMap, navigation]
  );

  const ButtonContainerJSX = (
    <View style={isPortrait && styles.buttonContainer}>
      {!showSimplify && (
        <FlatButton
          textStyle={styles.buttonText}
          onPress={async () => {
            if (showSimplify) {
              trackEvent(VexoEvents.SPLIT_SUMMARY_BACK_PRESSED);
              navigation.goBack();
            } else {
              await getOpenSplits();
              setShowSimplify(true);
              setTitleText(titleTextOriginal);
            }
          }}
        >
          {i18n.t("back")}
        </FlatButton>
      )}
      {showSimplify && !noSimpleSplits && (
        <GradientButton
          buttonStyle={styles.button}
          style={styles.button}
          onPress={handleSimpflifySplits}
        >
          {i18n.t("simplifySplits")}
        </GradientButton>
      )}
      {hasOpenSplits && !isTripSettled && (
        <GradientButton
          style={styles.button}
          colors={GlobalStyles.gradientColors}
          darkText
          buttonStyle={{
            backgroundColor: GlobalStyles.colors.errorGrayed,
          }}
          onPress={async () => {
            Alert.alert(
              i18n.t("settleSplits"),
              i18n.t("sureSettleSplitsFullMessage"),
              [
                {
                  text: i18n.t("cancel"),
                  style: "cancel",
                },
                {
                  text: i18n.t("confirmSettle"),
                  onPress: async () => {
                    trackEvent(VexoEvents.SETTLE_ALL_PRESSED, {
                      splitsCount: splits?.length || 0,
                    });
                    await settleSplitsHandler();
                  },
                },
              ]
            );
          }}
        >
          {i18n.t("settleSplits")}
        </GradientButton>
      )}
    </View>
  );

  if (error && !isFetching) {
    return <ErrorOverlay message={error} onConfirm={errorHandler} />;
  }

  return (
    <ScrollView
      scrollEnabled={isPortrait}
      contentContainerStyle={styles.container}
    >
      <Animated.View
        style={[
          GlobalStyles.wideStrongShadow,
          styles.cardContainer,
          !isPortrait && styles.row,
        ]}
      >
        <View style={styles.cardContent}>
          <View>
            <View style={styles.titleContainer}>
              <Text style={styles.titleText}> {titleText}</Text>
              <View style={styles.syncIndicatorContainer}>
                <MiniSyncIndicator
                  isVisible={isFetching}
                  size={dynamicScale(16, false, 0.5)}
                />
              </View>
            </View>
            {isTripSettled && (
              <View style={styles.subTitleContainer}>
                <Text
                  style={[
                    styles.subTitleText,
                    {
                      color: GlobalStyles.colors.primary500,
                      fontWeight: "600",
                    },
                  ]}
                >
                  {i18n.t("tripSettledAllExpensesPaid")}
                </Text>
              </View>
            )}
            {!isTripSettled && (
              <>
                <View style={styles.subTitleContainer}>
                  <Text style={styles.subTitleText}> {totalPaidBackText}</Text>
                </View>
                <View style={styles.subTitleContainer}>
                  <Text style={styles.subTitleText}> {totalPayBackText}</Text>
                </View>
              </>
            )}
            {!isPortrait && ButtonContainerJSX}
          </View>

          <FlatList
            style={{
              paddingHorizontal: dynamicScale(8, false, 0.5),
              flex: 1,
            }}
            contentContainerStyle={{
              paddingBottom: isPortrait ? 0 : dynamicScale(18, false, 0.5),
            }}
            data={splits}
            scrollEnabled={!isPortrait}
            ListHeaderComponent={
              <View style={{ height: dynamicScale(20, false, 0.5) }}></View>
            }
            ListEmptyComponent={
              isTripSettled ? (
                <View style={{ padding: 20, alignItems: "center" }}>
                  <Text
                    style={[
                      styles.subTitleText,
                      { color: GlobalStyles.colors.primary500 },
                    ]}
                  >
                    {i18n.t("noOpenSplitsAllSettled")}
                  </Text>
                </View>
              ) : splits.length === 0 && !isFetching ? (
                <View style={{ padding: 20, alignItems: "center" }}>
                  <Text style={styles.subTitleText}>
                    {i18n.t("noOpenSplits")}
                  </Text>
                </View>
              ) : null
            }
            renderItem={renderSplitItem}
          />
        </View>
        {isPortrait && ButtonContainerJSX}
      </Animated.View>
    </ScrollView>
  );
};

export default SplitSummaryScreen;

SplitSummaryScreen.propTypes = {
  route: PropTypes.object.isRequired,
  navigation: PropTypes.object.isRequired,
};

const styles = StyleSheet.create({
  syncIndicatorContainer: {
    position: "absolute",
    right: 0,
    top: dynamicScale(8, false, 0.5),
  },
  buttonText: {
    fontSize: dynamicScale(16, false, 0.5),
    fontWeight: "500",
    color: GlobalStyles.colors.textColor,
  },
  container: {
    flex: 1,
    backgroundColor: GlobalStyles.colors.backgroundColor,
  },
  cardContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: GlobalStyles.colors.gray300,
    alignItems: "center",
    flexDirection: "column",
    justifyContent: "space-between",
    margin: dynamicScale(20, false, 0.5),
    paddingBottom: dynamicScale(18, false, 0.5),
    paddingHorizontal: dynamicScale(8, false, 0.5),
    backgroundColor: GlobalStyles.colors.backgroundColorLight,
    borderRadius: dynamicScale(20, false, 0.5),
    ...Platform.select({
      android: {
        margin: dynamicScale(8),
        marginTop: dynamicScale(2, true),
        minWidth: dynamicScale(300),
      },
    }),
  },
  cardContent: {
    flex: 1,
    width: "100%",
    flexDirection: "column",
  },
  button: {
    ...Platform.select({
      ios: {
        borderRadius: 12,
        minHeight: dynamicScale(48, false, 0.5),
      },
      android: {
        elevation: 0,
      },
    }),
  },
  splitContainer: {
    flex: 1,
    flexDirection: "row",
    paddingHorizontal: dynamicScale(16, false, 0.5),
    paddingVertical: dynamicScale(8, false, 0.5),
    marginVertical: dynamicScale(8, false, 0.5),
    borderWidth: 2,
    borderColor: GlobalStyles.colors.gray300,
    backgroundColor: GlobalStyles.colors.backgroundColor,
    borderRadius: dynamicScale(44, false, 0.5),
    alignItems: "center",
    justifyContent: "center",
    // android styles
    ...Platform.select({
      android: {
        margin: dynamicScale(8),
        minHeight: dynamicScale(55, true),
      },
    }),
  },
  buttonContainer: {
    flexDirection: "row",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "space-between",
    ...Platform.select({
      ios: { marginTop: 0 },
      android: {
        marginVertical: dynamicScale(18),
        minHeight: dynamicScale(100, true),
      },
    }),
  },
  splitText: {
    maxWidth: "100%",
    textAlign: "center",
  },
  userText: {
    fontSize: dynamicScale(18, false, 0.5),
    fontWeight: "500",
    fontStyle: "italic",
    color: GlobalStyles.colors.textColor,
    alignItems: "center",
    alignContent: "center",
  },
  normalText: {
    fontSize: dynamicScale(16, false, 0.5),
    fontWeight: "300",
    color: GlobalStyles.colors.textColor,
    alignItems: "center",
    alignContent: "center",
    fontStyle: "italic",
  },
  amountText: {
    fontSize: dynamicScale(18, false, 0.5),
    fontWeight: "500",
    fontStyle: "italic",
    color: GlobalStyles.colors.errorGrayed,
    alignItems: "center",
  },

  titleContainer: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginTop: dynamicScale(18, false, 0.5),
  },
  titleText: {
    fontSize: dynamicScale(32, false, 0.5),
    fontWeight: "bold",
    paddingBottom: dynamicScale(12, true),
    color: GlobalStyles.colors.textColor,
    alignItems: "center",
    alignContent: "center",
  },
  subTitleContainer: {
    marginVertical: dynamicScale(4, false, 0.5),
    alignItems: "center",
    alignContent: "center",
  },
  subTitleText: {
    fontSize: dynamicScale(16, false, 0.5),
    fontWeight: "300",
    fontStyle: "italic",
    color: GlobalStyles.colors.textColor,
    alignItems: "flex-start",
    alignContent: "flex-start",
  },
  row: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignContent: "flex-start",
    alignItems: "flex-start",
  },
});
