import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import Button from "../components/UI/Button";
import ErrorOverlay from "../components/UI/ErrorOverlay";
import FlatButton from "../components/UI/FlatButton";
import LoadingOverlay from "../components/UI/LoadingOverlay";
import { GlobalStyles } from "../constants/styles";
import { calcOpenSplitsTable } from "../util/split";

const SplitSummaryScreen = ({ route, navigation }) => {
  const { tripid } = route.params;
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState();

  const [splits, setSplits] = useState([]);

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
        <Text>
          {item.userName} owes {item.amount} to {item.whoPaid}!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titleText}> Open splits!</Text>
      <FlatList data={splits} renderItem={renderSplitItem} />
      <View style={styles.buttonContainer}>
        <FlatButton
          onPress={() => {
            navigation.goBack();
          }}
        >
          Back
        </FlatButton>
        <Button>Settle</Button>
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
    color: GlobalStyles.colors.textColor,
  },
  splitContainer: {
    padding: 8,
    borderWidth: 1,
    margin: 8,
    borderRadius: 12,
    borderColor: GlobalStyles.colors.textColor,
  },
  buttonContainer: {
    marginTop: 24,
    minWidth: 150,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
