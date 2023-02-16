import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import React, { useState } from "react";
import IconButton from "../components/UI/IconButton";
import Button from "../components/UI/Button";
import FlatButton from "../components/UI/FlatButton";
import { GlobalStyles } from "../constants/styles";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de } from "../i18n/supportedLanguages";
const i18n = new I18n({ en, de });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

const CategoryPickScreen = ({ route, navigation }) => {
  const { editedExpenseId } = route.params ? route.params : "null";
  console.log("CategoryPickScreen ~ editedExpenseId", editedExpenseId);
  const [isShaking, setIsShaking] = useState(false);

  const CATLIST = [
    {
      icon: "fast-food-outline",
      color: GlobalStyles.colors.textColor,
      cat: "food",
      catString: i18n.t("catFoodString"),
    },
    {
      icon: "airplane-outline",
      color: GlobalStyles.colors.textColor,
      cat: "international-travel",
      catString: i18n.t("catIntTravString"),
    },
    {
      icon: "bed-outline",
      color: GlobalStyles.colors.textColor,
      cat: "accomodation",
      catString: i18n.t("catAccoString"),
    },
    {
      icon: "car-outline",
      color: GlobalStyles.colors.textColor,
      cat: "national-travel",
      catString: i18n.t("catNatTravString"),
    },
    {
      icon: "basket-outline",
      color: GlobalStyles.colors.textColor,
      cat: "other",
      catString: i18n.t("catOtherString"),
    },
    {
      icon: "add-outline",
      color: GlobalStyles.colors.textColor,
      cat: "newCat",
      catString: i18n.t("catNewString"),
    },
  ];

  function catPressHandler(item) {
    setIsShaking(false);
    if (item.cat === "newCat") {
      Alert.alert("New Category function coming soon... ");
    } else
      navigation.navigate("ManageExpense", {
        pickedCat: item.cat,
        newCat: true,
        expenseId: editedExpenseId,
      });
  }

  function catLongPressHandler(item) {
    setIsShaking(true);
    console.log("long pressed", item);
    Alert.alert("Customizing categories function coming soon... ");
  }

  function startShake(item) {
    Animated.sequence([
      Animated.timing(item.shakeAnimation, {
        toValue: 5,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(item.shakeAnimation, {
        toValue: -5,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(item.shakeAnimation, {
        toValue: 5,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(item.shakeAnimation, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    setTimeout(() => {
      if (isShaking) startShake(item);
    }, 800);
  }

  function renderCatItem(itemData) {
    const item = itemData.item;
    item.shakeAnimation = new Animated.Value(0);
    if (isShaking) startShake(item);
    return (
      <Animated.View
        style={[
          styles.itemContainer,
          styles.buttonStyle,
          GlobalStyles.strongShadow,
          styles.widthConstraint,
          { transform: [{ translateX: item.shakeAnimation }] },
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.widthConstraint,
            pressed && styles.pressed,
          ]}
          onPress={catPressHandler.bind(this, item)}
          onLongPress={catLongPressHandler.bind(this, item)}
        >
          <Animated.View
            style={[
              styles.centerStyle,
              { transform: [{ translateX: item.shakeAnimation }] },
            ]}
          >
            <IconButton
              icon={item.icon}
              size={42}
              color={item.color}
              onPress={catPressHandler.bind(this, item)}
              onLongPress={catLongPressHandler.bind(this, item)}
            ></IconButton>
            <Text style={styles.itemText}>{item.catString}</Text>
          </Animated.View>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        numColumns={2}
        data={CATLIST}
        renderItem={renderCatItem}
        ListFooterComponent={<View style={{ height: 100 }}></View>}
        style={styles.listStyle}
      ></FlatList>
      <View style={styles.buttonContainer}>
        <FlatButton
          onPress={() => {
            navigation.goBack();
          }}
        >
          {i18n.t("cancel")}
        </FlatButton>
        <Button
          buttonStyle={styles.continueButtonStyle}
          onPress={() => {
            navigation.navigate("ManageExpense", {
              pickedCat: "other",
            });
          }}
        >
          {i18n.t("continue")}
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
  listStyle: {
    paddingTop: "2%",
  },
  container: {
    flex: 1,
    padding: "1%",
    paddingTop: "2%",
    paddingHorizontal: "4%",
  },
  widthConstraint: {
    minWidth: "30%",
    maxWidth: "100%",
  },
  rowContainer: {
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
    paddingVertical: "4%",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  buttonStyle: {
    backgroundColor: GlobalStyles.colors.gray500,
    paddingVertical: "4%",
    paddingHorizontal: "1%",
    borderRadius: 12,
  },
  itemContainer: {
    flex: 1,
    margin: "3%",
  },
  onPressStyleItem: {
    backgroundColor: GlobalStyles.colors.primary400,
  },
  itemText: {
    fontSize: 16,
    marginTop: "-6%",
    color: GlobalStyles.colors.textColor,
    fontWeight: "200",
    fontStyle: "italic",
  },
  continueButtonStyle: {
    paddingVertical: "12%",
    paddingHorizontal: "12%",
  },
});
