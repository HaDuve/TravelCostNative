import { useContext, useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Button from "../components/UI/Button";
import ErrorOverlay from "../components/UI/ErrorOverlay";
import FlatButton from "../components/UI/FlatButton";
import LoadingOverlay from "../components/UI/LoadingOverlay";
import { GlobalStyles } from "../constants/styles";
import { TripContext } from "../store/trip-context";
import { calcOpenSplitsTable } from "../util/split";

const SplitSummaryScreen = ({ route, navigation }) => {
  const { tripid } = route.params;
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState();

  const [splits, setSplits] = useState([]);
  const TripCtx = useContext(TripContext);

  useEffect(() => {
    async function getOpenSplits() {
      setIsFetching(true);
      try {
        const response = await calcOpenSplitsTable(tripid);
        setSplits(response);
      } catch (error) {
        setError("Could not fetch splits from the web database! " + error);
      }
      setIsFetching(false);
    }

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
      <Text style={styles.titleText}> Open splits!</Text>
      <FlatList
        style={{ maxHeight: Dimensions.get("screen").height / 1.5 }}
        data={splits}
        renderItem={renderSplitItem}
      />
      <View style={styles.buttonContainer}>
        <FlatButton
          onPress={() => {
            navigation.goBack();
          }}
        >
          Back
        </FlatButton>
        <Button
          style={{ marginLeft: 24 }}
          onPress={() => {
            Alert.alert("Settle debts function coming soon...");
          }}
        >
          Settle debts
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
