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
import { en, de } from "../i18n/supportedLanguages";
import { fetchTrip, fetchTripHistory, fetchUser } from "../util/http";
import { AuthContext } from "../store/auth-context";
import React from "react";
const i18n = new I18n({ en, de });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "de";

const ProfileScreen = ({ navigation }) => {
  const UserCtx = useContext(UserContext);
  const FreshlyCreated = UserCtx.freshlyCreated;
  // // // console.log("ProfileScreen ~ FreshlyCreated", FreshlyCreated);
  const TripCtx = useContext(TripContext);
  const AuthCtx = useContext(AuthContext);
  const uid = AuthCtx.uid;

  const [refreshing, setRefreshing] = useState(false);

  let allTripsList = [];
  const [tripsList, setTripsList] = useState([]);

  useEffect(() => {
    if (FreshlyCreated) return;
    refreshHandler();
  }, [TripCtx.refreshState]);

  // TODO: all of this has to be moved into TripContext to be loaded correctly
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
    TripCtx.fetchAndSetCurrentTrip(TripCtx.tripid);
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

  const visibleContent = FreshlyCreated ? (
    <></>
  ) : (
    <>
      <View style={styles.tripContainer}>
        <View style={styles.horizontalContainer}>
          <Text style={styles.tripListTitle}>{i18n.t("myTrips")}</Text>
          <Pressable
            onPress={navigation.navigate.bind(this, "ManageTrip")}
            style={styles.newTripButtonContainer}
          >
            <Text style={{ color: GlobalStyles.colors.primary700 }}>+</Text>
            <IconButton
              icon={"ios-earth"}
              size={36}
              color={GlobalStyles.colors.primary400}
              buttonStyle={styles.createButton}
              onPress={navigation.navigate.bind(this, "ManageTrip")}
            />
          </Pressable>
        </View>
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
      </View>
      {/* <AddExpenseButton navigation={navigation} /> */}
      <View style={styles.horizontalButtonContainer}>
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
    paddingTop: "3%",
    paddingHorizontal: "4%",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 0,

    elevation: 2,
    shadowColor: GlobalStyles.colors.textColor,
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
  },
});
