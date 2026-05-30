/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
import React, { createContext, useEffect, useState } from "react";
import { fetchTrip, fetchUser, getTravellers, updateTrip } from "../util/http";
import { asyncStoreGetObject, asyncStoreSetObject } from "./async-storage";
import { secureStoreGetItem } from "./secure-storage";
import { ExpenseData, isPaidString } from "../util/expense";
import { Traveller } from "../util/traveler";
import { isConnectionFastEnough } from "../util/connectionSpeed";
import { useInterval } from "../components/Hooks/useInterval";
import { getMMKVObject, MMKV_KEYS, setMMKVObject } from "./mmkv";
import { Category } from "../util/category";
import safeLogError from "../util/error";
import { computeDynamicDailyBudget } from "../util/budget";
import type { TripData } from "../types/trip";
import { settleTrip } from "../util/settlement";
import { useTripTotalSpent } from "../hooks/useTripTotalSpent";
import { hydrateTrip } from "../util/hydrate-trip";

export type { TripData };

export type TripContextType = {
  tripid: string;
  tripName: string;
  totalBudget: string;
  dailyBudget: string;
  setdailyBudget: (dailyBudget: string) => void;
  tripCurrency: string;
  tripProgress: number;
  startDate: string;
  endDate: string;
  refreshState: boolean;
  refresh: () => void;
  setTripProgress: (percent: number) => void;
  travellers: Traveller[];
  fetchAndSetTravellers: (tripid: string) => Promise<boolean>;
  setTripid: (tripid: string) => void;
  addTrip: ({ tripName, tripTotalBudget }) => void;
  deleteTrip: (tripid: string) => void;
  getcurrentTrip: () => TripData;
  setCurrentTrip: (tripid: string, trip: TripData) => Promise<TripData | void>;
  fetchAndSetCurrentTrip: (tripid: string) => Promise<TripData>;
  saveTripDataInStorage: (tripData: TripData) => Promise<void>;
  loadTripDataFromStorage: () => Promise<TripData>;
  saveTravellersInStorage: (travellers) => Promise<void>;
  loadTravellersFromStorage: () => Promise<Traveller[]>;
  fetchAndSettleCurrentTrip: () => Promise<void>;
  setTripUnsettled: () => Promise<void>;
  isPaid: isPaidString;
  isPaidDate: string;
  isPaidTimestamp: number | undefined;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  isDynamicDailyBudget: boolean;
};

export const TripContext = createContext<TripContextType>({
  tripid: "",
  tripName: "",
  totalBudget: "",
  dailyBudget: "",
  setdailyBudget: (dailyBudget: string) => {},
  tripCurrency: "",
  tripProgress: 0,
  startDate: "",
  endDate: "",
  refreshState: false,
  refresh: () => {},
  setTripProgress: (percent: number) => {},
  travellers: [],
  fetchAndSetTravellers: async (tripid: string) => false,
  setTripid: (tripid: string) => {},

  addTrip: ({ tripName, tripTotalBudget }) => {},
  deleteTrip: (tripid: string) => {},
  getcurrentTrip: () => {
    const tripData = {} as TripData;
    return tripData;
  },
  setCurrentTrip: async (tripid: string, trip: TripData) => undefined,
  fetchAndSetCurrentTrip: async (tripid: string): Promise<TripData> => {
    return {};
  },
  saveTripDataInStorage: async (tripData: TripData) => {},
  loadTripDataFromStorage: async (): Promise<TripData> => {
    return {} as TripData;
  },
  saveTravellersInStorage: async (travellers) => {},
  loadTravellersFromStorage: async (): Promise<Traveller[]> => [],
  fetchAndSettleCurrentTrip: async () => {},
  setTripUnsettled: async () => {},
  isPaid: isPaidString.notPaid,
  isPaidDate: "",
  isPaidTimestamp: undefined,
  isLoading: false,
  setIsLoading: (isLoading: boolean) => {},
  isDynamicDailyBudget: false,
});

function TripContextProvider({ children }: React.PropsWithChildren) {
  const [travellers, setTravellers] = useState([]);
  const [tripid, setTripid] = useState("");
  const [tripName, setTripName] = useState("");
  const [totalBudget, setTotalBudget] = useState("");
  const [tripCurrency, setTripCurrency] = useState("");
  const [dailyBudget, setdailyBudget] = useState("");
  const [progress, setProgress] = useState(0);
  const [refreshState, setRefreshState] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isPaid, setIsPaid] = useState(isPaidString.notPaid);
  const [isPaidDate, setIsPaidDate] = useState("");
  const [isPaidTimestamp, setIsPaidTimestamp] = useState<number | undefined>(
    undefined
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isDynamicDailyBudget, setIsDynamicDailyBudget] = useState(false);

  const tripTotalSpent = useTripTotalSpent();

  async function loadTripidFetchTrip() {
    const stored_tripid = await secureStoreGetItem("currentTripId");
    const stored_uid = await secureStoreGetItem("uid");
    if (!(stored_tripid || stored_uid)) return;
    setTripid(stored_tripid ?? "");
    const { isFastEnough } = await isConnectionFastEnough();
    if (isFastEnough) {
      try {
        const checkUser = await fetchUser(stored_uid);
        const fetched_tripid = checkUser.currentTrip;
        await fetchAndSetCurrentTrip(fetched_tripid ?? stored_tripid);
        await fetchAndSetTravellers(fetched_tripid ?? stored_tripid);
      } catch (error) {
        setIsLoading(false);
      }
    } else {
      await loadTripDataFromStorage();
      setIsLoading(false);
    }
    setIsLoading(false);
  }

  useEffect(() => {
    function calcDynamicDailyBudget() {
      if (isDynamicDailyBudget) {
        const computed = computeDynamicDailyBudget({
          totalBudget: Number(totalBudget),
          tripTotalSpent,
          endDate: new Date(endDate),
          now: new Date(),
        });
        // negative numbers are not allowed
        if (isNaN(computed)) return;
        if (computed < 0) {
          setdailyBudget("0.0001");
        } else {
          setdailyBudget(computed.toFixed(2));
        }
      }
    }
    calcDynamicDailyBudget();
  }, [isDynamicDailyBudget, totalBudget, tripTotalSpent, endDate]);

  useInterval(
    () => {
      if (tripid && tripName) {
        setIsLoading(false);
        return;
      }
      if (isLoading) return;
      setIsLoading(true);
      loadTripidFetchTrip();
    },
    2000,
    true
  );

  useEffect(() => {
    async function loadAsyncTravellers() {
      const travellers = await asyncStoreGetObject("currentTravellers");
      if (travellers) {
        setTravellers(travellers);
      }
    }
    loadAsyncTravellers();
  }, []);

  useEffect(() => {
    if (!travellers || (travellers?.length === 0 && tripid)) {
      fetchAndSetTravellers(tripid);
    }
  }, [travellers, tripid]);

  function setTripProgress(percent: number) {
    if (percent < 0 || percent > 1) percent = 1;
    setProgress(percent);
  }
  //
  function refresh() {
    setRefreshState(!refreshState);
  }

  async function fetchAndSetTravellers(tripid: string): Promise<boolean> {
    await loadTravellersFromStorage();
    const { isFastEnough } = await isConnectionFastEnough();
    if (!isFastEnough || !tripid || tripid === "") return false;
    try {
      const travellers = await getTravellers(tripid);
      if (travellers?.length < 1) throw new Error("no travellers found");
      saveTravellersInStorage(travellers);
      setTravellers(travellers);
      return true;
    } catch (error) {
      safeLogError(error);
      return false;
    }
  }

  async function setCurrentTrip(
    tripid: string,
    trip: TripData
  ): Promise<TripData | void> {
    if (!trip) return;
    if (tripid === "reset") {
      _setTripid("");
      setTripName("");
      setTotalBudget("");
      setTripCurrency("");
      setdailyBudget("");
      setTravellers([]);
      setStartDate("");
      setEndDate("");
      setIsPaid(isPaidString.notPaid);
      setIsPaidDate("");
      setIsPaidTimestamp(undefined);
      setIsLoading(false);
      return;
    }

    const hydratedTrip = hydrateTrip({ ...trip, tripid: trip.tripid ?? tripid });

    _setTripid(tripid);
    setTripName(hydratedTrip.tripName);
    setTotalBudget(hydratedTrip.totalBudget!);
    setTripCurrency(hydratedTrip.tripCurrency);
    setdailyBudget(hydratedTrip.dailyBudget!);
    setStartDate(hydratedTrip.startDate);
    setEndDate(hydratedTrip.endDate);
    setIsPaid(hydratedTrip.isPaid!);
    setIsPaidDate(hydratedTrip.isPaidDate!);
    setIsPaidTimestamp(hydratedTrip.isPaidTimestamp);
    setIsLoading(false);
    setIsDynamicDailyBudget(hydratedTrip.isDynamicDailyBudget ?? false);
    if (typeof trip.travellers[1] === "string") {
      setTravellers(trip.travellers);
    } else {
      const extractedTravellers = [];
      Object.keys(trip.travellers).forEach((key) => {
        //skip undefined keys
        if (key && travellers[key]) {
          extractedTravellers.push(travellers[key]["userName"]);
        }
      });
      setTravellers(extractedTravellers);
    }

    return hydratedTrip;
  }

  async function fetchAndSetCurrentTrip(tripid: string) {
    if (!tripid) return;
    const { isFastEnough } = await isConnectionFastEnough();
    if (!isFastEnough) return;
    try {
      const trip: TripData = await fetchTrip(tripid);
      if (!trip) throw new Error("no trip found");
      trip.tripid = tripid;

      const migratedTrip = await setCurrentTrip(tripid, trip);
      if (!migratedTrip) return;

      // If migration occurred, save migrated trip back to database and storage
      if (
        trip.isPaidDate &&
        !trip.isPaidTimestamp &&
        migratedTrip.isPaidTimestamp
      ) {
        await saveTripDataInStorage(migratedTrip);
        await updateTrip(tripid, migratedTrip);
      } else {
        await saveTripDataInStorage(migratedTrip);
      }
      return migratedTrip;
    } catch (error) {
      safeLogError(error);
    }
  }

  async function fetchAndSettleCurrentTrip() {
    try {
      const trip = await fetchTrip(tripid);
      const settledTrip = settleTrip(trip);
      await setCurrentTrip(tripid, settledTrip);
      await saveTripDataInStorage(settledTrip);
      await updateTrip(tripid, settledTrip);
    } catch (error) {
      safeLogError(error);
      throw error;
    }
  }

  async function setTripUnsettled() {
    try {
      const trip = await fetchTrip(tripid);
      trip.isPaid = isPaidString.notPaid;
      // Keep isPaidTimestamp unchanged for reference
      // isPaidTimestamp remains set even though isPaid is false
      await setCurrentTrip(tripid, trip);
      await saveTripDataInStorage(trip);
      await updateTrip(tripid, trip);
    } catch (error) {
      safeLogError(error);
    }
  }

  function getcurrentTrip() {
    const curTripData: TripData = {
      tripid: tripid,
      tripName: tripName,
      totalBudget: totalBudget,
      dailyBudget: dailyBudget,
      tripCurrency: tripCurrency,
      isPaid: isPaid,
      isPaidDate: isPaidDate,
      isPaidTimestamp: isPaidTimestamp,
      tripProgress: progress,
      startDate: startDate,
      endDate: endDate,
      travellers: travellers,
      isDynamicDailyBudget: isDynamicDailyBudget,
    };
    return curTripData;
  }

  function _setTripid(tripid: string) {
    setTripid(tripid);
  }

  function addTrip() {}
  function deleteTrip() {}

  async function saveTripDataInStorage(tripData: TripData) {
    // cut away the trip.expenses array
    tripData.expenses = [];
    setMMKVObject(MMKV_KEYS.CURRENT_TRIP, tripData);
  }

  async function loadTripDataFromStorage() {
    const tripData: TripData = getMMKVObject(MMKV_KEYS.CURRENT_TRIP);
    if (tripData) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const hadDeprecatedTotalSum = "totalSum" in (tripData as any);
      const migratedTrip = await setCurrentTrip(tripData.tripid ?? "", tripData);
      if (!migratedTrip) {
        setIsLoading(false);
        return;
      }

      try {
        await loadTravellersFromStorage();
      } catch (error) {
        safeLogError(error);
      }

      const didMigrateSettlementData =
        tripData.isPaidDate &&
        !tripData.isPaidTimestamp &&
        migratedTrip.isPaidTimestamp;
      if (didMigrateSettlementData || hadDeprecatedTotalSum) {
        await saveTripDataInStorage(migratedTrip);
      }

      return migratedTrip;
    } else {
      setIsLoading(false);
    }
  }

  async function saveTravellersInStorage(travellers) {
    await asyncStoreSetObject("currentTravellers", travellers);
  }

  async function loadTravellersFromStorage(): Promise<Traveller[]> {
    const travellers = await asyncStoreGetObject("currentTravellers");
    if (travellers) {
      setTravellers(travellers);
    }
    return travellers ?? [];
  }

  const value = {
    tripid: tripid,
    tripName: tripName,
    totalBudget: totalBudget,
    dailyBudget: dailyBudget,
    setdailyBudget: setdailyBudget,
    tripCurrency: tripCurrency,
    tripProgress: progress,
    startDate: startDate,
    endDate: endDate,
    refresh: refresh,
    refreshState: refreshState,
    setTripProgress: setTripProgress,
    travellers: travellers,
    fetchAndSetTravellers: fetchAndSetTravellers,
    setTripid: _setTripid,
    addTrip: addTrip,
    deleteTrip: deleteTrip,
    getcurrentTrip: getcurrentTrip,
    setCurrentTrip: setCurrentTrip,
    fetchAndSetCurrentTrip: fetchAndSetCurrentTrip,
    saveTripDataInStorage: saveTripDataInStorage,
    loadTripDataFromStorage: loadTripDataFromStorage,
    saveTravellersInStorage: saveTravellersInStorage,
    loadTravellersFromStorage: loadTravellersFromStorage,
    fetchAndSettleCurrentTrip: fetchAndSettleCurrentTrip,
    setTripUnsettled: setTripUnsettled,
    isPaid: isPaid,
    isPaidDate: isPaidDate,
    isPaidTimestamp: isPaidTimestamp,
    isLoading: isLoading,
    setIsLoading: setIsLoading,
    isDynamicDailyBudget: isDynamicDailyBudget,
  };

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export default TripContextProvider;
