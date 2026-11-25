import * as React from "react";
import { waitFor } from "@testing-library/react-native";

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
import type { SplitHistoryEntry } from "../../util/split-history";
import { renderWithAppProviders } from "../fixtures/app-providers";

const fetchPage = fetchSplitHistoryPage as jest.Mock;

const entry = (n: number): SplitHistoryEntry => ({
  id: String(1_000 + n).padStart(13, "0") + "-abc123",
  kind: "added",
  description: `Expense ${n}`,
  byUid: "u1",
  byName: "Alice",
  timestamp: Date.UTC(2026, 0, 15, 12, n),
  tripCurrency: "EUR",
  balanceChanges: [
    { userName: "Alice", amount: 12.4 + n },
    { userName: "Bob", amount: -(12.4 + n) },
  ],
});

/**
 * Opening the modal must not stall the JS thread: Intl formatters are slow to
 * construct on Hermes, so a page of rows may build only a handful, not one (or
 * more) per row.
 */
describe("SplitHistoryModal open cost", () => {
  it("constructs a bounded number of Intl formatters for a full page", async () => {
    fetchPage.mockResolvedValueOnce({
      entries: Array.from({ length: 20 }, (_, i) => entry(20 - i)),
      hasMore: true,
    });
    const nf = jest.spyOn(Intl, "NumberFormat");
    const dtf = jest.spyOn(Intl, "DateTimeFormat");
    const tls = jest.spyOn(Date.prototype, "toLocaleString");
    const tlds = jest.spyOn(Date.prototype, "toLocaleDateString");

    const screen = renderWithAppProviders(
      <LayoutContextProvider>
        <SplitHistoryModal isVisible onClose={jest.fn()} tripid="t1" />
      </LayoutContextProvider>,
      { wrapNavigation: false },
    );
    await waitFor(() => expect(screen.getByText("Expense 20")).toBeTruthy());

    const constructed =
      nf.mock.calls.length +
      dtf.mock.calls.length +
      tls.mock.calls.length +
      tlds.mock.calls.length;
    // eslint-disable-next-line no-console
    console.log(
      `[open-cost] NumberFormat=${nf.mock.calls.length} DateTimeFormat=${dtf.mock.calls.length} toLocaleString=${tls.mock.calls.length} toLocaleDateString=${tlds.mock.calls.length}`,
    );
    expect(constructed).toBeLessThanOrEqual(6);
  });
});
