import { StyleSheet, View, Text, Pressable } from "react-native";

function CostItems(props) {
  return (
    <View style={styles.goalItem}>
      <Pressable
        android_ripple={{ color: "#210644" }}
        onPress={props.onDeleteItem.bind(this, props.id)}
        style={(pressable) => pressable.pressed && styles.pressedItem}
      >
        <Text style={styles.goalText}>{props.text}</Text>
      </Pressable>
    </View>
  );
}

export default CostItems;

const styles = StyleSheet.create({
  goalItem: {
    margin: 8,
    borderRadius: 6,
    backgroundColor: "#2241d8",
  },
  pressedItem: {
    color: "black",
    opacity: 0.5,
  },
  goalText: {
    color: "white",
    padding: 8,
  },
});
