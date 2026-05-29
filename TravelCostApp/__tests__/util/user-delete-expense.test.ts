jest.mock("react-native-toast-message", () => ({
  show: jest.fn(),
  hide: jest.fn(),
}));

jest.mock("../../util/offline-queue", () => ({
  deleteExpenseOnlineOffline: jest.fn(async () => {}),
  restoreExpenseOnlineOffline: jest.fn(async () => {}),
}));

jest.mock("../../util/http", () => ({
  touchAllTravelers: jest.fn(async () => {}),
}));

import Toast from "react-native-toast-message";
import { i18n } from "../../i18n/i18n";
import {
  deleteExpenseOnlineOffline,
  restoreExpenseOnlineOffline,
} from "../../util/offline-queue";
import { touchAllTravelers } from "../../util/http";
import {
  UNDO_DELETE_WINDOW_MS,
  collectUserDeleteTargets,
  deleteUserExpenses,
  undoUserExpenseDelete,
} from "../../util/user-delete-expense";
import type { ExpenseData } from "../../util/expense";

describe("deleteUserExpenses", () => {
  const expenseCtx = {
    deleteExpense: jest.fn(),
    restoreExpenses: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("soft-deletes locally, syncs, then shows a deletedExpense toast with undo", async () => {
    const promise = deleteUserExpenses({
      tripid: "trip-1",
      targets: [{ tripid: "trip-1", uid: "u1", id: "exp-1" }],
      isOnline: true,
      expenseCtx,
      afterSync: () => touchAllTravelers("trip-1", true),
    });

    await promise;

    expect(expenseCtx.deleteExpense).toHaveBeenCalledWith("exp-1");
    expect(deleteExpenseOnlineOffline).toHaveBeenCalledWith(
      {
        type: "delete",
        expense: { tripid: "trip-1", uid: "u1", id: "exp-1" },
      },
      true,
    );
    expect(touchAllTravelers).toHaveBeenCalledWith("trip-1", true);

    const deletedToastCall = (Toast.show as jest.Mock).mock.calls.find(
      ([args]) => args.type === "deletedExpense",
    );
    expect(deletedToastCall).toBeDefined();
    expect(deletedToastCall[0].visibilityTime).toBe(UNDO_DELETE_WINDOW_MS);
    expect(deletedToastCall[0].props?.onUndo).toEqual(expect.any(Function));
  });

  it("does not show undo toast when showUndoToast is false", async () => {
    await deleteUserExpenses({
      tripid: "trip-1",
      targets: [{ tripid: "trip-1", uid: "u1", id: "exp-1" }],
      isOnline: true,
      expenseCtx,
      showUndoToast: false,
    });

    expect(expenseCtx.deleteExpense).toHaveBeenCalledWith("exp-1");
    const deletedToastCall = (Toast.show as jest.Mock).mock.calls.find(
      ([args]) => args.type === "deletedExpense",
    );
    expect(deletedToastCall).toBeUndefined();
  });

  it("skips delete and undo toast when there are no targets", async () => {
    await deleteUserExpenses({
      tripid: "trip-1",
      targets: [],
      isOnline: true,
      expenseCtx,
    });

    expect(expenseCtx.deleteExpense).not.toHaveBeenCalled();
    expect(deleteExpenseOnlineOffline).not.toHaveBeenCalled();
    const deletedToastCall = (Toast.show as jest.Mock).mock.calls.find(
      ([args]) => args.type === "deletedExpense",
    );
    expect(deletedToastCall).toBeUndefined();
  });

  it("shows undo toast when afterSync fails after deletes succeed", async () => {
    (touchAllTravelers as jest.Mock).mockRejectedValueOnce(
      new Error("touch failed"),
    );

    await deleteUserExpenses({
      tripid: "trip-1",
      targets: [{ tripid: "trip-1", uid: "u1", id: "exp-1" }],
      isOnline: true,
      expenseCtx,
      afterSync: () => touchAllTravelers("trip-1", true),
    });

    expect(expenseCtx.deleteExpense).toHaveBeenCalledWith("exp-1");
    expect(Toast.hide).toHaveBeenCalled();
    const deletedToastCall = (Toast.show as jest.Mock).mock.calls.find(
      ([args]) => args.type === "deletedExpense",
    );
    expect(deletedToastCall).toBeDefined();
  });
});

describe("undoUserExpenseDelete", () => {
  const expenseCtx = {
    deleteExpense: jest.fn(),
    restoreExpenses: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("restores every expense from the delete action when undo is pressed in time", async () => {
    await deleteUserExpenses({
      tripid: "trip-1",
      targets: [
        { tripid: "trip-1", uid: "u1", id: "exp-1" },
        { tripid: "trip-1", uid: "u2", id: "exp-2" },
      ],
      isOnline: true,
      expenseCtx,
      afterSync: () => touchAllTravelers("trip-1", true),
    });

    const deletedToastCall = (Toast.show as jest.Mock).mock.calls.find(
      ([args]) => args.type === "deletedExpense",
    );
    const { actionId, onUndo } = deletedToastCall![0].props;

    await onUndo();

    expect(restoreExpenseOnlineOffline).toHaveBeenCalledTimes(2);
    expect(expenseCtx.restoreExpenses).toHaveBeenCalledWith(["exp-1", "exp-2"]);
    expect(actionId).toBeDefined();
  });

  it("shows expired copy when undo is pressed after the window", async () => {
    await deleteUserExpenses({
      tripid: "trip-1",
      targets: [{ tripid: "trip-1", uid: "u1", id: "exp-1" }],
      isOnline: true,
      expenseCtx,
    });

    const { actionId } = (Toast.show as jest.Mock).mock.calls.find(
      ([args]) => args.type === "deletedExpense",
    )![0].props;

    jest.advanceTimersByTime(UNDO_DELETE_WINDOW_MS + 1);

    await undoUserExpenseDelete({
      actionId,
      isOnline: true,
      expenseCtx,
    });

    expect(restoreExpenseOnlineOffline).not.toHaveBeenCalled();
    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "error",
        text2: i18n.t("toastUndoDeleteExpired"),
      }),
    );
  });
});

describe("dismissing the deleted expense toast", () => {
  const expenseCtx = {
    deleteExpense: jest.fn(),
    restoreExpenses: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("expires undo when the toast is dismissed before the window ends", async () => {
    await deleteUserExpenses({
      tripid: "trip-1",
      targets: [{ tripid: "trip-1", uid: "u1", id: "exp-1" }],
      isOnline: true,
      expenseCtx,
    });

    const deletedToastCall = (Toast.show as jest.Mock).mock.calls.find(
      ([args]) => args.type === "deletedExpense",
    )!;
    const { actionId, onHide } = deletedToastCall[0];
    onHide();

    await undoUserExpenseDelete({
      actionId,
      isOnline: true,
      expenseCtx,
    });

    expect(restoreExpenseOnlineOffline).not.toHaveBeenCalled();
  });
});

describe("collectUserDeleteTargets", () => {
  it("expands a ranged selection to every day in the range for one undo scope", () => {
    const tripid = "trip-1";
    const expenses = [
      { id: "e1", uid: "u1", rangeId: "r1", isDeleted: false },
      { id: "e2", uid: "u1", rangeId: "r1", isDeleted: false },
      { id: "e3", uid: "u1", rangeId: "r2", isDeleted: false },
    ] as ExpenseData[];

    const targets = collectUserDeleteTargets(tripid, expenses, ["e1"]);

    expect(targets).toEqual(
      expect.arrayContaining([
        { tripid, uid: "u1", id: "e1" },
        { tripid, uid: "u1", id: "e2" },
      ]),
    );
    expect(targets).toHaveLength(2);
  });
});

describe("pending undo replacement", () => {
  const expenseCtx = {
    deleteExpense: jest.fn(),
    restoreExpenses: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("replaces the first undo scope when a second delete happens within the window", async () => {
    await deleteUserExpenses({
      tripid: "trip-1",
      targets: [{ tripid: "trip-1", uid: "u1", id: "exp-a" }],
      isOnline: true,
      expenseCtx,
    });
    const firstActionId = (Toast.show as jest.Mock).mock.calls.find(
      ([args]) => args.type === "deletedExpense",
    )![0].props.actionId;

    await deleteUserExpenses({
      tripid: "trip-1",
      targets: [{ tripid: "trip-1", uid: "u1", id: "exp-b" }],
      isOnline: true,
      expenseCtx,
    });
    const secondActionId = (Toast.show as jest.Mock).mock.calls
      .filter(([args]) => args.type === "deletedExpense")
      .at(-1)![0].props.actionId;

    expect(secondActionId).not.toBe(firstActionId);

    await undoUserExpenseDelete({
      actionId: firstActionId,
      isOnline: true,
      expenseCtx,
    });

    expect(restoreExpenseOnlineOffline).not.toHaveBeenCalled();
    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({ type: "error" }),
    );
  });
});
