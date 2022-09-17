import { StyleSheet, Text, View } from "react-native";
import { useContext, useEffect, useLayoutEffect, useState } from "react";
import { fetchTrip, storeUserToTrip, updateTrip } from "../util/http";
import { Button } from "react-native";
import { UserContext } from "../store/user-context";
import { AuthContext } from "../store/auth-context";

const JoinTrip = ({ navigation, route }) => {
  if (!route.params.id) return;
  const userCtx = useContext(UserContext);
  const authCtx = useContext(AuthContext);
  const uid = authCtx.uid;
  const tripid = route.params.id;
  let tripdata = {};
  console.log("🚀 ~ file: JoinTrip.js ~ line 8 ~ JoinTrip ~ tripid", tripid);
  const [tripName, setTripName] = useState("");

  useLayoutEffect(() => {
    async function getTrip() {
      //   setIsFetching(true);
      try {
        const trip = await fetchTrip(tripid);
        setTripName(trip.tripName);
        tripdata = trip;
        // expensesCtx.setExpenses(expenses);
        // const user = await fetchUser(uid);
        // userCtx.addUser(user);
      } catch (error) {
        console.log(error);
      }
      //   setIsFetching(false);
    }

    getTrip();
  }, [tripid]);

  function joinHandler(join) {
    if (join) {
      const traveller = { travellerid: uid, userName: userCtx.userName };
      storeUserToTrip(tripid, traveller);
      userCtx.addTripHistory(tripdata);
      // TODO: SAVE triphistory online
      navigation.navigate("Profile");
      return;
    }
    navigation.navigate("Home");
  }

  return (
    <View style={styles.container}>
      <Text>Do you want to join the Trip named : {tripName}</Text>
      <View style={styles.buttonContainer}>
        <Button title="Yes" onPress={joinHandler.bind(this, true)} />
        <Button title="No" onPress={joinHandler.bind(this, false)} />
      </View>
    </View>
  );
};

export default JoinTrip;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 40,
    alignContent: "center",
    alignItems: "center",
  },
  buttonContainer: {
    flex: 1,
    padding: 40,
    flexDirection: "row",
    alignContent: "space-between",
  },
});
