import React, { useState, useEffect, useCallback, useMemo, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import Animated, {
  ZoomInLeft,
  ZoomOutRight,
} from "react-native-reanimated";
import { i18n } from "../i18n/i18n";

import Ionicons from "@expo/vector-icons/Ionicons";
import { TripContext } from "../store/trip-context";
import { GlobalStyles } from "../constants/styles";
import SelectCategoryIcon from "../components/UI/selectCategoryIcon";
import ActionRow from "../components/UI/ActionRow";
import BackgroundGradient from "../components/UI/BackgroundGradient";
import { ActivityIndicator } from "react-native-paper";

import PropTypes from "prop-types";
import { UserContext } from "../store/user-context";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";
import { Category } from "../util/category";
import { alertYesNo } from "../components/Errors/Alert";
import IconButton from "../components/UI/IconButton";
import { NetworkContext } from "../store/network-context";
import InfoButton from "../components/UI/InfoButton";
import Modal from "react-native-modal";
import BlurPremium from "../components/Premium/BlurPremium";
import safeLogError from "../util/error";
import { dynamicScale } from "../util/scalingUtil";
import { trackEvent } from "../util/vexo-tracking";
import { VexoEvents } from "../util/vexo-constants";
import { CATEGORY_ICON_CHOICES } from "../util/category-icons";
import { ManageCategoryTokens } from "../styles/manage-category-tokens";
import {
  commitCategoryRename,
  commitNewCategory,
  createCategoryListStore,
  defaultTripCategoryList,
  insertCategoryAt,
  readCategoryList,
  removeCategoryAt,
  UNDO_DELETE_CATEGORY_WINDOW_MS,
  writeCategoryList,
  type AddCategoryMissingField,
} from "../util/category-list";

/** Hard floor so rename/delete hit areas stay ≥48dp on small phones (AC). */
const TOUCH_TARGET_MIN = Math.max(48, dynamicScale(48, false, 0.5));
const ICON_CELL = 56;
const ICON_PICKER_MAX_HEIGHT = dynamicScale(168, true);
const ICON_PICKER_KEYBOARD_MAX_HEIGHT = dynamicScale(72, true);

function addHintMessage(missing: AddCategoryMissingField[]): string {
  const hasName = missing.includes("name");
  const hasIcon = missing.includes("icon");
  if (hasName && hasIcon) {
    return i18n.t("categoryAddMissingNameAndIcon");
  }
  if (hasName) {
    return i18n.t("categoryAddMissingName");
  }
  return i18n.t("categoryAddMissingIcon");
}

const ManageCategoryScreen = ({ navigation }) => {
  const { width: windowWidth } = useWindowDimensions();
  const defaultCategoryList: Category[] = useMemo(
    () => defaultTripCategoryList(),
    []
  );

  const categoryStore = useMemo(() => createCategoryListStore(), []);

  const [categoryList, setCategoryList] =
    useState<Category[]>(defaultCategoryList);
  const [draftNames, setDraftNames] = useState<Record<number, string>>({});
  const [renameError, setRenameError] = useState<{
    index: number;
    reason: "empty" | "duplicate";
  } | null>(null);

  const [newCategoryName, setNewCategoryName] = useState("");
  const [selectedIconName, setSelectedIconName] = useState("");
  const [addHint, setAddHint] = useState<string | null>(null);

  const [isFetching, setIsFetching] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const userCtx = useContext(UserContext);
  const netCtx = useContext(NetworkContext);
  const isOnline = netCtx.isConnected && netCtx.strongConnection;

  const tripCtx = useContext(TripContext);
  const tripid = tripCtx.tripid;

  const iconGridContentWidth = Math.max(
    ICON_CELL,
    windowWidth - dynamicScale(48, false, 0.5)
  );
  const iconPickerMaxHeight = keyboardVisible
    ? ICON_PICKER_KEYBOARD_MAX_HEIGHT
    : ICON_PICKER_MAX_HEIGHT;

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, () => {
      setKeyboardVisible(true);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardVisible(false);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const refreshCategoryList = useCallback(async () => {
    try {
      setIsFetching(true);
      const list = await readCategoryList(categoryStore, tripid, { isOnline });
      setCategoryList(list.length > 0 ? list : defaultCategoryList);
    } catch (error) {
      safeLogError(error);
      setCategoryList(defaultCategoryList);
    } finally {
      setIsFetching(false);
    }
  }, [categoryStore, defaultCategoryList, isOnline, tripid]);

  useEffect(() => {
    refreshCategoryList();
  }, [refreshCategoryList]);

  const persistCategoryList = useCallback(
    async (
      newCategoryList: Category[],
      options?: { previousList?: Category[] }
    ) => {
      setIsUploading(true);
      try {
        const result = await writeCategoryList(
          categoryStore,
          tripid,
          newCategoryList,
          { isOnline }
        );

        if (result.status === "offline") {
          Toast.show({
            text1: i18n.t("noConnection"),
            text2: i18n.t("checkConnectionError"),
            type: "error",
          });
          // Offline skips cache/server — revert so Done→remount does not drop the edit.
          if (options?.previousList) {
            setCategoryList(options.previousList);
          }
          return result;
        }

        if (result.status === "error") {
          safeLogError(result.error);
          Alert.alert(i18n.t("error"), i18n.t("toastErrorSaveCategories"), [
            { text: i18n.t("cancel"), style: "cancel" },
            {
              text: i18n.t("retry"),
              onPress: () => {
                void persistCategoryList(newCategoryList, options);
              },
            },
          ]);
          return result;
        }

        await userCtx.loadCatListFromAsyncInCtx(tripid);
        return result;
      } finally {
        setIsUploading(false);
      }
    },
    [categoryStore, isOnline, tripid, userCtx]
  );

  const handleAddCategory = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = commitNewCategory(
      categoryList,
      newCategoryName,
      selectedIconName
    );

    if (result.status === "incomplete") {
      setAddHint(addHintMessage(result.missing));
      return;
    }

    if (result.status === "rejected") {
      setAddHint(
        result.reason === "empty"
          ? i18n.t("categoryNameEmpty")
          : i18n.t("categoryNameDuplicate")
      );
      return;
    }

    trackEvent(VexoEvents.CATEGORY_CREATED, {
      categoryName: result.category.catString,
      icon: result.category.icon,
    });

    setAddHint(null);
    const previousList = categoryList;
    setCategoryList(result.list);
    const persistResult = await persistCategoryList(result.list, {
      previousList,
    });
    if (persistResult.status === "saved" || persistResult.status === "error") {
      setNewCategoryName("");
      setSelectedIconName("");
    }
  };

  const handleCommitRename = async (index: number) => {
    if (!(index in draftNames)) {
      return;
    }
    const draft = draftNames[index];
    const previousName = categoryList[index]?.catString ?? "";
    const result = commitCategoryRename(categoryList, index, draft);

    setDraftNames((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });

    if (result.status === "rejected") {
      setRenameError({ index, reason: result.reason });
      return;
    }

    if (result.list[index]?.catString === previousName) {
      setRenameError(null);
      return;
    }

    trackEvent(VexoEvents.CATEGORY_EDITED, {
      oldName: previousName,
      newName: result.list[index]?.catString,
      icon: categoryList[index]?.icon,
    });

    setRenameError(null);
    const previousList = categoryList;
    setCategoryList(result.list);
    await persistCategoryList(result.list, { previousList });
  };

  const showDeletedCategoryUndo = (
    removed: Category,
    index: number,
    listAfterDelete: Category[]
  ) => {
    const actionId = `${Date.now()}-${removed.cat}-${index}`;
    Toast.show({
      type: "deletedExpense",
      text1: i18n.t("toastDeletedCategory1"),
      text2: i18n.t("toastDeletedCategory2"),
      visibilityTime: UNDO_DELETE_CATEGORY_WINDOW_MS,
      autoHide: true,
      props: {
        actionId,
        onUndo: async () => {
          Toast.hide();
          const restored = insertCategoryAt(listAfterDelete, removed, index);
          setCategoryList(restored);
          await persistCategoryList(restored);
        },
      },
    });
  };

  const handleDeleteCategory = async (index: number) => {
    const previousList = categoryList;
    const { list, removed, index: removedIndex } = removeCategoryAt(
      categoryList,
      index
    );

    trackEvent(VexoEvents.CATEGORY_DELETED, {
      categoryName: removed?.catString,
      icon: removed?.icon,
    });

    setCategoryList(list);
    setDraftNames({});
    setRenameError(null);
    const result = await persistCategoryList(list, { previousList });
    // Undo only after a real save — offline/error must not claim "Category deleted".
    if (result.status === "saved") {
      showDeletedCategoryUndo(removed, removedIndex, list);
    }
  };

  const handleResetCategoryList = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const previousList = categoryList;
    setCategoryList(defaultCategoryList);
    setDraftNames({});
    setRenameError(null);
    await persistCategoryList(defaultCategoryList, { previousList });
  };

  const renderCategoryItem = ({ item, index }) => {
    const displayName =
      index in draftNames ? draftNames[index] : item.catString ?? "";
    const errorForRow =
      renameError?.index === index
        ? renameError.reason === "empty"
          ? i18n.t("categoryNameEmpty")
          : i18n.t("categoryNameDuplicate")
        : null;

    return (
      <Animated.View
        entering={ZoomInLeft}
        exiting={ZoomOutRight}
        style={[styles.categoryItem]}
      >
        <Ionicons
          name={item.icon}
          size={dynamicScale(24, false, 0.3)}
          color={GlobalStyles.colors.textColor}
        />
        <View style={styles.categoryNameColumn}>
          <TextInput
            style={styles.categoryNameInput}
            value={displayName}
            autoCapitalize="sentences"
            autoComplete="off"
            autoCorrect={false}
            accessibilityLabel={i18n.t("renameCategoryA11y", {
              name: item.catString ?? item.cat,
            })}
            onChangeText={(newName) => {
              setDraftNames((prev) => ({ ...prev, [index]: newName }));
              if (renameError?.index === index) {
                setRenameError(null);
              }
            }}
            onBlur={() => {
              void handleCommitRename(index);
            }}
            onSubmitEditing={() => {
              void handleCommitRename(index);
            }}
            returnKeyType="done"
          />
          {errorForRow ? (
            <Text style={styles.renameErrorText}>{errorForRow}</Text>
          ) : null}
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          accessibilityRole="button"
          accessibilityLabel={i18n.t("deleteCategoryA11y", {
            name: item.catString ?? item.cat,
          })}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            void handleDeleteCategory(index);
          }}
        >
          <Ionicons
            name="trash-outline"
            size={dynamicScale(24, false, 0.3)}
            color={GlobalStyles.colors.textColor}
          />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const [infoIsVisible, setInfoIsVisible] = useState(false);
  const [infoTitleText, setInfoTitleText] = useState("");
  const [infoContentText, setInfoContentText] = useState("");

  enum infoEnum {
    titleInfo = 1,
  }
  function showInfoHandler(infoEnu: infoEnum) {
    let titleText = "";
    let contentText = "";
    switch (infoEnu) {
      case infoEnum.titleInfo:
        titleText = i18n.t("infoNewCatTitle");
        contentText = i18n.t("infoNewCatText");
        break;
      default:
        break;
    }
    setInfoTitleText(titleText);
    setInfoContentText(contentText);
    setInfoIsVisible(true);
  }

  function handleClose() {
    setInfoIsVisible(false);
  }

  const modalJSX = (
    <Modal
      isVisible={infoIsVisible}
      style={styles.modalStyle}
      backdropOpacity={0.5}
      onSwipeComplete={handleClose}
      swipeDirection={["up", "left", "right", "down"]}
      onBackdropPress={handleClose}
      onBackButtonPress={handleClose}
    >
      <View
        style={styles.infoModalContainer}
        testID="manage-category-info-modal"
      >
        <Text style={styles.infoTitleText}>{infoTitleText}</Text>
        <Text style={styles.infoContentText}>{infoContentText}</Text>
        <ActionRow
          tier="primary"
          label={i18n.t("confirm")}
          onPress={setInfoIsVisible.bind(this, false)}
          showChevron={false}
        />
      </View>
    </Modal>
  );

  return (
    <>
      {modalJSX}
      <BackgroundGradient
        colors={GlobalStyles.gradientColors}
        style={styles.container}
      >
        <KeyboardAvoidingView
          style={styles.flex}
          behavior="padding"
          keyboardVerticalOffset={dynamicScale(12, true)}
        >
          <View
            style={styles.headerRow}
            testID="manage-category-header"
          >
            <Pressable
              testID="manage-category-back"
              accessibilityRole="button"
              accessibilityLabel={i18n.t("back")}
              hitSlop={8}
              style={styles.headerBackButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.pop();
              }}
            >
              <Ionicons
                name="chevron-back-outline"
                size={24}
                color={ManageCategoryTokens.backControl}
              />
            </Pressable>
          </View>
          <View style={styles.addFormSection}>
            <View style={styles.nameRow}>
              <TextInput
                autoFocus={false}
                style={styles.newCategoryInput}
                placeholder={i18n.t("newCatNamePlaceholder")}
                value={newCategoryName}
                textAlign="center"
                onChangeText={(text) => {
                  setNewCategoryName(text);
                  if (addHint) {
                    setAddHint(null);
                  }
                }}
              />
              <InfoButton
                testID="manage-category-info"
                onPress={showInfoHandler.bind(this, infoEnum.titleInfo)}
                containerStyle={styles.infoButton}
              />
            </View>
            <ScrollView
              testID="manage-category-icon-picker"
              style={[
                styles.iconPickerScroll,
                { maxHeight: iconPickerMaxHeight },
              ]}
              contentContainerStyle={[
                styles.iconGrid,
                { width: iconGridContentWidth },
              ]}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
            >
              {CATEGORY_ICON_CHOICES.map((iconName) => (
                <SelectCategoryIcon
                  key={iconName}
                  iconName={iconName}
                  selectedIconName={selectedIconName}
                  setSelectedIconName={(name) => {
                    setSelectedIconName(name);
                    if (addHint) {
                      setAddHint(null);
                    }
                  }}
                />
              ))}
            </ScrollView>
            {addHint ? (
              <Text style={styles.addHintText} testID="manage-category-add-hint">
                {addHint}
              </Text>
            ) : null}
            {isUploading ? (
              <View style={styles.addButton} testID="manage-category-add">
                <ActivityIndicator
                  size="small"
                  color={ManageCategoryTokens.addButtonText}
                />
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addButton}
                testID="manage-category-add"
                accessibilityRole="button"
                onPress={() => {
                  void handleAddCategory();
                }}
              >
                <Text style={styles.addButtonText}>{i18n.t("add")}</Text>
              </TouchableOpacity>
            )}
          </View>
          {categoryList ? (
            <Animated.FlatList
              style={styles.flex}
              data={categoryList}
              renderItem={renderCategoryItem}
              keyExtractor={(item, index) => `${item.cat}-${index}`}
              refreshing={isFetching}
              onRefresh={refreshCategoryList}
              keyboardShouldPersistTaps="handled"
            />
          ) : null}
          <View
            style={styles.footerActions}
            testID="manage-category-footer"
          >
            <ActionRow
              testID="manage-category-reset"
              tier="secondary"
              label={i18n.t("reset")}
              icon="refresh-outline"
              onPress={() => {
                alertYesNo(
                  i18n.t("reset"),
                  i18n.t("sureResetCategories"),
                  handleResetCategoryList
                );
              }}
            />
            <ActionRow
              testID="manage-category-done"
              tier="primary"
              label={i18n.t("done")}
              icon="checkmark-circle-outline"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.pop();
              }}
            />
          </View>
        </KeyboardAvoidingView>
      </BackgroundGradient>
      <BlurPremium canBack featureHintKey="paywallHintCustomCategories" />
    </>
  );
};

export default ManageCategoryScreen;

ManageCategoryScreen.propTypes = {
  route: PropTypes.object.isRequired,
  navigation: PropTypes.object.isRequired,
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: dynamicScale(16),
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: TOUCH_TARGET_MIN,
    marginBottom: dynamicScale(4, true),
  },
  headerBackButton: {
    minWidth: TOUCH_TARGET_MIN,
    minHeight: TOUCH_TARGET_MIN,
    alignItems: "center",
    justifyContent: "center",
  },
  addFormSection: {
    flexShrink: 1,
    alignItems: "center",
    backgroundColor: GlobalStyles.colors.backgroundColor,
    borderRadius: 8,
    marginBottom: dynamicScale(8, false, 0.5),
    padding: dynamicScale(8, false, 0.5),
    ...GlobalStyles.shadowPrimary,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: dynamicScale(8, false, 0.5),
  },
  infoButton: {
    marginLeft: dynamicScale(8, false, 0.5),
  },
  newCategoryInput: {
    flex: 1,
    minHeight: TOUCH_TARGET_MIN,
    fontSize: dynamicScale(20, false, 0.5),
    color: GlobalStyles.colors.primary700,
    borderBottomWidth: 1,
    borderBottomColor: GlobalStyles.colors.primary700,
    paddingVertical: dynamicScale(8, false, 0.5),
  },
  iconPickerScroll: {
    alignSelf: "stretch",
    flexShrink: 1,
    marginTop: dynamicScale(8, true),
  },
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignSelf: "center",
  },
  addHintText: {
    fontSize: dynamicScale(12, false, 0.5),
    color: GlobalStyles.colors.error500,
    marginTop: dynamicScale(4, true),
    textAlign: "center",
    paddingHorizontal: dynamicScale(8, false, 0.5),
  },
  addButton: {
    backgroundColor: ManageCategoryTokens.addButtonBackground,
    borderRadius: dynamicScale(8, false, 0.5),
    paddingVertical: dynamicScale(12, false, 0.5),
    paddingHorizontal: dynamicScale(16, false, 0.5),
    marginVertical: dynamicScale(8, false, 0.5),
    minHeight: TOUCH_TARGET_MIN,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "stretch",
    marginHorizontal: dynamicScale(8, false, 0.5),
  },
  addButtonText: {
    fontSize: dynamicScale(16, false, 0.5),
    color: ManageCategoryTokens.addButtonText,
    fontWeight: "600",
  },
  categoryItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: GlobalStyles.colors.backgroundColor,
    borderRadius: dynamicScale(8, false, 0.5),
    margin: dynamicScale(8, false, 0.5),
    padding: dynamicScale(16, false, 0.5),
    zIndex: 1,
    ...GlobalStyles.strongShadow,
  },
  categoryNameColumn: {
    flex: 1,
    marginLeft: dynamicScale(16, false, 0.5),
  },
  categoryNameInput: {
    fontSize: dynamicScale(16, false, 0.5),
    color: GlobalStyles.colors.textColor,
    minHeight: TOUCH_TARGET_MIN,
    paddingVertical: dynamicScale(12, false, 0.5),
  },
  renameErrorText: {
    fontSize: dynamicScale(12, false, 0.5),
    color: GlobalStyles.colors.error500,
    marginTop: dynamicScale(2, true),
  },
  deleteButton: {
    marginLeft: dynamicScale(16, false, 0.5),
    minWidth: TOUCH_TARGET_MIN,
    minHeight: TOUCH_TARGET_MIN,
    alignItems: "center",
    justifyContent: "center",
  },
  modalStyle: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  infoModalContainer: {
    backgroundColor: GlobalStyles.colors.backgroundColor,
    borderRadius: dynamicScale(8, false, 0.5),
    padding: dynamicScale(16, false, 0.5),
    width: "80%",
    justifyContent: "center",
  },
  infoTitleText: {
    fontSize: dynamicScale(20, false, 0.5),
    fontWeight: "bold",
    color: GlobalStyles.colors.textColor,
    textAlign: "center",
    marginBottom: dynamicScale(8, true),
  },
  infoContentText: {
    fontSize: dynamicScale(16, false, 0.5),
    color: GlobalStyles.colors.textColor,
    textAlign: "center",
    marginBottom: dynamicScale(12, true),
  },
  footerActions: {
    paddingHorizontal: dynamicScale(8, false, 0.5),
    paddingBottom: dynamicScale(8, true),
  },
});
