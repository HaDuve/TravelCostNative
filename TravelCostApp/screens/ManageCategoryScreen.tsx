import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr } from "../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import { useContext } from "react";
import { TripContext } from "../store/trip-context";
import { GlobalStyles } from "../constants/styles";
import { fetchCategories, postCategories } from "../util/http";
import { ScrollView } from "react-native-gesture-handler";
import SelectCategoryIcon from "../components/UI/selectCategoryIcon";
import Button from "../components/UI/Button";
import GradientButton from "../components/UI/GradientButton";

const ManageCategoryScreen = ({ route, navigation }) => {
  const [categoryList, setCategoryList] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [selectedIconName, setSelectedIconName] = useState("");
  const [isFetching, setIsFetching] = useState(false);

  const defaultCategoryList = [
    {
      id: 1,
      icon: "fast-food-outline",
      color: GlobalStyles.colors.textColor,
      cat: "food",
      name: i18n.t("catFoodString"),
    },
    {
      id: 2,
      icon: "airplane-outline",
      color: GlobalStyles.colors.textColor,
      cat: "international-travel",
      name: i18n.t("catIntTravString"),
    },
    {
      id: 3,
      icon: "bed-outline",
      color: GlobalStyles.colors.textColor,
      cat: "accomodation",
      name: i18n.t("catAccoString"),
    },
    {
      id: 4,
      icon: "car-outline",
      color: GlobalStyles.colors.textColor,
      cat: "national-travel",
      name: i18n.t("catNatTravString"),
    },
    {
      id: 5,
      icon: "basket-outline",
      color: GlobalStyles.colors.textColor,
      cat: "other",
      name: i18n.t("catOtherString"),
    },
  ];
  const tripCtx = useContext(TripContext);
  const tripid = tripCtx.tripid;

  const fetchCategoryList = async () => {
    setIsFetching(true);
    const fetchCatResponse = await fetchCategories(tripid);
    if (fetchCatResponse) {
      console.log("fetchCategoryList ~ fetchCatResponse:", fetchCatResponse);
      for (const key in fetchCatResponse) {
        const categoryList = fetchCatResponse[key];
        console.log("fetchCategoryList ~ categoryList:", categoryList);
        setCategoryList(categoryList);
      }
    }
    if (categoryList.length === 0 || !categoryList[0].name) {
      loadCategoryList();
    }
    setIsFetching(false);
  };

  const loadCategoryList = async () => {
    try {
      const categoryListString = await AsyncStorage.getItem("categoryList");
      if (categoryListString !== null) {
        setCategoryList(JSON.parse(categoryListString));
      } else {
        setCategoryList(defaultCategoryList);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const saveCategoryList = async (newCategoryList) => {
    try {
      await AsyncStorage.setItem(
        "categoryList",
        JSON.stringify(newCategoryList)
      );
      await postCategories(tripid, categoryList);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddCategory = () => {
    const newCategory = {
      name: newCategoryName,
      icon: selectedIconName,
      cat: newCategoryName,
    };
    const newCategoryList = [...categoryList, newCategory];
    setCategoryList(newCategoryList);
    saveCategoryList(newCategoryList);
    setNewCategoryName("");
    setSelectedIconName("");
  };

  const handleEditCategory = (index, newName) => {
    const newCategoryList = [...categoryList];
    newCategoryList[index].name = newName;
    setCategoryList(newCategoryList);
    saveCategoryList(newCategoryList);
  };

  const handleDeleteCategory = (index) => {
    const newCategoryList = [...categoryList];
    newCategoryList.splice(index, 1);
    setCategoryList(newCategoryList);
    saveCategoryList(newCategoryList);
  };

  useEffect(() => {
    fetchCategoryList();
  }, []);

  const renderCategoryItem = ({ item, index }) => {
    return (
      <View style={styles.categoryItem}>
        <Ionicons name={item.icon} size={24} color="#434343" />
        <TextInput
          style={styles.categoryNameInput}
          value={item.name}
          onChangeText={(newName) => handleEditCategory(index, newName)}
        />
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteCategory(index)}
        >
          <Ionicons name="trash-outline" size={24} color="#434343" />
        </TouchableOpacity>
      </View>
    );
  };

  const ioniconsList = [
    "ios-briefcase-outline",
    "ios-airplane-outline",
    "ios-restaurant-outline",
    "ios-wallet-outline",
    "ios-cash-outline",
    "ios-card-outline",
    "ios-calendar-outline",
    "ios-settings-outline",
    "ios-list-outline",
    "ios-globe-outline",
    "ios-car-outline",
    "ios-bed-outline",
    "ios-camera-outline",
    "ios-mail-outline",
    "ios-calculator-outline",
    "ios-pricetag-outline",
    "ios-cart-outline",
    "ios-compass-outline",
    "ios-bus-outline",
    "ios-happy-outline",
    "ios-alarm-outline",
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

  const arrays = [],
    size = 3;
  while (ioniconsList.length > 0) arrays.push(ioniconsList.splice(0, size));

  function renderRowIconPicker({ item }) {
    return (
      <View style={{ margin: 5 }}>
        <View
          style={{
            // backgroundColor: "red",
            // width: 200,
            // height: 100,
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
              // backgroundColor: "green",
              // width: 200,
              // height: 100,
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
              // backgroundColor: "green",
              // width: 200,
              // height: 100,
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
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.newCategoryInput}
          placeholder="New category name"
          value={newCategoryName}
          onChangeText={(text) => setNewCategoryName(text)}
        />
        <FlatList
          horizontal
          data={arrays}
          renderItem={renderRowIconPicker}
        ></FlatList>
        <TouchableOpacity style={styles.addButton} onPress={handleAddCategory}>
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>
      <View
        style={{
          height: 16,
          backgroundColor: "#A1D8C1",
          borderBottomWidth: 2,
          borderColor: "#FFFFFF",
        }}
      />
      <FlatList
        data={categoryList}
        renderItem={renderCategoryItem}
        keyExtractor={(item, index) => `${index}`}
        refreshing={isFetching}
        onRefresh={fetchCategoryList}
      />
      <View
        style={{
          height: 0,
          backgroundColor: "#A1D8C1",
          borderBottomWidth: 2,
          borderColor: "#FFFFFF",
        }}
      />
      <GradientButton
        // colors={GlobalStyles.gradientErrorButton}
        onPress={() => navigation.pop()}
        style={{ margin: 16 }}
      >
        {i18n.t("saveChanges")}
      </GradientButton>
    </View>
  );
};

export default ManageCategoryScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#A1D8C1",
  },
  inputContainer: {
    flex: 1,
    alignItems: "center",
    minHeight: 320,
    maxHeight: 320,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  newCategoryInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: "#434343",
    marginRight: 16,
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
  },
  addButtonText: {
    fontSize: 16,
    color: "#FFFFFF",
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    marginBottom: 8,
    padding: 16,
  },
  categoryNameInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: "#434343",
    marginLeft: 16,
  },
  deleteButton: {
    marginLeft: 16,
  },
});
