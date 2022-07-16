import { StyleSheet, View, FlatList } from "react-native";
import { useState } from "react";
import CostItem from "./components/CostItems";
import CostInput from "./components/CostInputs";

export default function App() {
  const [courseCosts, setCourseCosts] = useState([]);

  function addCostHandler(enteredCostText) {
    setCourseCosts((currentCourseCosts) => [
      ...currentCourseCosts,
      { text: enteredCostText, id: Math.random().toString() },
    ]);
  }

  return (
    <View style={styles.appContainer}>
      <CostInput onAddGoal={addCostHandler}></CostInput>
      <View style={styles.goalsContainer}>
        <FlatList
          data={courseCosts}
          renderItem={(itemData) => {
            return <CostItem text={itemData.item.text} />;
          }}
          keyExtractor={(item, index) => {
            return item.id;
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 18,
  },
  goalsContainer: {
    flex: 6,
  },
});
