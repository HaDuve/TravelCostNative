import Toast from "react-native-toast-message";

import { i18n } from "../i18n/i18n";
import safeLogError from "./error";
import {
  resolveLeaverOpenBalances,
  type LeaveTripDeps,
  type LeaveTripResult,
  type ResolveLeaverOpenBalancesDeps,
} from "./leave-trip";
import type { Traveller } from "./traveler";

export type PerformLeaveTripUiInput = {
  tripid: string;
  uid: string;
  tripHistory: readonly string[];
  getTravellers: (tripid: string) => Promise<Traveller[]>;
  openBalancesDeps: ResolveLeaverOpenBalancesDeps;
  leaveTrip: (
    tripid: string,
    deps: Omit<LeaveTripDeps, "activeTripId">
  ) => Promise<LeaveTripResult>;
  removeFromTripHistoryLocal: LeaveTripDeps["removeFromTripHistoryLocal"];
  restoreTripHistoryLocal: LeaveTripDeps["restoreTripHistoryLocal"];
  activate: NonNullable<LeaveTripDeps["activate"]>;
};

/**
 * Shared Leave trip accept path (loading toast + leaveTrip orchestration).
 * Used by TripForm and My Trips swipe after confirm.
 */
export async function performLeaveTripUi(
  input: PerformLeaveTripUiInput
): Promise<boolean> {
  Toast.show({
    type: "loading",
    text1: i18n.t("toastSaving1"),
    text2: i18n.t("toastSaving2"),
    autoHide: false,
  });

  try {
    const roster = await input.getTravellers(input.tripid);
    const openBalances = await resolveLeaverOpenBalances(
      input.tripid,
      input.uid,
      roster,
      input.openBalancesDeps
    );
    const result = await input.leaveTrip(input.tripid, {
      uid: input.uid,
      tripHistory: input.tripHistory,
      getTravellers: input.getTravellers,
      openBalances,
      removeFromTripHistoryLocal: input.removeFromTripHistoryLocal,
      restoreTripHistoryLocal: input.restoreTripHistoryLocal,
      activate: input.activate,
    });

    if (!result.performed) {
      Toast.hide();
      Toast.show({
        text1: i18n.t("toastSavingError1"),
        text2: i18n.t("error2"),
        type: "error",
      });
      return false;
    }
    // Plain leave: leaveTrip shows Undo toast. Cascade-delete: no Undo.
    return true;
  } catch (error) {
    safeLogError(error);
    Toast.hide();
    Toast.show({
      text1: i18n.t("toastSavingError1"),
      text2: i18n.t("error2"),
      type: "error",
    });
    return false;
  }
}
