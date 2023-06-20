/* eslint-disable react/prop-types */
import {
  Dimensions,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { GlobalStyles } from "../constants/styles";
import ProfileForm from "../components/ManageProfile/ProfileForm";
import TripList from "../components/ProfileOutput/TripList";
import { useContext, useState, useEffect } from "react";
import IconButton from "../components/UI/IconButton";
import { TripContext } from "../store/trip-context";
import { UserContext } from "../store/user-context";
import { onShare } from "../components/ProfileOutput/ShareTrip";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr, ru } from "../i18n/supportedLanguages";
import { fetchTrip, fetchTripHistory, fetchUser } from "../util/http";
import { AuthContext } from "../store/auth-context";
import React from "react";
import { useFocusEffect } from "@react-navigation/native";
import { saveStoppedTour } from "../util/tourUtil";
import { TourGuideZone, useTourGuideController } from "rn-tourguide";
import { sleep } from "../util/appState";
import { useInterval } from "../components/Hooks/useInterval";
import { DEBUG_POLLING_INTERVAL, MAX_JS_NUMBER } from "../confAppConstants";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  asyncStoreGetItem,
  asyncStoreGetObject,
  asyncStoreSetItem,
  asyncStoreSetObject,
} from "../store/async-storage";
import { NetworkContext } from "../store/network-context";
import TripHistoryItem from "../components/ProfileOutput/TripHistoryItem";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "de";

const ProfileScreen = ({ navigation }) => {
  const userCtx = useContext(UserContext);
  const tripCtx = useContext(TripContext);
  const authCtx = useContext(AuthContext);
  const netCtx = useContext(NetworkContext);

  const [tourIsRunning, setTourIsRunning] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [tripHistory, setTripHistory] = useState([]);
  console.log("ProfileScreen ~ tripHistory:", tripHistory);
  useEffect(() => {
    setTripHistory(userCtx.tripHistory);
    console.log("useEffect ~ userCtx.tripHistory:", userCtx.tripHistory);
  }, [userCtx.tripHistory]);

  const uid = authCtx.uid;

  let allTripsList = [];

  useInterval(
    () => {
      if (canStart && userCtx.needsTour && !tourIsRunning) {
        // 👈 test if you can start otherwise nothing will happen
        // sleepyStartTour();
      }
    },
    3000,
    false
  );

  // useEffect(() => {
  //   async function loadTrips() {
  //     if (tripsList.length > 0) return;
  //     console.log("loadTrips ~ tripsList.length", tripsList.length);
  //     if (await refreshHandler()) return;
  //     console.log("loadTrips stage offline");
  //     if (await loadFromAsyncStore(tripCtx.tripid)) return;
  //   }
  //   loadTrips();
  // }, [tripsList.length, netCtx.isConnected]);

  async function loadFromAsyncStore(currentTripid: string) {
    try {
      const tripid = await asyncStoreGetItem("PROFILE_tripid");
      if (tripid != currentTripid) return;
      console.log("loadFromAsyncStore ~ tripid:", tripid);
      const tripName = await asyncStoreGetItem("PROFILE_tripName");
      console.log("loadFromAsyncStore ~ tripName:", tripName);
      const totalBudget = await asyncStoreGetItem("PROFILE_totalBudget");
      console.log("loadFromAsyncStore ~ totalBudget:", totalBudget);
      const dailyBudget = await asyncStoreGetItem("PROFILE_dailyBudget");
      console.log("loadFromAsyncStore ~ dailyBudget:", dailyBudget);
      const tripCurrency = await asyncStoreGetItem("PROFILE_tripCurrency");
      console.log("loadFromAsyncStore ~ tripCurrency:", tripCurrency);
      const travellers = await asyncStoreGetObject("PROFILE_travellers");
      console.log("loadFromAsyncStore ~ travellers:", travellers);
      if (
        !tripid ||
        !tripName ||
        !totalBudget ||
        !dailyBudget ||
        !tripCurrency ||
        !travellers
      ) {
        console.log("not loaded!!!!!!!!!!!");
        return;
      }
      allTripsList = allTripsList.filter((trip) => trip !== tripid);
      allTripsList.push({
        tripid: tripid,
        tripName: tripName,
        totalBudget: totalBudget,
        dailyBudget: dailyBudget,
        tripCurrency: tripCurrency,
        travellers: travellers,
      });
      setTripHistory(allTripsList.reverse());
      return true;
    } catch (error) {
      return false;
    }
  }

  async function saveTripFromContext() {
    asyncStoreSetItem("PROFILE_tripid", tripCtx.tripid);
    asyncStoreSetItem("PROFILE_tripName", tripCtx.tripName);
    asyncStoreSetItem(
      "PROFILE_totalBudget",
      tripCtx.totalBudget ?? MAX_JS_NUMBER
    );
    asyncStoreSetItem("PROFILE_dailyBudget", tripCtx.dailyBudget);
    asyncStoreSetItem("PROFILE_tripCurrency", tripCtx.tripCurrency);
    asyncStoreSetObject("PROFILE_travellers", tripCtx.travellers);
  }

  const {
    canStart, // a boolean indicate if you can start tour guide
    start, // a function to start the tourguide
    // stop, // a function  to stopping it
    eventEmitter, // an object for listening some events
  } = useTourGuideController();
  // Can start at mount 🎉
  // you need to wait until everything is registered 😁
  async function sleepyStartTour() {
    setTourIsRunning(true);
    await sleep(1000);
    start();
  }
  React.useEffect(() => {
    if (canStart && userCtx.needsTour) {
      // 👈 test if you can start otherwise nothing will happen
      // sleepyStartTour();
    }
  }, [canStart, userCtx.needsTour]); // 👈 don't miss it!

  const handleOnStart = () => {
    navigation.navigate("RecentExpenses");
    console.log("start");
  };
  const handleOnStop = () => {
    saveStoppedTour();
    userCtx.setNeedsTour(false);
    setTourIsRunning(false);
    console.log("stop");
  };
  const handleOnStepChange = async (step) => {
    console.log(`stepChange, name: ${step?.name} order: ${step?.order}`);
    switch (step?.order) {
      case 1:
        await navigation.navigate("RecentExpenses");
        break;
      case 2:
        await navigation.navigate("RecentExpenses");
        break;
      case 3:
        await navigation.navigate("RecentExpenses");
        break;
      case 4:
        await navigation.navigate("Overview");
        break;
      case 5:
        await navigation.navigate("Profile");
        break;
      case 6:
        await navigation.navigate("Profile");
        break;
      case 7:
        await navigation.navigate("Profile");
        break;
      case 8:
      default:
        navigation.navigate("RecentExpenses");
        break;
    }
  };

  React.useEffect(() => {
    eventEmitter.on("start", handleOnStart);
    eventEmitter.on("stop", handleOnStop);
    eventEmitter.on("stepChange", handleOnStepChange);

    return () => {
      eventEmitter.off("start", handleOnStart);
      eventEmitter.off("stop", handleOnStop);
      eventEmitter.off("stepChange", handleOnStepChange);
    };
  }, []);

  const visibleContent = userCtx.freshlyCreated ? (
    <></>
  ) : (
    <>
      <View style={styles.tripContainer}>
        <View style={styles.horizontalContainer}>
          <Text style={styles.tripListTitle}>{i18n.t("myTrips")}</Text>
          {/* <Pressable onPress={navigation.navigate.bind(this, "ManageTrip")}> */}
          {/* <Text style={{ color: GlobalStyles.colors.primary700 }}>+</Text> */}
          <TourGuideZone
            text={i18n.t("walk5")}
            shape={"circle"}
            maskOffset={24}
            zone={5}
          >
            <IconButton
              icon={"ios-earth"}
              size={36}
              buttonStyle={styles.newTripButtonContainer}
              color={GlobalStyles.colors.primary400}
              onPress={navigation.navigate.bind(this, "ManageTrip")}
            />
          </TourGuideZone>
          {/* </Pressable> */}
        </View>
        <TourGuideZone
          text={i18n.t("walk6")}
          maskOffset={200}
          tooltipBottomOffset={250}
          zone={6}
        >
          <TripList
            trips={tripHistory}
            setRefreshing={setRefreshing}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                // onRefresh={refreshHandler}
              />
            }
          ></TripList>
        </TourGuideZone>
      </View>
      <View style={styles.horizontalButtonContainer}>
        <TourGuideZone
          text={i18n.t("walk7")}
          maskOffset={50}
          tooltipBottomOffset={50}
          zone={7}
        >
          <View>
            <IconButton
              icon="person-add-outline"
              buttonStyle={[styles.addButton, GlobalStyles.shadowGlowPrimary]}
              size={42}
              color={"white"}
              onPress={() => {
                onShare(tripCtx.tripid, navigation);
              }}
            />
          </View>
        </TourGuideZone>
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <View style={styles.innerContainer}>
        <ProfileForm navigation={navigation}></ProfileForm>
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
    minHeight: "68%",
    margin: 16,
    marginBottom: -30,
    backgroundColor: GlobalStyles.colors.backgroundColor,
  },
  horizontalContainer: {
    marginTop: "3%",
    marginRight: "3%",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  horizontalButtonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    // make it appear behind the triplist
    // zIndex: -1,
  },
  newTripButtonContainer: {
    flexDirection: "row",
    padding: "10%",
    paddingHorizontal: "12%",
    marginBottom: "2%",
    marginTop: "-4%",
    marginRight: "-12%",
    borderRadius: 99,
    backgroundColor: GlobalStyles.colors.backgroundColor,
    elevation: 2,
    shadowColor: GlobalStyles.colors.textColor,
    shadowOffset: { width: 2.5, height: 2.2 },
    shadowOpacity: 0.55,
    shadowRadius: 4,
    //center
    alignSelf: "center",
  },
  tripListTitle: {
    fontSize: 22,
    fontWeight: "bold",
    fontStyle: "italic",
    color: GlobalStyles.colors.gray700,
    marginLeft: "2%",
  },
  deleteContainer: {
    marginTop: 16,
    paddingTop: 8,
    borderTopWidth: 2,
    borderTopColor: GlobalStyles.colors.primary200,
    alignItems: "center",
  },
  addButton: {
    backgroundColor: GlobalStyles.colors.primary400,
    padding: 16,
    paddingHorizontal: 18,
    marginBottom: 4,
    borderRadius: 99,
  },
  offlineWarningContainer: {
    // center content
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    alignContent: "center",
  },
  offlineWarningText: {
    fontSize: 14,
    paddingVertical: "2%",
    paddingHorizontal: "2%",
    color: GlobalStyles.colors.gray700,
    fontWeight: "300",
  },
});
