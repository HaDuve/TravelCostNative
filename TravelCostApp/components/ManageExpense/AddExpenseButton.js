import { StyleSheet, Text, View } from "react-native";
import { GlobalStyles } from "../../constants/styles";
import IconButton from "../UI/IconButton";

const AddExpenseButton = ({ navigation }) => {
  return (
    <View>
      <View style={styles.addButton}>
        <IconButton
          icon="add"
          size={30}
          color={"white"}
          onPress={() => {
            navigation.navigate("ManageExpense");
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
    borderRadius: 100,
    minHeight: 55,
    minWidth: 30,
    marginHorizontal: 160,
    marginTop: -40,
    marginBottom: -15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
});
