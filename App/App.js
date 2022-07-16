import { StyleSheet, Text, View, TextInput, Button } from "react-native";
import { useState } from "react";

export default function App() {
  const [enteredCostText, setEnteredCostText] = useState("");
  const [courseCosts, setCourseCosts] = useState([]);
  function goalInputHandler(enteredText) {
    setEnteredCostText(enteredText);
  }
  function addCostHandler() {
    setCourseCosts((currentCourseCosts) => [
      ...currentCourseCosts,
      enteredCostText,
    ]);
  }

  return (
    <View style={styles.appContainer}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="Your new Cost!"
          onChangeText={goalInputHandler}
        ></TextInput>
        <Button title="New Cost" onPress={addCostHandler}></Button>
      </View>
      <View style={styles.goalsContainer}>
        {courseCosts.map((cost) => (
          <View key={cost} style={styles.costItem}>
            <Text style={styles.costText}>{cost}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 16,
  },
  inputContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#cccccc",
  },
  textInput: {
    borderColor: "#cccccc",
    borderWidth: 1,
    width: "70%",
    marginRight: 10,
    marginBottom: 10,
    padding: 8,
  },
  goalsContainer: {
    flex: 6,
  },
  costItem: {
    margin: 8,
    padding: 6,
    backgroundColor: "#146bbdba",
    borderRadius: 3,
  },
  costText: {
    color: "white",
  },
});
