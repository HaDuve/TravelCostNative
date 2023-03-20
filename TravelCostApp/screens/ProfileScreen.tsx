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
import { en, de, fr } from "../i18n/supportedLanguages";
import { fetchTrip, fetchTripHistory, fetchUser } from "../util/http";
import { AuthContext } from "../store/auth-context";
import React from "react";
import { useFocusEffect } from "@react-navigation/native";
import { saveStoppedTour } from "../util/tourUtil";
import { TourGuideZone, useTourGuideController } from "rn-tourguide";
import { sleep } from "../util/appState";
import { useInterval } from "../components/Hooks/useInterval";
import { DEBUG_POLLING_INTERVAL } from "../confApp";
const i18n = new I18n({ en, de, fr });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "de";

const ProfileScreen = ({ navigation }) => {
  const UserCtx = useContext(UserContext);
  const FreshlyCreated = UserCtx.freshlyCreated;
  const [tourIsRunning, setTourIsRunning] = useState(false);
  // // // console.log("ProfileScreen ~ FreshlyCreated", FreshlyCreated);
  const TripCtx = useContext(TripContext);
  const AuthCtx = useContext(AuthContext);
  const uid = AuthCtx.uid;

  const [refreshing, setRefreshing] = useState(false);

  let allTripsList = [];
  const [tripsList, setTripsList] = useState([]);

  useInterval(
    () => {
      if (canStart && UserCtx.needsTour && !tourIsRunning) {
        // 👈 test if you can start otherwise nothing will happen
        sleepyStartTour();
      }
    },
    3000,
    false
  );

  useFocusEffect(() => {
    if (tripsList.length > 0) return;
    refreshHandler();
  });

  // refreshHandler() could be moved into TripContext to be loaded correctly
  async function refreshHandler() {
    // check freshly and offlinemode
    if (FreshlyCreated || !UserCtx.isOnline) return;
    allTripsList = [];
    const tripHistory = await fetchTripHistory(uid);
    if (!tripHistory.length) {
      console.log("no tripHistory fetched");
      return;
    }
    allTripsList = [...tripHistory];
    await TripCtx.fetchAndSetCurrentTrip(TripCtx.tripid);
    addTripFromContext();
    // console.log("allTripsList length: ", allTripsList.length);
    setTripsList(allTripsList.reverse());
  }
  function addTripFromContext() {
    console.log("addTripFromContext ~ addTripFromContext", TripCtx.tripName);
    if (!TripCtx.tripid || TripCtx.tripid.length < 1) return;
    allTripsList = allTripsList.filter((trip) => trip !== TripCtx.tripid);
    allTripsList.push({
      tripid: TripCtx.tripid,
      tripName: TripCtx.tripName,
      totalBudget: TripCtx.totalBudget,
      dailyBudget: TripCtx.dailyBudget,
      tripCurrency: TripCtx.tripCurrency,
      travellers: TripCtx.travellers,
    });
  }

  // Tourguide Test

  const {
    canStart, // a boolean indicate if you can start tour guide
    start, // a function to start the tourguide
    stop, // a function  to stopping it
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
    if (canStart && UserCtx.needsTour) {
      // 👈 test if you can start otherwise nothing will happen
      sleepyStartTour();
    }
  }, [canStart]); // 👈 don't miss it!

  const handleOnStart = () => {
    navigation.navigate("RecentExpenses");
    console.log("start");
  };
  const handleOnStop = () => {
    saveStoppedTour();
    UserCtx.setNeedsTour(false);
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

  const visibleContent = FreshlyCreated ? (
    <></>
  ) : UserCtx.isOnline ? (
    <>
      <View style={styles.tripContainer}>
        <View style={styles.horizontalContainer}>
          <Text style={styles.tripListTitle}>{i18n.t("myTrips")}</Text>
          <Pressable
            onPress={navigation.navigate.bind(this, "ManageTrip")}
            style={styles.newTripButtonContainer}
          >
            <Text style={{ color: GlobalStyles.colors.primary700 }}>+</Text>
            <TourGuideZone
              text={i18n.t("walk5")}
              shape={"circle"}
              maskOffset={24}
              zone={5}
            >
              <IconButton
                icon={"ios-earth"}
                size={36}
                color={GlobalStyles.colors.primary400}
                buttonStyle={styles.createButton}
                onPress={navigation.navigate.bind(this, "ManageTrip")}
              />
            </TourGuideZone>
          </Pressable>
        </View>
        <TourGuideZone
          text={i18n.t("walk6")}
          maskOffset={200}
          tooltipBottomOffset={250}
          zone={6}
        >
          <TripList
            trips={tripsList}
            setRefreshing={setRefreshing}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={refreshHandler}
                // progressViewOffset={-100000}
              />
            }
          ></TripList>
        </TourGuideZone>
      </View>
      {/* <AddExpenseButton navigation={navigation} /> */}

      <View style={styles.horizontalButtonContainer}>
        <TourGuideZone
          text={i18n.t("walk7")}
          maskOffset={50}
          tooltipBottomOffset={50}
          zone={7}
        >
          <View style={styles.addButton}>
            <IconButton
              icon="person-add-outline"
              size={42}
              color={"white"}
              onPress={() => {
                onShare(TripCtx.tripid, navigation);
              }}
            />
          </View>
        </TourGuideZone>
      </View>
    </>
  ) : (
    <View style={styles.offlineWarningContainer}>
      <Text style={styles.offlineWarningText}>
        {" "}
        My Trips are not available in Offline Mode yet, sorry!
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.innerContainer}>
        <ProfileForm
          navigation={navigation}
          sleepyStartHandler={sleepyStartTour}
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
    marginTop: "2%",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  horizontalButtonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  newTripButtonContainer: {
    flexDirection: "row",
    padding: "2%",
    paddingHorizontal: "4%",
    marginRight: "4%",
    marginBottom: "2%",
    marginTop: "-4%",
    borderRadius: 99,
    backgroundColor: GlobalStyles.colors.backgroundColor,
    elevation: 2,
    shadowColor: GlobalStyles.colors.textColor,
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
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
  createButton: {
    marginTop: -12,
    marginRight: 16,
  },
  addButton: {
    backgroundColor: GlobalStyles.colors.primary400,
    flex: 0,
    borderRadius: 999,
    minWidth: "18%",
    paddingTop: "12%",
    paddingHorizontal: "4%",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 0,
    flexDirection: "row",

    elevation: 2,
    shadowColor: GlobalStyles.colors.textColor,
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
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
