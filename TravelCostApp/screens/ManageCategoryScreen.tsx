import React, { useState, useEffect } from "react";
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
import { en, de, fr } from "../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr });
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
import { KeyboardAvoidingView, ActivityIndicator } from "react-native";
import PropTypes from "prop-types";
import { UserContext } from "../store/user-context";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";
import { Category } from "../util/category";
import Dimensions from "react-native";
import { alertYesNo } from "../components/Errors/Alert";
import IconButton from "../components/UI/IconButton";
import { NetworkContext } from "../store/network-context";

const ManageCategoryScreen = ({ route, navigation }) => {
  const defaultCategoryList: Category[] = [
    {
      id: 1,
      icon: "fast-food-outline",
      color: GlobalStyles.colors.textColor,
      cat: "food",
      catString: i18n.t("catFoodString"),
    },
    {
      id: 2,
      icon: "airplane-outline",
      color: GlobalStyles.colors.textColor,
      cat: "international-travel",
      catString: i18n.t("catIntTravString"),
    },
    {
      id: 3,
      icon: "bed-outline",
      color: GlobalStyles.colors.textColor,
      cat: "accomodation",
      catString: i18n.t("catAccoString"),
    },
    {
      id: 4,
      icon: "car-outline",
      color: GlobalStyles.colors.textColor,
      cat: "national-travel",
      catString: i18n.t("catNatTravString"),
    },
    {
      id: 5,
      icon: "basket-outline",
      color: GlobalStyles.colors.textColor,
      cat: "other",
      catString: i18n.t("catOtherString"),
    },
  ];

  const [categoryList, setCategoryList] =
    useState<Category[]>(defaultCategoryList);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [selectedIconName, setSelectedIconName] = useState("");

  const [isFetching, setIsFetching] = useState(false);

  // use state for is uploading
  const [isUploading, setIsUploading] = useState(false);

  const userCtx = useContext(UserContext);
  const netCtx = useContext(NetworkContext);
  const isOnline = netCtx.isConnected;

  const tripCtx = useContext(TripContext);
  const tripid = tripCtx.tripid;

  const fetchCategoryList = async () => {
    setIsFetching(true);
    if (!isOnline) {
      await loadCategoryList();
      return;
    }
    try {
      const categories = await fetchCategories(tripid);
      if (categories) {
        const tempList = [...categories];
        setCategoryList(tempList);
        setIsFetching(false);
      }
    } catch (error) {
      console.error(error);
    }
    if (categoryList.length === 0) {
      await loadCategoryList();
    }
    if (categoryList.length === 0) {
      setCategoryList(defaultCategoryList);
    }
  };

  const loadCategoryList = async () => {
    try {
      const categoryListString = await AsyncStorage.getItem("categoryList");
      if (categoryListString !== null) {
        const list = JSON.parse(categoryListString);
        console.log("loadCategoryList ~ list:", list);
        setCategoryList(list);
      } else {
        setCategoryList(defaultCategoryList);
      }
    } catch (error) {
      console.error(error);
    }
    setIsFetching(false);
  };

  const saveCategoryList = async (newCategoryList) => {
    setIsUploading(true);
    // if not isOnline, alert user
    if (!isOnline) {
      Toast.show({
        text1: "No Internet Connection",
        text2: "Please try again later!",
        type: "error",
      });
      navigation.pop(2);
    }
    try {
      await AsyncStorage.setItem(
        "categoryList",
        JSON.stringify(newCategoryList)
      );
      console.log(
        `updating trip categories with ${JSON.stringify(newCategoryList)}`
      );
      await updateTrip(tripid, {
        categories: JSON.stringify(newCategoryList),
      });
      // todo: update this without another fetch
      await userCtx.loadCatListFromAsyncInCtx(tripid);
    } catch (error) {
      console.error(error);
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
    await saveCategoryList(newCategoryList);
  };

  const handleDeleteCategory = async (index) => {
    const newCategoryList = [...categoryList];
    newCategoryList.splice(index, 1);
    setCategoryList(newCategoryList);
    await saveCategoryList(newCategoryList);
  };

  const handleResetCategoryList = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCategoryList(defaultCategoryList);
    await saveCategoryList(defaultCategoryList);
  };

  useEffect(() => {
    fetchCategoryList();
  }, [isOnline]);

  const renderCategoryItem = ({ item, index }) => {
    return (
      <Animated.View
        entering={ZoomInLeft}
        exiting={ZoomOutRight}
        style={[styles.categoryItem, GlobalStyles.strongShadow]}
      >
        <Ionicons
          name={item.icon}
          size={24}
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
          <Ionicons name="trash-outline" size={24} color="#434343" />
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
  while (ioniconsList.length > 0) arrays.push(ioniconsList.splice(0, size));

  function renderRowIconPicker({ item }) {
    return (
      <View style={[{ margin: 5 }]}>
        <View
          style={{
            marginBottom: 1,
          }}
        >
          <SelectCategoryIcon
            iconName={item[0]}
            selectedIconName={selectedIconName}
            setSelectedIconName={setSelectedIconName}
          />
        </View>
        {item.length > 1 ? (
          <View
            style={{
              marginBottom: 1,
            }}
          >
            <SelectCategoryIcon
              iconName={item[1]}
              selectedIconName={selectedIconName}
              setSelectedIconName={setSelectedIconName}
            />
          </View>
        ) : null}
        {item.length > 2 ? (
          <View
            style={{
              marginBottom: 1,
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

  return (
    <BackgroundGradient
      colors={GlobalStyles.gradientColors}
      style={styles.container}
    >
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={"padding"}>
        <View
          style={[
            styles.inputContainer,
            bigDisplay && { minHeight: 284, maxHeight: 284 },
            GlobalStyles.shadowPrimary,
          ]}
        >
          <TextInput
            autoFocus={true}
            style={[styles.newCategoryInput]}
            placeholder="New category name"
            value={newCategoryName}
            onChangeText={(text) => setNewCategoryName(text)}
          />
          <FlatList
            horizontal
            data={arrays}
            renderItem={renderRowIconPicker}
          ></FlatList>
          {!isUploading &&
            newCategoryName.length > 0 &&
            selectedIconName.length > 0 && (
              <Animated.View entering={ZoomIn} exiting={ZoomOut}>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={handleAddCategory}
                >
                  <Text style={styles.addButtonText}>Add</Text>
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
            height: 16,
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
            elevation: 3,
          }}
        />
        {!isFetching && (
          <Animated.FlatList
            data={categoryList}
            numColumns={2}
            renderItem={renderCategoryItem}
            keyExtractor={(item, index) => `${index}`}
            refreshing={isFetching}
            onRefresh={fetchCategoryList}
          />
        )}
        {isFetching && (
          <View style={{ flex: 1, justifyContent: "center" }}>
            <ActivityIndicator
              size="large"
              color={GlobalStyles.colors.backgroundColor}
            />
          </View>
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
            elevation: 3,
            overflow: "visible",
          }}
        />
        <View style={{ flexDirection: "row", justifyContent: "space-evenly" }}>
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
                "Reset",
                "Reset all categories?",
                handleResetCategoryList
              );
            }}
          >
            RESET
          </GradientButton>
          {/* <FlatButton
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.pop();
            }}
            // style={{ margin: 16 }}
          >
            {i18n.t("back")}
          </FlatButton> */}

          <GradientButton
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.pop();
            }}
          >
            {i18n.t("confirm")}
          </GradientButton>
        </View>
      </KeyboardAvoidingView>
    </BackgroundGradient>
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
    padding: 16,
  },
  inputContainer: {
    flex: 1,
    alignItems: "center",
    minHeight: 220,
    maxHeight: 220,
    backgroundColor: GlobalStyles.colors.backgroundColor,
    borderRadius: 8,
    marginBottom: 8,
    padding: 4,
    // paddingHorizontal: 16,
  },
  newCategoryInput: {
    // center
    alignItems: "center",
    flex: 1,
    height: 40,
    maxHeight: 40,
    fontSize: 20,
    color: GlobalStyles.colors.primary400,
    borderBottomWidth: 1,
    borderBottomColor: GlobalStyles.colors.primary500,
  },
  iconPicker: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    padding: 8,
    marginHorizontal: 8,
    borderRadius: 16,
  },
  selectedIconButton: {
    backgroundColor: GlobalStyles.colors.gray500Accent,
  },
  addButton: {
    backgroundColor: "#538076",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
    marginTop: -24,
  },
  addButtonText: {
    fontSize: 16,
    color: GlobalStyles.colors.backgroundColor,
  },
  categoryItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: GlobalStyles.colors.backgroundColor,
    borderRadius: 8,
    margin: 8,
    padding: 16,
    zIndex: 1,
  },
  categoryNameInput: {
    fontSize: 16,
    color: "#434343",
    marginLeft: 16,
    flex: 1,
  },
  deleteButton: {
    marginLeft: 16,
  },
});
