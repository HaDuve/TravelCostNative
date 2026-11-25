import React, { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import PropTypes from "prop-types";

import AppModal from "../UI/AppModal";
import ActionRow from "../UI/ActionRow";
import ModalFrame from "../layout/ModalFrame";
import { GlobalStyles } from "../../constants/styles";
import { i18n } from "../../i18n/i18n";
import { useLayoutProfile } from "../../store/layout-context";
import { fetchSplitHistoryPage, SPLIT_HISTORY_PAGE_SIZE } from "../../util/http";
import safeLogError from "../../util/error";
import { dynamicScale } from "../../util/scalingUtil";
import { formatExpenseWithCurrency } from "../../util/string";
import { MODAL_MAX_WIDTH } from "../../util/modal-frame-layout";
import type {
  BalanceChange,
  SplitHistoryEntry,
  SplitHistoryKind,
} from "../../util/split-history";

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
    tripCurrency
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

const HistoryRow = React.memo(function HistoryRow({
  entry,
}: {
  entry: SplitHistoryEntry;
}) {
  return (
    <View testID={`split-history-entry-${entry.id}`} style={styles.row}>
      <Text style={styles.kind}>{i18n.t(KIND_COPY_KEYS[entry.kind])}</Text>
      {!!entry.description && (
        <Text style={styles.description}>{entry.description}</Text>
      )}
      <Text style={styles.meta}>
        {`${i18n.t("splitHistoryBy", { name: entry.byName })} · ${formatWhen(
          entry.timestamp
        )}`}
      </Text>
      {entry.balanceChanges.map((change) => (
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
  const [entries, setEntries] = useState<SplitHistoryEntry[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const loadingRef = useRef(false);
  const entriesRef = useRef<SplitHistoryEntry[]>([]);

  const loadPage = useCallback(
    async (reset: boolean) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      setLoading(true);
      setFailed(false);
      try {
        const current = reset ? [] : entriesRef.current;
        const page = await fetchSplitHistoryPage(tripid, {
          beforeId: current.length ? current[current.length - 1].id : undefined,
        });
        entriesRef.current = [...current, ...page.entries];
        setEntries(entriesRef.current);
        setHasMore(page.hasMore);
        setLoaded(true);
      } catch (error) {
        safeLogError(error, "SplitHistoryModal.tsx");
        setFailed(true);
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [tripid]
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
        { width: "100%", maxWidth: MODAL_MAX_WIDTH, alignSelf: "center" },
      ]}
    >
      <ModalFrame layout={layout}>
        <View style={styles.header}>
          <Text style={styles.title}>{i18n.t("splitHistoryTitle")}</Text>
          <ActionRow
            testID="split-history-close"
            tier="secondary"
            label={i18n.t("close")}
            onPress={onClose}
            showChevron={false}
            style={styles.closeAction}
          />
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
    paddingLeft: dynamicScale(8, false, 0.5),
    fontWeight: "300",
    fontSize: dynamicScale(22, false, 0.5),
    color: GlobalStyles.colors.textColor,
  },
  closeAction: { marginBottom: 0, flex: 1 },
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
  change: { fontSize: dynamicScale(15, false, 0.5) },
  changePositive: { color: GlobalStyles.colors.textColor },
  changeNegative: { color: GlobalStyles.colors.errorGrayed },
  empty: { padding: dynamicScale(20, false, 0.5), alignItems: "center" },
  emptyText: {
    fontSize: dynamicScale(16, false, 0.5),
    fontStyle: "italic",
    textAlign: "center",
    color: GlobalStyles.colors.textColor,
  },
  error: {
    textAlign: "center",
    color: GlobalStyles.colors.error500,
    marginVertical: dynamicScale(8, true),
  },
});
