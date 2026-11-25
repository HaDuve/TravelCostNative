import type { BalanceChange, SplitHistoryKind } from "./split-history";

/** i18n key (under `splitHistory…`) plus the names/amount it interpolates. */
export type HistorySentence = {
  key:
    | "splitHistoryOwesMore"
    | "splitHistoryOwesLess"
    | "splitHistoryOweMore"
    | "splitHistoryOweLess"
    | "splitHistoryOwedMore"
    | "splitHistoryOwedLess";
  debtor?: string;
  creditor?: string;
  name?: string;
  /** Always positive; the sentence says "more" or "less". */
  amount: number;
};

/** Kinds that shrink what someone owes; every other kind grows it. */
const REDUCES_DEBT: ReadonlySet<SplitHistoryKind> = new Set([
  "deleted",
  "paidBack",
  "settlement",
]);

const EPSILON = 0.005;

/**
 * Turns a history entry's signed per-traveller **Balance** changes into plain
 * "X owes Y …" sentences.
 *
 * The stored deltas only say whose balance went up (+) or down (−), not who
 * owed whom before. So: added / edited / undone entries read "the one whose
 * balance fell owes the one whose balance rose more"; deleted / paid back /
 * settlement entries read "the one whose balance rose owes the other less".
 */
export function describeBalanceChanges(
  kind: SplitHistoryKind,
  changes: BalanceChange[],
): HistorySentence[] {
  const reduces = REDUCES_DEBT.has(kind);
  const up = changes.filter((c) => c.amount > EPSILON);
  const down = changes.filter((c) => c.amount < -EPSILON);
  // Debtors are the side whose owing changes; creditors are the counterparty.
  const debtors = reduces ? up : down;
  const creditors = reduces ? down : up;
  const pairKey = reduces ? "splitHistoryOwesLess" : "splitHistoryOwesMore";

  if (creditors.length === 1) {
    return debtors.map((d) => ({
      key: pairKey,
      debtor: d.userName,
      creditor: creditors[0].userName,
      amount: Math.abs(d.amount),
    }));
  }
  if (debtors.length === 1) {
    return creditors.map((c) => ({
      key: pairKey,
      debtor: debtors[0].userName,
      creditor: c.userName,
      amount: Math.abs(c.amount),
    }));
  }
  // Several on both sides: no honest pairing, so state each person's own change.
  return [...debtors, ...creditors].map((c) => ({
    key: debtors.includes(c)
      ? reduces
        ? "splitHistoryOweLess"
        : "splitHistoryOweMore"
      : reduces
        ? "splitHistoryOwedLess"
        : "splitHistoryOwedMore",
    name: c.userName,
    amount: Math.abs(c.amount),
  }));
}
