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
import { fetchTrip } from "../util/http";
const i18n = new I18n({ en, de });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

const ProfileScreen = ({ route, navigation, param }) => {
  const UserCtx = useContext(UserContext);
  const FreshlyCreated = UserCtx.freshlyCreated;
  const TripCtx = useContext(TripContext);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = constructHistory.bind(this, true);

  const currentTrip = TripCtx.tripid;
  let allTripsList = [];
  const [tripsList, setTripsList] = useState([]);
  function addTripFromContext() {
    allTripsList.push({
      tripid: TripCtx.tripid,
      tripName: TripCtx.tripName,
      totalBudget: TripCtx.totalBudget,
      dailyBudget: TripCtx.dailyBudget,
      tripCurrency: TripCtx.tripCurrency,
      travellers: TripCtx.travellers,
    });
    console.log("addTripFromContext ~ allTripsList", allTripsList);
    setTripsList(allTripsList);
  }

  // add all trips from history into the list
  async function getTrips(tripid: string) {
    await fetchTrip(tripid).then((res) => {
      console.log("awaitfetchTrip ~ res", res);
      if (tripid !== TripCtx.tripid) allTripsList.push(res);
    });
  }
  async function constructHistory() {
    UserCtx.getTripHistory().forEach((tripid) => {
      console.log("UserCtx.getTripHistory ~ tripid", tripid);
      getTrips(tripid);
    });
  }

  useEffect(() => {
    TripCtx.fetchAndSetCurrentTrip(TripCtx.tripid);
    console.log("useEffect ~ useEffect", useEffect);
    addTripFromContext();
    constructHistory();
  }, []);

  function refreshHandler() {
    allTripsList = [];
    TripCtx.fetchAndSetCurrentTrip(TripCtx.tripid);
    addTripFromContext();
    constructHistory();
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
      <View style={styles.addButton}>
        <IconButton
          icon="person-add-outline"
          size={42}
          color={"white"}
          onPress={() => {
            onShare(TripCtx.tripid);
          }}
        />
      </View>
      <View style={styles.tempGrayBar2}></View>
    </>
  );

  return (
    <View style={styles.container}>
      <NetworkConsumer>
        {({ isConnected }) =>
          isConnected ? <Text>Online</Text> : <Text>Offline</Text>
        }
      </NetworkConsumer>
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
    minHeight: Dimensions.get("window").height / 4,
    margin: 16,
    backgroundColor: GlobalStyles.colors.backgroundColor,
  },
  horizontalContainer: {
    marginLeft: Dimensions.get("window").width / 3,
    flexDirection: "row",
    justifyContent: "space-between",
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
  },
  addButton: {
    backgroundColor: GlobalStyles.colors.primary400,
    flex: 0,
    borderRadius: 999,
    marginHorizontal: Dimensions.get("screen").width / 2.49,
    marginBottom: -10,
    marginTop: -Dimensions.get("screen").height / 11,
    paddingTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
});
