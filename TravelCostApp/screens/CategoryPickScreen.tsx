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
import { layoutFor } from "../util/layout";
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
import { categoryPickLayoutTokens } from "../styles/category-pick-layout-tokens";

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
  const { width, height, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const layout = useMemo(() => layoutFor({ width, height }), [width, height]);
  const tokens = useMemo(
    () => categoryPickLayoutTokens(layout, fontScale),
    [layout, fontScale]
  );
  const numColumns = categoryPickColumnCount(layout);

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
    const label = item.catString ?? item.name ?? item.cat ?? "";
    const selected = isCategoryTileSelected(item.cat, selectedCategory);

    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ selected }}
        testID={`category-pick-tile-${item.cat ?? "unknown"}`}
        android_ripple={{ color: GlobalStyles.colors.gray600 }}
        style={({ pressed }) => [
          {
            flex: 1,
            margin: tokens.tileMargin,
            minHeight: Math.max(tokens.tileMinHeight, MIN_TOUCH_TARGET),
          },
          {
            backgroundColor: GlobalStyles.colors.gray500,
            borderRadius: tokens.tileBorderRadius,
            ...GlobalStyles.strongShadow,
          },
          selected && styles.selectedTile,
          pressed && GlobalStyles.pressedWithShadow,
        ]}
        onPress={() => void catPressHandler(item)}
      >
        <View
          style={[
            styles.centerStyle,
            { paddingHorizontal: tokens.tilePaddingHorizontal },
          ]}
        >
          <Ionicons
            name={item.icon as React.ComponentProps<typeof Ionicons>["name"]}
            size={dynamicScale(42, false, 0.5)}
            color={item.color}
          />
          <Text
            style={[
              styles.itemText,
              {
                fontSize: tokens.labelFontSize,
                marginTop: tokens.tileLabelMarginTop,
              },
            ]}
            numberOfLines={2}
          >
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
          {
            paddingTop: Math.max(insets.top, tokens.headerSafeAreaFloor),
            paddingHorizontal: tokens.headerPaddingHorizontal,
            paddingBottom: tokens.headerPaddingBottom,
            gap: tokens.headerGap,
          },
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
          style={[styles.title, { fontSize: tokens.titleFontSize }]}
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
            { paddingHorizontal: tokens.editButtonPaddingHorizontal },
            pressed && GlobalStyles.pressed,
          ]}
          onPress={() => void openManageCategories()}
        >
          <Text
            style={[styles.editButtonText, { fontSize: tokens.editFontSize }]}
            numberOfLines={1}
          >
            {i18n.t("editCategories")}
          </Text>
        </Pressable>
      </View>

      {showSpinner ? (
        <View style={styles.spinnerContainer} testID="category-pick-spinner">
          <ActivityIndicator
            size="large"
            color={GlobalStyles.colors.gray500}
          />
        </View>
      ) : (
        <FlatList
          testID="category-pick-list"
          key={`category-pick-cols-${numColumns}`}
          numColumns={numColumns}
          data={categoryList}
          keyExtractor={(item, index) =>
            `${item.cat ?? item.name ?? "cat"}-${index}`
          }
          renderItem={renderCatItem}
          contentContainerStyle={{
            paddingHorizontal: tokens.listPaddingHorizontal,
            paddingBottom: tokens.listPaddingBottom,
          }}
          style={styles.listStyle}
        />
      )}

      <View
        style={[
          styles.bottomBar,
          {
            paddingHorizontal: tokens.bottomBarPaddingHorizontal,
            paddingTop: tokens.bottomBarPaddingTop,
            paddingBottom: Math.max(
              insets.bottom,
              tokens.bottomBarSafeAreaFloor
            ),
          },
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
  },
  headerButton: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: "center",
    alignItems: "center",
  },
  editButton: {
    flexShrink: 1,
  },
  editButtonText: {
    color: GlobalStyles.colors.primary400,
    fontWeight: "400",
  },
  title: {
    flex: 1,
    textAlign: "center",
    color: GlobalStyles.colors.textColor,
    fontWeight: "600",
  },
  listStyle: {
    flex: 1,
  },
  spinnerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  bottomBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: GlobalStyles.colors.gray500,
    backgroundColor: GlobalStyles.colors.backgroundColor,
  },
  centerStyle: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedTile: {
    backgroundColor: GlobalStyles.colors.primary100,
    borderWidth: 2,
    borderColor: GlobalStyles.colors.primary400,
  },
  itemText: {
    color: GlobalStyles.colors.textColor,
    fontWeight: "400",
    textAlign: "center",
    flexShrink: 1,
  },
});
