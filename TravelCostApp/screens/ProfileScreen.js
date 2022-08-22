import { StyleSheet, Text, TextInput, View } from "react-native";
import { GlobalStyles } from "./../constants/styles";
import ProfileForm from "../components/ManageProfile/ProfileForm";
import TripList from "../components/ProfileOutput/TripList";
import { ScrollView } from "react-native";
import { useEffect } from "react";
import IconButton from "../components/UI/IconButton";

const ProfileScreen = ({ route, navigation, param }) => {
  useEffect(() => {
    // do something
  }, [route]);
  // TODO: make a list in context where all trips are handled like expenses,
  // also 1 trip has to be set as active

  // useEffect(() => {
  //   async function getTrips() {
  //     setIsFetching(true);
  //     try {
  //       const expenses = await fetchTrips(tripid, uid, token);
  //       expensesCtx.setTrips(expenses);
  //       const user = await fetchUser(uid);
  //       userCtx.addUser(user);
  //     } catch (error) {
  //       setError("Could not fetch data from the web database!");
  //     }
  //     setIsFetching(false);
  //   }

  //   getTrips();
  // }, []);

  const DUMMYTRIPS = [
    {
      id: "-N9zE5RNR99u_qjn-rud",
      description: "Worldtrip",
      amount: "20,000$",
      date: "",
    },
  ];

  function cancelHandler() {
    //refreshes the screen
    console.log("canceled");
  }

  return (
    <View style={styles.container}>
      <View style={styles.container}>
        <ProfileForm onCancel={cancelHandler}></ProfileForm>
      </View>
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
        <TripList trips={DUMMYTRIPS}></TripList>
      </View>
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 2,
    padding: 4,
    backgroundColor: GlobalStyles.colors.backgroundColor,
  },
  tripContainer: {
    flex: 1,
    margin: 16,
    backgroundColor: GlobalStyles.colors.backgroundColor,
  },
  horizontalContainer: {
    marginLeft: 100,
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
