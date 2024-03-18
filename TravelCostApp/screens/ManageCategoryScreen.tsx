import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Platform,
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
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useContext, useLayoutEffect } from "react";
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
import Dimensions from "react-native";
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
import { moderateScale, scale, verticalScale } from "../util/scalingUtil";

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
          size={moderateScale(24, 0.3)}
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
            size={moderateScale(24, 0.3)}
            color={GlobalStyles.colors.textColor}
          />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const ioniconsList = [
    "ios-wallet-outline",
    "ios-cash-outline",
    "ios-card-outline",
    "ios-list-outline",
    "ios-calculator-outline",
    "ios-pricetag-outline",
    "ios-cart-outline",
    "ios-compass-outline",
    "ios-happy-outline",
    "ios-trophy-outline",
    "ios-gift-outline",
    "ios-pie-chart-outline",
    "ios-podium-outline",
    "ios-fitness-outline",
    "ios-pulse-outline",
    "ios-desktop-outline",
    "ios-cube-outline",
    "ios-flame-outline",
    "ios-color-palette-outline",
    "ios-rocket-outline",
    "ios-leaf-outline",
    "ios-pint-outline",
    "ios-wine-outline",
    "ios-film-outline",
    "ios-game-controller-outline",
    "ios-book-outline",
    "ios-tv-outline",
    "ios-gift-outline",
    "ios-cloud-outline",
    "ios-thermometer-outline",
    "ios-flash-outline",
    "ios-train-outline",
    "ios-school-outline",
    "ios-flower-outline",
    "ios-radio-outline",
    "ios-pizza-outline",
    "ios-medkit-outline",
    "ios-american-football-outline",
    "ios-musical-note-outline",
    "ios-musical-notes-outline",
    "ios-headset-outline",
    "ios-ice-cream-outline",
    "ios-cafe-outline",
    "ios-paw-outline",
    "ios-thumbs-up-outline",
    "ios-battery-dead-outline",
    "ios-watch-outline",
    "ios-chatbubbles-outline",
    "ios-cloudy-outline",
    "ios-desktop-outline",
    "ios-document-outline",
    "ios-easel-outline",
    "ios-eye-outline",
    "ios-fast-food-outline",
    "ios-film-outline",
    "ios-football-outline",
    "ios-glasses-outline",
    "ios-heart-outline",
    "ios-key-outline",
    "ios-laptop-outline",
    "ios-leaf-outline",
    "ios-moon-outline",
    "ios-nutrition-outline",
    "ios-partly-sunny-outline",
    "ios-people-outline",
    "ios-person-outline",
    "ios-planet-outline",
    "ios-pulse-outline",
    "ios-rainy-outline",
    "ios-rose-outline",
    "ios-search-outline",
    "ios-shirt-outline",
    "ios-speedometer-outline",
    "ios-stopwatch-outline",
    "ios-sunny-outline",
    "ios-thunderstorm-outline",
    "ios-time-outline",
    "ios-volume-high-outline",
    "ios-walk-outline",
    "ios-water-outline",
  ];
  // get dimensions
  const bigDisplay = Dimensions.useWindowDimensions().height > 850;
  const arrays = [];
  // 1-3 possible items per row
  const size = bigDisplay ? 3 : 2;
  while (ioniconsList?.length > 0) arrays.push(ioniconsList.splice(0, size));

  function renderRowIconPicker({ item }) {
    return (
      <View style={[{ margin: scale(5) }]}>
        <View
          style={{
            marginBottom: verticalScale(2),
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
              marginBottom: verticalScale(2),
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
              marginBottom: verticalScale(2),
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
                minHeight: moderateScale(284, 0.3),
                maxHeight: moderateScale(284, 0.3),
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
              height: verticalScale(16),
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
    padding: moderateScale(16),
  },
  inputContainer: {
    flex: 1,
    alignItems: "center",
    minHeight: moderateScale(220, 0.3),
    maxHeight: moderateScale(220, 0.3),
    backgroundColor: GlobalStyles.colors.backgroundColor,
    borderRadius: 8,
    marginBottom: moderateScale(8),
    padding: moderateScale(4),
    // paddingHorizontal: 16,
  },
  newCategoryInput: {
    // center
    alignItems: "center",
    flex: 1,
    height: moderateScale(40),
    maxHeight: moderateScale(40),
    fontSize: moderateScale(20),
    color: GlobalStyles.colors.primary400,
    borderBottomWidth: 1,
    borderBottomColor: GlobalStyles.colors.primary500,
  },
  iconPicker: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    padding: moderateScale(8),
    marginHorizontal: moderateScale(8),
    borderRadius: moderateScale(16),
  },
  selectedIconButton: {
    backgroundColor: GlobalStyles.colors.gray500Accent,
  },
  addButton: {
    backgroundColor: "#538076",
    borderRadius: moderateScale(8),
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(16),
    marginBottom: moderateScale(12),
    marginTop: moderateScale(-24),
  },
  addButtonText: {
    fontSize: moderateScale(16),
    color: GlobalStyles.colors.backgroundColor,
  },
  categoryItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: GlobalStyles.colors.backgroundColor,
    borderRadius: moderateScale(8),
    margin: moderateScale(8),
    padding: moderateScale(16),
    zIndex: 1,
  },
  categoryNameInput: {
    fontSize: moderateScale(16),
    color: "#434343",
    marginLeft: moderateScale(16),
    flex: 1,
  },
  deleteButton: {
    marginLeft: moderateScale(16),
  },
  modalStyle: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  modalContainer: {
    backgroundColor: GlobalStyles.colors.backgroundColor,
    borderRadius: moderateScale(8),
    padding: moderateScale(16),
    width: "80%",
    height: "40%",
    justifyContent: "space-evenly",
  },
  modalTitle: {
    fontSize: moderateScale(20),
    fontWeight: "bold",
    color: GlobalStyles.colors.primary400,
    textAlign: "center",
  },
  modalText: {
    fontSize: moderateScale(16),
    color: GlobalStyles.colors.primary400,
    textAlign: "center",
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
  },
  modalButton: {
    backgroundColor: GlobalStyles.colors.primary400,
    borderRadius: moderateScale(8),
    padding: moderateScale(8),
    width: "40%",
  },
  modalButtonText: {
    fontSize: moderateScale(16),
    color: GlobalStyles.colors.backgroundColor,
    textAlign: "center",
  },
  infoModalContainer: {
    backgroundColor: GlobalStyles.colors.backgroundColor,
    borderRadius: moderateScale(8),
    padding: moderateScale(16),
    width: "80%",
    height: "40%",
    justifyContent: "space-evenly",
  },
  infoTitleText: {
    fontSize: moderateScale(20),
    fontWeight: "bold",
    color: GlobalStyles.colors.textColor,
    textAlign: "center",
  },
  infoContentText: {
    fontSize: moderateScale(16),
    color: GlobalStyles.colors.textColor,
    textAlign: "center",
  },
});
