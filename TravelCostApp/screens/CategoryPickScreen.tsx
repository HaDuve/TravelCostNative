import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";

import React, { useState } from "react";
import FlatButton from "../components/UI/FlatButton";
import { GlobalStyles } from "../constants/styles";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr, ru } from "../i18n/supportedLanguages";
import { fetchCategories } from "../util/http";
import { useContext } from "react";
import { TripContext } from "../store/trip-context";
import { Ionicons } from "@expo/vector-icons";
import GradientButton from "../components/UI/GradientButton";
import { useFocusEffect } from "@react-navigation/native";
import { Alert } from "react-native";
import { ActivityIndicator } from "react-native-paper";

import PropTypes from "prop-types";
import { NetworkContext } from "../store/network-context";
import { Category, DEFAULTCATEGORIES } from "../util/category";
import BackButton from "../components/UI/BackButton";
import { getMMKVObject, setMMKVObject } from "../store/mmkv";
import { useCallback } from "react";
import { isConnectionFastEnoughAsBool } from "../util/connectionSpeed";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

const CategoryPickScreen = ({ route, navigation }) => {
  const { editedExpenseId, tempValues } = route.params ? route.params : "";

  const tripCtx = useContext(TripContext);
  const netCtx = useContext(NetworkContext);

  const isOnline = netCtx.isConnected && netCtx.strongConnection;
  const tripid = tripCtx.tripid;

  const CATLIST = DEFAULTCATEGORIES;

  const [categoryList, setCategoryList] = useState(CATLIST);
  // isfetching state
  const [isFetching, setIsFetching] = useState(false);

  // state to check if we just came from manageCategoryScreen

  // load categories from server or asyncstore
  useFocusEffect(
    useCallback(() => {
      const loadCategories = async () => {
        setStoredCategories();
        if (!isOnline) return;
        setIsFetching(true);
        const categories = await fetchCategories(tripid);
        if (categories) {
          const tempList = [...categories];
          tempList.push({
            id: 6,
            icon: "add-outline",
            color: GlobalStyles.colors.textColor,
            cat: "newCat",
            catString: i18n.t("catNewString"),
          });
          setCategoryList(tempList);
          setMMKVObject("categoryList", categories);
        }
        setIsFetching(false);
      };

      // first try to load categories from asyncstore
      const setStoredCategories = () => {
        const categories = getMMKVObject("categoryList");
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
      loadCategories();
    }, [tripid, isOnline])
  );

  async function newCatPressHandler() {
    if (!isOnline) {
      if (await isConnectionFastEnoughAsBool()) {
        // try again
        navigation.navigate("ManageCategory");
        return;
      }
      Alert.alert("Offline", "You need to be online to add a new category");
      return;
    }
    navigation.navigate("ManageCategory");
  }

  async function catPressHandler(item: Category) {
    setIsFetching(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (item.cat === "newCat") {
      await newCatPressHandler();
    } else {
      navigation.navigate("ManageExpense", {
        pickedCat: item.cat ?? item.name,
        newCat: true,
        iconName: item.icon,
        expenseId: editedExpenseId,
        tempValues: tempValues,
      });
    }
    setIsFetching(false);
  }

  function renderCatItem(itemData) {
    const item = itemData.item;
    if (!item.catString) item.catString = item.name;

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
      >
        <View style={styles.widthConstraint}>
          <View style={styles.centerStyle}>
            <Ionicons name={item.icon} size={42} color={item.color} />
            <Text style={styles.itemText}>{item.catString}</Text>
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        numColumns={2}
        data={categoryList}
        renderItem={renderCatItem}
        ListHeaderComponent={
          <>
            <BackButton />
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {isFetching && (
                <ActivityIndicator
                  size="large"
                  color={GlobalStyles.colors.gray500}
                />
              )}
            </View>
          </>
        }
        ListFooterComponent={
          <View>
            <View style={styles.buttonContainer}>
              <FlatButton
                onPress={() => {
                  navigation.goBack();
                }}
              >
                {i18n.t("cancel")}
              </FlatButton>
              {true && (
                <GradientButton
                  buttonStyle={styles.continueButtonStyle}
                  onPress={() => {
                    navigation.navigate("ManageExpense", {
                      pickedCat: "undefined",
                    });
                  }}
                >
                  {i18n.t("continue")}
                </GradientButton>
              )}
            </View>
          </View>
        }
        style={styles.listStyle}
      ></FlatList>
    </View>
  );
};

export default CategoryPickScreen;

CategoryPickScreen.propTypes = {
  navigation: PropTypes.object,
  route: PropTypes.object,
};

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.4,
  },
  listStyle: {
    paddingTop: "2%",
  },
  container: {
    flex: 1,

    ...Platform.select({
      ios: {
        padding: "1%",
        paddingTop: "2%",
        paddingHorizontal: "4%",
      },
      android: {
        padding: "0%",
        paddingTop: "2%",
        paddingHorizontal: "5%",
      },
    }),
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
