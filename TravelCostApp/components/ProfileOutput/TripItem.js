import {
  Pressable,
  StyleSheet,
  Text,
  View,
  FlatList,
  Alert,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

import { GlobalStyles } from "../../constants/styles";
import * as Progress from "react-native-progress";
import { useContext, useEffect, useState } from "react";
import { TripContext } from "../../store/trip-context";
import { formatExpenseString } from "../../util/string";
import { fetchTrip, getTravellers } from "../../util/http";
import { onShare } from "./ShareTrip";
import { calcOpenSplitsTable } from "../../util/split";
import LoadingOverlay from "../UI/LoadingOverlay";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de } from "../../i18n/supportedLanguages";
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
}) {
  const tripData = {
    tripid,
    tripName,
    totalBudget,
    dailyBudget,
    tripCurrency,
  };
  if (!tripid) return <Text>No Tripid</Text>;
  const navigation = useNavigation();
  const tripCtx = useContext(TripContext);
  const [travellers, setTravellers] = useState([]);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    async function getTripTravellers() {
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
    // NOTE: Android can only handle alert with 2 actions, so this needs to be changed or actions will go missing
    console.log("pressed: ", tripid);
    Alert.alert(tripName, i18n.t("chooseAction"), [
      {
        text: i18n.t("cancel"),
        onPress: () => navigation.navigate("Profile"),
        style: "cancel",
      },
      {
        text: i18n.t("setActiveTrip"),
        onPress: () => {
          tripCtx.setCurrentTrip(tripid, tripData);
          console.log(`set ${tripName} ${tripid} as active!`);
        },
      },
      travellers.length > 1 && {
        text: i18n.t("calcOpenSplits"),
        onPress: () => {
          navigation.navigate("SplitSummary", { tripid: tripid });
        },
      },
    ]);
  }

  const activeBorder =
    tripName === tripCtx.tripName
      ? { borderWidth: 1, borderColor: GlobalStyles.colors.primary400 }
      : {};

  const activeProgress = tripCtx.totalSum / totalBudget;

  if (isFetching) {
    return <LoadingOverlay />;
  }

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

  if (tripid && !totalBudget) {
    return <Text>{tripid}</Text>;
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
