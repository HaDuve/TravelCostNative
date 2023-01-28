import React, { Dimensions, Pressable, StyleSheet, View } from "react-native";
import { GlobalStyles } from "../../constants/styles";
import IconButton from "../UI/IconButton";

const AddExpenseButton = ({ navigation }) => {
  return (
    <Pressable
      onPress={() => {
        navigation.navigate("CategoryPick");
      }}
    >
      <View style={styles.addButton}>
        <IconButton
          icon="add-outline"
          size={42}
          color={"white"}
          onPress={() => {
            navigation.navigate("CategoryPick");
          }}
        />
      </View>
    </Pressable>
  );
};

export default AddExpenseButton;

const styles = StyleSheet.create({
  addButton: {
    backgroundColor: GlobalStyles.colors.primary400,
    flex: 1,
    borderRadius: 999,
    marginHorizontal: "41.5%",
    marginTop: "-17%",
    paddingTop: "4.3%",
    paddingLeft: "1.0%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    elevation: 2,
    shadowColor: GlobalStyles.colors.textColor,
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
  },
});
