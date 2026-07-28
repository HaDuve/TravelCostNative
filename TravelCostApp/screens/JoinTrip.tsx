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
  applyJoinImplicitDefaultCleanup,
  resolveJoinImplicitDefaultDecision,
} from "../util/join-implicit-default";
import {
  fetchTrip,
  getAllExpenses,
  storeTripHistory,
  updateUser,
  updateTripHistory,
  putTravelerInTrip,
  getTravellers,
  updateTrip,
  deleteTrip,
} from "../util/http";
import { UserContext } from "../store/user-context";
import { AuthContext } from "../store/auth-context";
import { TripContext, TripData } from "../store/trip-context";
import { GlobalStyles } from "../constants/styles";
import Input from "../components/Auth/Input";
import { i18n } from "../i18n/i18n";
import { ExpensesContext } from "../store/expenses-context";
import React from "react";
import ActionRow from "../components/UI/ActionRow";
import ActionRowStack from "../components/UI/ActionRowStack";
import PropTypes from "prop-types";
import { ActivityIndicator } from "react-native-paper";

import BackButton from "../components/UI/BackButton";
import { NetworkContext } from "../store/network-context";
import uniqBy from "lodash.uniqby";
import {
  secureStoreGetItem,
  secureStoreSetItem,
} from "../store/secure-storage";
import { MMKV_KEYS, setMMKVObject } from "../store/mmkv";
import safeLogError from "../util/error";
import {
  isConnectionFastEnough,
  isConnectionFastEnoughAsBool,
} from "../util/connectionSpeed";
import { sleep } from "../util/appState";
import { dynamicScale } from "../util/scalingUtil";
import { trackEvent } from "../util/vexo-tracking";
import { VexoEvents } from "../util/vexo-constants";
import { activateTrip } from "../util/activate-trip";

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

    // Track trip join
    trackEvent(VexoEvents.TRIP_JOINED, {
      tripId: joinTripid || tripid,
      tripName: tripName,
    });

    setIsFetching(true);
    try {
      const previousActiveTripId = tripCtx.tripid;
      const previousWasImplicit = tripCtx.isImplicitDefault === true;
      const previousExpenseCount = expenseCtx.expenses?.length ?? 0;

      tripid = joinTripid || tripid;

      // if fresh store history else update
      if (userCtx.freshlyCreated) {
        await storeTripHistory(uid, [tripid]);
      } else {
        await updateTripHistory(uid, tripid);
      }
      const historyWithJoined = uniqBy([
        ...(userCtx.tripHistory ?? []),
        tripid,
      ]);
      userCtx.setTripHistory(historyWithJoined);

      const travellers = await getTravellers(tripid);
      // only put traveller in trip if not already in trip
      if (
        !travellers?.some((traveller) => traveller.userName === userCtx.userName)
      ) {
        await putTravelerInTrip(tripid, {
          uid: uid,
          userName: userCtx.userName,
        });
      }

      try {
        await activateTrip(tripid, {
          uid,
          tripData: tripdata,
          previousTripSnapshot: tripCtx.getcurrentTrip(),
          previousExpensesSnapshot: expenseCtx.expenses,
          fetchTrip,
          getTravellers,
          getAllExpenses,
          updateUser,
          secureStoreGetItem,
          secureStoreSetItem,
          setCurrentTrip: tripCtx.setCurrentTrip,
          saveTripDataInStorage: tripCtx.saveTripDataInStorage,
          saveTravellersInStorage: tripCtx.saveTravellersInStorage,
          setExpenses: expenseCtx.setExpenses,
          setExpensesCache: (nextExpenses) =>
            setMMKVObject(MMKV_KEYS.EXPENSES, nextExpenses),
          setFreshlyCreatedTo: userCtx.setFreshlyCreatedTo,
        });
        await userCtx.loadCatListFromAsyncInCtx(tripid);
      } catch (error) {
        safeLogError(error);
        throw new Error("Error while updating user in context");
      }

      const joinDecision = resolveJoinImplicitDefaultDecision({
        activeTripId: previousActiveTripId,
        isImplicitDefault: previousWasImplicit,
        expenseCount: previousExpenseCount,
        joinedTripId: tripid,
        promotedTripName: i18n.t("myBudgetAutoName"),
      });
      await applyJoinImplicitDefaultCleanup(joinDecision, {
        uid,
        tripHistory: historyWithJoined,
        updateTrip,
        deleteTrip,
        storeTripHistory,
        setTripHistory: userCtx.setTripHistory,
      });

      navigation.popToTop();
    } catch (error) {
      Alert.alert(
        i18n.t("alertException"),
        i18n.t("alertTryAgainLater") + "\n" + error.message
      );
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
            <ActionRow
              testID="join-trip-update-link"
              tier="secondary"
              label={i18n.t("update")}
              icon="refresh-outline"
              onPress={joinLinkHandler}
              showChevron={false}
              disabled={freshLink}
              style={{ marginTop: "5%" }}
            />
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
        <ActionRowStack
          showChevron={false}
          actions={[
            ...(tripName?.length > 0 && !isFetching
              ? [
                  {
                    testID: "join-trip-confirm",
                    tier: "primary" as const,
                    label: i18n.t("confirm2"),
                    icon: "checkmark-circle-outline" as const,
                    onPress: joinHandler.bind(this, true),
                  },
                ]
              : []),
            {
              testID: "join-trip-cancel",
              tier: "secondary" as const,
              label: i18n.t("cancel"),
              icon: "arrow-back-outline" as const,
              onPress: joinHandler.bind(this, false),
            },
          ]}
        />
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
    width: "100%",
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
