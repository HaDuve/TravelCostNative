jest.mock("axios", () => {
  const get = jest.fn();
  return {
    __esModule: true,
    default: {
      get,
      put: jest.fn(),
      defaults: {},
      interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
    },
  };
});
jest.mock("../../util/authed-request", () => ({
  withAuthToken: jest.fn(async (_n: string, fn: (t: string) => unknown) => fn("tok")),
}));

import axios from "axios";
import { AuthFailureError } from "../../util/auth-failure";
import {
  appendSplitHistoryEntry,
  fetchSplitHistoryPage,
  SPLIT_HISTORY_PAGE_SIZE,
} from "../../util/http";
import type { SplitHistoryEntry } from "../../util/split-history";

const entry = (n: number): SplitHistoryEntry => ({
  id: String(1_000 + n).padStart(13, "0") + "-abc123",
  kind: "added",
  description: `Expense ${n}`,
  byUid: "u1",
  byName: "Alice",
  timestamp: 1_000 + n,
  tripCurrency: "EUR",
  balanceChanges: [
    { userName: "Alice", amount: 1 },
    { userName: "Bob", amount: -1 },
  ],
});

/** RTDB `limitToLast(n)` ordered by key, optionally `endAt(key)` (inclusive). */
function serve(all: SplitHistoryEntry[]) {
  (axios.get as jest.Mock).mockImplementation(async (url: string) => {
    const q = new URL(url).searchParams;
    const limit = Number(q.get("limitToLast"));
    const endAt = q.has("endAt") ? JSON.parse(q.get("endAt") as string) : undefined;
    const sorted = [...all]
      .filter((e) => endAt === undefined || e.id <= endAt)
      .sort((a, b) => (a.id < b.id ? -1 : 1))
      .slice(-limit);
    return { data: sorted.length ? Object.fromEntries(sorted.map((e) => [e.id, e])) : null };
  });
}

describe("fetchSplitHistoryPage", () => {
  const all = Array.from({ length: 45 }, (_, i) => entry(i + 1));
  beforeEach(() => serve(all));

  it("returns the newest page first, about 20 entries, with a way to load more", async () => {
    const page = await fetchSplitHistoryPage("trip-1");

    expect(SPLIT_HISTORY_PAGE_SIZE).toBe(20);
    expect(page.entries).toHaveLength(20);
    expect(page.entries[0].description).toBe("Expense 45");
    expect(page.entries[19].description).toBe("Expense 26");
    expect(page.hasMore).toBe(true);
  });

  it("loads the next page after the last seen entry, without overlap, until exhausted", async () => {
    const first = await fetchSplitHistoryPage("trip-1");
    const second = await fetchSplitHistoryPage("trip-1", {
      beforeId: first.entries[19].id,
    });
    const third = await fetchSplitHistoryPage("trip-1", {
      beforeId: second.entries[19].id,
    });

    expect(second.entries[0].description).toBe("Expense 25");
    expect(second.entries).toHaveLength(20);
    expect(second.hasMore).toBe(true);
    expect(third.entries.map((e) => e.description)).toEqual([
      "Expense 5",
      "Expense 4",
      "Expense 3",
      "Expense 2",
      "Expense 1",
    ]);
    expect(third.hasMore).toBe(false);
  });

  it("returns an empty page for a trip without history", async () => {
    serve([]);
    expect(await fetchSplitHistoryPage("trip-1")).toEqual({ entries: [], hasMore: false });
  });

  it("does not report more when the last page is exactly full", async () => {
    serve(all.slice(0, 20));
    const page = await fetchSplitHistoryPage("trip-1");
    expect(page.entries).toHaveLength(20);
    expect(page.hasMore).toBe(false);
  });
});

describe("appendSplitHistoryEntry", () => {
  it("puts the entry at its own id under the trip's history", async () => {
    (axios.put as jest.Mock).mockResolvedValue({});
    const e = entry(1);

    await appendSplitHistoryEntry("trip-1", e);

    expect((axios.put as jest.Mock).mock.calls[0][0]).toContain(`/splitHistory/trip-1/${e.id}.json`);
    expect((axios.put as jest.Mock).mock.calls[0][1]).toEqual(e);
  });

  it("treats a refusal as success when the entry already landed (create-only retry)", async () => {
    const { withAuthToken } = jest.requireMock("../../util/authed-request");
    const e = entry(1);
    withAuthToken.mockRejectedValueOnce(new AuthFailureError("appendSplitHistoryEntry"));
    (axios.get as jest.Mock).mockReset();
    (axios.get as jest.Mock).mockResolvedValueOnce({ data: e });

    await expect(appendSplitHistoryEntry("trip-1", e)).resolves.toBeUndefined();
    expect((axios.get as jest.Mock).mock.calls[0][0]).toContain(`/splitHistory/trip-1/${e.id}.json`);
  });

  it("surfaces a refusal when the entry did not land (expired token, undeployed rules)", async () => {
    const { withAuthToken } = jest.requireMock("../../util/authed-request");
    withAuthToken.mockRejectedValueOnce(new AuthFailureError("appendSplitHistoryEntry"));
    (axios.get as jest.Mock).mockResolvedValueOnce({ data: null });

    await expect(appendSplitHistoryEntry("trip-1", entry(1))).rejects.toThrow("AUTH-FAILURE");
  });

  it("lets network errors through so the Expense change is retried from the queue", async () => {
    (axios.put as jest.Mock).mockRejectedValue(new Error("Network Error"));

    await expect(appendSplitHistoryEntry("trip-1", entry(1))).rejects.toThrow("Network Error");
  });
});
