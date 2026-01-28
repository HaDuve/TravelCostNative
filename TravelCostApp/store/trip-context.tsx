/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable no-empty-function */
import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import PropTypes from "prop-types";
import { fetchTrip, fetchUser, getTravellers, updateTrip } from "../util/http";
import {
  trackAsyncFunction,
  logFunctionTime,
  logRender,
} from "../util/performance";
import { asyncStoreGetObject, asyncStoreSetObject } from "./async-storage";
import { MAX_JS_NUMBER } from "../confAppConstants";
import { secureStoreGetItem } from "./secure-storage";
import { ExpenseData, isPaidString } from "../util/expense";
import { Traveller } from "../util/traveler";
import { isConnectionFastEnough } from "../util/connectionSpeed";
import { useInterval } from "../components/Hooks/useInterval";
import { getMMKVObject, MMKV_KEYS, setMMKVObject } from "./mmkv";
import { Category } from "../util/category";
import safeLogError from "../util/error";

export interface TripData {
  tripName?: string;
  expenses?: ExpenseData[];
  totalBudget?: string;
  dailyBudget?: string;
  tripCurrency?: string;
  travellers?: Traveller[];
  tripid?: string;
  totalSum?: number;
  tripProgress?: number;
  startDate?: string;
  endDate?: string;
  isPaidDate?: string;
  isPaid?: isPaidString;
  isPaidTimestamp?: number;
  isDynamicDailyBudget?: boolean;
  // online categories are stored as a JSON.stringified strings
  // local categories are stored as Category arrays.
  categories?: Category[] | string;
}

export type TripContextType = {
  tripid: string;
  tripName: string;
  totalBudget: string;
  dailyBudget: string;
  setdailyBudget: (dailyBudget: string) => void;
  tripCurrency: string;
  totalSum: number;
  tripProgress: number;
  startDate: string;
  endDate: string;
  refreshState: boolean;
  refresh: () => void;
  setTripProgress: (percent: number) => void;
  travellers: Traveller[];
  fetchAndSetTravellers: (tripid: string) => Promise<boolean>;
  setTotalSum: (amount: number) => void;
  setTripid: (tripid: string) => void;
  addTrip: ({ tripName, tripTotalBudget }) => void;
  deleteTrip: (tripid: string) => void;
  getcurrentTrip: () => TripData;
  setCurrentTrip: (tripid: string, trip: TripData) => Promise<void>;
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
  totalSum: 0,
  tripProgress: 0,
  startDate: "",
  endDate: "",
  refreshState: false,
  refresh: () => {},
  setTripProgress: (percent: number) => {},
  travellers: [],
  fetchAndSetTravellers: async (tripid: string) => false,
  setTotalSum: (amount: number) => {},
  setTripid: (tripid: string) => {},

  addTrip: ({ tripName, tripTotalBudget }) => {},
  deleteTrip: (tripid: string) => {},
  getcurrentTrip: () => {
    const tripData = {} as TripData;
    return tripData;
  },
  setCurrentTrip: async (tripid: string, trip: TripData) => {},
  fetchAndSetCurrentTrip: async (tripid: string): Promise<TripData> => {
    return {};
  },
  saveTripDataInStorage: async (tripData: TripData) => {},
  loadTripDataFromStorage: async (): Promise<TripData> => {
    return {} as TripData;
  },
  saveTravellersInStorage: async (travellers) => {},
  loadTravellersFromStorage: async () => [],
  fetchAndSettleCurrentTrip: async () => {},
  setTripUnsettled: async () => {},
  isPaid: isPaidString.notPaid,
  isPaidDate: "",
  isPaidTimestamp: undefined,
  isLoading: false,
  setIsLoading: (isLoading: boolean) => {},
  isDynamicDailyBudget: false,
});

function TripContextProvider({ children }) {
  const [travellers, setTravellers] = useState([]);
  const [tripid, setTripid] = useState("");
  const [tripName, setTripName] = useState("");
  const [totalBudget, setTotalBudget] = useState("");
  const [tripCurrency, setTripCurrency] = useState("");
  const [dailyBudget, setdailyBudget] = useState("");
  const [totalSum, setTotalSumTrip] = useState(0);
  const [progress, setProgress] = useState(0);
  const [refreshState, setRefreshState] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isPaid, setIsPaid] = useState(isPaidString.notPaid);
  const [isPaidDate, setIsPaidDate] = useState("");
  const [isPaidTimestamp, setIsPaidTimestamp] = useState<number | undefined>(
    undefined,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isDynamicDailyBudget, setIsDynamicDailyBudget] = useState(false);

  // Track renders
  React.useEffect(() => {
    logRender("TripContextProvider", "state changed", [
      "tripid",
      "tripName",
      "totalBudget",
      "totalSum",
    ]);
  });

  const loadTripidFetchTrip = useCallback(async () => {
    const stored_tripid = await trackAsyncFunction(
      secureStoreGetItem,
      "secureStoreGetItem_tripId",
      "context-polling",
    )("currentTripId");
    const stored_uid = await trackAsyncFunction(
      secureStoreGetItem,
      "secureStoreGetItem_uid",
      "context-polling",
    )("uid");
    if (!(stored_tripid || stored_uid)) return;
    setTripid(stored_tripid ?? "");
    const { isFastEnough } = await trackAsyncFunction(
      isConnectionFastEnough,
      "isConnectionFastEnough",
      "context-polling",
    )();
    if (isFastEnough) {
      try {
        const checkUser = await trackAsyncFunction(
          fetchUser,
          "fetchUser",
          "context-polling",
        )(stored_uid);
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
  }, [isLoading, tripid, tripName]);

  useEffect(() => {
    function calcDynamicDailyBudget() {
      const startTime = Date.now();
      if (isDynamicDailyBudget) {
        const daysLeft = Math.floor(
          (new Date(endDate).getTime() - new Date().getTime()) /
            (1000 * 3600 * 24),
        );
        const totalBudgetLeft = Number(totalBudget) - Number(totalSum);
        const dailyBudget = totalBudgetLeft / daysLeft;
        // negative numbers are not allowed
        if (isNaN(dailyBudget)) return;
        if (dailyBudget < 0) {
          setdailyBudget("0.0001");
        } else {
          setdailyBudget(dailyBudget.toFixed(2));
        }
      }
      logFunctionTime(
        "calcDynamicDailyBudget",
        startTime,
        Date.now(),
        "context-update",
      );
    }
    calcDynamicDailyBudget();
  }, [isDynamicDailyBudget, totalBudget, totalSum, endDate]);

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
    true,
  );

  useEffect(() => {
    async function loadAsyncTravellers() {
      await trackAsyncFunction(
        asyncStoreGetObject,
        "loadAsyncTravellers",
        "context-init",
      )("currentTravellers").then((travellers) => {
        if (travellers) {
          setTravellers(travellers);
        }
      });
    }
    loadAsyncTravellers();
  }, []);

  useEffect(() => {
    if (!travellers || (travellers?.length === 0 && tripid)) {
      trackAsyncFunction(
        fetchAndSetTravellers,
        "fetchAndSetTravellers",
        "context-update",
      )(tripid);
    }
  }, [travellers, tripid]);

  const setTripProgress = useCallback((percent: number) => {
    if (percent < 0 || percent > 1) percent = 1;
    setProgress(percent);
  }, []);
  //
  const refresh = useCallback(() => {
    setRefreshState((prev) => !prev);
  }, []);

  /**
   * Migrates trip data from old settlement system (isPaidDate) to new system (isPaidTimestamp).
   * Old system: "settled until today" - isPaidDate exists but means partial settlement
   * New system: "settled everything" - isPaidTimestamp means all expenses before that timestamp are paid
   * Migration: Convert isPaidDate to isPaidTimestamp, set isPaid to false (since old system was different)
   */
  function migrateTripSettlementData(trip: TripData): TripData {
    // If trip has isPaidDate but no isPaidTimestamp, migrate it
    if (trip.isPaidDate && !trip.isPaidTimestamp) {
      try {
        // Convert ISO string date to timestamp
        const date = new Date(trip.isPaidDate);
        if (!isNaN(date.getTime())) {
          trip.isPaidTimestamp = date.getTime();
          // Set isPaid to false because old system was "settled until today", not "settled everything"
          trip.isPaid = isPaidString.notPaid;
        }
      } catch (error) {
        safeLogError(error);
      }
    }
    return trip;
  }

  const fetchAndSetTravellers = useCallback(
    async (tripid: string): Promise<boolean> => {
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
    },
    [],
  );

  const setCurrentTrip = useCallback(
    async (tripid: string, trip: TripData) => {
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
        setTotalSumTrip(0);
        setIsLoading(false);
        return;
      }

      // Migrate trip data from old settlement system
      const migratedTrip = migrateTripSettlementData(trip);

      _setTripid(tripid);
      setTripName(migratedTrip.tripName);
      setTotalBudget(
        migratedTrip.totalBudget
          ? migratedTrip.totalBudget.toString()
          : MAX_JS_NUMBER.toString(),
      );
      setTripCurrency(migratedTrip.tripCurrency);
      // negative Numbers are not allowed
      if (Number(migratedTrip.dailyBudget) < 0) {
        setdailyBudget("0.0001");
      } else {
        setdailyBudget(migratedTrip.dailyBudget.toString());
      }
      setStartDate(migratedTrip.startDate);
      setEndDate(migratedTrip.endDate);
      setIsPaid(migratedTrip.isPaid ?? isPaidString.notPaid);
      setIsPaidDate(migratedTrip.isPaidDate);
      setIsPaidTimestamp(migratedTrip.isPaidTimestamp);
      setTotalSumTrip(migratedTrip.totalSum);
      setIsLoading(false);
      setIsDynamicDailyBudget(migratedTrip.isDynamicDailyBudget);
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
    },
    [travellers],
  );

  const setTotalSum = useCallback((amount: number) => {
    setTotalSumTrip(amount);
  }, []);

  const fetchAndSetCurrentTrip = useCallback(
    async (tripid: string) => {
      if (!tripid) return;
      const { isFastEnough } = await isConnectionFastEnough();
      if (!isFastEnough) return;
      try {
        const trip: TripData = await fetchTrip(tripid);
        if (!trip) throw new Error("no trip found");
        trip.tripid = tripid;

        // Migrate trip data from old settlement system
        const migratedTrip = migrateTripSettlementData(trip);

        // Avoid unnecessary updates if trip hasn't changed
        if (
          tripid === getcurrentTrip().tripid &&
          migratedTrip.totalSum === getcurrentTrip().totalSum &&
          migratedTrip.tripName === getcurrentTrip().tripName
        ) {
          return migratedTrip;
        }

        await setCurrentTrip(tripid, migratedTrip);

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
    },
    [setCurrentTrip],
  );

  const fetchAndSettleCurrentTrip = useCallback(async () => {
    try {
      const trip = await fetchTrip(tripid);
      trip.isPaid = isPaidString.paid;
      const now = Date.now();
      trip.isPaidTimestamp = now;
      const today = new Date();
      trip.isPaidDate = today.toISOString();
      await setCurrentTrip(tripid, trip);
      await saveTripDataInStorage(trip);
      await updateTrip(tripid, trip);
    } catch (error) {
      safeLogError(error);
      throw error;
    }
  }, [tripid, setCurrentTrip]);

  const setTripUnsettled = useCallback(async () => {
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
  }, [tripid, setCurrentTrip]);

  const getcurrentTrip = useCallback(() => {
    const curTripData: TripData = {
      tripid: tripid,
      tripName: tripName,
      totalBudget: totalBudget,
      dailyBudget: dailyBudget,
      tripCurrency: tripCurrency,
      totalSum: totalSum,
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
  }, [
    tripid,
    tripName,
    totalBudget,
    dailyBudget,
    tripCurrency,
    totalSum,
    isPaid,
    isPaidDate,
    isPaidTimestamp,
    progress,
    startDate,
    endDate,
    travellers,
    isDynamicDailyBudget,
  ]);

  const _setTripid = useCallback((tripid: string) => {
    setTripid(tripid);
  }, []);

  function addTrip() {}
  function deleteTrip() {}

  const saveTripDataInStorage = useCallback(async (tripData: TripData) => {
    // cut away the trip.expenses array
    tripData.expenses = [];
    setMMKVObject(MMKV_KEYS.CURRENT_TRIP, tripData);
  }, []);

  const loadTripDataFromStorage = useCallback(async () => {
    const tripData: TripData = getMMKVObject(MMKV_KEYS.CURRENT_TRIP);
    if (tripData) {
      // Migrate trip data from old settlement system
      const migratedTrip = migrateTripSettlementData(tripData);

      setTripName(migratedTrip.tripName);
      setTotalBudget(
        migratedTrip.totalBudget
          ? migratedTrip.totalBudget.toString()
          : MAX_JS_NUMBER.toString(),
      );

      setTripCurrency(migratedTrip.tripCurrency);
      setdailyBudget(migratedTrip.dailyBudget.toString());
      setIsPaid(migratedTrip.isPaid ?? isPaidString.notPaid);
      setIsPaidDate(migratedTrip.isPaidDate ?? "");
      setIsPaidTimestamp(migratedTrip.isPaidTimestamp);
      setTotalSumTrip(migratedTrip.totalSum ?? 0);
      setStartDate(migratedTrip.startDate ?? "");
      setEndDate(migratedTrip.endDate ?? "");
      try {
        await loadTravellersFromStorage();
      } catch (error) {
        safeLogError(error);
      }
      setIsLoading(false);

      // If migration occurred, save migrated trip back to storage
      if (
        tripData.isPaidDate &&
        !tripData.isPaidTimestamp &&
        migratedTrip.isPaidTimestamp
      ) {
        await saveTripDataInStorage(migratedTrip);
      }

      return migratedTrip;
    } else {
      setIsLoading(false);
    }
  }, []);

  const saveTravellersInStorage = useCallback(async (travellers) => {
    await asyncStoreSetObject("currentTravellers", travellers);
  }, []);

  const loadTravellersFromStorage = useCallback(async (): Promise<
    Traveller[]
  > => {
    const travellers = await asyncStoreGetObject("currentTravellers");
    if (travellers) {
      setTravellers(travellers);
    }
    return travellers;
  }, []);

  const value = useMemo(
    () => ({
      tripid: tripid,
      tripName: tripName,
      totalBudget: totalBudget,
      dailyBudget: dailyBudget,
      setdailyBudget: setdailyBudget,
      tripCurrency: tripCurrency,
      totalSum: totalSum,
      tripProgress: progress,
      startDate: startDate,
      endDate: endDate,
      refresh: refresh,
      refreshState: refreshState,
      setTripProgress: setTripProgress,
      travellers: travellers,
      fetchAndSetTravellers: fetchAndSetTravellers,
      setTotalSum: setTotalSum,
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
    }),
    [
      tripid,
      tripName,
      totalBudget,
      dailyBudget,
      tripCurrency,
      totalSum,
      progress,
      startDate,
      endDate,
      refresh,
      refreshState,
      setTripProgress,
      travellers,
      fetchAndSetTravellers,
      setTotalSum,
      _setTripid,
      getcurrentTrip,
      setCurrentTrip,
      fetchAndSetCurrentTrip,
      saveTripDataInStorage,
      loadTripDataFromStorage,
      saveTravellersInStorage,
      loadTravellersFromStorage,
      fetchAndSettleCurrentTrip,
      setTripUnsettled,
      isPaid,
      isPaidDate,
      isPaidTimestamp,
      isLoading,
      isDynamicDailyBudget,
    ],
  );

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export default TripContextProvider;

TripContextProvider.propTypes = {
  children: PropTypes.node,
};
