/* eslint-disable react-hooks/exhaustive-deps */
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr, ru } from "../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

import {
  Alert,
  Dimensions,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import ErrorOverlay from "../components/UI/ErrorOverlay";
import FlatButton from "../components/UI/FlatButton";
import LoadingOverlay from "../components/UI/LoadingOverlay";
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
import { ExpenseData, isPaidString, Split } from "../util/expense";
import Animated from "react-native-reanimated";
import { formatExpenseWithCurrency, truncateString } from "../util/string";
import { useFocusEffect } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { Pressable, ScrollView } from "react-native";
import {
  dynamicScale,
  moderateScale,
  scale,
  verticalScale,
} from "../util/scalingUtil";

const SplitSummaryScreen = ({ navigation }) => {
  const {
    tripid,
    tripCurrency,
    tripName,
    fetchAndSettleCurrentTrip,
    isPaid,
    isPaidDate,
  } = useContext(TripContext);
  const { freshlyCreated, userName } = useContext(UserContext);
  const { expenses } = useContext(ExpensesContext);
  // avoid rerenders
  const memoExpenses = useMemo(() => expenses, [expenses]);
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
    }, [freshlyCreated])
  );

  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState();

  const [tripIsPaid, setTripIsPaid] = useState(isPaid === isPaidString.paid);

  useEffect(() => {
    setTripIsPaid(isPaid === isPaidString.paid);
  }, [isPaid]);

  const [splits, setSplits] = useState<Split[]>([]);
  const hasOpenSplits = splits?.length > 0;
  const [showSimplify, setShowSimplify] = useState(true);

  // TODO: improve text and translate
  const titleTextOriginal = "Split Summary";
  const titleTextSimplified = "Split Summary";

  const tripNameString = truncateString(tripName, 25);
  const subTitleOriginal =
    "Overview of owed amounts in the trip:\n  " + tripNameString;
  const subTitleSimplified =
    "Simplified Summary of Optimal Transactions in the trip:  " +
    tripNameString;

  const [titleText, setTitleText] = useState(titleTextOriginal);
  const [subTitleText, setSubTitleText] = useState(subTitleOriginal);

  const totalPaidBackTextOriginal = `Your money back:  `;
  const [totalPaidBackText, setTotalPaidBackText] = useState(
    totalPaidBackTextOriginal
  );
  const totalPayBackTextOriginal = `You still owe: `;
  const [totalPayBackText, setTotalPayBackText] = useState(
    totalPayBackTextOriginal
  );

  const getOpenSplits = useCallback(async () => {
    // console.log("called getOpenSplits!");
    if (!tripid || expenses?.length === 0) return;
    setIsFetching(true);
    try {
      const response = await calcOpenSplitsTable(
        tripid,
        tripCurrency,
        expenses,
        isPaidDate
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
      setTotalPaidBackText(
        totalPaidBackTextOriginal +
          formatExpenseWithCurrency(userGetsBack, tripCurrency)
      );
      setTotalPayBackText(
        totalPayBackTextOriginal +
          formatExpenseWithCurrency(userHasToPay, tripCurrency)
      );
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Could not fetch splits!",
        visibilityTime: 2000,
      });
      console.error(error);
      // setError("Could not fetch splits from the web database! " + error);
    }
    setIsFetching(false);
  }, [
    totalPaidBackTextOriginal,
    totalPayBackTextOriginal,
    isPaidDate,
    tripCurrency,
    tripid,
    memoExpenses,
    userName,
  ]);
  const simpleSplits = useCallback(
    () => simplifySplits(splits),
    [splits.length]
  )();
  const sameList = useMemo(
    () => areSplitListsEqual(splits, simpleSplits),
    [splits.length, simpleSplits.length]
  );
  const noSimpleSplits = !simpleSplits || simpleSplits?.length < 1 || sameList;

  useEffect(() => {
    if (isFetching || !tripid) return;
    getOpenSplits();
  }, [getOpenSplits]);

  const handleSimpflifySplits = useCallback(async () => {
    try {
      if (noSimpleSplits) {
        // Alert.alert("No Splits to Simplify");
        Toast.show({
          type: "error",
          text1: "No Splits to Simplify",
          visibilityTime: 2000,
        });
        navigation.pop();
      }
      if (simpleSplits.some((split) => split.whoPaid === "Error")) {
        setTitleText(titleTextSimplified);
        setSubTitleText(subTitleSimplified);
        setShowSimplify(false);
        Toast.show({
          type: "error",
          text1: "Could not simplify splits",
          text2: "Something must have gone wrong, sorry!",
          visibilityTime: 2000,
        });
        return;
      }
      setSplits(simpleSplits);
      setShowSimplify(false);
      setTitleText(titleTextSimplified);
      setSubTitleText(subTitleSimplified);
    } catch (error) {
      // console.log("handleSimpflifySplits ~ error", error);
    }
  }, [splits?.length, subTitleSimplified]);

  function errorHandler() {
    setError(null);
  }

  const settleSplitsHandler = useCallback(async () => {
    setIsFetching(true);
    try {
      await fetchAndSettleCurrentTrip(false);
      await getOpenSplits();
      setSplits([]);
      setShowSimplify(false);
      setTitleText(titleTextOriginal);
      setSubTitleText(subTitleOriginal);
      setTotalPaidBackText("");
      setTotalPayBackText("");
    } catch (error) {
      // console.log("settleSplitsHandler ~ error", error);
    }
    setIsFetching(false);
    navigation.popToTop();
  }, []);

  const renderSplitItem = useCallback(
    (itemData) => {
      // get a list of all expenses where the item.userName and item.whoPaid is included in the expense.splitList as either whoPaid or userName
      const expensesList = expenses.filter((expense: ExpenseData) => {
        const splitList = expense?.splitList;
        const splitListLength = splitList?.length;
        for (let i = 0; i < splitListLength; i++) {
          const split = splitList[i];
          if (
            (split.userName === itemData.item.userName &&
              split.whoPaid === itemData.item.whoPaid) ||
            split.userName === itemData.item.whoPaid ||
            split.whoPaid === itemData.item.userName
          ) {
            return true;
          }
        }
        return false;
      });

      const length = expensesList.length;
      const item = itemData.item;
      return (
        <Pressable
          onPress={() => {
            // console.log("length of split expenses", length);
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
    [tripCurrency]
  );

  if (error && !isFetching) {
    return <ErrorOverlay message={error} onConfirm={errorHandler} />;
  }

  if (isFetching) {
    return <LoadingOverlay />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Animated.View
        // entering={FadeIn}
        // exiting={FadeOut}
        style={[GlobalStyles.wideStrongShadow, styles.cardContainer]}
      >
        <View style={styles.titleContainer}>
          {/* <BackButton></BackButton> */}
          <Text style={styles.titleText}> {titleText}</Text>
        </View>
        {/* <View style={styles.subTitleContainer}>
            <Text style={styles.subTitleText}> {subTitleText}</Text>
          </View> */}
        <View style={styles.subTitleContainer}>
          <Text style={styles.subTitleText}> {totalPaidBackText}</Text>
        </View>
        <View style={styles.subTitleContainer}>
          <Text style={styles.subTitleText}> {totalPayBackText}</Text>
        </View>

        <FlatList
          style={{ maxWidth: "100%", paddingHorizontal: "2%" }}
          data={splits}
          ListFooterComponent={
            <View style={styles.buttonContainer}>
              {!showSimplify && !noSimpleSplits && (
                <FlatButton
                  onPress={async () => {
                    if (showSimplify) {
                      navigation.goBack();
                    } else {
                      await getOpenSplits();
                      setShowSimplify(true);
                      setTitleText(titleTextOriginal);
                      setSubTitleText(subTitleOriginal);
                    }
                  }}
                >
                  Back
                </FlatButton>
              )}
              {showSimplify && !noSimpleSplits && (
                <GradientButton
                  style={styles.button}
                  onPress={handleSimpflifySplits}
                >
                  Simplify Splits
                </GradientButton>
              )}
              {hasOpenSplits && (
                <GradientButton
                  style={styles.button}
                  colors={GlobalStyles.gradientColors}
                  darkText
                  buttonStyle={{
                    backgroundColor: GlobalStyles.colors.errorGrayed,
                  }}
                  onPress={async () => {
                    // alert ask user if he really wants to settle all Splits
                    // if yes, call settleSplitsHandler
                    Alert.alert(
                      "Settle Splits",
                      "Are you sure you want to settle all splits? Has everyone gotten their money back? (This will only settle splits from Today or Before, but not open splits from the future!)",
                      [
                        {
                          text: "Cancel",
                          style: "cancel",
                        },
                        {
                          text: "Settle",
                          onPress: async () => await settleSplitsHandler(),
                        },
                      ]
                    );
                  }}
                >
                  Settle Splits
                </GradientButton>
              )}
            </View>
          }
          ListHeaderComponent={<View style={{ height: 40 }}></View>}
          renderItem={renderSplitItem}
        />
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
  container: {
    flex: 1,
    alignItems: "center",
    padding: dynamicScale(28),
    backgroundColor: GlobalStyles.colors.backgroundColor,
  },
  cardContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: dynamicScale(24),
    paddingTop: dynamicScale(24, true),
    paddingBottom: dynamicScale(2, true),
    //card
    backgroundColor: GlobalStyles.colors.backgroundColorLight,
    borderRadius: dynamicScale(20, false, 0.5),
    // borderWidth: 1,
    borderColor: GlobalStyles.colors.gray500,
    minWidth: dynamicScale(300),
    // android styles
    ...Platform.select({
      android: {
        margin: dynamicScale(8),
        marginTop: dynamicScale(2, true),
      },
    }),
  },
  button: {
    ...Platform.select({
      ios: {
        marginLeft: dynamicScale(24),
        marginTop: dynamicScale(50, true),
        borderRadius: 12,
        minHeight: 55,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  splitContainer: {
    flex: 1,
    flexDirection: "row",
    paddingHorizontal: dynamicScale(16),
    paddingVertical: dynamicScale(8, true),
    marginVertical: dynamicScale(8, true),
    borderWidth: 1,
    borderColor: GlobalStyles.colors.backgroundColor,
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
    // marginVertical: "10%",
    // minWidth: 150,
    flexDirection: "row",

    flex: 1,
    alignItems: "center",
    justifyContent: "center",

    // margin: "2%",
    // minHeight: 250,
    ...Platform.select({
      ios: { marginTop: "-0%" },
      android: {
        // height: dynamicScale(55, true),
        marginVertical: dynamicScale(18),
        // flexDirection: "column",
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
    //italics
    fontStyle: "italic",
    color: GlobalStyles.colors.textColor,
    // center
    alignItems: "center",
    alignContent: "center",
  },
  normalText: {
    fontSize: dynamicScale(16),
    fontWeight: "300",
    color: GlobalStyles.colors.textColor, // center
    alignItems: "center",
    alignContent: "center",
    fontStyle: "italic",
  },
  amountText: {
    fontSize: dynamicScale(18, false, 0.5),
    fontWeight: "500",
    fontStyle: "italic",

    color: GlobalStyles.colors.errorGrayed,
    // center
    alignItems: "center",
  },

  titleContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginLeft: "-8%",
    // row
    flexDirection: "row",
  },
  titleText: {
    fontSize: dynamicScale(32, false, 0.5),
    fontWeight: "bold",
    paddingBottom: dynamicScale(12, true),
    color: GlobalStyles.colors.textColor,
    // center
    alignItems: "center",
    alignContent: "center",
  },
  subTitleContainer: {
    alignItems: "flex-start",
    justifyContent: "flex-start",
    margin: "2%",
    // center
    alignContent: "flex-start",
  },
  subTitleText: {
    fontSize: dynamicScale(16, false, 0.5),
    fontWeight: "300",
    fontStyle: "italic",

    color: GlobalStyles.colors.textColor,
    // center
    alignItems: "flex-start",
    alignContent: "flex-start",
  },
});
