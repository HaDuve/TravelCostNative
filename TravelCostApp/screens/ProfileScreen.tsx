import {
  Dimensions,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { GlobalStyles } from "../constants/styles";
import ProfileForm from "../components/ManageProfile/ProfileForm";
import TripList from "../components/ProfileOutput/TripList";
import { useContext, useEffect, useState } from "react";
import IconButton from "../components/UI/IconButton";
import AddExpenseButton from "../components/ManageExpense/AddExpenseButton";
import { TripContext } from "../store/trip-context";
import Button from "../components/UI/Button";
import { UserContext } from "../store/user-context";
import { onShare } from "../components/ProfileOutput/ShareTrip";
import { NetworkConsumer } from "react-native-offline";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de } from "../i18n/supportedLanguages";
import { fetchTrip, fetchTripHistory } from "../util/http";
import { AuthContext } from "../store/auth-context";
import React from "react";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Updates from "expo-updates";
const i18n = new I18n({ en, de });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

const ProfileScreen = ({ route, navigation, param }) => {
  const UserCtx = useContext(UserContext);
  const FreshlyCreated = UserCtx.freshlyCreated;
  const TripCtx = useContext(TripContext);
  const AuthCtx = useContext(AuthContext);
  const uid = AuthCtx.uid;

  const [refreshing, setRefreshing] = useState(false);

  let currentTripid = TripCtx.tripid;
  let allTripsList = [];
  const [tripsList, setTripsList] = useState([]);

  useEffect(() => {
    refreshHandler();
  }, []);

  useEffect(() => {
    const focusHandler = navigation.addListener("focus", async () => {
      await refreshHandler();
    });
    return focusHandler;
  }, [navigation]);

  async function refreshHandler() {
    allTripsList = [];
    const tripHistory = await fetchTripHistory(uid);
    console.log("refreshHandler ~ tripHistory", tripHistory);
    allTripsList = tripHistory;

    if (!currentTripid) {
      if (!tripHistory || !tripHistory[0]) {
        AuthCtx.logout();
        Updates.reloadAsync();
        return;
      }
      currentTripid = tripHistory[0];
    }
    console.log("refreshHandler ~ currentTripid", currentTripid);
    TripCtx.fetchAndSetCurrentTrip(currentTripid);
    addTripFromContext();
  }

  function addTripFromContext() {
    if (!TripCtx.tripid || TripCtx.tripid.length < 1) return;
    allTripsList.push({
      tripid: currentTripid,
      tripName: TripCtx.tripName,
      totalBudget: TripCtx.totalBudget,
      dailyBudget: TripCtx.dailyBudget,
      tripCurrency: TripCtx.tripCurrency,
      travellers: TripCtx.travellers,
    });

    allTripsList.forEach((trip) => {
      console.log(" ~ trip.tripName", trip.tripName);
      console.log(" ~ trip.tripid", trip.tripid);
    });
    console.log("allTripsList length: ", allTripsList.length);
    setTripsList(allTripsList.reverse());
  }

  function cancelHandler() {
    console.log("canceled");
  }

  const visibleContent = FreshlyCreated ? (
    <></>
  ) : (
    <>
      <View style={styles.tripContainer}>
        <View style={styles.horizontalContainer}>
          <Text style={styles.tripListTitle}>{i18n.t("myTrips")}</Text>
          <View style={{ borderRadius: 99 }}>
            <IconButton
              icon={"ios-earth"}
              size={36}
              color={GlobalStyles.colors.primary400}
              buttonStyle={styles.createButton}
              onPress={navigation.navigate.bind(this, "ManageTrip")}
            />
          </View>
        </View>

        <TripList
          trips={tripsList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refreshHandler}
              // progressViewOffset={-100000}
            />
          }
        ></TripList>
      </View>
      {/* <AddExpenseButton navigation={navigation} /> */}
      <View style={styles.horizontalButtonContainer}>
        <View style={styles.addButton}>
          <IconButton
            icon="person-add-outline"
            size={42}
            color={"white"}
            onPress={() => {
              onShare(currentTripid, navigation);
            }}
          />
        </View>
      </View>
      <View style={styles.tempGrayBar2}></View>
    </>
  );

  return (
    <View style={styles.container}>
      {/* NOTE: this commented pattern can be used, to maintain offline/online //
      behavior */}
      {/* <NetworkConsumer>
        {({ isConnected }) =>
          isConnected ? <Text>Online</Text> : <Text>Offline</Text>
        }
      </NetworkConsumer> */}
      <View style={styles.innerContainer}>
        <ProfileForm
          navigation={navigation}
          onCancel={cancelHandler}
        ></ProfileForm>
      </View>
      {visibleContent}
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 0,
    backgroundColor: GlobalStyles.colors.backgroundColor,
  },
  innerContainer: {
    flex: 2,
    padding: 4,
  },
  tripContainer: {
    flex: 1,
    minHeight: "40%",
    margin: 16,
    backgroundColor: GlobalStyles.colors.backgroundColor,
  },
  horizontalContainer: {
    marginLeft: Dimensions.get("window").width / 3,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  horizontalButtonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  tripListTitle: {
    fontSize: 24,
    fontWeight: "bold",
    fontStyle: "italic",
    alignContent: "flex-start",
    color: GlobalStyles.colors.gray600,
    marginLeft: -20,
  },
  deleteContainer: {
    marginTop: 16,
    paddingTop: 8,
    borderTopWidth: 2,
    borderTopColor: GlobalStyles.colors.primary200,
    alignItems: "center",
  },
  createButton: {
    marginTop: -12,
    marginRight: 16,
  },
  tempGrayBar2: {
    borderTopWidth: 1,
    borderTopColor: GlobalStyles.colors.gray600,
    minHeight: 16,
    backgroundColor: GlobalStyles.colors.gray500,
    zIndex: -1,
  },
  addButton: {
    backgroundColor: GlobalStyles.colors.primary400,
    marginBottom: -12,
    flex: 0,
    borderRadius: 999,
    minWidth: "18%",
    paddingTop: "3%",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 0,
  },
});
