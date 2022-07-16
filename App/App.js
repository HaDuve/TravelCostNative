import { StyleSheet, View, FlatList, Button } from "react-native";
import { useState } from "react";
import CostItems from "./components/CostItems";
import CostInput from "./components/CostInputs";
import { StatusBar } from "expo-status-bar";

export default function App() {
  const [modalIsVisible, setModalIsVisible] = useState(false);
  const [courseCosts, setCourseCosts] = useState([]);

  function startAddGoalHandler() {
    setModalIsVisible(true);
  }

  function endAddGoalHandler() {
    setModalIsVisible(false);
  }

  function addCostHandler(enteredCostText) {
    setCourseCosts((currentCourseCosts) => [
      ...currentCourseCosts,
      { text: enteredCostText, id: Math.random().toString() },
    ]);
    endAddGoalHandler();
  }

  function deleteCostHandler(id) {
    setCourseCosts((currentCourseCosts) => {
      return currentCourseCosts.filter((cost) => cost.id !== id);
    });
  }

  return (
    <>
      <StatusBar style="light"></StatusBar>
      <View style={styles.appContainer}>
        <Button
          title="Add new Goal"
          color="#ddc1f0"
          onPress={startAddGoalHandler}
        ></Button>
        <CostInput
          visible={modalIsVisible}
          onAddGoal={addCostHandler}
          onCancel={endAddGoalHandler}
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
    </>
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
