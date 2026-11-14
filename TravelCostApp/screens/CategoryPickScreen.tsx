import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

import PropTypes from "prop-types";
import { NetworkContext } from "../store/network-context";
import { Category } from "../util/category";
import { getExpenseCat, setExpenseCat } from "../store/mmkv";
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
import {
  categoryPickColumnCount,
  categoryPickSelectionResult,
  isCategoryTileSelected,
  SKIP_CATEGORY_VALUE,
  shouldShowCategoryPickSpinner,
} from "../util/category-pick";

interface CategoryPickScreenProps {
  route: {
    params?: {
      expenseId?: string;
    };
  };
  navigation: any;
}

const MIN_TOUCH_TARGET = 48;

const CategoryPickScreen = ({ route, navigation }: CategoryPickScreenProps) => {
  const { expenseId } = route.params || {};
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const numColumns = categoryPickColumnCount(width);

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

  const cachedOnMount = useMemo(() => {
    const cached = categoryStore.getCached();
    return cached != null && cached.length > 0;
  }, [categoryStore]);

  const [categoryList, setCategoryList] = useState(() => {
    const cached = categoryStore.getCached();
    const base =
      cached && cached.length > 0
        ? cached
        : defaultTripCategoryList();
    return appendNewCategoryTile(base, newCategoryTile);
  });
  const [isLoading, setIsLoading] = useState(!cachedOnMount);
  const [hasCachedList, setHasCachedList] = useState(cachedOnMount);

  const selectedCategory = useMemo(() => {
    if (!expenseId) return undefined;
    const temp = getExpenseCat(expenseId) as
      | { category?: string }
      | undefined
      | null;
    return temp?.category;
  }, [expenseId]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const loadCategories = async () => {
        const hadCache =
          (categoryStore.getCached()?.length ?? 0) > 0;
        if (!hadCache) {
          setIsLoading(true);
        }
        try {
          const list = await readCategoryList(categoryStore, tripid, {
            isOnline,
          });
          if (cancelled) return;
          setCategoryList(appendNewCategoryTile(list, newCategoryTile));
          setHasCachedList(true);
        } finally {
          if (!cancelled) {
            setIsLoading(false);
          }
        }
      };
      void loadCategories();
      return () => {
        cancelled = true;
      };
    }, [categoryStore, isOnline, newCategoryTile, tripid])
  );

  const showSpinner = shouldShowCategoryPickSpinner({
    isLoading,
    hasCachedList,
  });

  async function openManageCategories() {
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

  const applySelectionResult = useCallback(
    (category: string, iconName?: string) => {
      const result = categoryPickSelectionResult({
        expenseId,
        category,
        iconName,
      });

      if (result.action === "goBack") {
        setExpenseCat(result.expenseId, {
          expenseId: result.expenseId,
          category: result.category,
        });
        navigation.goBack();
        return;
      }

      if (result.iconName) {
        navigation.navigate("ManageExpense", {
          pickedCat: result.pickedCat,
          iconName: result.iconName,
        });
        return;
      }

      navigation.navigate("ManageExpense", {
        pickedCat: result.pickedCat,
      });
    },
    [expenseId, navigation]
  );

  async function catPressHandler(item: Category) {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (item.cat === "newCat") {
      await openManageCategories();
      return;
    }

    const selected = item.cat ?? item.name ?? SKIP_CATEGORY_VALUE;

    trackEvent(VexoEvents.CATEGORY_PICKED, {
      category: selected,
      icon: item.icon,
      hasExpenseId: !!expenseId,
    });

    applySelectionResult(selected, item.icon);
  }

  function skipCategoryHandler() {
    applySelectionResult(SKIP_CATEGORY_VALUE);
  }

  function renderCatItem(itemData: { item: Category }) {
    const item = itemData.item;
    if (!item.catString) item.catString = item.name;

    const label = item.catString ?? item.cat ?? "";
    const selected = isCategoryTileSelected(item.cat, selectedCategory);

    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ selected }}
        android_ripple={{ color: GlobalStyles.colors.gray600 }}
        style={({ pressed }) => [
          styles.itemContainer,
          styles.buttonStyle,
          selected && styles.selectedTile,
          pressed && GlobalStyles.pressedWithShadow,
        ]}
        onPress={() => void catPressHandler(item)}
      >
        <View style={styles.centerStyle}>
          <Ionicons
            name={item.icon as React.ComponentProps<typeof Ionicons>["name"]}
            size={dynamicScale(42, false, 0.5)}
            color={item.color}
          />
          <Text style={styles.itemText} numberOfLines={2}>
            {label}
          </Text>
        </View>
      </Pressable>
    );
  }

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.header,
          { paddingTop: Math.max(insets.top, dynamicScale(8, false, 0.5)) },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={i18n.t("close")}
          testID="category-pick-close"
          hitSlop={8}
          android_ripple={{ color: GlobalStyles.colors.gray600, borderless: true }}
          style={({ pressed }) => [
            styles.headerButton,
            pressed && GlobalStyles.pressed,
          ]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name="close-outline"
            size={dynamicScale(28, false, 0.5)}
            color={GlobalStyles.colors.textColor}
          />
        </Pressable>

        <Text
          accessibilityRole="header"
          style={styles.title}
          numberOfLines={1}
        >
          {i18n.t("pickCategoryTitle")}
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={i18n.t("editCategories")}
          testID="category-pick-edit"
          hitSlop={8}
          android_ripple={{ color: GlobalStyles.colors.gray600, borderless: true }}
          style={({ pressed }) => [
            styles.headerButton,
            styles.editButton,
            pressed && GlobalStyles.pressed,
          ]}
          onPress={() => void openManageCategories()}
        >
          <Text style={styles.editButtonText} numberOfLines={1}>
            {i18n.t("editCategories")}
          </Text>
        </Pressable>
      </View>

      {showSpinner ? (
        <View style={styles.spinnerContainer}>
          <ActivityIndicator
            size="large"
            color={GlobalStyles.colors.gray500}
          />
        </View>
      ) : (
        <FlatList
          key={`category-pick-cols-${numColumns}`}
          numColumns={numColumns}
          data={categoryList}
          keyExtractor={(item, index) =>
            `${item.cat ?? item.name ?? "cat"}-${index}`
          }
          renderItem={renderCatItem}
          contentContainerStyle={styles.listContent}
          style={styles.listStyle}
        />
      )}

      <View
        style={[
          styles.bottomBar,
          { paddingBottom: Math.max(insets.bottom, dynamicScale(12, false, 0.5)) },
        ]}
      >
        <ActionRow
          testID="category-pick-skip"
          tier="secondary"
          label={i18n.t("skipCategory")}
          icon="arrow-forward-outline"
          onPress={skipCategoryHandler}
        />
      </View>
    </View>
  );
};

export default CategoryPickScreen;

CategoryPickScreen.propTypes = {
  navigation: PropTypes.object,
  route: PropTypes.object,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GlobalStyles.colors.backgroundColor,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: dynamicScale(12, false, 0.5),
    paddingBottom: dynamicScale(8, false, 0.5),
    gap: dynamicScale(8, false, 0.5),
  },
  headerButton: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: "center",
    alignItems: "center",
  },
  editButton: {
    flexShrink: 1,
    paddingHorizontal: dynamicScale(8, false, 0.5),
  },
  editButtonText: {
    color: GlobalStyles.colors.primary400,
    fontSize: dynamicScale(16, false, 0.5),
    fontWeight: "400",
  },
  title: {
    flex: 1,
    textAlign: "center",
    color: GlobalStyles.colors.textColor,
    fontSize: dynamicScale(18, false, 0.5),
    fontWeight: "600",
  },
  listStyle: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: dynamicScale(12, false, 0.5),
    paddingBottom: dynamicScale(8, false, 0.5),
  },
  spinnerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  bottomBar: {
    paddingHorizontal: dynamicScale(12, false, 0.5),
    paddingTop: dynamicScale(8, false, 0.5),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: GlobalStyles.colors.gray500,
    backgroundColor: GlobalStyles.colors.backgroundColor,
  },
  centerStyle: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: dynamicScale(4, false, 0.5),
  },
  buttonStyle: {
    backgroundColor: GlobalStyles.colors.gray500,
    borderRadius: 12,
    ...GlobalStyles.strongShadow,
  },
  itemContainer: {
    flex: 1,
    margin: dynamicScale(8, false, 0.5),
    height: dynamicScale(120, false, 0.5),
    minHeight: MIN_TOUCH_TARGET,
  },
  selectedTile: {
    backgroundColor: GlobalStyles.colors.primary100,
    borderWidth: 2,
    borderColor: GlobalStyles.colors.primary400,
  },
  itemText: {
    fontSize: dynamicScale(16, false, 0.5),
    marginTop: dynamicScale(4, false, 0.5),
    color: GlobalStyles.colors.textColor,
    fontWeight: "400",
    textAlign: "center",
    flexShrink: 1,
  },
});
