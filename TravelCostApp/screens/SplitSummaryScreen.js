import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

const SplitSummaryScreen = (tripid) => {
  const [isFetching, setIsFetching] = useState(true);
  setIsFetching(true);
  if (isFetching) {
    return <LoadingOverlay />;
  }
  return (
    <View>
      <Text>SplitSummaryScreen</Text>
    </View>
  );
};

export default SplitSummaryScreen;

const styles = StyleSheet.create({});
