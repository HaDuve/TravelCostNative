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
  updateUser,
  updateTripHistory,
  putTravelerInTrip,
} from "../util/http";
import { UserContext } from "../store/user-context";
import { AuthContext } from "../store/auth-context";
import { TripContext } from "../store/trip-context";
import { GlobalStyles } from "../constants/styles";
import Input from "../components/Auth/Input";
import * as Updates from "expo-updates";
//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr, ru } from "../i18n/supportedLanguages";
import { ExpensesContext } from "../store/expenses-context";
import React from "react";
import FlatButton from "../components/UI/FlatButton";
import Button from "../components/UI/Button";
import { G } from "react-native-svg";
import LoadingOverlay from "../components/UI/LoadingOverlay";
import PropTypes from "prop-types";
import { ActivityIndicator } from "react-native-paper";

import { reloadApp } from "../util/appState";
import BackButton from "../components/UI/BackButton";
import { asyncStoreSetItem, asyncStoreSetObject } from "../store/async-storage";
import { NetworkContext } from "../store/network-context";
import uniqBy from "lodash.uniqby";
import { secureStoreSetItem } from "../store/secure-storage";
import { setMMKVObject } from "../store/mmkv";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

const JoinTrip = ({ navigation, route }) => {
  // join Trips via route params (route.params.id -> tripid)
  // or with an invitation link (Input -> joinTripid)

  const userCtx = useContext(UserContext);
  const authCtx = useContext(AuthContext);
  const tripCtx = useContext(TripContext);
  const netCtx = useContext(NetworkContext);
  const isConnected = netCtx.isConnected && netCtx.strongConnection;
  const expenseCtx = useContext(ExpensesContext);
  const uid = authCtx.uid;
  let tripid = route.params ? route.params.id : "";
  const [clickedOnLink, setClickedOnLink] = useState(tripid ? true : false);
  const [joinTripid, setJoinTripid] = useState("");
  const [tripdata, setTripdata] = useState({});
  const [tripName, setTripName] = useState("");
  const [freshLink, setFreshLink] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  async function getTrip(tripID: string) {
    if (!isConnected) {
      Alert.alert(i18n.t("noConnection"), i18n.t("checkConnectionError"));
      return;
    }
    if (!tripID) return;
    setIsFetching(true);
    setFreshLink(false);
    try {
      const trip = await fetchTrip(tripID);
      setTripName(trip.tripName);
      setTripdata(trip);
      setClickedOnLink(true);
    } catch (e) {
      Alert.alert(i18n.t("noTrip"), i18n.t("tryAgain"));
    }
    setIsFetching(false);
  }

  useEffect(() => {
    if (clickedOnLink) getTrip(tripid);
  }, [clickedOnLink, tripid]);

  async function joinHandler(join: boolean) {
    if (!isConnected) {
      Alert.alert(i18n.t("noConnection"), i18n.t("checkConnectionError"));
      return;
    }
    // either we press the confirm or the cancel button (join=true/false)
    if (!join) {
      navigation.pop();
    } else {
      setIsFetching(true);
      try {
        tripid = joinTripid;
        console.log("joinHandler ~ tripid", tripid);

        // if fresh store history else update
        if (userCtx.freshlyCreated) {
          await storeTripHistory(uid, [tripid]);
        } else {
          await updateTripHistory(uid, tripid);
        }
        userCtx.setTripHistory(uniqBy([...userCtx.tripHistory, tripid]));

        await putTravelerInTrip(tripid, {
          uid: uid,
          userName: userCtx.userName,
        });

        updateUser(uid, {
          currentTrip: tripid,
        });
        await tripCtx.setCurrentTrip(tripid, tripdata);
        await tripCtx.fetchAndSetTravellers(tripid);
        await userCtx.setFreshlyCreatedTo(false);
        await userCtx.loadCatListFromAsyncInCtx(tripid);
        const expenses = await getAllExpenses(tripid, uid);
        expenseCtx.setExpenses(expenses);
        await asyncStoreSetObject("currentTrip", tripdata);
        await secureStoreSetItem("currentTripId", tripid);
        // await asyncStoreSetObject("expenses", expenses);
        setMMKVObject("expenses", expenses);

        // // Immediately reload the React Native Bundle
        // const r = await reloadApp();
        // if (r == -1)
        navigation.popToTop();
      } catch (error) {
        Alert.alert("Exception", "Please try again later.\n" + error.message);
        console.error(error);
        navigation.popToTop();
      }
      setIsFetching(false);
    }
  }

  async function joinLinkHandler() {
    setTripdata({});
    setTripName("");
    if (joinTripid.length > 25) {
      // find the tripid from long string
      // we are assuming this link has the following form
      // "://join/[tripid]"
      const index_start1 = joinTripid.indexOf("://join/");
      const final_link_string = joinTripid.slice(index_start1 + 8).trim();
      console.log("joinLinkHandler ~ final_link_string:", final_link_string);
      setJoinTripid(final_link_string);
      getTrip(final_link_string);
    } else {
      await getTrip(joinTripid);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.card}>
      <View style={styles.titleContainer}>
        <BackButton></BackButton>
        <Text style={styles.titleText}>{i18n.t("joinTripLabel")}</Text>

        <View style={{ marginLeft: "5%" }}>
          {isFetching && (
            <ActivityIndicator
              size={"large"}
              color={GlobalStyles.colors.primaryGrayed}
            />
          )}
        </View>
      </View>
      {!clickedOnLink && (
        <View style={styles.linkInputContainer}>
          <Text> {i18n.t("joinLink")}</Text>
          <Input
            value={joinTripid}
            onUpdateValue={(value) => {
              setJoinTripid(value);
              setFreshLink(true);
            }}
            label={""}
            secure={false}
            keyboardType={"default"}
            isInvalid={false}
          ></Input>
          {!isFetching && (
            <Button
              style={{ maxWidth: "100%", marginTop: "5%" }}
              buttonStyle={{
                backgroundColor: freshLink
                  ? GlobalStyles.colors.primaryGrayed
                  : GlobalStyles.colors.gray700,
              }}
              onPress={joinLinkHandler}
            >
              {i18n.t("update")}
            </Button>
          )}
        </View>
      )}
      {tripName?.length > 1 && (
        <Text style={{ padding: 16, fontSize: 22 }}>{i18n.t("joinTrip")}?</Text>
      )}
      <Text style={{ padding: 4, fontSize: 26, fontWeight: "bold" }}>
        {tripName}
      </Text>
      <View style={styles.buttonContainer}>
        <FlatButton onPress={joinHandler.bind(this, false)}>
          {i18n.t("cancel")}
        </FlatButton>
        {tripName?.length > 0 && !isFetching && (
          <Button
            style={{ marginLeft: "10%" }}
            buttonStyle={{ paddingHorizontal: "20%" }}
            onPress={joinHandler.bind(this, true)}
          >
            {i18n.t("confirm2")}
          </Button>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

export default JoinTrip;
JoinTrip.propTypes = {
  navigation: PropTypes.object,
  route: PropTypes.object,
};
const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: "5%",
    padding: "2%",
    backgroundColor: GlobalStyles.colors.gray500,
    borderRadius: 10,
    borderWidth: 1,
    elevation: 3,
    borderColor: GlobalStyles.colors.gray600,
    shadowColor: GlobalStyles.colors.gray600,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 10,

    alignContent: "center",
    alignItems: "center",
  },
  titleContainer: {
    marginLeft: "-7,5%",
    minHeight: "12%",
    flexDirection: "row",
    padding: "2%",
    marginBottom: "2%",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleText: {
    fontSize: 30,
    fontWeight: "bold",
  },
  buttonContainer: {
    flex: 1,
    padding: "5%",
    marginTop: "5%",
    flexDirection: "row",
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
