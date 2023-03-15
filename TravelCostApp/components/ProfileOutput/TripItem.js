import {
  Pressable,
  StyleSheet,
  Text,
  View,
  FlatList,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import * as Haptics from "expo-haptics";

import { GlobalStyles } from "../../constants/styles";
import * as Progress from "react-native-progress";
import React, { useContext, useEffect, useState } from "react";
import { TripContext } from "../../store/trip-context";
import { truncateString } from "../../util/string";
import { getTravellers } from "../../util/http";
import LoadingOverlay from "../UI/LoadingOverlay";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de } from "../../i18n/supportedLanguages";
import { UserContext } from "../../store/user-context";
const i18n = new I18n({ en, de });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

function TripItem({
  tripid,
  tripName,
  totalBudget,
  dailyBudget,
  tripCurrency,
  trips,
}) {
  const tripData = {
    tripid,
    tripName,
    totalBudget,
    dailyBudget,
    tripCurrency,
  };
  const navigation = useNavigation();
  const tripCtx = useContext(TripContext);
  const userCtx = useContext(UserContext);
  const [travellers, setTravellers] = useState([]);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    async function getTripTravellers() {
      if (userCtx.isOnline === false) return;
      setIsFetching(true);
      try {
        const listTravellers = await getTravellers(tripid);
        const objTravellers = [];
        listTravellers.forEach((traveller) => {
          objTravellers.push({ userName: traveller });
        });
        setTravellers(objTravellers);
      } catch (error) {
        console.log("error caught while get Travellers!");
      }
      setIsFetching(false);
    }
    getTripTravellers();
  }, []);

  function tripPressHandler() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (userCtx.isOnline === false) {
      Alert.alert("You are offline", "Please go online to manage your trip");
      return;
    }
    // NOTE: Android can only handle alert with 2 actions, so this needs to be changed or actions will go missing
    console.log("pressed: ", tripid);
    navigation.navigate("ManageTrip", { tripId: tripid, trips: trips });
  }

  const activeBorder =
    tripName === tripCtx.tripName
      ? { borderWidth: 1, borderColor: GlobalStyles.colors.primary400 }
      : {};

  const activeProgress = tripCtx.totalSum / totalBudget;

  function renderTravellers(item) {
    return (
      <View style={[styles.travellerCard, GlobalStyles.strongShadow]}>
        <View style={[styles.avatar, GlobalStyles.shadowPrimary]}>
          <Text style={styles.avatarText}>
            {/* TODO: Profile Picture for now replaced with first char of the name */}
            {item.item.userName.charAt(0)}
          </Text>
        </View>
        <Text>{truncateString(item.item.userName, 10)}</Text>
      </View>
    );
  }

  if (tripid && !totalBudget) {
    return (
      <View style={styles.tripItem}>
        <Text>Refresh..</Text>
      </View>
    );
  }
  if (isFetching) {
    return <LoadingOverlay />;
  }
  if (!tripid) return <Text>no id</Text>;

  return (
    <Pressable
      onPress={tripPressHandler}
      style={({ pressed }) => pressed && GlobalStyles.pressedWithShadow}
    >
      <View style={[styles.tripItem, activeBorder]}>
        <View style={styles.topRow}>
          <View>
            <Text style={[styles.textBase, styles.description]}>
              {truncateString(tripName, 11)}
            </Text>
            <Text style={styles.textBase}>
              {i18n.t("daily")}
              {": " + dailyBudget}
              {" " + tripCurrency}
            </Text>
          </View>
          <View style={styles.amountContainer}>
            <Text style={styles.amount}>
              {totalBudget}
              {" " + tripCurrency}
            </Text>
            <Progress.Bar
              color={GlobalStyles.colors.primary500}
              unfilledColor={GlobalStyles.colors.gray600}
              borderWidth={0}
              borderRadius={8}
              progress={activeProgress}
              height={12}
              width={150}
            />
          </View>
        </View>
        <FlatList
          data={travellers}
          renderItem={renderTravellers}
          numColumns={2}
          keyExtractor={(item) => {
            return item.userName + tripid;
          }}
        ></FlatList>
      </View>
    </Pressable>
  );
}

export default TripItem;

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.75,
  },
  tripItem: {
    flex: 1,
    padding: 12,
    margin: 12,
    backgroundColor: GlobalStyles.colors.gray500,
    borderRadius: 6,
    elevation: 2,
    shadowColor: GlobalStyles.colors.textColor,
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
  },
  topRow: {
    marginVertical: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  textBase: {
    color: GlobalStyles.colors.primary500,
  },
  description: {
    fontSize: 16,
    marginBottom: 4,
    fontWeight: "bold",
  },
  amountContainer: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 4,
    minWidth: 80,
  },
  amount: {
    color: GlobalStyles.colors.primary500,
    fontWeight: "bold",
  },
  travellerCard: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-start",
    margin: 4,
    padding: 8,
    borderRadius: 16,
    maxWidth: "47%",
    backgroundColor: GlobalStyles.colors.backgroundColor,
  },
  travellerText: {
    fontSize: 12,
    color: GlobalStyles.colors.textColor,
  },
  avatar: {
    minHeight: 20,
    minWidth: 20,
    borderRadius: 60,
    backgroundColor: GlobalStyles.colors.gray500,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "bold",
    color: GlobalStyles.colors.primary700,
  },
});
