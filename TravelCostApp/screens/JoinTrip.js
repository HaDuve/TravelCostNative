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
  console.log("🚀 ~ file: JoinTrip.js ~ line 8 ~ JoinTrip ~ tripid", tripid);
  const [tripName, setTripName] = useState("");

  useLayoutEffect(() => {
    async function getTrip() {
      //   setIsFetching(true);
      try {
        const trip = await fetchTrip(tripid);
        setTripName(trip.tripName);
        // expensesCtx.setExpenses(expenses);
        // const user = await fetchUser(uid);
        // userCtx.addUser(user);
      } catch (error) {
        console.log(
          "🚀 ~ file: JoinTrip.js ~ line 22 ~ getTrip ~ error",
          error
        );

        // setError("Could not fetch data from the web database!");
      }
      //   setIsFetching(false);
    }

    getTrip();
  }, [tripid]);

  function joinHandler(arg) {
    if (arg) {
      console.log("YES pressed");
      const traveller = { travellerid: uid };
      storeUserToTrip(tripid, traveller);
      navigation.navigate("RecentExpenses");
      return;
    }
    console.log("NO pressed");
    navigation.navigate("RecentExpenses");
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
