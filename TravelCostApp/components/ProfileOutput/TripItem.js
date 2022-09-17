import {
  Pressable,
  StyleSheet,
  Text,
  View,
  FlatList,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

import { GlobalStyles } from "../../constants/styles";
import * as Progress from "react-native-progress";
import { useContext } from "react";
import { TripContext } from "../../store/trip-context";
import { formatExpenseString } from "../../util/string";
import { fetchTrip } from "../../util/http";
import { onShare } from "./ShareTrip";

function TripItem({
  tripid,
  tripName,
  totalBudget,
  dailyBudget,
  tripCurrency,
  totalSum,
  travellers,
}) {
  const tripData = {
    tripid,
    tripName,
    totalBudget,
    dailyBudget,
    tripCurrency,
    totalSum,
    travellers,
  };
  console.log("tripPressHandler ~ tripData", tripData);
  // this clause might hide some bugs
  if (!tripid) return <></>;
  const navigation = useNavigation();
  const tripCtx = useContext(TripContext);

  // const totalBudgetString = formatExpenseString(totalBudget) + tripCurrency;
  const DUMMYTRAVELLERS = travellers
    ? travellers
    : [
        { userName: "Hannes" },
        { userName: "Tina" },
        { userName: "Helene" },
        { userName: "Thorben" },
      ];

  function tripPressHandler() {
    console.log("pressed: ", tripid);
    Alert.alert(tripName, "Please choose action:", [
      {
        text: "Cancel",
        onPress: () => navigation.navigate("Profile"),
        style: "cancel",
      },
      {
        text: "Invite other travellers",
        onPress: () => {
          onShare(tripid);
        },
      },
      {
        text: "Set as active Trip",
        onPress: () => {
          tripCtx.setCurrentTrip(tripid, tripData);
          console.log(`set ${tripName} ${tripid} as active!`);
        },
      },
    ]);
  }

  const activeBorder =
    tripName === tripCtx.tripName
      ? { borderWidth: 1, borderColor: GlobalStyles.colors.primary400 }
      : {};

  function renderTravellers(item) {
    return (
      <View style={styles.travellerCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {/* TODO: Profile Picture for now replaced with first char of the name */}
            {item.item.userName.charAt(0)}
          </Text>
        </View>
        <Text>{item.item.userName}</Text>
      </View>
    );
  }

  return (
    <Pressable
      onPress={tripPressHandler}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <View style={[styles.tripItem, activeBorder]}>
        <View style={styles.topRow}>
          <View>
            <Text style={[styles.textBase, styles.description]}>
              {tripName}
            </Text>
            <Text style={styles.textBase}>
              Daily:
              {" " + dailyBudget}
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
              progress={totalSum ? totalBudget / totalSum : 0.3}
              height={12}
              width={150}
            />
          </View>
        </View>
        <FlatList
          data={DUMMYTRAVELLERS}
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
    elevation: 3,
    shadowColor: GlobalStyles.colors.gray500,
    shadowRadius: 4,
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.4,
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
    maxWidth: 200,
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
