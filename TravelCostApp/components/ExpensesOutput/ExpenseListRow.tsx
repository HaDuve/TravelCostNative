import React from "react";
import PropTypes from "prop-types";

import ExpenseItem from "./ExpenseItem";
import type { ExpenseData } from "../../util/expense";

export type ExpenseListRowLayoutVariant = "ledger" | "templatePicker";

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
  return (
    <ExpenseItem
      {...expense}
      onPressOverride={onPress}
      disableLongPressSelection
      layoutVariant={layoutVariant}
    />
  );
}

ExpenseListRow.propTypes = {
  onPress: PropTypes.func.isRequired,
  layoutVariant: PropTypes.oneOf(["ledger", "templatePicker"]),
};

export default ExpenseListRow;
