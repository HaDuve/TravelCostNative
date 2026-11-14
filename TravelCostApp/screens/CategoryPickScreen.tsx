import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  Alert,
} from "react-native";
import * as Haptics from "expo-haptics";

import React, { useState, useMemo, useContext, useCallback } from "react";
import ActionRow from "../components/UI/ActionRow";
import { GlobalStyles } from "../constants/styles";

import { i18n } from "../i18n/i18n";
import { TripContext } from "../store/trip-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { ActivityIndicator } from "react-native-paper";

import PropTypes from "prop-types";
import { NetworkContext } from "../store/network-context";
import { Category } from "../util/category";
import BackButton from "../components/UI/BackButton";
import { setExpenseCat } from "../store/mmkv";
import { isConnectionFastEnoughAsBool } from "../util/connectionSpeed";
import { dynamicScale } from "../util/scalingUtil";
import { trackEvent } from "../util/vexo-tracking";
import { VexoEvents } from "../util/vexo-constants";
import {
  appendNewCategoryTile,
  createCategoryListStore,
  defaultTripCategoryList,
  readCategoryList,
} from "../util/category-list";

interface CategoryPickScreenProps {
  route: {
    params?: {
      expenseId?: string;
    };
  };
  navigation: any;
}

const CategoryPickScreen = ({ route, navigation }: CategoryPickScreenProps) => {
  const { expenseId } = route.params || {};

  const tripCtx = useContext(TripContext);
  const netCtx = useContext(NetworkContext);

  const isOnline = netCtx.isConnected && netCtx.strongConnection;
  const tripid = tripCtx.tripid;

  const categoryStore = useMemo(() => createCategoryListStore(), []);

  const newCategoryTile: Category = useMemo(
    () => ({
      id: 6,
      icon: "add-outline",
      color: GlobalStyles.colors.textColor,
      cat: "newCat",
      catString: i18n.t("catNewString"),
    }),
    []
  );

  const [categoryList, setCategoryList] = useState(() =>
    appendNewCategoryTile(defaultTripCategoryList(), newCategoryTile)
  );
  const [isFetching, setIsFetching] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const loadCategories = async () => {
        setIsFetching(true);
        try {
          const list = await readCategoryList(categoryStore, tripid, {
            isOnline,
          });
          setCategoryList(appendNewCategoryTile(list, newCategoryTile));
        } finally {
          setIsFetching(false);
        }
      };
      void loadCategories();
    }, [categoryStore, isOnline, newCategoryTile, tripid])
  );

  async function newCatPressHandler() {
    if (!isOnline) {
      if (await isConnectionFastEnoughAsBool()) {
        navigation.navigate("ManageCategory");
        return;
      }
      Alert.alert(i18n.t("alertOffline"), i18n.t("alertNeedOnlineCategory"));
      return;
    }
    navigation.navigate("ManageCategory");
  }

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

      trackEvent(VexoEvents.CATEGORY_PICKED, {
        category: selectedCategory,
        icon: item.icon,
        hasExpenseId: !!expenseId,
      });

      if (expenseId) {
        updateTempCategory(selectedCategory);
        navigation.goBack();
      } else {
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
              <ActionRow
                testID="category-pick-continue"
                tier="primary"
                label={i18n.t("continue")}
                icon="arrow-forward-outline"
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
              />
              <ActionRow
                testID="category-pick-back"
                tier="secondary"
                label={i18n.t("cancel")}
                icon="arrow-back-outline"
                onPress={() => {
                  navigation.goBack();
                }}
              />
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
    paddingHorizontal: "2%",
  },
  buttonStyle: {
    backgroundColor: GlobalStyles.colors.gray500,
    paddingVertical: "4%",
    paddingHorizontal: "1%",
    borderRadius: 12,
    ...GlobalStyles.strongShadow,
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
});
