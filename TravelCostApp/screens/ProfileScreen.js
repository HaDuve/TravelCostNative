import { StyleSheet, Text, TextInput, View } from "react-native";
import { GlobalStyles } from "./../constants/styles";
import ProfileForm from "../components/ManageProfile/ProfileForm";
import TripList from "../components/ProfileOutput/TripList";
import { ScrollView } from "react-native";

const ProfileScreen = () => {
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
      description: "Goes to Bandung",
      amount: "1",
      date: "",
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.container}>
        <ProfileForm></ProfileForm>
      </ScrollView>
      <View style={styles.container}>
        <Text>Active Trip</Text>
        <TripList trips={DUMMYTRIPS}></TripList>
        <Text>Other Trips</Text>
        <TripList trips={DUMMYTRIPS}></TripList>
      </View>
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 8,
    backgroundColor: GlobalStyles.colors.primary800,
  },
  deleteContainer: {
    marginTop: 16,
    paddingTop: 8,
    borderTopWidth: 2,
    borderTopColor: GlobalStyles.colors.primary200,
    alignItems: "center",
  },
});
