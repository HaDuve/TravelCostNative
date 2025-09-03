import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";
// import animated from reanimated
import Animated, {
  ZoomIn,
  ZoomInLeft,
  ZoomOut,
  ZoomOutRight,
} from "react-native-reanimated";
//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr, ru } from "../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale =
  Localization.getLocales()[0] && Localization.getLocales()[0].languageCode
    ? Localization.getLocales()[0].languageCode.slice(0, 2)
    : "en";
i18n.enableFallback = true;
// i18n.locale = "en";

import Ionicons from "@expo/vector-icons/Ionicons";
import { useContext } from "react";
import { TripContext } from "../store/trip-context";
import { GlobalStyles } from "../constants/styles";
import { fetchCategories, updateTrip } from "../util/http";
import SelectCategoryIcon from "../components/UI/selectCategoryIcon";
import GradientButton from "../components/UI/GradientButton";
import BackgroundGradient from "../components/UI/BackgroundGradient";
import { KeyboardAvoidingView } from "react-native";
import { ActivityIndicator } from "react-native-paper";

import PropTypes from "prop-types";
import { UserContext } from "../store/user-context";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";
import { Category, DEFAULTCATEGORIES } from "../util/category";
import { alertYesNo } from "../components/Errors/Alert";
import IconButton from "../components/UI/IconButton";
import { NetworkContext } from "../store/network-context";
import InfoButton from "../components/UI/InfoButton";
import Modal from "react-native-modal";
import FlatButton from "../components/UI/FlatButton";
import BlurPremium from "../components/Premium/BlurPremium";
import { getMMKVObject, setMMKVObject } from "../store/mmkv";
import safeLogError from "../util/error";
import { useMemo } from "react";
import { dynamicScale } from "../util/scalingUtil";

const ManageCategoryScreen = ({ navigation }) => {
  // defaultCategories minus the last element (-new cat element)
  const defaultCategoryList: Category[] = useMemo(
    () => DEFAULTCATEGORIES.slice(0, DEFAULTCATEGORIES?.length - 1),
    []
  );

  const [categoryList, setCategoryList] =
    useState<Category[]>(defaultCategoryList);

  const [newCategoryName, setNewCategoryName] = useState("");
  const [selectedIconName, setSelectedIconName] = useState("");

  const [isFetching, setIsFetching] = useState(false);
  const [touched, setTouched] = useState(false);

  // use state for is uploading
  const [isUploading, setIsUploading] = useState(false);

  const userCtx = useContext(UserContext);
  const netCtx = useContext(NetworkContext);
  const isOnline = netCtx.isConnected && netCtx.strongConnection;

  const tripCtx = useContext(TripContext);
  const tripid = tripCtx.tripid;

  const loadCategoryList = useCallback(async () => {
    try {
      const categoryList = getMMKVObject("categoryList");
      if (categoryList !== null) {
        setCategoryList(categoryList);
      } else {
        setCategoryList(defaultCategoryList);
      }
    } catch (error) {
      safeLogError(error);
    }
    setIsFetching(false);
  }, []);

  useEffect(() => {
    loadCategoryList();
  }, [loadCategoryList]);

  const fetchCategoryList = useCallback(async () => {
    if (!isOnline) {
      await loadCategoryList();
      return;
    }
    try {
      setIsFetching(true);
      const categories = await fetchCategories(tripid);
      if (categories) {
        const tempList = [...categories];
        setCategoryList(tempList);
        setIsFetching(false);
      }
    } catch (error) {
      safeLogError(error);
    }
    if (categoryList?.length === 0) {
      await loadCategoryList();
    }
    if (categoryList?.length === 0) {
      setCategoryList(defaultCategoryList);
    }
  }, [isOnline, loadCategoryList, tripid]);

  const saveCategoryList = async (newCategoryList) => {
    setIsUploading(true);
    // if not isOnline, alert user
    if (!isOnline) {
      Toast.show({
        text1: i18n.t("noConnection"),
        text2: i18n.t("checkConnectionError"),
        type: "error",
      });
      navigation.pop(2);
    }
    try {
      setMMKVObject("categoryList", categoryList);
      await updateTrip(tripid, {
        categories: JSON.stringify(newCategoryList),
      });
      await userCtx.loadCatListFromAsyncInCtx(tripid);
    } catch (error) {
      safeLogError(error);
    }
    setIsUploading(false);
  };

  const handleAddCategory = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newCategory: Category = {
      catString: newCategoryName,
      icon: selectedIconName,
      cat: newCategoryName,
    };
    const newCategoryList = [...categoryList, newCategory];
    setCategoryList(newCategoryList);
    setTouched(true);
    await saveCategoryList(newCategoryList);
    setNewCategoryName("");
    setSelectedIconName("");
    // navigate to category pick screen
    // navigation.navigate("CategoryPick");
  };

  const handleEditCategory = async (index, newName) => {
    const newCategoryList = [...categoryList];
    newCategoryList[index].catString = newName;
    newCategoryList[index].cat = newName;
    setCategoryList(newCategoryList);
    setTouched(true);
    await saveCategoryList(newCategoryList);
  };

  const handleDeleteCategory = async (index) => {
    const newCategoryList = [...categoryList];
    newCategoryList.splice(index, 1);
    setCategoryList(newCategoryList);
    setTouched(true);
    await saveCategoryList(newCategoryList);
  };

  const handleResetCategoryList = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCategoryList(defaultCategoryList);
    setTouched(true);
    await saveCategoryList(defaultCategoryList);
  };

  const renderCategoryItem = ({ item, index }) => {
    return (
      <Animated.View
        entering={ZoomInLeft}
        exiting={ZoomOutRight}
        style={[styles.categoryItem, GlobalStyles.strongShadow]}
      >
        <Ionicons
          name={item.icon}
          size={dynamicScale(24, false, 0.3)}
          color={GlobalStyles.colors.textColor}
        />
        <TextInput
          style={styles.categoryNameInput}
          value={item.catString}
          autoCapitalize="sentences"
          autoComplete="off"
          autoCorrect={false}
          onChangeText={(newName) => handleEditCategory(index, newName)}
        />
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            handleDeleteCategory(index);
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
  // get dimensions
  const bigDisplay = dynamicScale(680, true) > 850;
  const arrays = [];
  // 1-3 possible items per row
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

  // useStates for info Modal
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
        titleText = i18n.t("infoNewCatTitle"); //i18n.t("currencyInfoTitle");
        contentText = i18n.t("infoNewCatText");
        break;
      default:
        break;
    }
    setInfoTitleText(titleText);
    setInfoContentText(contentText);
    setInfoIsVisible(true);
  }

  // handle close
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
        <FlatButton onPress={setInfoIsVisible.bind(this, false)}>
          {i18n.t("confirm")}
        </FlatButton>
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
              GlobalStyles.shadowPrimary,
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
              //transparent border color
              borderBottomWidth: 1,
              borderBottomColor: GlobalStyles.colors.primary100,
              // shadow over the flatlist
              shadowColor: GlobalStyles.colors.primaryGrayed,
              shadowOffset: {
                width: 0,
                height: 2,
              },
              shadowOpacity: 0.42,
              shadowRadius: 2.42,
              // elevation: 1,
            }}
          />
          {categoryList && (
            <Animated.FlatList
              data={categoryList}
              renderItem={renderCategoryItem}
              keyExtractor={(item, index) => `${index}`}
              refreshing={isFetching}
              onRefresh={fetchCategoryList}
            />
          )}
          <View
            style={{
              height: 16,
              width: "100%",
              zIndex: 10,
              //transparent border color
              borderTopWidth: 1,
              borderTopColor: GlobalStyles.colors.primary100,
              // shadow over the flatlist
              shadowColor: GlobalStyles.colors.primaryGrayed,
              shadowOffset: {
                width: 0,
                height: -2,
              },
              shadowOpacity: 0.42,
              shadowRadius: 2.42,
              // elevation: 3,
              overflow: "visible",
            }}
          />
          <View
            style={{ flexDirection: "row", justifyContent: "space-evenly" }}
          >
            <IconButton
              icon={"chevron-back-outline"}
              size={24}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.pop();
              }}
              color={GlobalStyles.colors.primaryGrayed}
            ></IconButton>
            <GradientButton
              colors={GlobalStyles.gradientAccentButton}
              darkText
              onPress={() => {
                alertYesNo(
                  i18n.t("reset"),
                  i18n.t("sureResetCategories"),
                  handleResetCategoryList
                );
              }}
            >
              {i18n.t("reset")}
            </GradientButton>

            {touched && (
              <GradientButton
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setTouched(false);
                  navigation.pop();
                }}
              >
                {i18n.t("confirm")}
              </GradientButton>
            )}
          </View>
        </KeyboardAvoidingView>
      </BackgroundGradient>
      <BlurPremium canBack />
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
    // paddingHorizontal: 16,
  },
  newCategoryInput: {
    // center
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
  },
  categoryNameInput: {
    fontSize: dynamicScale(16, false, 0.5),
    color: "#434343",
    marginLeft: dynamicScale(16, false, 0.5),
    flex: 1,
  },
  deleteButton: {
    marginLeft: dynamicScale(16, false, 0.5),
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
});
