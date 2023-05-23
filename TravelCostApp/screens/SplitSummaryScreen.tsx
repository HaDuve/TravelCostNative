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
import { settleAllSplits } from "../util/settleSplits";
import uniqBy from "lodash.uniqby";

const SplitSummaryScreen = ({ route, navigation }) => {
  const { tripid } = route.params;
  const tripCtx = useContext(TripContext);
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
  const titleTextSimplified = "Simplified Split Summary";

  const subTitleOriginal = "Overview of owed amounts between travellers";
  const subTitleSimplified = "Simplified Summary of Optimal Transactions";

  const [titleText, setTitleText] = useState(titleTextOriginal);
  const [subTitleText, setSubTitleText] = useState(subTitleOriginal);

  const totalPaidBackTextOriginal = "Money you get back: ";
  const [totalPaidBackText, setTotalPaidBackText] = useState(
    totalPaidBackTextOriginal
  );
  const totalPayBackTextOriginal = "Money you still owe: ";
  const [totalPayBackText, setTotalPayBackText] = useState(
    totalPayBackTextOriginal
  );

  async function getOpenSplits() {
    setIsFetching(true);
    console.log("getOpenSplits ~ tripCtx.isPaid:", tripCtx.isPaid);
    // first check if current trip is paid
    if (tripIsPaid) {
      setSplits([]);
      setIsFetching(false);
      setTotalPaidBackText(
        "PAID!: " + totalPaidBackTextOriginal + "0 " + currencySymbol
      );
      setTotalPayBackText(totalPayBackTextOriginal + "0 " + currencySymbol);
      return;
    }

    try {
      const response = await calcOpenSplitsTable(
        tripid,
        tripCurrency,
        uniqueExpenses
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
          userGetsBack.toFixed(2) +
          " " +
          currencySymbol
      );
      setTotalPayBackText(
        totalPayBackTextOriginal +
          userHasToPay.toFixed(2) +
          " " +
          currencySymbol
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
      navigation.popToTop();
      await tripCtx.fetchAndSettleCurrentTrip();
      await settleAllSplits(tripCtx.tripid, expenseCtx);
    } catch (error) {
      console.log("settleSplitsHandler ~ error", error);
    }
    setIsFetching(false);
    navigation.navigate("Settings");
  };

  if (error && !isFetching) {
    return <ErrorOverlay message={error} onConfirm={errorHandler} />;
  }

  if (isFetching) {
    return <LoadingOverlay />;
  }

  function renderSplitItem(itemData) {
    const item = itemData.item;
    return (
      <View style={[styles.splitContainer, GlobalStyles.strongShadow]}>
        <Text style={styles.userText}>{item.userName} </Text>
        <Text style={styles.normalText}>owes </Text>
        <Text style={styles.amountText}>{item.amount} </Text>
        <Text style={styles.amountText}>{currencySymbol} </Text>
        <Text style={styles.normalText}>to</Text>
        <Text style={styles.userText}> {item.whoPaid}!</Text>
      </View>
    );
  }

  return (
    <BackgroundGradient style={styles.container}>
      <Animated.View
        entering={FadeIn}
        exiting={FadeOut}
        style={styles.headerContainer}
      >
        <View style={styles.titleContainer}>
          <Text style={styles.titleText}> {titleText}</Text>
        </View>
        <View style={styles.subTitleContainer}>
          <Text style={styles.subTitleText}> {subTitleText}</Text>
        </View>
        <View style={styles.subTitleContainer}>
          <Text style={styles.subTitleText}> {totalPaidBackText}</Text>
        </View>
        <View style={styles.subTitleContainer}>
          <Text style={styles.subTitleText}> {totalPayBackText}</Text>
        </View>
      </Animated.View>
      <FlatList
        style={{ maxHeight: Dimensions.get("screen").height / 1.5 }}
        data={splits}
        ListFooterComponent={<View style={{ height: 100 }}></View>}
        renderItem={renderSplitItem}
      />
      <View style={styles.buttonContainer}>
        <FlatButton
          onPress={() => {
            if (showSimplify) navigation.goBack();
            getOpenSplits();
            setShowSimplify(true);
            setTitleText(titleTextOriginal);
            setSubTitleText(subTitleOriginal);
          }}
        >
          Back
        </FlatButton>
        {showSimplify && (
          <GradientButton style={styles.button} onPress={handleSimpflifySplits}>
            Simplify Splits
          </GradientButton>
        )}
        <GradientButton
          style={styles.button}
          colors={GlobalStyles.gradientErrorButton}
          buttonStyle={{ backgroundColor: GlobalStyles.colors.errorGrayed }}
          onPress={async () => {
            // alert ask user if he really wants to settle all Splits
            // if yes, call settleSplitsHandler
            Alert.alert(
              "Settle Splits",
              "Are you sure you want to settle all splits? This will pay back all open splits and cannot be undone!",
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
    </BackgroundGradient>
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
    padding: 4,
    paddingTop: 24,
    alignItems: "center",
  },
  button: {
    marginLeft: 24,
  },
  splitContainer: {
    flexDirection: "row",
    padding: 8,
    borderWidth: 1,
    margin: 8,
    borderRadius: 12,
    // center
    alignItems: "center",
    justifyContent: "center",
    minHeight: "20%",
    minWidth: "80%",
    backgroundColor: GlobalStyles.colors.backgroundColor,
    borderColor: GlobalStyles.colors.error300,
  },
  buttonContainer: {
    marginTop: 24,
    minWidth: 150,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    margin: "2%",
  },
  userText: {
    fontSize: 18,
    fontWeight: "700",
    color: GlobalStyles.colors.textColor,
  },
  normalText: { fontSize: 16, color: GlobalStyles.colors.textColor },
  amountText: {
    fontSize: 18,
    fontWeight: "700",
    color: GlobalStyles.colors.errorGrayed,
  },
  headerContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  titleContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: {
    fontSize: 32,
    fontWeight: "bold",
    paddingBottom: 12,
    color: GlobalStyles.colors.textColor,
  },
  subTitleContainer: {
    alignItems: "center",
    justifyContent: "center",
    margin: "2%",
  },
  subTitleText: {
    fontSize: 14,
    color: GlobalStyles.colors.textColor,
  },
});
