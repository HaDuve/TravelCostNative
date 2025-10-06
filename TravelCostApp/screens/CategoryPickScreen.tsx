import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as Haptics from "expo-haptics";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";

import GradientButton from "../components/UI/GradientButton";

import { Alert } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import PropTypes from "prop-types";
import React, { useState, useContext, useCallback } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import BackButton from "../components/UI/BackButton";
import FlatButton from "../components/UI/FlatButton";
import { GlobalStyles } from "../constants/styles";
import { en, de, fr, ru } from "../i18n/supportedLanguages";
import { getMMKVObject, setMMKVObject } from "../store/mmkv";
import { NetworkContext } from "../store/network-context";
import { TripContext } from "../store/trip-context";
import { Category, DEFAULTCATEGORIES } from "../util/category";
import { isConnectionFastEnoughAsBool } from "../util/connectionSpeed";
import { fetchCategories } from "../util/http";
import { dynamicScale } from "../util/scalingUtil";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale =
  Localization.getLocales()[0] && Localization.getLocales()[0].languageCode
    ? Localization.getLocales()[0].languageCode.slice(0, 2)
    : "en";
i18n.enableFallback = true;
// i18n.locale = "en";

interface CategoryPickScreenProps {
  route: {
    params?: {
      editedExpenseId?: string;
      tempValues?: any; // ExpenseData type
    };
  };
  navigation: any;
}

const CategoryPickScreen = ({ route, navigation }: CategoryPickScreenProps) => {
  const { editedExpenseId, tempValues } = route.params || {};

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
      Alert.alert(i18n.t("alertOffline"), i18n.t("alertNeedOnlineCategory"));
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
        tempValues,
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
            <Ionicons
              name={item.icon}
              size={dynamicScale(42, false, 0.5)}
              color={item.color}
            />
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
            <BackButton style={{}} />
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
                      tempValues,
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
  buttonContainer: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: "4%",
  },
  buttonStyle: {
    backgroundColor: GlobalStyles.colors.gray500,
    borderRadius: 12,
    paddingHorizontal: "1%",
    paddingVertical: "4%",
  },
  centerStyle: {
    alignItems: "center",

    flex: 1,
    justifyContent: "center",
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
  continueButtonStyle: {
    paddingHorizontal: "12%",
    paddingVertical: "12%",
  },
  itemContainer: {
    flex: 1,
    margin: "3%",
  },
  itemText: {
    color: GlobalStyles.colors.textColor,
    fontSize: dynamicScale(16, false, 0.5),
    fontStyle: "italic",
    fontWeight: "200",
    marginTop: "2%",
  },
  listStyle: {
    paddingTop: "2%",
  },
  onPressStyleItem: {
    backgroundColor: GlobalStyles.colors.primary400,
  },
  pressed: {
    opacity: 0.4,
  },
  rowContainer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-around",
  },
  widthConstraint: {
    maxWidth: "100%",
    minWidth: "30%",
  },
});
