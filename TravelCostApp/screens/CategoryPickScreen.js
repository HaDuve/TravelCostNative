import { StyleSheet, Text, View } from "react-native";
import React from "react";
import IconButton from "../components/UI/IconButton";
import Button from "../components/UI/Button";
import FlatButton from "../components/UI/FlatButton";
import { GlobalStyles } from "../constants/styles";

const CategoryPickScreen = ({ route, navigation }) => {
  const { tempPickedCat, tempValues } = route.params ? route.params : "null";

  return (
    <View style={styles.container}>
      <View style={styles.rowContainer}>
        <IconButton
          icon={"fast-food-outline"}
          size={34}
          color={GlobalStyles.colors.textColor}
          buttonStyle={[styles.buttonStyle, GlobalStyles.shadow]}
          onPress={() => {
            navigation.navigate("ManageExpense", {
              pickedCat: "food",
            });
          }}
        ></IconButton>
        <IconButton
          icon={"airplane-outline"}
          size={34}
          color={GlobalStyles.colors.textColor}
          buttonStyle={[styles.buttonStyle, GlobalStyles.shadow]}
          onPress={() => {
            navigation.navigate("ManageExpense", {
              pickedCat: "international-travel",
            });
          }}
        ></IconButton>
      </View>
      <View style={styles.rowContainer}>
        <IconButton
          icon={"bed-outline"}
          size={34}
          color={GlobalStyles.colors.textColor}
          buttonStyle={[styles.buttonStyle, GlobalStyles.shadow]}
          onPress={() => {
            navigation.navigate("ManageExpense", {
              pickedCat: "accomodation",
            });
          }}
        ></IconButton>
        <IconButton
          icon={"car-outline"}
          size={34}
          color={GlobalStyles.colors.textColor}
          buttonStyle={[styles.buttonStyle, GlobalStyles.shadow]}
          onPress={() => {
            navigation.navigate("ManageExpense", {
              pickedCat: "national-travel",
            });
          }}
        ></IconButton>
      </View>
      <View style={styles.rowContainer}>
        <IconButton
          icon={"basket-outline"}
          size={34}
          color={GlobalStyles.colors.textColor}
          buttonStyle={[styles.buttonStyle, GlobalStyles.shadow]}
          onPress={() => {
            navigation.navigate("ManageExpense", {
              pickedCat: "other",
            });
          }}
        ></IconButton>
        <IconButton
          icon={"md-ice-cream-outline"}
          size={34}
          color={GlobalStyles.colors.textColor}
          buttonStyle={[styles.buttonStyle, GlobalStyles.shadow]}
          onPress={() => {
            navigation.navigate("ManageExpense", {
              pickedCat: "other",
            });
          }}
        ></IconButton>
      </View>
      <View style={styles.buttonContainer}>
        <FlatButton
          onPress={() => {
            navigation.goBack();
          }}
        >
          Cancel
        </FlatButton>
        <Button
          onPress={() => {
            navigation.navigate("ManageExpense", {
              pickedCat: "other",
            });
          }}
        >
          Continue
        </Button>
      </View>
    </View>
  );
};

export default CategoryPickScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 4,
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  rowContainer: {
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  buttonContainer: {
    flex: 1,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  buttonStyle: {
    backgroundColor: GlobalStyles.colors.gray500,
    borderRadius: 0,
    paddingVertical: 20,
    paddingHorizontal: 50,
  },
});
