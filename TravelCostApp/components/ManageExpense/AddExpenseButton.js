import { StyleSheet, Text, View } from "react-native";
import { GlobalStyles } from "../../constants/styles";
import IconButton from "../UI/IconButton";

const AddExpenseButton = ({ navigation }) => {
  return (
    <View>
      <View style={styles.addButton}>
        <IconButton
          icon="add"
          size={36}
          color={"white"}
          onPress={() => {
            navigation.navigate("CategoryPick");
          }}
        />
      </View>
      <View style={styles.tempGrayBar2}></View>
    </View>
  );
};

export default AddExpenseButton;

const styles = StyleSheet.create({
  tempGrayBar2: {
    borderTopWidth: 1,
    borderTopColor: GlobalStyles.colors.gray600,
    minHeight: 16,
    backgroundColor: GlobalStyles.colors.gray500,
  },
  addButton: {
    backgroundColor: GlobalStyles.colors.primary400,
    flex: 0,
    borderRadius: 999,
    marginHorizontal: 150,
    marginBottom: -10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
});
