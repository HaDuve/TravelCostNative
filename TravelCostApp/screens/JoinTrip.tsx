import {
  Alert,
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useContext, useEffect, useLayoutEffect, useState } from "react";
import {
  fetchTrip,
  getAllExpenses,
  storeTripHistory,
  storeTravellerToTrip,
  updateUser,
  fetchTripHistory,
  updateTripHistory,
} from "../util/http";
import { Button } from "react-native";
import { UserContext } from "../store/user-context";
import { AuthContext } from "../store/auth-context";
import { TripContext } from "../store/trip-context";
import { GlobalStyles } from "../constants/styles";
import Input from "../components/Auth/Input";
import * as Updates from "expo-updates";
//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de } from "../i18n/supportedLanguages";
import { ExpensesContext } from "../store/expenses-context";
import React from "react";
const i18n = new I18n({ en, de });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

const JoinTrip = ({ navigation, route }) => {
  // join Trips via route params (route.params.id -> tripid)
  // or with an invitation link (Input -> joinTripid)

  if (!route.params.id) return;
  const userCtx = useContext(UserContext);
  const authCtx = useContext(AuthContext);
  const tripCtx = useContext(TripContext);
  const expenseCtx = useContext(ExpensesContext);
  const uid = authCtx.uid;
  let tripid = route.params.id;

  const [joinTripid, setJoinTripid] = useState("");
  const [tripdata, setTripdata] = useState({});
  const [tripName, setTripName] = useState("");

  async function getTrip(tripID: string) {
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
  }

  useLayoutEffect(() => {
    getTrip(joinTripid);
  }, []);

  async function joinHandler(join: boolean) {
    // either we press the confirm or the cancel button (join=true/false)
    if (!join) {
      navigation.navigate("Profile");
    } else {
      tripid = joinTripid;
      console.log("joinHandler ~ tripid", tripid);

      // if fresh store history else update
      if (userCtx.freshlyCreated) {
        await storeTripHistory(uid, [tripid]);
      } else {
        await updateTripHistory(uid, tripid);
      }
      try {
        await storeTravellerToTrip(tripid, {
          userName: userCtx.userName,
          uid: uid,
        });
      } catch (error) {
        console.error(error);
      }
      updateUser(uid, {
        currentTrip: tripid,
      });
      tripCtx.setCurrentTrip(tripid, tripdata);
      tripCtx.setCurrentTravellers(tripid);
      userCtx.setFreshlyCreatedTo(false);
      const expenses = await getAllExpenses(tripid, uid);
      expenseCtx.setExpenses(expenses);

      // Immediately reload the React Native Bundle
      Updates.reloadAsync();
    }
  }

  async function joinLinkHandler() {
    setTripdata({});
    setTripName("");
    if (joinTripid.length > 25) {
      // find the tripid from long string
      const index_start = joinTripid.indexOf("-");
      const temp_string = joinTripid.slice(index_start);
      const index_end = temp_string.indexOf(" ");
      const final_link_string = temp_string.slice(0, index_end);
      setJoinTripid(final_link_string);
      getTrip(final_link_string);
    } else {
      await getTrip(joinTripid);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.titleText}>Join Trip</Text>
      </View>
      <View style={styles.linkInputContainer}>
        <Text> {i18n.t("joinLink")}</Text>
        <Input
          value={joinTripid}
          onUpdateValue={setJoinTripid}
          label={""}
          secure={false}
          keyboardType={"default"}
          isInvalid={false}
        ></Input>
        <Button title={"Update"} onPress={joinLinkHandler}></Button>
      </View>
      {tripName?.length > 1 && (
        <Text style={{ padding: 16, fontSize: 22 }}>{i18n.t("joinTrip")}?</Text>
      )}
      <Text style={{ padding: 4, fontSize: 18, fontWeight: "bold" }}>
        {tripName}
      </Text>
      <View style={styles.buttonContainer}>
        <Button
          title={i18n.t("cancel")}
          onPress={joinHandler.bind(this, false)}
        />
        {tripName?.length > 0 && (
          <Button
            title={i18n.t("confirm2")}
            onPress={joinHandler.bind(this, true)}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

export default JoinTrip;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 40,
    alignContent: "center",
    alignItems: "center",

    marginBottom: "40%",
  },
  titleContainer: {
    padding: 12,
    marginBottom: 24,
  },
  titleText: {
    fontSize: 30,
    fontWeight: "bold",
  },
  buttonContainer: {
    flex: 1,
    padding: 40,
    flexDirection: "row",
    alignContent: "space-between",
  },
  linkInputContainer: {
    flex: 1,
    padding: 24,
    margin: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: GlobalStyles.colors.gray500,
  },
});
