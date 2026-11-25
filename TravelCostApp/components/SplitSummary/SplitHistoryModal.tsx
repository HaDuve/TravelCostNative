import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import PropTypes from "prop-types";

import AppModal from "../UI/AppModal";
import ActionRow from "../UI/ActionRow";
import ModalFrame from "../layout/ModalFrame";
import { GlobalStyles } from "../../constants/styles";
import { i18n } from "../../i18n/i18n";
import { useLayoutProfile } from "../../store/layout-context";
import {
  fetchSplitHistoryPage,
  SPLIT_HISTORY_PAGE_SIZE,
} from "../../util/http";
import safeLogError from "../../util/error";
import { dynamicScale } from "../../util/scalingUtil";
import { formatExpenseWithCurrency } from "../../util/string";
import { MODAL_MAX_WIDTH } from "../../util/modal-frame-layout";
import type {
  BalanceChange,
  SplitHistoryRange,
  SplitHistoryEntry,
  SplitHistoryKind,
} from "../../util/split-history";

const MODAL_SCREEN_MARGIN = 16;

const KIND_COPY_KEYS: Record<SplitHistoryKind, string> = {
  added: "splitHistoryAdded",
  edited: "splitHistoryEdited",
  deleted: "splitHistoryDeleted",
  undone: "splitHistoryUndone",
  paidBack: "splitHistoryPaidBack",
  settlement: "splitHistorySettlement",
};

function formatChange(change: BalanceChange, tripCurrency: string): string {
  const sign = change.amount < 0 ? "−" : "+";
  return `${change.userName} ${sign}${formatExpenseWithCurrency(
    Math.abs(change.amount),
    tripCurrency,
  )}`;
}

function formatWhen(timestamp: number): string {
  try {
    return new Date(timestamp).toLocaleString(i18n.locale, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return new Date(timestamp).toISOString();
  }
}

/** `YYYY-MM-DD` as a local calendar day, so it never shifts with the time zone. */
function formatDay(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  try {
    return new Date(y, m - 1, d).toLocaleDateString(i18n.locale, {
      dateStyle: "medium",
    });
  } catch {
    return date;
  }
}

function formatRange(range: SplitHistoryRange): string {
  return i18n.t("splitHistoryRange", {
    start: formatDay(range.startDate),
    end: formatDay(range.endDate),
  });
}

/** Rows come from a shared database: skip anything that is not a well-formed change. */
function validChanges(changes: unknown): BalanceChange[] {
  const list = Array.isArray(changes)
    ? changes
    : changes && typeof changes === "object"
      ? Object.values(changes)
      : [];
  return list.filter(
    (c): c is BalanceChange =>
      !!c &&
      typeof (c as BalanceChange).userName === "string" &&
      typeof (c as BalanceChange).amount === "number" &&
      Number.isFinite((c as BalanceChange).amount),
  );
}

const HistoryRow = React.memo(function HistoryRow({
  entry,
}: {
  entry: SplitHistoryEntry;
}) {
  const [expanded, setExpanded] = useState(false);
  const days = entry.days;
  return (
    <View testID={`split-history-entry-${entry.id}`} style={styles.row}>
      <Text style={styles.kind}>{i18n.t(KIND_COPY_KEYS[entry.kind])}</Text>
      {!!entry.description && (
        <Text style={styles.description}>{entry.description}</Text>
      )}
      {!!entry.range && (
        <Text style={styles.range}>
          {days
            ? formatRange(entry.range)
            : i18n.t("splitHistoryRangeDay", {
                range: formatRange(entry.range),
              })}
        </Text>
      )}
      <Text style={styles.meta}>
        {`${i18n.t("splitHistoryBy", { name: entry.byName })} · ${formatWhen(
          entry.timestamp,
        )}`}
      </Text>
      {validChanges(entry.balanceChanges).map((change) => (
        <Text
          key={change.userName}
          style={[
            styles.change,
            change.amount < 0 ? styles.changeNegative : styles.changePositive,
          ]}
        >
          {formatChange(change, entry.tripCurrency)}
        </Text>
      ))}
      {!!days?.length && (
        <>
          <Pressable
            testID={`split-history-toggle-${entry.id}`}
            accessibilityRole="button"
            onPress={() => setExpanded((open) => !open)}
            style={styles.toggle}
          >
            <Text style={styles.toggleText}>
              {i18n.t(
                expanded ? "splitHistoryHideDays" : "splitHistoryShowDays",
              )}
            </Text>
          </Pressable>
          {expanded &&
            days.map((day) => (
              <View
                key={day.date}
                testID={`split-history-day-${entry.id}-${day.date}`}
                style={styles.day}
              >
                <Text style={styles.dayDate}>{formatDay(day.date)}</Text>
                {day.balanceChanges.map((change) => (
                  <Text
                    key={change.userName}
                    style={[
                      styles.dayChange,
                      change.amount < 0
                        ? styles.changeNegative
                        : styles.changePositive,
                    ]}
                  >
                    {formatChange(change, entry.tripCurrency)}
                  </Text>
                ))}
              </View>
            ))}
        </>
      )}
    </View>
  );
});

type Props = {
  isVisible: boolean;
  onClose: () => void;
  tripid: string;
};

/**
 * Change history of the Split Summary: newest first, paged (about 20 per
 * page), loaded by the "Load more" row or by reaching the end of the list.
 */
const SplitHistoryModal = ({ isVisible, onClose, tripid }: Props) => {
  const layout = useLayoutProfile();
  const { width: screenWidth } = useWindowDimensions();
  // Explicit pixel width: AppModal wraps content in a shrink-wrapped Pressable,
  // so a percentage width has nothing to resolve against and text overflows.
  const contentWidth = Math.min(
    screenWidth - MODAL_SCREEN_MARGIN * 2,
    MODAL_MAX_WIDTH,
  );
  const [entries, setEntries] = useState<SplitHistoryEntry[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const loadingRef = useRef(false);
  /** Bumped by every reset; a page fetched under an older token is stale. */
  const requestTokenRef = useRef(0);
  const entriesRef = useRef<SplitHistoryEntry[]>([]);

  const loadPage = useCallback(
    async (reset: boolean) => {
      if (!reset && loadingRef.current) return;
      if (reset) requestTokenRef.current += 1;
      const token = requestTokenRef.current;
      loadingRef.current = true;
      setLoading(true);
      setFailed(false);
      try {
        const current = reset ? [] : entriesRef.current;
        const page = await fetchSplitHistoryPage(tripid, {
          beforeId: current.length ? current[current.length - 1].id : undefined,
        });
        if (token !== requestTokenRef.current) return;
        entriesRef.current = [...current, ...page.entries];
        setEntries(entriesRef.current);
        setHasMore(page.hasMore);
        setLoaded(true);
      } catch (error) {
        if (token !== requestTokenRef.current) return;
        safeLogError(error, "SplitHistoryModal.tsx");
        setFailed(true);
      } finally {
        if (token === requestTokenRef.current) {
          loadingRef.current = false;
          setLoading(false);
        }
      }
    },
    [tripid],
  );

  useEffect(() => {
    if (!isVisible || !tripid) return;
    entriesRef.current = [];
    setEntries([]);
    setLoaded(false);
    setHasMore(false);
    loadPage(true);
  }, [isVisible, tripid, loadPage]);

  const onEndReached = useCallback(() => {
    if (hasMore && !failed) loadPage(false);
  }, [hasMore, failed, loadPage]);

  const showEmpty = loaded && entries.length === 0 && !failed;
  const showLoadMore = (hasMore && !loading) || failed;

  return (
    <AppModal
      isVisible={isVisible}
      onClose={onClose}
      testID="split-history-modal"
      contentTestID="split-history-content"
      contentStyle={[
        styles.content,
        { width: contentWidth, maxWidth: contentWidth, marginHorizontal: 0 },
      ]}
    >
      <ModalFrame layout={layout}>
        <View style={styles.header}>
          <Text style={styles.title}>{i18n.t("splitHistoryTitle")}</Text>
          <Pressable
            testID="split-history-close"
            accessibilityRole="button"
            accessibilityLabel={i18n.t("close")}
            hitSlop={8}
            onPress={onClose}
            style={({ pressed }) => [
              styles.closeButton,
              pressed && styles.closeButtonPressed,
            ]}
          >
            <Text style={styles.closeText} numberOfLines={1}>
              {i18n.t("close")}
            </Text>
          </Pressable>
        </View>
        <FlatList
          testID="split-history-list"
          data={entries}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <HistoryRow entry={item} />}
          initialNumToRender={SPLIT_HISTORY_PAGE_SIZE}
          onEndReachedThreshold={0.5}
          onEndReached={onEndReached}
          style={styles.list}
          ListEmptyComponent={
            showEmpty ? (
              <View testID="split-history-empty" style={styles.empty}>
                <Text style={styles.emptyText}>
                  {i18n.t("splitHistoryEmpty")}
                </Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            <View>
              {failed && (
                <Text style={styles.error}>
                  {i18n.t("splitHistoryLoadError")}
                </Text>
              )}
              {showLoadMore && (
                <ActionRow
                  testID="split-history-load-more"
                  tier="secondary"
                  label={i18n.t("splitHistoryLoadMore")}
                  onPress={() => loadPage(!loaded)}
                  showChevron={false}
                />
              )}
            </View>
          }
        />
      </ModalFrame>
    </AppModal>
  );
};

SplitHistoryModal.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  tripid: PropTypes.string.isRequired,
};

export default SplitHistoryModal;

const styles = StyleSheet.create({
  content: {
    maxHeight: "85%",
    padding: dynamicScale(12, false, 0.5),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: dynamicScale(12, true),
  },
  title: {
    flex: 1,
    flexShrink: 1,
    paddingLeft: dynamicScale(8, false, 0.5),
    paddingRight: dynamicScale(8, false, 0.5),
    fontWeight: "300",
    fontSize: dynamicScale(22, false, 0.5),
    color: GlobalStyles.colors.textColor,
  },
  closeButton: {
    flexShrink: 0,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: dynamicScale(16, false, 0.5),
    borderRadius: dynamicScale(12, false, 0.5),
    backgroundColor: GlobalStyles.colors.gray300,
  },
  closeButtonPressed: { opacity: 0.6 },
  closeText: {
    fontSize: dynamicScale(15, false, 0.5),
    fontWeight: "600",
    color: GlobalStyles.colors.textColor,
  },
  list: { flexGrow: 0 },
  row: {
    paddingVertical: dynamicScale(10, true),
    paddingHorizontal: dynamicScale(8, false, 0.5),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: GlobalStyles.colors.gray300,
  },
  kind: {
    fontSize: dynamicScale(13, false, 0.5),
    fontWeight: "600",
    color: GlobalStyles.colors.primary500,
  },
  description: {
    fontSize: dynamicScale(17, false, 0.5),
    fontWeight: "500",
    color: GlobalStyles.colors.textColor,
  },
  meta: {
    fontSize: dynamicScale(13, false, 0.5),
    color: GlobalStyles.colors.gray700,
    marginBottom: dynamicScale(4, true),
  },
  range: {
    fontSize: dynamicScale(14, false, 0.5),
    color: GlobalStyles.colors.textColor,
  },
  toggle: { paddingVertical: dynamicScale(6, true) },
  toggleText: {
    fontSize: dynamicScale(14, false, 0.5),
    fontWeight: "600",
    color: GlobalStyles.colors.primary500,
  },
  day: {
    paddingLeft: dynamicScale(10, false, 0.5),
    paddingVertical: dynamicScale(3, true),
  },
  dayDate: {
    fontSize: dynamicScale(13, false, 0.5),
    color: GlobalStyles.colors.gray700,
  },
  dayChange: { fontSize: dynamicScale(14, false, 0.5) },
  change: { fontSize: dynamicScale(15, false, 0.5) },
  changePositive: { color: GlobalStyles.colors.textColor },
  changeNegative: { color: GlobalStyles.colors.errorGrayed },
  empty: {
    paddingHorizontal: dynamicScale(12, false, 0.5),
    paddingTop: dynamicScale(8, true),
    paddingBottom: dynamicScale(24, true),
    alignItems: "center",
  },
  emptyText: {
    fontSize: dynamicScale(16, false, 0.5),
    fontStyle: "italic",
    lineHeight: dynamicScale(24, false, 0.5),
    textAlign: "center",
    color: GlobalStyles.colors.textColor,
  },
  error: {
    textAlign: "center",
    color: GlobalStyles.colors.error500,
    marginVertical: dynamicScale(8, true),
  },
});
