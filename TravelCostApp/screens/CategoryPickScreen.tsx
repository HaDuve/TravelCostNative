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
import * as Haptics from "expo-haptics";

import React, { useState } from "react";
import IconButton from "../components/UI/IconButton";
import Button from "../components/UI/Button";
import FlatButton from "../components/UI/FlatButton";
import { GlobalStyles } from "../constants/styles";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr } from "../i18n/supportedLanguages";
import { Category } from "../util/category";
import {
  fetchCategories,
  storeCategories,
  updateCategories,
} from "../util/http";
import { useContext } from "react";
import { TripContext } from "../store/trip-context";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import GradientButton from "../components/UI/GradientButton";
import useEffect from "react";
import { useFocusEffect } from "@react-navigation/native";
import { asyncStoreGetObject } from "../store/async-storage";
const i18n = new I18n({ en, de, fr });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

const CategoryPickScreen = ({ route, navigation }) => {
  const tripCtx = useContext(TripContext);
  const tripid = tripCtx.tripid;
  const { editedExpenseId } = route.params ? route.params : "null";
  console.log("CategoryPickScreen ~ editedExpenseId", editedExpenseId);
  const [isShaking, setIsShaking] = useState(false);

  const CATLIST = [
    {
      id: 1,
      icon: "fast-food-outline",
      color: GlobalStyles.colors.textColor,
      cat: "food",
      catString: i18n.t("catFoodString"),
    },
    {
      id: 2,
      icon: "airplane-outline",
      color: GlobalStyles.colors.textColor,
      cat: "international-travel",
      catString: i18n.t("catIntTravString"),
    },
    {
      id: 3,
      icon: "bed-outline",
      color: GlobalStyles.colors.textColor,
      cat: "accomodation",
      catString: i18n.t("catAccoString"),
    },
    {
      id: 4,
      icon: "car-outline",
      color: GlobalStyles.colors.textColor,
      cat: "national-travel",
      catString: i18n.t("catNatTravString"),
    },
    {
      id: 5,
      icon: "basket-outline",
      color: GlobalStyles.colors.textColor,
      cat: "other",
      catString: i18n.t("catOtherString"),
    },
    {
      id: 6,
      icon: "add-outline",
      color: GlobalStyles.colors.textColor,
      cat: "newCat",
      catString: i18n.t("catNewString"),
    },
  ];

  const [categoryList, setCategoryList] = useState(CATLIST);

  // load categories from server or asyncstore
  useFocusEffect(
    React.useCallback(() => {
      const loadCategories = async () => {
        const categories = await fetchCategories(tripid);
        console.log("CategoryPickScreen ~ categories", categories);
        if (categories) {
          for (const key in categories) {
            const categoryList = categories[key];
            console.log("fetchCategoryList ~ categoryList:", categoryList);
            categoryList.push({
              id: 6,
              icon: "add-outline",
              color: GlobalStyles.colors.textColor,
              cat: "newCat",
              catString: i18n.t("catNewString"),
            });
            setCategoryList(categoryList);
          }
        }
      };

      // first try to load categories from asyncstore
      const loadCategoryList = async () => {
        const categories = await asyncStoreGetObject("categoryList");
        if (categories) {
          categories.push({
            id: 6,
            icon: "add-outline",
            color: GlobalStyles.colors.textColor,
            cat: "newCat",
            catString: i18n.t("catNewString"),
          });
          setCategoryList(categories);
        }
      };
      loadCategoryList();
      // loadCategories();
    }, [])
  );

  async function catPressHandler(item) {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsShaking(false);
    if (item.cat === "newCat") {
      Toast.show({
        type: "error",
        text1: "Not yet implemented",
        text2: "This function will be available soon!",
      });
      navigation.navigate("ManageCategory");
    } else
      navigation.navigate("ManageExpense", {
        pickedCat: item.cat ?? item.name,
        newCat: true,
        iconName: item.icon,
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
    if (!item.catString) item.catString = item.name;
    item.shakeAnimation = new Animated.Value(0);
    if (isShaking) startShake(item);
    return (
      <Pressable
        style={({ pressed }) => [
          styles.widthConstraint,
          GlobalStyles.strongShadow,
          styles.itemContainer,
          styles.buttonStyle,
          pressed && GlobalStyles.pressedWithShadow,
        ]}
        onPress={catPressHandler.bind(this, item)}
        // onLongPress={catLongPressHandler.bind(this, item)}
      >
        <Animated.View
          style={[
            styles.widthConstraint,
            { transform: [{ translateX: item.shakeAnimation }] },
          ]}
        >
          <Animated.View
            style={[
              styles.centerStyle,
              { transform: [{ translateX: item.shakeAnimation }] },
            ]}
          >
            <Ionicons name={item.icon} size={42} color={item.color} />
            <Text style={styles.itemText}>{item.catString}</Text>
          </Animated.View>
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        numColumns={2}
        data={categoryList}
        renderItem={renderCatItem}
        ListFooterComponent={
          <View style={styles.buttonContainer}>
            <FlatButton
              onPress={() => {
                navigation.goBack();
              }}
            >
              {i18n.t("cancel")}
            </FlatButton>
            <GradientButton
              buttonStyle={styles.continueButtonStyle}
              onPress={() => {
                navigation.navigate("ManageExpense", {
                  pickedCat: "other",
                });
              }}
            >
              {i18n.t("continue")}
            </GradientButton>
          </View>
        }
        style={styles.listStyle}
      ></FlatList>
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
    flex: 1,

    justifyContent: "center",
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
    marginTop: "2%",
    color: GlobalStyles.colors.textColor,
    fontWeight: "200",
    fontStyle: "italic",
  },
  continueButtonStyle: {
    paddingVertical: "12%",
    paddingHorizontal: "12%",
  },
});
