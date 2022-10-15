import { Dimensions, StyleSheet, Text, TextInput, View } from "react-native";
import { GlobalStyles } from "./../constants/styles";
import ProfileForm from "../components/ManageProfile/ProfileForm";
import TripList from "../components/ProfileOutput/TripList";
import { useContext, useEffect } from "react";
import IconButton from "../components/UI/IconButton";
import AddExpenseButton from "../components/ManageExpense/AddExpenseButton";
import { TripContext } from "../store/trip-context";
import Button from "../components/UI/Button";
import { UserContext } from "../store/user-context";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de } from "../i18n/supportedLanguages";
const i18n = new I18n({ en, de });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

const ProfileScreen = ({ route, navigation, param }) => {
  const UserCtx = useContext(UserContext);
  const FreshlyCreated = UserCtx.freshlyCreated;
  const TripCtx = useContext(TripContext);

  const allTripsList = [
    {
      tripid: TripCtx.tripid,
      tripName: TripCtx.tripName,
      totalBudget: TripCtx.totalBudget,
      dailyBudget: TripCtx.dailyBudget,
      tripCurrency: TripCtx.tripCurrency,
      travellers: TripCtx.travellers,
    },
  ];

  useEffect(() => {
    // add all trips from history into the list
    UserCtx.tripHistory.forEach((trip) => {
      if (trip.tripid !== TripCtx.tripid) allTripsList.push(trip);
    });
  }, []);

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
          <IconButton
            icon={"create-outline"}
            size={36}
            color={GlobalStyles.colors.primary500}
            buttonStyle={styles.createButton}
            onPress={navigation.navigate.bind(this, "ManageTrip")}
          />
        </View>
        <TripList trips={allTripsList}></TripList>
      </View>
      {/* <AddExpenseButton navigation={navigation} /> */}
      <View style={styles.tempGrayBar2}></View>
    </>
  );

  return (
    <View style={styles.container}>
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
});
