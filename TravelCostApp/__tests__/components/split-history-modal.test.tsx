import * as React from "react";
import { Dimensions, FlatList, StyleSheet } from "react-native";
import { fireEvent, waitFor, within } from "@testing-library/react-native";

jest.mock("../../util/http", () => ({
  fetchSplitHistoryPage: jest.fn(),
  SPLIT_HISTORY_PAGE_SIZE: 20,
}));
jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(async () => {}),
  ImpactFeedbackStyle: { Light: "Light" },
}));

import LayoutContextProvider from "../../store/layout-context";
import SplitHistoryModal from "../../components/SplitSummary/SplitHistoryModal";
import { fetchSplitHistoryPage } from "../../util/http";
import type { SplitHistoryEntry, SplitHistoryKind } from "../../util/split-history";
import { renderWithAppProviders } from "../fixtures/app-providers";

const fetchPage = fetchSplitHistoryPage as jest.Mock;

const entry = (
  n: number,
  kind: SplitHistoryKind = "added",
  description = `Expense ${n}`
): SplitHistoryEntry => ({
  id: String(1_000 + n).padStart(13, "0") + "-abc123",
  kind,
  description,
  byUid: "u1",
  byName: "Alice",
  timestamp: Date.UTC(2026, 0, 15, 12, n),
  tripCurrency: "EUR",
  balanceChanges: [
    { userName: "Alice", amount: 12.4 },
    { userName: "Bob", amount: -12.4 },
  ],
});

const newestFirst = (from: number, count: number) =>
  Array.from({ length: count }, (_, i) => entry(from - i));

/** Entries the list holds (the list only paints a window of them). */
const listedIds = (screen: ReturnType<typeof renderModal>): string[] =>
  screen.UNSAFE_getByType(FlatList).props.data.map((e: SplitHistoryEntry) => e.id);

function renderModal(props: Record<string, unknown> = {}, size = { width: 390, height: 844 }) {
  jest.spyOn(Dimensions, "get").mockReturnValue({
    width: size.width,
    height: size.height,
    scale: 3,
    fontScale: 1,
  });
  return renderWithAppProviders(
    <LayoutContextProvider>
      <SplitHistoryModal isVisible onClose={jest.fn()} tripid="t1" {...props} />
    </LayoutContextProvider>,
    {
      wrapNavigation: false,
      orientation: {
        isPortrait: size.height > size.width,
        isLandscape: size.width > size.height,
        isTablet: size.width >= 768,
      },
    }
  );
}

afterEach(() => jest.restoreAllMocks());

beforeEach(() => fetchPage.mockReset());

describe("SplitHistoryModal", () => {
  it("lists what happened, who, and the per-Nomad Balance change in Trip currency", async () => {
    fetchPage.mockResolvedValueOnce({ entries: [entry(1, "added", "Dinner")], hasMore: false });
    const screen = renderModal();

    const row = await screen.findByTestId(`split-history-entry-${entry(1).id}`);
    expect(within(row).getByText("Expense added")).toBeTruthy();
    expect(within(row).getByText("Dinner")).toBeTruthy();
    expect(within(row).getByText(/by Alice/)).toBeTruthy();
    expect(within(row).getByText(/Alice \+€12\.40/)).toBeTruthy();
    expect(within(row).getByText(/Bob (−|-)€12\.40/)).toBeTruthy();
  });

  it("labels every kind of change", async () => {
    const kinds: [SplitHistoryKind, string][] = [
      ["added", "Expense added"],
      ["edited", "Expense edited"],
      ["deleted", "Expense deleted"],
      ["undone", "Delete undone"],
      ["paidBack", "Paid back"],
      ["settlement", "Settlement"],
    ];
    fetchPage.mockResolvedValueOnce({
      entries: kinds.map(([kind], i) => entry(i + 1, kind)),
      hasMore: false,
    });
    const screen = renderModal();

    for (const [, label] of kinds) {
      expect(await screen.findByText(label)).toBeTruthy();
    }
  });

  it("shows an empty state saying history starts now, with Nomad wording", async () => {
    fetchPage.mockResolvedValueOnce({ entries: [], hasMore: false });
    const screen = renderModal();

    const empty = await screen.findByTestId("split-history-empty");
    expect(within(empty).getByText(/History starts now/)).toBeTruthy();
    expect(within(empty).getByText(/nomads/)).toBeTruthy();
    expect(screen.queryByText(/traveller/i)).toBeNull();
  });

  it("loads the first page of 20, then the next page on Load more", async () => {
    fetchPage
      .mockResolvedValueOnce({ entries: newestFirst(45, 20), hasMore: true })
      .mockResolvedValueOnce({ entries: newestFirst(25, 20), hasMore: true });
    const screen = renderModal();

    await screen.findByText("Expense 45");
    expect(screen.getAllByTestId(/^split-history-entry-/)).toHaveLength(20);
    expect(listedIds(screen)).toHaveLength(20);
    expect(fetchPage).toHaveBeenLastCalledWith("t1", { beforeId: undefined });

    fireEvent.press(screen.getByTestId("split-history-load-more"));

    await waitFor(() => expect(listedIds(screen)).toHaveLength(40));
    expect(fetchPage).toHaveBeenLastCalledWith("t1", { beforeId: entry(26).id });
    expect(listedIds(screen)[20]).toBe(entry(25).id);
  });

  it("hides Load more once the oldest entry is reached", async () => {
    fetchPage
      .mockResolvedValueOnce({ entries: newestFirst(25, 20), hasMore: true })
      .mockResolvedValueOnce({ entries: newestFirst(5, 5), hasMore: false });
    const screen = renderModal();

    await screen.findByText("Expense 25");
    fireEvent.press(screen.getByTestId("split-history-load-more"));
    await waitFor(() => expect(listedIds(screen)).toHaveLength(25));

    expect(screen.queryByTestId("split-history-load-more")).toBeNull();
  });

  it("also loads the next page when the list reaches its end (infinite scroll)", async () => {
    fetchPage
      .mockResolvedValueOnce({ entries: newestFirst(45, 20), hasMore: true })
      .mockResolvedValueOnce({ entries: newestFirst(25, 20), hasMore: false });
    const screen = renderModal();
    await screen.findByText("Expense 45");

    fireEvent(screen.getByTestId("split-history-list"), "onEndReached");
    fireEvent(screen.getByTestId("split-history-list"), "onEndReached");

    await waitFor(() => expect(listedIds(screen)).toHaveLength(40));
    expect(fetchPage).toHaveBeenCalledTimes(2);
  });

  it("shows an error with a retry when loading fails", async () => {
    fetchPage.mockRejectedValueOnce(new Error("offline"));
    fetchPage.mockResolvedValueOnce({ entries: [entry(1)], hasMore: false });
    const screen = renderModal();

    await screen.findByText("Could not load the change history.");
    fireEvent.press(screen.getByTestId("split-history-load-more"));

    await screen.findByText("Expense 1");
  });

  it("does not fetch while closed", () => {
    renderModal({ isVisible: false });
    expect(fetchPage).not.toHaveBeenCalled();
  });

  describe("Ranged expense entries", () => {
    const day = (d: number) => `2026-01-${String(d).padStart(2, "0")}`;
    const rangedEntry = (n: number, extra: Partial<SplitHistoryEntry> = {}): SplitHistoryEntry => ({
      ...entry(n, "edited", "Rent"),
      balanceChanges: [
        { userName: "Alice", amount: 30 },
        { userName: "Bob", amount: -30 },
      ],
      range: { rangeId: "r1", startDate: day(1), endDate: day(3) },
      days: [1, 2, 3].map((d) => ({
        date: day(d),
        balanceChanges: [
          { userName: "Alice", amount: 10 },
          { userName: "Bob", amount: -10 },
        ],
      })),
      ...extra,
    });

    it("shows a grouped change as one row with the range and combined Balance change, days collapsed", async () => {
      fetchPage.mockResolvedValueOnce({ entries: [rangedEntry(1)], hasMore: false });
      const screen = renderModal();

      const row = await screen.findByTestId(`split-history-entry-${entry(1).id}`);
      expect(within(row).getByText("Rent")).toBeTruthy();
      expect(within(row).getByText(/Jan 1, 2026 – Jan 3, 2026/)).toBeTruthy();
      expect(within(row).getByText(/Alice \+€30/)).toBeTruthy();
      expect(within(row).queryByTestId(`split-history-day-${entry(1).id}-${day(2)}`)).toBeNull();
      expect(screen.getAllByTestId(/^split-history-entry-/)).toHaveLength(1);
    });

    it("expands to the per-day lines, which add up to the group total", async () => {
      fetchPage.mockResolvedValueOnce({ entries: [rangedEntry(1)], hasMore: false });
      const screen = renderModal();
      await screen.findByTestId(`split-history-entry-${entry(1).id}`);

      fireEvent.press(screen.getByTestId(`split-history-toggle-${entry(1).id}`));

      for (const d of [1, 2, 3]) {
        const line = screen.getByTestId(`split-history-day-${entry(1).id}-${day(d)}`);
        expect(within(line).getByText(/Alice \+€10/)).toBeTruthy();
      }
      expect(screen.getByText("Hide days")).toBeTruthy();

      fireEvent.press(screen.getByTestId(`split-history-toggle-${entry(1).id}`));
      expect(screen.queryByTestId(`split-history-day-${entry(1).id}-${day(1)}`)).toBeNull();
    });

    it("labels a single-day edit with the range it belongs to and offers no day lines", async () => {
      fetchPage.mockResolvedValueOnce({
        entries: [rangedEntry(1, { days: undefined })],
        hasMore: false,
      });
      const screen = renderModal();

      const row = await screen.findByTestId(`split-history-entry-${entry(1).id}`);
      expect(within(row).getByText(/Day of Jan 1, 2026 – Jan 3, 2026/)).toBeTruthy();
      expect(screen.queryByTestId(`split-history-toggle-${entry(1).id}`)).toBeNull();
    });

    it("counts a grouped row as one of the page's 20 rows", async () => {
      const grouped = Array.from({ length: 20 }, (_, i) => rangedEntry(45 - i));
      fetchPage.mockResolvedValueOnce({ entries: grouped, hasMore: true });
      const screen = renderModal();

      await screen.findByTestId(`split-history-entry-${entry(45).id}`);
      expect(listedIds(screen)).toHaveLength(20);
      expect(screen.getByTestId("split-history-load-more")).toBeTruthy();
    });
  });

  it("caps the modal width on tablets and fills the phone width", async () => {
    fetchPage.mockResolvedValue({ entries: [entry(1)], hasMore: false });
    const tablet = renderModal({}, { width: 1194, height: 834 });
    await tablet.findByText("Expense 1");
    const tabletStyle = StyleSheet.flatten(
      tablet.getByTestId("split-history-content").props.style
    ) as Record<string, unknown>;
    expect(tabletStyle.maxWidth).toBe(600);

    const phone = renderModal({}, { width: 390, height: 844 });
    await phone.findByText("Expense 1");
    const phoneStyle = StyleSheet.flatten(
      phone.getByTestId("split-history-content").props.style
    ) as Record<string, unknown>;
    expect(phoneStyle.width).toBe("100%");
  });
});
