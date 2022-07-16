import { StyleSheet, View, Text } from "react-native";

function CostItem(props) {
  return (
    <View style={styles.costItem}>
      <Text style={styles.goalText}>{props.text}</Text>
    </View>
  );
}

export default CostItem;

const styles = StyleSheet.create({
  costItem: {
    margin: 8,
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#5e0acc",
  },
  goalText: {
    color: "white",
  },
});
