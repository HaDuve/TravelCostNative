import React, { useState, useEffect, useCallback, useMemo, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
} from "react-native";
import Animated, {
  ZoomIn,
  ZoomInLeft,
  ZoomOut,
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
import {
  commitCategoryRename,
  createCategoryListStore,
  defaultTripCategoryList,
  insertCategoryAt,
  readCategoryList,
  removeCategoryAt,
  UNDO_DELETE_CATEGORY_WINDOW_MS,
  writeCategoryList,
} from "../util/category-list";

const TOUCH_TARGET_MIN = dynamicScale(48, false, 0.5);

const ManageCategoryScreen = ({ navigation }) => {
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

  const [isFetching, setIsFetching] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const userCtx = useContext(UserContext);
  const netCtx = useContext(NetworkContext);
  const isOnline = netCtx.isConnected && netCtx.strongConnection;

  const tripCtx = useContext(TripContext);
  const tripid = tripCtx.tripid;

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
    async (newCategoryList: Category[]) => {
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
          return result;
        }

        if (result.status === "error") {
          safeLogError(result.error);
          Alert.alert(i18n.t("error"), i18n.t("toastErrorSaveCategories"), [
            { text: i18n.t("cancel"), style: "cancel" },
            {
              text: i18n.t("retry"),
              onPress: () => {
                void persistCategoryList(newCategoryList);
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
    const newCategory: Category = {
      catString: newCategoryName,
      icon: selectedIconName,
      cat: newCategoryName,
    };

    trackEvent(VexoEvents.CATEGORY_CREATED, {
      categoryName: newCategoryName,
      icon: selectedIconName,
    });

    const newCategoryList = [...categoryList, newCategory];
    setCategoryList(newCategoryList);
    await persistCategoryList(newCategoryList);
    setNewCategoryName("");
    setSelectedIconName("");
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
    setCategoryList(result.list);
    await persistCategoryList(result.list);
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
    await persistCategoryList(list);
    showDeletedCategoryUndo(removed, removedIndex, list);
  };

  const handleResetCategoryList = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCategoryList(defaultCategoryList);
    setDraftNames({});
    setRenameError(null);
    await persistCategoryList(defaultCategoryList);
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

  const ioniconsList = [
    "wallet-outline",
    "cash-outline",
    "card-outline",
    "list-outline",
    "calculator-outline",
    "pricetag-outline",
    "cart-outline",
    "compass-outline",
    "happy-outline",
    "trophy-outline",
    "gift-outline",
    "pie-chart-outline",
    "podium-outline",
    "fitness-outline",
    "pulse-outline",
    "desktop-outline",
    "cube-outline",
    "flame-outline",
    "color-palette-outline",
    "rocket-outline",
    "leaf-outline",
    "pint-outline",
    "wine-outline",
    "film-outline",
    "game-controller-outline",
    "book-outline",
    "tv-outline",
    "gift-outline",
    "cloud-outline",
    "thermometer-outline",
    "flash-outline",
    "train-outline",
    "school-outline",
    "flower-outline",
    "radio-outline",
    "pizza-outline",
    "medical-outline",
    "american-football-outline",
    "musical-note-outline",
    "musical-notes-outline",
    "headset-outline",
    "ice-cream-outline",
    "cafe-outline",
    "paw-outline",
    "thumbs-up-outline",
    "battery-dead-outline",
    "watch-outline",
    "chatbubbles-outline",
    "cloudy-outline",
    "desktop-outline",
    "document-outline",
    "easel-outline",
    "eye-outline",
    "fast-food-outline",
    "film-outline",
    "football-outline",
    "glasses-outline",
    "heart-outline",
    "key-outline",
    "laptop-outline",
    "leaf-outline",
    "moon-outline",
    "nutrition-outline",
    "partly-sunny-outline",
    "people-outline",
    "person-outline",
    "planet-outline",
    "pulse-outline",
    "rainy-outline",
    "rose-outline",
    "search-outline",
    "shirt-outline",
    "speedometer-outline",
    "stopwatch-outline",
    "sunny-outline",
    "thunderstorm-outline",
    "time-outline",
    "volume-high-outline",
    "walk-outline",
    "water-outline",
  ];
  const bigDisplay = dynamicScale(680, true) > 850;
  const arrays = [];
  const size = bigDisplay ? 3 : 2;
  while (ioniconsList?.length > 0) arrays.push(ioniconsList.splice(0, size));

  function renderRowIconPicker({ item }) {
    return (
      <View style={[{ margin: dynamicScale(5) }]}>
        <View
          style={{
            marginBottom: dynamicScale(2, true),
          }}
        >
          <SelectCategoryIcon
            iconName={item[0]}
            selectedIconName={selectedIconName}
            setSelectedIconName={setSelectedIconName}
          />
        </View>
        {item?.length > 1 ? (
          <View
            style={{
              marginBottom: dynamicScale(2, true),
            }}
          >
            <SelectCategoryIcon
              iconName={item[1]}
              selectedIconName={selectedIconName}
              setSelectedIconName={setSelectedIconName}
            />
          </View>
        ) : null}
        {item?.length > 2 ? (
          <View
            style={{
              marginBottom: dynamicScale(2, true),
            }}
          >
            <SelectCategoryIcon
              iconName={item[2]}
              selectedIconName={selectedIconName}
              setSelectedIconName={setSelectedIconName}
            />
          </View>
        ) : null}
      </View>
    );
  }

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
      <View style={styles.infoModalContainer}>
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
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={"padding"}>
          <View
            style={[
              styles.inputContainer,
              bigDisplay && {
                minHeight: dynamicScale(284, false, 0.3),
                maxHeight: dynamicScale(284, false, 0.3),
              },
            ]}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginLeft: "10%",
                marginRight: "5%",
              }}
            >
              <TextInput
                autoFocus={true}
                style={[styles.newCategoryInput]}
                placeholder={i18n.t("newCatNamePlaceholder")}
                value={newCategoryName}
                textAlign="center"
                onChangeText={(text) => setNewCategoryName(text)}
              />
              <InfoButton
                onPress={showInfoHandler.bind(this, infoEnum.titleInfo)}
                containerStyle={{ marginTop: "2%", marginLeft: "8%" }}
              ></InfoButton>
            </View>
            <FlatList
              horizontal
              data={arrays}
              renderItem={renderRowIconPicker}
            ></FlatList>
            {!isUploading &&
              newCategoryName?.length > 0 &&
              selectedIconName?.length > 0 && (
                <Animated.View entering={ZoomIn} exiting={ZoomOut}>
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={handleAddCategory}
                  >
                    <Text style={styles.addButtonText}>{i18n.t("add")}</Text>
                  </TouchableOpacity>
                </Animated.View>
              )}
            {isUploading && (
              <View style={styles.addButton}>
                <ActivityIndicator size="small" color="#fff" />
              </View>
            )}
          </View>
          <View
            style={{
              height: dynamicScale(16, true),
              width: "100%",
              zIndex: 10,
              borderBottomWidth: 1,
              borderBottomColor: GlobalStyles.colors.primary100,
              shadowColor: GlobalStyles.colors.primaryGrayed,
              shadowOffset: {
                width: 0,
                height: 2,
              },
              shadowOpacity: 0.42,
              shadowRadius: 2.42,
            }}
          />
          {categoryList && (
            <Animated.FlatList
              data={categoryList}
              renderItem={renderCategoryItem}
              keyExtractor={(item, index) => `${item.cat}-${index}`}
              refreshing={isFetching}
              onRefresh={refreshCategoryList}
            />
          )}
          <View
            style={{
              height: 16,
              width: "100%",
              zIndex: 10,
              borderTopWidth: 1,
              borderTopColor: GlobalStyles.colors.primary100,
              shadowColor: GlobalStyles.colors.primaryGrayed,
              shadowOffset: {
                width: 0,
                height: -2,
              },
              shadowOpacity: 0.42,
              shadowRadius: 2.42,
              overflow: "visible",
            }}
          />
          <View style={styles.footerActions}>
            <IconButton
              icon={"chevron-back-outline"}
              size={24}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.pop();
              }}
              color={GlobalStyles.colors.primaryGrayed}
            ></IconButton>
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
  container: {
    flex: 1,
    padding: dynamicScale(16),
  },
  inputContainer: {
    flex: 1,
    alignItems: "center",
    minHeight: dynamicScale(220, false, 0.3),
    maxHeight: dynamicScale(220, false, 0.3),
    backgroundColor: GlobalStyles.colors.backgroundColor,
    borderRadius: 8,
    marginBottom: dynamicScale(8, false, 0.5),
    padding: dynamicScale(4, false, 0.5),
    ...GlobalStyles.shadowPrimary,
  },
  newCategoryInput: {
    alignItems: "center",
    flex: 1,
    height: dynamicScale(40, false, 0.5),
    maxHeight: dynamicScale(40, false, 0.5),
    fontSize: dynamicScale(20, false, 0.5),
    color: GlobalStyles.colors.primary400,
    borderBottomWidth: 1,
    borderBottomColor: GlobalStyles.colors.primary500,
  },
  iconPicker: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    padding: dynamicScale(8, false, 0.5),
    marginHorizontal: dynamicScale(8, false, 0.5),
    borderRadius: dynamicScale(16, false, 0.5),
  },
  selectedIconButton: {
    backgroundColor: GlobalStyles.colors.gray500Accent,
  },
  addButton: {
    backgroundColor: "#538076",
    borderRadius: dynamicScale(8, false, 0.5),
    paddingVertical: dynamicScale(8, false, 0.5),
    paddingHorizontal: dynamicScale(16, false, 0.5),
    marginBottom: dynamicScale(12, false, 0.5),
    marginTop: dynamicScale(-24, false, 0.5),
  },
  addButtonText: {
    fontSize: dynamicScale(16, false, 0.5),
    color: GlobalStyles.colors.backgroundColor,
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
    color: "#434343",
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
  modalContainer: {
    backgroundColor: GlobalStyles.colors.backgroundColor,
    borderRadius: dynamicScale(8, false, 0.5),
    padding: dynamicScale(16, false, 0.5),
    width: "80%",
    height: "40%",
    justifyContent: "space-evenly",
  },
  modalTitle: {
    fontSize: dynamicScale(20, false, 0.5),
    fontWeight: "bold",
    color: GlobalStyles.colors.primary400,
    textAlign: "center",
  },
  modalText: {
    fontSize: dynamicScale(16, false, 0.5),
    color: GlobalStyles.colors.primary400,
    textAlign: "center",
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
  },
  modalButton: {
    backgroundColor: GlobalStyles.colors.primary400,
    borderRadius: dynamicScale(8, false, 0.5),
    padding: dynamicScale(8, false, 0.5),
    width: "40%",
  },
  modalButtonText: {
    fontSize: dynamicScale(16, false, 0.5),
    color: GlobalStyles.colors.backgroundColor,
    textAlign: "center",
  },
  infoModalContainer: {
    backgroundColor: GlobalStyles.colors.backgroundColor,
    borderRadius: dynamicScale(8, false, 0.5),
    padding: dynamicScale(16, false, 0.5),
    width: "80%",
    height: "40%",
    justifyContent: "space-evenly",
  },
  infoTitleText: {
    fontSize: dynamicScale(20, false, 0.5),
    fontWeight: "bold",
    color: GlobalStyles.colors.textColor,
    textAlign: "center",
  },
  infoContentText: {
    fontSize: dynamicScale(16, false, 0.5),
    color: GlobalStyles.colors.textColor,
    textAlign: "center",
  },
  footerActions: {
    paddingHorizontal: dynamicScale(8, false, 0.5),
    paddingBottom: dynamicScale(8, true),
  },
});
