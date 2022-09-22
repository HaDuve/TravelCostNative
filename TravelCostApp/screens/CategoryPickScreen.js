import {
  Alert,
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import React from "react";
import IconButton from "../components/UI/IconButton";
import Button from "../components/UI/Button";
import FlatButton from "../components/UI/FlatButton";
import { GlobalStyles } from "../constants/styles";

const CategoryPickScreen = ({ route, navigation }) => {
  const { tempPickedCat, tempValues } = route.params ? route.params : "null";

  const CATLIST = [
    {
      icon: "fast-food-outline",
      color: GlobalStyles.colors.textColor,
      cat: "food",
      catString: "Food",
    },
    {
      icon: "airplane-outline",
      color: GlobalStyles.colors.textColor,
      cat: "international-travel",
      catString: "International Travel",
    },
    {
      icon: "bed-outline",
      color: GlobalStyles.colors.textColor,
      cat: "accomodation",
      catString: "Accomodation",
    },
    {
      icon: "car-outline",
      color: GlobalStyles.colors.textColor,
      cat: "national-travel",
      catString: "National Travel",
    },
    {
      icon: "basket-outline",
      color: GlobalStyles.colors.textColor,
      cat: "other",
      catString: "Other",
    },
    {
      icon: "add-outline",
      color: GlobalStyles.colors.textColor,
      cat: "newCat",
      catString: "New Category",
    },
  ];

  function catPressHandler(item) {
    if (item.cat === "newCat") {
      Alert.alert("New Category function coming soon... ");
    } else
      navigation.navigate("ManageExpense", {
        pickedCat: item.cat,
      });
  }

  function renderCatItem(itemData) {
    const item = itemData.item;
    console.log("renderCatItem ~ item", item);
    return (
      <View
        style={[
          styles.itemContainer,
          styles.buttonStyle,
          GlobalStyles.shadow,
          styles.widthConstraint,
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.widthConstraint,
            pressed && styles.pressed,
          ]}
          onPress={catPressHandler.bind(this, item)}
        >
          <View style={styles.centerStyle}>
            <IconButton
              icon={item.icon}
              size={42}
              color={item.color}
              onPress={catPressHandler.bind(this, item)}
            ></IconButton>
            <Text style={styles.itemText}>{item.catString}</Text>
          </View>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        numColumns={2}
        data={CATLIST}
        renderItem={renderCatItem}
      ></FlatList>
      <View style={styles.buttonContainer}>
        <FlatButton
          onPress={() => {
            navigation.goBack();
          }}
        >
          Cancel
        </FlatButton>
        <Button
          buttonStyle={styles.continueButtonStyle}
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
  pressed: {
    opacity: 0.4,
  },
  container: {
    flex: 1,
    padding: 4,
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  widthConstraint: {
    minWidth: Dimensions.get("window").width / 2.7,
    maxWidth: Dimensions.get("window").width / 2.7,
  },
  rowContainer: {
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  centerStyle: {
    justifyContent: "flex-start",
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
    paddingBottom: 8,
    paddingHorizontal: 4,
  },
  itemContainer: {
    flex: 1,
    padding: 0,
    margin: 16,
  },
  onPressStyleItem: {
    backgroundColor: GlobalStyles.colors.primary400,
  },
  itemText: {
    fontSize: 16,
    color: GlobalStyles.colors.textColor,
    fontWeight: "200",
    fontStyle: "italic",
  },
  continueButtonStyle: {
    paddingVertical: 16,
    paddingHorizontal: 44,
  },
});
