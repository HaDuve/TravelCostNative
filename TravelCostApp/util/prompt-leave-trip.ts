import { Alert } from "react-native";

import { i18n } from "../i18n/i18n";
import safeLogError from "./error";
import {
  leaveConfirmMessage,
  resolveLeaverOpenBalances,
  type ResolveLeaverOpenBalancesDeps,
} from "./leave-trip";
import { planTripLeave } from "./plan-trip-leave";
import type { Traveller } from "./traveler";

export type PromptLeaveTripInput = {
  isConnected: boolean;
  tripid: string;
  uid: string;
  tripHistory: readonly string[];
  activeTripId: string | null | undefined;
  getTravellers: (tripid: string) => Promise<Traveller[]>;
  openBalancesDeps: ResolveLeaverOpenBalancesDeps;
  onConfirm: () => void;
};

/**
 * Shared Leave trip confirm dialog (TripForm button + My Trips swipe).
 * Online-only; respects last-trip guard (no dialog when not allowed).
 */
export async function promptLeaveTrip(
  input: PromptLeaveTripInput
): Promise<void> {
  if (!input.isConnected) {
    Alert.alert(i18n.t("noConnection"), i18n.t("leaveTripConnectRequired"));
    return;
  }

  try {
    const roster = await input.getTravellers(input.tripid);
    const openBalances = await resolveLeaverOpenBalances(
      input.tripid,
      input.uid,
      roster,
      input.openBalancesDeps
    );
    const plan = planTripLeave({
      tripHistory: input.tripHistory,
      roster,
      openBalances,
      activeTripId: input.activeTripId,
      tripid: input.tripid,
    });

    if (!plan.allowed) {
      return;
    }

    Alert.alert(
      i18n.t("leaveTrip"),
      leaveConfirmMessage(plan.warnings),
      [
        {
          text: i18n.t("cancel"),
          style: "cancel",
        },
        {
          text: i18n.t("leaveTrip"),
          style: "destructive",
          onPress: input.onConfirm,
        },
      ],
      { cancelable: false }
    );
  } catch (error) {
    safeLogError(error);
    Alert.alert(i18n.t("error"), i18n.t("error2"));
  }
}
