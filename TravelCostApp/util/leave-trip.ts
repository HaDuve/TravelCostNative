import Toast from "react-native-toast-message";
import { i18n } from "../i18n/i18n";
import {
  deleteTrip,
  putTravelerInTrip,
  removeTravelerFromTrip,
  removeTripFromHistory as removeTripFromHistoryRemote,
  storeTripHistory,
} from "./http";
import {
  activateTrip,
  type ActivateTripDeps,
} from "./activate-trip";
import type { ExpenseData, Split } from "./expense";
import {
  planTripLeave,
  type PlanTripLeaveResult,
  type TripLeaveWarning,
} from "./plan-trip-leave";
import { rollupOpenBalances } from "./split";
import type { Traveller } from "./traveler";

export const UNDO_LEAVE_WINDOW_MS = 8000;

/**
 * Open Balances that involve a Traveller (as debtor or who paid),
 * from the trip-wide rollup — used to feed `planTripLeave` warnings.
 */
export function openBalancesForTraveller(
  expenses: ExpenseData[],
  tripCurrency: string,
  isPaidTimestamp: number | undefined,
  travellerUserName: string
): Split[] {
  return rollupOpenBalances(expenses, tripCurrency, isPaidTimestamp).filter(
    (balance) =>
      balance.userName === travellerUserName ||
      balance.whoPaid === travellerUserName
  );
}

/** Confirm-dialog body for Leave trip: base copy plus optional open-Balance warning. */
export function leaveConfirmMessage(
  warnings: readonly TripLeaveWarning[]
): string {
  const base = warnings.includes("permanentDelete")
    ? i18n.t("leaveTripPermanentDeleteSure")
    : i18n.t("leaveTripSure");
  if (!warnings.includes("openBalances")) {
    return base;
  }
  return `${base}\n\n${i18n.t("leaveTripOpenBalancesWarning")}`;
}

export type ResolveLeaverOpenBalancesDeps = {
  activeTripId: string | null | undefined;
  activeExpenses: ExpenseData[];
  activeTripCurrency: string;
  activeIsPaidTimestamp: number | undefined;
  fallbackTripCurrency?: string;
  userNameFallback?: string;
  getAllExpenses: (
    tripid: string,
    uid: string
  ) => Promise<ExpenseData[] | null | undefined>;
  fetchTrip: (tripid: string) => Promise<{
    tripCurrency?: string;
    isPaidTimestamp?: number;
  } | null>;
};

/**
 * Resolve open Balances for the leaver on a trip: Active trip uses local
 * expenses; other trips fetch expenses + trip meta, then filter via rollup.
 */
export async function resolveLeaverOpenBalances(
  tripid: string,
  uid: string,
  roster: readonly Pick<Traveller, "uid" | "userName">[],
  deps: ResolveLeaverOpenBalancesDeps
): Promise<Split[]> {
  const leaverUserName =
    roster.find((traveller) => traveller.uid === uid)?.userName ??
    deps.userNameFallback;
  if (!leaverUserName) {
    return [];
  }

  if (tripid === deps.activeTripId) {
    return openBalancesForTraveller(
      deps.activeExpenses,
      deps.activeTripCurrency,
      deps.activeIsPaidTimestamp,
      leaverUserName
    );
  }

  const [expenses, trip] = await Promise.all([
    deps.getAllExpenses(tripid, uid),
    deps.fetchTrip(tripid),
  ]);
  return openBalancesForTraveller(
    expenses ?? [],
    trip?.tripCurrency ?? deps.fallbackTripCurrency ?? deps.activeTripCurrency,
    trip?.isPaidTimestamp,
    leaverUserName
  );
}

export type LeaveTripDeps = {
  uid: string;
  tripHistory: readonly string[];
  openBalances?: readonly unknown[];
  activeTripId: string | null | undefined;
  /** Authoritative Traveller roster for the trip being left. */
  getTravellers: (tripid: string) => Promise<Traveller[]>;
  /** Update Trip history state + local cache after a successful leave. */
  removeFromTripHistoryLocal: (tripid: string) => void;
  /** Restore full Trip history state + local cache after Undo. */
  restoreTripHistoryLocal: (tripHistory: readonly string[]) => void;
  /**
   * Active trip promotion deps (sans uid). Used when leaving the Active trip
   * so `nextActiveTripId` is promoted through `activateTrip`, and again on Undo
   * to restore the previously Active trip.
   */
  activate?: Omit<ActivateTripDeps, "uid">;
  /** False to skip Undo toast (e.g. tests that only assert leave writes). Default true. */
  showUndoToast?: boolean;
};

export type LeaveTripResult = PlanTripLeaveResult & {
  /** True when leave or cascade-delete writes ran. */
  performed: boolean;
  /** Trip name after Active trip promotion; null when no promotion ran. */
  promotedTripName: string | null;
};

type PendingUndoLeave = {
  actionId: string;
  expiresAt: number;
  tripid: string;
  uid: string;
  userName: string;
  previousTripHistory: string[];
  /** Set when leave promoted a new Active trip — Undo re-activates this id. */
  previousActiveTripId: string | null;
  activate?: Omit<ActivateTripDeps, "uid">;
  restoreTripHistoryLocal: (tripHistory: readonly string[]) => void;
};

let pendingUndoLeave: PendingUndoLeave | null = null;
let undoExpiryTimer: ReturnType<typeof setTimeout> | null = null;
let dismissToastClearsUndo = true;

export function clearPendingUndoLeave(): void {
  pendingUndoLeave = null;
  if (undoExpiryTimer) {
    clearTimeout(undoExpiryTimer);
    undoExpiryTimer = null;
  }
}

export function isUndoLeaveAvailable(actionId: string): boolean {
  if (!pendingUndoLeave || pendingUndoLeave.actionId !== actionId) {
    return false;
  }
  return Date.now() < pendingUndoLeave.expiresAt;
}

function registerPendingUndoLeave(
  pending: Omit<PendingUndoLeave, "actionId" | "expiresAt">
): string {
  clearPendingUndoLeave();
  dismissToastClearsUndo = true;
  const actionId = `${Date.now()}-${pending.tripid}-${pending.uid}`;
  const expiresAt = Date.now() + UNDO_LEAVE_WINDOW_MS;
  pendingUndoLeave = { ...pending, actionId, expiresAt };
  undoExpiryTimer = setTimeout(() => {
    clearPendingUndoLeave();
  }, UNDO_LEAVE_WINDOW_MS);
  return actionId;
}

function showLeftTripToast(
  actionId: string,
  text1: string,
  onUndo: () => Promise<void>
): void {
  const dismissUndoScope = () => {
    if (dismissToastClearsUndo && pendingUndoLeave?.actionId === actionId) {
      clearPendingUndoLeave();
    }
  };

  Toast.show({
    type: "deletedExpense",
    text1,
    text2: i18n.t("toastLeftTrip2"),
    visibilityTime: UNDO_LEAVE_WINDOW_MS,
    autoHide: true,
    onHide: () => {
      // Undo scope is cleared explicitly via onDismissUndo or the expiry timer.
    },
    props: { actionId, onUndo, onDismissUndo: dismissUndoScope },
  });
}

/**
 * Leave trip orchestration: plain leave (roster + Trip history + optional Undo)
 * or cascade-delete when the leaver is the last Traveller (DELETE trip; no Undo).
 * Active trip promotion runs before either write path when needed.
 */
export async function leaveTrip(
  tripid: string,
  deps: LeaveTripDeps
): Promise<LeaveTripResult> {
  const roster = await deps.getTravellers(tripid);
  const plan = planTripLeave({
    tripHistory: deps.tripHistory,
    roster,
    openBalances: deps.openBalances ?? [],
    activeTripId: deps.activeTripId,
    tripid,
  });

  if (!plan.allowed) {
    return { ...plan, performed: false, promotedTripName: null };
  }

  let promotedTripName: string | null = null;

  // Promote first when leaving the Active trip so a failed activateTrip does
  // not leave the User without a valid Active trip after leave/cascade writes.
  if (plan.nextActiveTripId) {
    if (!deps.activate) {
      throw new Error(
        "leaveTrip: activate deps required to promote Active trip"
      );
    }
    const { tripData } = await activateTrip(plan.nextActiveTripId, {
      uid: deps.uid,
      ...deps.activate,
    });
    promotedTripName = tripData.tripName ?? null;
  }

  if (plan.mode === "cascadeDelete") {
    const deleted = await deleteTrip(tripid);
    if (!deleted) {
      throw new Error("leaveTrip: cascade-delete failed");
    }
    await removeTripFromHistoryRemote(deps.uid, tripid);
    deps.removeFromTripHistoryLocal(tripid);
    Toast.hide();
    return {
      ...plan,
      performed: true,
      promotedTripName,
    };
  }

  const leaver = roster.find((t) => t.uid === deps.uid);
  if (!leaver?.userName) {
    throw new Error(
      "leaveTrip: Traveller roster entry with userName required for leave"
    );
  }
  const userName = leaver.userName;
  const previousTripHistory = [...deps.tripHistory];
  const previousActiveTripId = plan.nextActiveTripId ? tripid : null;

  await removeTravelerFromTrip(tripid, deps.uid);
  await removeTripFromHistoryRemote(deps.uid, tripid);
  deps.removeFromTripHistoryLocal(tripid);

  const result: LeaveTripResult = {
    ...plan,
    performed: true,
    promotedTripName,
  };

  if (deps.showUndoToast === false) {
    return result;
  }

  Toast.hide();

  const actionId = registerPendingUndoLeave({
    tripid,
    uid: deps.uid,
    userName,
    previousTripHistory,
    previousActiveTripId,
    activate: deps.activate,
    restoreTripHistoryLocal: deps.restoreTripHistoryLocal,
  });

  const toastText1 = plan.nextActiveTripId
    ? i18n.t("leaveTripNowShowing", {
        name: promotedTripName || i18n.t("trip"),
      })
    : i18n.t("toastLeftTrip1");

  showLeftTripToast(actionId, toastText1, () => {
    dismissToastClearsUndo = false;
    return undoLeaveTrip({ actionId });
  });

  return result;
}

export async function undoLeaveTrip({
  actionId,
}: {
  actionId: string;
}): Promise<void> {
  if (!isUndoLeaveAvailable(actionId)) {
    Toast.show({
      type: "error",
      text1: i18n.t("error"),
      text2: i18n.t("toastUndoLeaveExpired"),
    });
    return;
  }

  const pending = pendingUndoLeave!;
  clearPendingUndoLeave();
  Toast.hide();

  try {
    const restored = await putTravelerInTrip(pending.tripid, {
      uid: pending.uid,
      userName: pending.userName,
    });
    if (restored == null) {
      throw new Error("undoLeaveTrip: roster restore failed");
    }
    await storeTripHistory(pending.uid, pending.previousTripHistory);
    pending.restoreTripHistoryLocal(pending.previousTripHistory);

    if (pending.previousActiveTripId) {
      if (!pending.activate) {
        throw new Error(
          "undoLeaveTrip: activate deps required to restore Active trip"
        );
      }
      await activateTrip(pending.previousActiveTripId, {
        uid: pending.uid,
        ...pending.activate,
      });
    }
  } catch {
    Toast.show({
      type: "error",
      text1: i18n.t("error"),
      text2: i18n.t("error2"),
    });
  }
}
