import React, { useContext, useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { G } from "react-native-svg";
import Toast from "react-native-toast-message";
import Button from "../components/UI/Button";
import ErrorOverlay from "../components/UI/ErrorOverlay";
import FlatButton from "../components/UI/FlatButton";
import LoadingOverlay from "../components/UI/LoadingOverlay";
import { GlobalStyles } from "../constants/styles";
import { TripContext } from "../store/trip-context";
import { calcOpenSplitsTable, simplifySplits } from "../util/split";

const SplitSummaryScreen = ({ route, navigation }) => {
  const { tripid } = route.params;
  console.log("SplitSummaryScreen ~ tripid:", tripid);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState();

  const [splits, setSplits] = useState([]);
  const [showSimplify, setShowSimplify] = useState(true);
  const [titleText, setTitleText] = useState("Open Splits!");
  const TripCtx = useContext(TripContext);
  const tripCurrency = TripCtx.tripCurrency;

  async function getOpenSplits() {
    setIsFetching(true);
    try {
      const response = await calcOpenSplitsTable(tripid, tripCurrency);
      // if (!response || (response.length < 1 && !isFetching)) {
      //   Toast.show({
      //     type: "error",
      //     text1: "No Splits!",
      //     text2: "All debts are already settled!",
      //   });
      //   navigation.pop();
      // }
      console.log("getOpenSplits ~ response", response);
      setSplits(response);
      if (splits.length < 1 && !isFetching) {
        Toast.show({
          type: "error",
          text1: "No Splits!",
          text2: "All debts are already settled!",
        });
        navigation.pop();
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Could not fetch splits!",
        visibilityTime: 2000,
      });
      navigation.pop();
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
      <View style={styles.splitContainer}>
        <Text style={styles.userText}>{item.userName} </Text>
        <Text style={styles.normalText}>owes </Text>
        <Text style={styles.amountText}>{item.amount} </Text>
        <Text style={styles.amountText}>{TripCtx.tripCurrency} </Text>
        <Text style={styles.normalText}>to</Text>
        <Text style={styles.userText}> {item.whoPaid}!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titleText}> {titleText}</Text>
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
            setTitleText("Open Splits!");
          }}
        >
          Back
        </FlatButton>
        {showSimplify && (
          <Button
            style={styles.button}
            onPress={() => {
              setSplits(simplifySplits(splits));
              setShowSimplify(false);
              setTitleText("Simplified Open Splits!");
            }}
          >
            Simplify Splits
          </Button>
        )}
        <Button
          style={styles.button}
          buttonStyle={{ backgroundColor: GlobalStyles.colors.errorGrayed }}
          onPress={() => {
            Alert.alert("Settle Splits function coming soon...");
          }}
        >
          Settle Splits
        </Button>
      </View>
    </View>
  );
};

export default SplitSummaryScreen;

const styles = StyleSheet.create({
  container: {
    padding: 4,
    paddingTop: 24,
    alignItems: "center",
  },
  button: {
    marginLeft: 24,
  },
  titleText: {
    fontSize: 24,
    fontWeight: "bold",
    paddingBottom: 12,
    color: GlobalStyles.colors.textColor,
  },
  splitContainer: {
    flexDirection: "row",
    padding: 8,
    borderWidth: 1,
    margin: 8,
    borderRadius: 12,
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
    fontSize: 14,
    fontWeight: "700",
    color: GlobalStyles.colors.textColor,
  },
  normalText: { fontSize: 14, color: GlobalStyles.colors.textColor },
  amountText: {
    fontSize: 14,
    fontWeight: "700",
    color: GlobalStyles.colors.errorGrayed,
  },
});
