import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";

import { useCallback, useContext, useEffect, useState } from "react";
import {
  fetchTrip,
  getAllExpenses,
  storeTripHistory,
  updateUser,
  updateTripHistory,
  putTravelerInTrip,
  getTravellers,
  TravellerNames,
} from "../util/http";
import { UserContext } from "../store/user-context";
import { AuthContext } from "../store/auth-context";
import { TripContext, TripData } from "../store/trip-context";
import { GlobalStyles } from "../constants/styles";
import Input from "../components/Auth/Input";
//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr, ru } from "../i18n/supportedLanguages";
import { ExpensesContext } from "../store/expenses-context";
import React from "react";
import FlatButton from "../components/UI/FlatButton";
import Button from "../components/UI/Button";
import PropTypes from "prop-types";
import { ActivityIndicator } from "react-native-paper";

import BackButton from "../components/UI/BackButton";
import { NetworkContext } from "../store/network-context";
import uniqBy from "lodash.uniqby";
import { secureStoreSetItem } from "../store/secure-storage";
import { setMMKVObject } from "../store/mmkv";
import safeLogError from "../util/error";
import Animated, { FadeIn } from "react-native-reanimated";
import {
  isConnectionFastEnough,
  isConnectionFastEnoughAsBool,
} from "../util/connectionSpeed";
import { sleep } from "../util/appState";
import { dynamicScale } from "../util/scalingUtil";
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
  const [tripdata, setTripdata] = useState<TripData>({});
  const [tripName, setTripName] = useState("");
  const [freshLink, setFreshLink] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  const getTrip = useCallback(
    async (tripID: string) => {
      setIsFetching(true);
      if (!(await isConnectionFastEnoughAsBool())) {
        await sleep(3000);
        if (!(await isConnectionFastEnoughAsBool())) {
          Alert.alert(i18n.t("noConnection"), i18n.t("checkConnectionError"));
          return;
        }
      }
      if (!tripID) return;
      setFreshLink(false);
      let tripName = "";
      try {
        const trip = await fetchTrip(tripID);
        tripName = trip?.tripName;
        setTripName(trip?.tripName);
        setTripdata(trip ?? {});
        setClickedOnLink(true);
      } catch (e) {
        Alert.alert(
          i18n.t("noTrip"),
          i18n.t("tryAgain") +
            "\nid: " +
            tripID +
            "\nname:" +
            tripName +
            "\n" +
            e,
          [
            {
              style: "cancel",
              text: i18n.t("cancel"),
              onPress: () => {
                navigation.popToTop();
              },
            },
            {
              // try again button
              text: "Try Again", //i18n.t("tryAgain"),
              onPress: async () => {
                await getTrip(tripid);
              },
            },
          ]
        );
      }
      setIsFetching(false);
    },
    [tripid]
  );

  useEffect(() => {
    async function getTripFromLink() {
      if (await isConnectionFastEnough()) {
        await getTrip(tripid);
      }
    }
    if (clickedOnLink) getTripFromLink();
  }, [clickedOnLink, getTrip, tripid]);

  async function joinHandler(join: boolean) {
    if (!isConnected) {
      Alert.alert(i18n.t("noConnection"), i18n.t("checkConnectionError"));
      return;
    }
    // either we press the confirm or the cancel button (join=true/false)
    if (!join) {
      navigation.pop();
      return;
    }
    setIsFetching(true);
    try {
      tripid = joinTripid;

      // if fresh store history else update
      if (userCtx.freshlyCreated) {
        await storeTripHistory(uid, [tripid]);
      } else {
        await updateTripHistory(uid, tripid);
      }
      userCtx.setTripHistory(uniqBy([...(userCtx.tripHistory ?? []), tripid]));

      updateUser(uid, {
        currentTrip: tripid,
      });
      try {
        await tripCtx.setCurrentTrip(tripid, tripdata);
        await tripCtx.fetchAndSetTravellers(tripid);
        await userCtx.setFreshlyCreatedTo(false);
        await userCtx.loadCatListFromAsyncInCtx(tripid);
      } catch (error) {
        safeLogError(error);
        throw new Error("Error while updating user in context");
      }

      const expenses = await getAllExpenses(tripid, uid);
      expenseCtx.setExpenses(expenses);
      tripdata.expenses = [];
      setMMKVObject("currentTrip", tripdata);
      await secureStoreSetItem("currentTripId", tripid);
      // await asyncStoreSetObject("expenses", expenses);
      setMMKVObject("expenses", expenses);

      const travellers: TravellerNames = await getTravellers(tripid);
      // only put traveller in trip if not already in trip
      if (!travellers[userCtx.userName])
        await putTravelerInTrip(tripid, {
          uid: uid,
          userName: userCtx.userName,
        });
      // // Immediately reload the React Native Bundle
      // const r = await reloadApp();
      // if (r == -1)
      navigation.popToTop();
    } catch (error) {
      Alert.alert("Exception", "Please try again later.\n" + error.message);
      safeLogError(error);
      navigation.popToTop();
    }
    setIsFetching(false);
  }

  async function joinLinkHandler() {
    setTripdata({});
    setTripName("");
    if (joinTripid?.length > 25) {
      // find the tripid from long string
      // we are assuming this link has the following form
      // "://join/[tripid]"
      const index_start1 = joinTripid.indexOf("://join/");
      const final_link_string = joinTripid.slice(index_start1 + 8).trim();
      setJoinTripid(final_link_string);
      await getTrip(final_link_string);
    } else {
      await getTrip(joinTripid);
    }
  }

  const headerHeight = useHeaderHeight();

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ android: undefined, ios: "position" })}
      enabled={Platform.select({ android: true, ios: true })}
      keyboardVerticalOffset={Platform.select({
        android: headerHeight,
        ios: -100,
      })}
      style={styles.card}
    >
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
          <Text style={{ fontSize: dynamicScale(14, false, 0.5) }}>
            {" "}
            {i18n.t("joinLink")}
          </Text>
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
        <Text
          style={{
            alignSelf: "center",
            padding: dynamicScale(16, false, 0.5),
            fontSize: dynamicScale(16, false, 0.5),
          }}
        >
          {i18n.t("joinTrip")}?
        </Text>
      )}
      <Text
        style={{
          alignSelf: "center",
          padding: dynamicScale(4, false, 0.5),
          fontSize: dynamicScale(26, false, 0.5),
          fontWeight: "bold",
        }}
      >
        {tripName}
      </Text>
      <View style={styles.buttonContainer}>
        <FlatButton onPress={joinHandler.bind(this, false)}>
          {i18n.t("cancel")}
        </FlatButton>
        {tripName?.length > 0 && !isFetching && (
          <Animated.View entering={FadeIn}>
            <Button
              style={{ marginLeft: "10%" }}
              buttonStyle={{ paddingHorizontal: "20%" }}
              onPress={joinHandler.bind(this, true)}
            >
              {i18n.t("confirm2")}
            </Button>
          </Animated.View>
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
    borderRadius: dynamicScale(10, false, 0.5),
    borderWidth: 1,
    elevation: 3,
    borderColor: GlobalStyles.colors.gray600,
    shadowColor: GlobalStyles.colors.gray600,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 10,

    alignContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {},
      android: {
        // marginTop: "10%",
        flex: 1,
      },
    }),
  },
  titleContainer: {
    minHeight: "12%",
    flexDirection: "row",
    padding: "2%",
    marginBottom: "2%",
    alignItems: "center",
    justifyContent: "space-between",
    alignSelf: "center",
    ...Platform.select({
      ios: {
        marginLeft: "-7.5%",
      },
      android: {
        padding: "3%",
      },
    }),
  },
  titleText: {
    fontSize: dynamicScale(30, false, 0.5),
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
    minHeight: "50%",
    padding: dynamicScale(24, false, 0.5),
    margin: dynamicScale(16, false, 0.5),
    marginBottom: dynamicScale(32, false, 0.5),
    borderWidth: 1,
    borderColor: GlobalStyles.colors.gray500,
  },
});
