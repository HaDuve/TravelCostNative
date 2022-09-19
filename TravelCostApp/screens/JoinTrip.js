import { Alert, StyleSheet, Text, View } from "react-native";
import { useContext, useEffect, useLayoutEffect, useState } from "react";
import {
  fetchTrip,
  storeUserToTrip,
  updateTrip,
  updateUser,
} from "../util/http";
import { Button } from "react-native";
import { UserContext } from "../store/user-context";
import { AuthContext } from "../store/auth-context";
import { TripContext } from "../store/trip-context";
import { GlobalStyles } from "../constants/styles";
import Input from "../components/Auth/Input";

const JoinTrip = ({ navigation, route }) => {
  // join Trips via route params (route.params.id -> tripid)
  // or with an invitation link (Input -> joinTripid)

  if (!route.params.id) return;
  const userCtx = useContext(UserContext);
  const authCtx = useContext(AuthContext);
  const tripCtx = useContext(TripContext);
  const uid = authCtx.uid;
  const tripid = route.params.id;

  // NOTE: joinTripid for debug purposes
  //("-NCIxnq4MrQjGB_unKiE");
  const [joinTripid, setJoinTripid] = useState("");
  const [tripdata, setTripdata] = useState({});
  const [tripName, setTripName] = useState("");

  async function getTrip(tripID = tripid) {
    //   setIsFetching(true);
    try {
      const trip = await fetchTrip(tripID);
      setTripName(trip.tripName);
      setTripdata(trip);
    } catch (e) {
      Alert.alert(
        "Could not find trip!",
        " Please try another invitation or try again later."
      );
    }
    //   setIsFetching(false);
  }

  useLayoutEffect(() => {
    getTrip();
  }, []);

  function joinHandler(join) {
    if (join) {
      const traveller = { travellerid: uid, userName: userCtx.userName };
      storeUserToTrip(tripid, traveller);
      userCtx.addTripHistory(tripdata);
      tripCtx.setCurrentTrip(tripid, tripdata);
      updateUser(uid, {
        userName: userCtx.userName,
        tripHistory: userCtx.tripHistory,
      });
      userCtx.setFreshlyCreatedTo(false);
    }
    navigation.navigate("Profile");
  }

  async function joinLinkHandler() {
    setTripdata({});
    setTripName("");
    await getTrip(joinTripid);
    joinHandler(true);
  }

  return (
    <View style={styles.container}>
      <Text>Do you want to join the Trip : {tripName}?</Text>
      <View style={styles.buttonContainer}>
        <Button title="Yes" onPress={joinHandler.bind(this, true)} />
        <Button title="No" onPress={joinHandler.bind(this, false)} />
      </View>
      <View style={styles.linkInputContainer}>
        <Text> I have an invitation link!</Text>
        <Input value={joinTripid} onUpdateValue={setJoinTripid}></Input>
        <Button title={"Join"} onPress={joinLinkHandler}></Button>
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
  linkInputContainer: {
    flex: 1,
    padding: 12,
    margin: 12,
    borderWidth: 1,
    borderColor: GlobalStyles.colors.gray500,
  },
});
