import { StyleSheet, View, FlatList, Button } from "react-native";
import { useState } from "react";
import CostItems from "./components/CostItems";
import CostInput from "./components/CostInputs";

export default function App() {
  const [modalIsVisible, setModalIsVisible] = useState(false);
  const [courseCosts, setCourseCosts] = useState([]);

  function startAddGoalHandler() {
    setModalIsVisible(true);
  }

  function addCostHandler(enteredCostText) {
    setCourseCosts((currentCourseCosts) => [
      ...currentCourseCosts,
      { text: enteredCostText, id: Math.random().toString() },
    ]);
  }

  function deleteCostHandler(id) {
    setCourseCosts((currentCourseCosts) => {
      return currentCourseCosts.filter((cost) => cost.id !== id);
    });
  }

  return (
    <View style={styles.appContainer}>
      <Button
        title="Add new Goal"
        color="#2241d8"
        onPress={startAddGoalHandler}
      ></Button>
      <CostInput
        visible={modalIsVisible}
        onAddGoal={addCostHandler}
      ></CostInput>
      <View style={styles.goalsContainer}>
        <FlatList
          data={courseCosts}
          renderItem={(itemData) => {
            return (
              <CostItems
                text={itemData.item.text}
                id={itemData.item.id}
                onDeleteItem={deleteCostHandler}
              />
            );
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
