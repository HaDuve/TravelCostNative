import React, { useContext, useEffect, useState } from "react";
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
import { ExpensesContext } from "../store/expenses-context";
import BackgroundGradient from "../components/UI/BackgroundGradient";
import { Split } from "../util/expense";

const SplitSummaryScreen = ({ route, navigation }) => {
  const { tripid } = route.params;
  console.log("SplitSummaryScreen ~ tripid:", tripid);
  const tripCtx = useContext(TripContext);
  const tripCurrency = tripCtx.tripCurrency;
  const userCtx = useContext(UserContext);
  const expenseCtx = useContext(ExpensesContext);

  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState();

  const [splits, setSplits] = useState<Split[]>([]);
  const [showSimplify, setShowSimplify] = useState(true);

  // TODO: improve text and translate
  const titleTextOriginal = "Split Summary";
  const titleTextSimplified = "Simplified Split Summary";

  const subTitleOriginal = "Overview of owed amounts between travellers";
  const subTitleSimplified = "Simplified Summary of Optimal Transactions";

  const [titleText, setTitleText] = useState(titleTextOriginal);
  const [subTitleText, setSubTitleText] = useState(subTitleOriginal);

  async function getOpenSplits() {
    setIsFetching(true);
    try {
      const response = await calcOpenSplitsTable(
        tripid,
        tripCurrency,
        expenseCtx.expenses
      );
      console.log("getOpenSplits ~ response", response);
      setSplits(response);
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

  useEffect(() => {
    getOpenSplits();
  }, []);

  function errorHandler() {
    setError(null);
  }

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
        <Text style={styles.amountText}>{tripCtx.tripCurrency} </Text>
        <Text style={styles.normalText}>to</Text>
        <Text style={styles.userText}> {item.whoPaid}!</Text>
      </View>
    );
  }

  return (
    <BackgroundGradient style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.titleContainer}>
          <Text style={styles.titleText}> {titleText}</Text>
        </View>
        <View style={styles.subTitleContainer}>
          <Text style={styles.subTitleText}> {subTitleText}</Text>
        </View>
      </View>
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
          <GradientButton
            style={styles.button}
            onPress={async () => {
              const isPremium = await userCtx.checkPremium();
              // if (!isPremium) {
              //   navigation.navigate("Paywall");
              //   return;
              // }
              setSplits(simplifySplits(splits));
              setShowSimplify(false);
              setTitleText(titleTextSimplified);
              setSubTitleText(subTitleSimplified);
            }}
          >
            Simplify Splits
          </GradientButton>
        )}
        <GradientButton
          style={styles.button}
          colors={GlobalStyles.gradientErrorButton}
          buttonStyle={{ backgroundColor: GlobalStyles.colors.errorGrayed }}
          onPress={() => {
            Alert.alert("Settle Splits with Paypal function coming soon...");
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
    marginHorizontal: "10%",
  },
  subTitleText: {
    fontSize: 14,
    color: GlobalStyles.colors.textColor,
  },
});
