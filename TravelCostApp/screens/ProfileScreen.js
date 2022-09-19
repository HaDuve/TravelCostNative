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

const ProfileScreen = ({ route, navigation, param }) => {
  const UserCtx = useContext(UserContext);
  const FreshlyCreated = UserCtx.freshlyCreated;
  const TripCtx = useContext(TripContext);

  const ACTIVETRIPS = [
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
    UserCtx.tripHistory.forEach((trip) => {
      ACTIVETRIPS.push(trip);
    });
  }, []);
  // TODO: try UserCtx.tripHistory as a listener for this useEffect

  function cancelHandler() {
    console.log("canceled");
  }

  const visibleContent = FreshlyCreated ? (
    <></>
  ) : (
    <>
      <View style={styles.tripContainer}>
        <View style={styles.horizontalContainer}>
          <Text style={styles.tripListTitle}>My Trips</Text>
          <IconButton
            icon={"create-outline"}
            size={24}
            color={GlobalStyles.colors.primary500}
            style={styles.button}
            onPress={navigation.navigate.bind(this, "ManageTrip")}
          />
        </View>
        <TripList trips={ACTIVETRIPS}></TripList>
      </View>
      <AddExpenseButton navigation={navigation} />
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
    color: GlobalStyles.colors.gray600,
  },
  deleteContainer: {
    marginTop: 16,
    paddingTop: 8,
    borderTopWidth: 2,
    borderTopColor: GlobalStyles.colors.primary200,
    alignItems: "center",
  },
});
