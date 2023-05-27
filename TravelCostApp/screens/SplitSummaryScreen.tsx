import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
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
import { calcOpenSplitsTable, simplifySplits } from "../util/split";
import PropTypes from "prop-types";
import { UserContext } from "../store/user-context";
import GradientButton from "../components/UI/GradientButton";
import { ExpensesContext, RangeString } from "../store/expenses-context";
import BackgroundGradient from "../components/UI/BackgroundGradient";
import { ExpenseData, isPaidString, Split } from "../util/expense";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { getCurrencySymbol } from "../util/currencySymbol";
import uniqBy from "lodash.uniqby";
import BackButton from "../components/UI/BackButton";
import { formatExpenseWithCurrency, truncateString } from "../util/string";

const SplitSummaryScreen = ({ route, navigation }) => {
  // let { tripid } = route.params;
  const tripCtx = useContext(TripContext);
  // if (!tripid)
  const tripid = tripCtx.tripid;
  const tripCurrency = tripCtx.tripCurrency;
  const currencySymbol = getCurrencySymbol(tripCurrency);
  const userCtx = useContext(UserContext);
  const expenseCtx = useContext(ExpensesContext);
  const uniqueExpenses: Array<ExpenseData> = useMemo(
    () => uniqBy(expenseCtx.getRecentExpenses(RangeString.total), "id"),
    [expenseCtx.expenses]
  );
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState();

  const [tripIsPaid, setTripIsPaid] = useState(
    tripCtx.isPaid === isPaidString.paid
  );

  useEffect(() => {
    setTripIsPaid(tripCtx.isPaid === isPaidString.paid);
  }, [tripCtx.isPaid]);

  const [splits, setSplits] = useState<Split[]>([]);
  const [showSimplify, setShowSimplify] = useState(true);

  // TODO: improve text and translate
  const titleTextOriginal = "Split Summary";
  const titleTextSimplified = "Split Summary";

  const tripName = truncateString(tripCtx.tripName, 25);
  const subTitleOriginal =
    "Overview of owed amounts in the trip:\n  " + tripName;
  const subTitleSimplified =
    "Simplified Summary of Optimal Transactions in the trip:  " + tripName;

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

  async function getOpenSplits() {
    setIsFetching(true);
    try {
      const response = await calcOpenSplitsTable(
        tripid,
        tripCurrency,
        uniqueExpenses,
        tripCtx.isPaidDate
      );
      const temp = [];
      let userGetsBack = 0;
      let userHasToPay = 0;
      for (let i = 0; i < response.length; i++) {
        const split: Split = response[i];
        const tempObj = {
          userName: split.userName,
          whoPaid: split.whoPaid,
          amount: Number(split.amount).toFixed(2),
        };
        temp.push(tempObj);
        userGetsBack +=
          split.whoPaid === userCtx.userName ? Number(split.amount) : Number(0);
        userHasToPay +=
          split.userName === userCtx.userName
            ? Number(split.amount)
            : Number(0);
      }
      setSplits(temp);
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
  }

  const handleSimpflifySplits = async () => {
    // const isPremium = await userCtx.checkPremium();
    // if (!isPremium) {
    //   navigation.navigate("Paywall");
    //   return;
    // }
    try {
      const simpleSplits = simplifySplits(splits);
      if (simpleSplits.length === 0) {
        Alert.alert("No Splits to Simplify");
        navigation.navigate("Settings");
      }
      if (simpleSplits.some((split) => split.whoPaid === "Error")) {
        Alert.alert(
          "Error",
          "Could not simplify splits. Something must have gone wrong, sorry!"
        );
        navigation.navigate("Settings");
      }
      setSplits(simpleSplits);
      setShowSimplify(false);
      setTitleText(titleTextSimplified);
      setSubTitleText(subTitleSimplified);
    } catch (error) {
      console.log("handleSimpflifySplits ~ error", error);
    }
  };

  useEffect(() => {
    getOpenSplits();
  }, [expenseCtx.expenses, tripid]);

  function errorHandler() {
    setError(null);
  }

  const settleSplitsHandler = async () => {
    setIsFetching(true);
    try {
      await tripCtx.fetchAndSettleCurrentTrip();
    } catch (error) {
      console.log("settleSplitsHandler ~ error", error);
    }
    setIsFetching(false);
    navigation.navigate("Settings");
  };

  function renderSplitItem(itemData) {
    const item = itemData.item;
    return (
      <View style={[styles.splitContainer]}>
        <Text style={styles.userText}>{item.userName} </Text>
        <Text style={styles.normalText}>owes </Text>
        <Text style={styles.amountText}>{item.amount} </Text>
        <Text style={styles.amountText}>{currencySymbol} </Text>
        <Text style={styles.normalText}>to</Text>
        <Text style={styles.userText}> {item.whoPaid}!</Text>
      </View>
    );
  }

  if (error && !isFetching) {
    return <ErrorOverlay message={error} onConfirm={errorHandler} />;
  }

  if (isFetching) {
    return <LoadingOverlay />;
  }

  return (
    <View style={[styles.container]}>
      <Animated.View
        entering={FadeIn}
        exiting={FadeOut}
        style={[styles.cardContainer, GlobalStyles.wideStrongShadow]}
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
          // style={{ maxHeight: Dimensions.get("screen").height / 1.5 }}
          data={splits}
          ListFooterComponent={<View style={{ height: 10 }}></View>}
          ListHeaderComponent={<View style={{ height: 40 }}></View>}
          renderItem={renderSplitItem}
        />
        <View style={styles.buttonContainer}>
          {!showSimplify && (
            <FlatButton
              onPress={() => {
                if (showSimplify) {
                  navigation.goBack();
                } else {
                  getOpenSplits();
                  setShowSimplify(true);
                  setTitleText(titleTextOriginal);
                  setSubTitleText(subTitleOriginal);
                }
              }}
            >
              Back
            </FlatButton>
          )}
          {showSimplify && (
            <GradientButton
              style={styles.button}
              onPress={handleSimpflifySplits}
            >
              Simplify Splits
            </GradientButton>
          )}
          <GradientButton
            style={styles.button}
            colors={GlobalStyles.gradientColors}
            darkText
            buttonStyle={{ backgroundColor: GlobalStyles.colors.errorGrayed }}
            onPress={async () => {
              // alert ask user if he really wants to settle all Splits
              // if yes, call settleSplitsHandler
              Alert.alert(
                "Settle Splits",
                "Are you sure you want to settle all splits? Has everyone gotten their money back?",
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
        </View>
      </Animated.View>
    </View>
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
    backgroundColor: GlobalStyles.colors.backgroundColor,
  },
  cardContainer: {
    alignItems: "center",
    justifyContent: "center",
    margin: "8%",
    padding: "2%",
    paddingVertical: "4%",
    paddingTop: "12%",
    //card
    backgroundColor: "white",
    borderRadius: 20,
    // borderWidth: 1,
    borderColor: GlobalStyles.colors.gray500,
  },
  button: {
    marginLeft: 24,
  },
  splitContainer: {
    flexDirection: "row",
    // padding: 16,
    marginVertical: 4,
    // paddingHorizontal: 24,
    // borderWidth: 1,
    // margin: 8,
    borderRadius: 12,
    // align text on the bottom
    alignItems: "flex-end",
  },
  buttonContainer: {
    // marginVertical: "10%",
    // minWidth: 150,
    flexDirection: "row",
    marginRight: "5%",
    marginBottom: "7%",
    // alignItems: "center",
    // justifyContent: "space-between",
    // margin: "2%",
  },
  userText: {
    fontSize: 18,
    fontWeight: "500",
    //italics
    fontStyle: "italic",
    color: GlobalStyles.colors.textColor,
    // center
    alignItems: "center",
    alignContent: "center",
  },
  normalText: {
    fontSize: 16,
    fontWeight: "300",
    color: GlobalStyles.colors.textColor, // center
    alignItems: "center",
    alignContent: "center",
    fontStyle: "italic",
  },
  amountText: {
    fontSize: 18,
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
    fontSize: 32,
    fontWeight: "bold",
    paddingBottom: 12,
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
    fontSize: 16,
    fontWeight: "300",
    fontStyle: "italic",

    color: GlobalStyles.colors.textColor,
    // center
    alignItems: "flex-start",
    alignContent: "flex-start",
  },
});
