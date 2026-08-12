import React from "react";
import PropTypes from "prop-types";

import ExpenseItem from "./ExpenseItem";
import { useLayoutProfile } from "../../store/layout-context";
import {
  expenseListRowLayoutTokens,
  type ExpenseListRowLayoutVariant,
} from "../../styles/expense-list-row-layout-tokens";
import type { ExpenseData } from "../../util/expense";

export type { ExpenseListRowLayoutVariant };

export type ExpenseListRowProps = ExpenseData & {
  onPress: () => void;
  layoutVariant?: ExpenseListRowLayoutVariant;
};

/** Read-only ledger row for lists that must match {@link ExpenseItem} layout. */
function ExpenseListRow({
  onPress,
  layoutVariant = "ledger",
  ...expense
}: ExpenseListRowProps) {
  const layout = useLayoutProfile();
  const rowLayout = expenseListRowLayoutTokens(layout, layoutVariant);

  return (
    <ExpenseItem
      {...expense}
      onPressOverride={onPress}
      disableLongPressSelection
      layoutVariant={layoutVariant}
      rowLayout={rowLayout}
    />
  );
}

ExpenseListRow.propTypes = {
  onPress: PropTypes.func.isRequired,
  layoutVariant: PropTypes.oneOf(["ledger", "templatePicker"]),
};

export default ExpenseListRow;
