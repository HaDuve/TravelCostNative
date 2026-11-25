import { useContext, useMemo } from "react";

import { AuthContext } from "../store/auth-context";
import { TripContext } from "../store/trip-context";
import { UserContext } from "../store/user-context";
import type { SplitHistoryAuthor } from "../util/split-history";

export type SplitHistoryContext = {
  tripCurrency: string;
  isPaidTimestamp?: number;
  author: SplitHistoryAuthor;
};

/** Trip currency, Settlement timestamp and author a split history entry needs. */
export function useSplitHistoryContext(): SplitHistoryContext {
  const { tripCurrency, isPaidTimestamp } = useContext(TripContext);
  const { uid } = useContext(AuthContext);
  const { userName } = useContext(UserContext);
  return useMemo(
    () => ({ tripCurrency, isPaidTimestamp, author: { uid, userName } }),
    [tripCurrency, isPaidTimestamp, uid, userName]
  );
}
