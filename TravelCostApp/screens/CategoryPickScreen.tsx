import {
  AccessibilityInfo,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";

import React, {
  useState,
  useMemo,
  useContext,
  useCallback,
  useEffect,
} from "react";
import ActionRow from "../components/UI/ActionRow";
import { GlobalStyles } from "../constants/styles";

import { i18n } from "../i18n/i18n";
import { TripContext } from "../store/trip-context";
import { UserContext } from "../store/user-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { ActivityIndicator } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
} from "react-native-reanimated";
import Sortable, {
  type SortableGridRenderItem,
} from "react-native-sortables";

import PropTypes from "prop-types";
import { NetworkContext } from "../store/network-context";
import { Category } from "../util/category";
import { getExpenseCat, setExpenseCat } from "../store/mmkv";
import { isConnectionFastEnoughAsBool } from "../util/connectionSpeed";
import { dynamicScale } from "../util/scalingUtil";
import { layoutFor } from "../util/layout";
import { trackEvent } from "../util/vexo-tracking";
import { VexoEvents } from "../util/vexo-constants";
import safeLogError from "../util/error";
import {
  appendNewCategoryTile,
  createCategoryListStore,
  defaultTripCategoryList,
  moveCategoryAt,
  NEW_CATEGORY_CAT,
  persistReorderedCategoryList,
  readCategoryList,
  withoutNewCategoryTile,
} from "../util/category-list";
import {
  categoryPickColumnCount,
  categoryPickSelectionResult,
  isCategoryTileSelected,
  SKIP_CATEGORY_VALUE,
  shouldShowCategoryPickSpinner,
} from "../util/category-pick";
import {
  categoryPickLayoutTokens,
  type CategoryPickLayoutTokens,
} from "../styles/category-pick-layout-tokens";

interface CategoryPickScreenProps {
  route: {
    params?: {
      expenseId?: string;
    };
  };
  navigation: any;
}

const MIN_TOUCH_TARGET = 48;

function CategoryTileContent({
  item,
  label,
  isReordering,
  reduceMotion,
  tokens,
}: {
  item: Category;
  label: string;
  isReordering: boolean;
  reduceMotion: boolean;
  tokens: CategoryPickLayoutTokens;
}) {
  const wobble = useSharedValue(0);

  useEffect(() => {
    if (!isReordering || reduceMotion || item.cat === NEW_CATEGORY_CAT) {
      cancelAnimation(wobble);
      wobble.value = 0;
      return;
    }
    wobble.value = withRepeat(
      withSequence(
        withTiming(-1.5, { duration: 90 }),
        withTiming(1.5, { duration: 180 }),
        withTiming(0, { duration: 90 })
      ),
      -1,
      false
    );
    return () => {
      cancelAnimation(wobble);
    };
  }, [isReordering, item.cat, reduceMotion, wobble]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${wobble.value}deg` }],
  }));

  return (
    <Animated.View
      style={[
        styles.centerStyle,
        { paddingHorizontal: tokens.tilePaddingHorizontal },
        animatedStyle,
      ]}
    >
      {isReordering && item.cat !== NEW_CATEGORY_CAT ? (
        <Ionicons
          name="reorder-three-outline"
          size={dynamicScale(18, false, 0.5)}
          color={GlobalStyles.colors.gray700}
          style={styles.dragAffordance}
        />
      ) : null}
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
    </Animated.View>
  );
}

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
  const scrollableRef = useAnimatedRef<Animated.ScrollView>();

  const tripCtx = useContext(TripContext);
  const netCtx = useContext(NetworkContext);
  const userCtx = useContext(UserContext);

  const isOnline = netCtx.isConnected && netCtx.strongConnection;
  const tripid = tripCtx.tripid;

  const categoryStore = useMemo(() => createCategoryListStore(), []);

  const newCategoryTile: Category = useMemo(
    () => ({
      id: 6,
      icon: "add-outline",
      color: GlobalStyles.colors.textColor,
      cat: NEW_CATEGORY_CAT,
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
  const [isReordering, setIsReordering] = useState(false);
  const [orderBeforeReorder, setOrderBeforeReorder] = useState<Category[] | null>(
    null
  );
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  const selectedCategory = useMemo(() => {
    if (!expenseId) return undefined;
    const temp = getExpenseCat(expenseId) as
      | { category?: string }
      | undefined
      | null;
    return temp?.category;
  }, [expenseId]);

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (enabled) => {
        setReduceMotion(enabled);
      }
    );
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (isReordering) return;
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
    }, [categoryStore, isOnline, isReordering, newCategoryTile, tripid])
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
    if (isReordering) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (item.cat === NEW_CATEGORY_CAT) {
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

  async function tryEnterReorder(item: Category) {
    if (isReordering || item.cat === NEW_CATEGORY_CAT) return;

    if (!isOnline) {
      Alert.alert(i18n.t("alertOffline"), i18n.t("alertNeedOnlineCategory"));
      return;
    }

    const isPremium =
      userCtx.isPremium || (await userCtx.checkPremium?.()) || false;
    if (!isPremium) {
      navigation.navigate("Paywall");
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setOrderBeforeReorder(categoryList);
    setIsReordering(true);
  }

  const persistCurrentOrder = useCallback(
    async (listToSave: Category[]) => {
      const previous =
        withoutNewCategoryTile(orderBeforeReorder ?? categoryList);
      const next = withoutNewCategoryTile(listToSave);
      setIsSavingOrder(true);
      try {
        const result = await persistReorderedCategoryList(
          categoryStore,
          tripid,
          previous,
          next,
          { isOnline }
        );

        if (result.status === "saved") {
          setCategoryList(appendNewCategoryTile(result.list, newCategoryTile));
          setOrderBeforeReorder(null);
          setIsReordering(false);
          await userCtx.loadCatListFromAsyncInCtx?.(tripid);
          return;
        }

        setCategoryList(
          appendNewCategoryTile(result.list, newCategoryTile)
        );

        if (result.status === "offline") {
          Alert.alert(i18n.t("alertOffline"), i18n.t("alertNeedOnlineCategory"));
          setIsReordering(false);
          setOrderBeforeReorder(null);
          return;
        }

        safeLogError(result.error);
        Alert.alert(i18n.t("error"), i18n.t("toastErrorSaveCategories"), [
          { text: i18n.t("cancel"), style: "cancel" },
          {
            text: i18n.t("retry"),
            onPress: () => {
              setCategoryList(listToSave);
              void persistCurrentOrder(listToSave);
            },
          },
        ]);
      } finally {
        setIsSavingOrder(false);
      }
    },
    [
      categoryList,
      categoryStore,
      isOnline,
      newCategoryTile,
      orderBeforeReorder,
      tripid,
      userCtx,
    ]
  );

  async function finishReorder() {
    if (isSavingOrder) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await persistCurrentOrder(categoryList);
  }

  function skipCategoryHandler() {
    if (isReordering) return;
    applySelectionResult(SKIP_CATEGORY_VALUE);
  }

  const onAccessibilityMove = useCallback(
    (item: Category, direction: "earlier" | "later") => {
      if (!isReordering || item.cat === NEW_CATEGORY_CAT) return;
      const movable = withoutNewCategoryTile(categoryList);
      const fromIndex = movable.findIndex((c) => c.cat === item.cat);
      if (fromIndex < 0) return;
      const toIndex =
        direction === "earlier" ? fromIndex - 1 : fromIndex + 1;
      if (toIndex < 0 || toIndex >= movable.length) return;
      setCategoryList(moveCategoryAt(categoryList, fromIndex, toIndex));
    },
    [categoryList, isReordering]
  );

  function tileAccessibilityProps(item: Category, label: string) {
    if (!isReordering || item.cat === NEW_CATEGORY_CAT) {
      return {
        accessibilityRole: "button" as const,
        accessibilityLabel: label,
      };
    }
    return {
      accessibilityRole: "button" as const,
      accessibilityLabel: label,
      accessibilityActions: [
        { name: "moveEarlier", label: i18n.t("moveCategoryEarlier") },
        { name: "moveLater", label: i18n.t("moveCategoryLater") },
      ],
      onAccessibilityAction: (event: {
        nativeEvent: { actionName: string };
      }) => {
        if (event.nativeEvent.actionName === "moveEarlier") {
          onAccessibilityMove(item, "earlier");
        } else if (event.nativeEvent.actionName === "moveLater") {
          onAccessibilityMove(item, "later");
        }
      },
    };
  }

  function renderCatItem(itemData: { item: Category }) {
    const item = itemData.item;
    if (!item.catString) item.catString = item.name;

    const label = item.catString ?? item.cat ?? "";
    const selected = isCategoryTileSelected(item.cat, selectedCategory);

    return (
      <Pressable
        {...tileAccessibilityProps(item, label)}
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
        onLongPress={() => void tryEnterReorder(item)}
        delayLongPress={350}
      >
        <CategoryTileContent
          item={item}
          label={label}
          isReordering={false}
          reduceMotion={reduceMotion}
          tokens={tokens}
        />
      </Pressable>
    );
  }

  const renderSortableItem = useCallback<SortableGridRenderItem<Category>>(
    ({ item }) => {
      if (!item.catString) item.catString = item.name;
      const label = item.catString ?? item.cat ?? "";
      const isFixed = item.cat === NEW_CATEGORY_CAT;
      const selected = isCategoryTileSelected(item.cat, selectedCategory);

      const body = (
        <View
          {...tileAccessibilityProps(item, label)}
          accessibilityState={{ selected }}
          testID={`category-pick-tile-${item.cat ?? "unknown"}`}
          style={[
            styles.sortableItemContainer,
            {
              backgroundColor: GlobalStyles.colors.gray500,
              borderRadius: tokens.tileBorderRadius,
              minHeight: Math.max(tokens.tileMinHeight, MIN_TOUCH_TARGET),
              ...GlobalStyles.strongShadow,
            },
            selected && styles.selectedTile,
            isReordering &&
              reduceMotion &&
              !isFixed &&
              styles.reorderHighlight,
          ]}
        >
          <CategoryTileContent
            item={item}
            label={label}
            isReordering={isReordering}
            reduceMotion={reduceMotion}
            tokens={tokens}
          />
        </View>
      );

      return (
        <Sortable.Handle mode={isFixed ? "fixed-order" : "draggable"}>
          {body}
        </Sortable.Handle>
      );
    },
    // tileAccessibilityProps closes over onAccessibilityMove / isReordering
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isReordering, onAccessibilityMove, reduceMotion, selectedCategory, tokens]
  );

  const gap = tokens.tileMargin;

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
          onPress={() => {
            if (isReordering) {
              if (orderBeforeReorder) {
                setCategoryList(orderBeforeReorder);
              }
              setIsReordering(false);
              setOrderBeforeReorder(null);
              return;
            }
            navigation.goBack();
          }}
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

        {isReordering ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={i18n.t("done")}
            testID="category-pick-reorder-done"
            hitSlop={8}
            disabled={isSavingOrder}
            android_ripple={{
              color: GlobalStyles.colors.gray600,
              borderless: true,
            }}
            style={({ pressed }) => [
              styles.headerButton,
              styles.editButton,
              { paddingHorizontal: tokens.editButtonPaddingHorizontal },
              pressed && GlobalStyles.pressed,
            ]}
            onPress={() => void finishReorder()}
          >
            <Text
              style={[styles.editButtonText, { fontSize: tokens.editFontSize }]}
              numberOfLines={1}
            >
              {i18n.t("done")}
            </Text>
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={i18n.t("editCategories")}
            testID="category-pick-edit"
            hitSlop={8}
            android_ripple={{
              color: GlobalStyles.colors.gray600,
              borderless: true,
            }}
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
        )}
      </View>

      {showSpinner ? (
        <View style={styles.spinnerContainer} testID="category-pick-spinner">
          <ActivityIndicator
            size="large"
            color={GlobalStyles.colors.gray500}
          />
        </View>
      ) : isReordering ? (
        <Animated.ScrollView
          ref={scrollableRef}
          style={styles.listStyle}
          contentContainerStyle={{
            paddingHorizontal: tokens.listPaddingHorizontal,
            paddingBottom: tokens.listPaddingBottom,
          }}
        >
          <Sortable.Grid
            columns={numColumns}
            data={categoryList}
            customHandle
            hapticsEnabled
            keyExtractor={(item) => item.cat ?? item.name ?? "cat"}
            renderItem={renderSortableItem}
            rowGap={gap}
            columnGap={gap}
            scrollableRef={scrollableRef}
            onDragEnd={({ data }) => {
              const withoutNew = withoutNewCategoryTile(data);
              setCategoryList(
                appendNewCategoryTile(withoutNew, newCategoryTile)
              );
            }}
            overflow="visible"
          />
        </Animated.ScrollView>
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

      {!isReordering ? (
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
      ) : (
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
        />
      )}
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
  dragAffordance: {
    position: "absolute",
    top: dynamicScale(4, false, 0.5),
    right: dynamicScale(4, false, 0.5),
  },
  sortableItemContainer: {
    height: dynamicScale(120, false, 0.5),
    minHeight: MIN_TOUCH_TARGET,
  },
  selectedTile: {
    backgroundColor: GlobalStyles.colors.primary100,
    borderWidth: 2,
    borderColor: GlobalStyles.colors.primary400,
  },
  reorderHighlight: {
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
