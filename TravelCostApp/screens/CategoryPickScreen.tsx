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
import { useGlobalStyles } from "../store/theme-context";

import { i18n } from "../i18n/i18n";
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
import { getMMKVObject, setMMKVObject, setExpenseCat } from "../store/mmkv";
import { useCallback } from "react";
import { isConnectionFastEnoughAsBool } from "../util/connectionSpeed";
import { dynamicScale } from "../util/scalingUtil";
import { trackEvent } from "../util/vexo-tracking";
import { VexoEvents } from "../util/vexo-constants";

interface CategoryPickScreenProps {
  route: {
    params?: {
      expenseId?: string;
    };
  };
  navigation: any;
}

const CategoryPickScreen = ({ route, navigation }: CategoryPickScreenProps) => {
  const GlobalStyles = useGlobalStyles();
  const styles = getStyles(GlobalStyles);
  const { expenseId } = route.params || {};

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

  // Helper function to update category in temp storage
  const updateTempCategory = useCallback(
    (categoryValue: string) => {
      if (expenseId) {
        setExpenseCat(expenseId, {
          expenseId: expenseId,
          category: categoryValue,
        });
      }
    },
    [expenseId]
  );

  async function catPressHandler(item: Category) {
    setIsFetching(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (item.cat === "newCat") {
      await newCatPressHandler();
    } else {
      const selectedCategory = item.cat ?? item.name;

      // Track category selection
      trackEvent(VexoEvents.CATEGORY_PICKED, {
        category: selectedCategory,
        icon: item.icon,
        hasExpenseId: !!expenseId,
      });

      if (expenseId) {
        // Coming from ManageExpense - store and go back
        updateTempCategory(selectedCategory);
        navigation.goBack();
      } else {
        // Coming from AddExpenseButton - navigate to ManageExpense
        navigation.navigate("ManageExpense", {
          pickedCat: selectedCategory,
          iconName: item.icon,
        });
      }
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
            <BackButton style={{ zIndex: 1000 }} />
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
                textStyle={{}}
              >
                {i18n.t("cancel")}
              </FlatButton>
              {true && (
                <GradientButton
                  buttonStyle={styles.continueButtonStyle}
                  onPress={() => {
                    if (expenseId) {
                      updateTempCategory("undefined");
                      navigation.goBack();
                    } else {
                      navigation.navigate("ManageExpense", {
                        pickedCat: "undefined",
                      });
                    }
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

const getStyles = (GlobalStyles) =>
  StyleSheet.create({
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
    fontSize: dynamicScale(16, false, 0.5),
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
