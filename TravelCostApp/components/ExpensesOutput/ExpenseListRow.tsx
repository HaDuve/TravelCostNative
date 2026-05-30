import React from "react";
import PropTypes from "prop-types";

import ExpenseItem from "./ExpenseItem";
import type { ExpenseData } from "../../util/expense";

export type ExpenseListRowProps = ExpenseData & {
  onPress: () => void;
};

/** Read-only ledger row for lists that must match {@link ExpenseItem} layout. */
function ExpenseListRow({ onPress, ...expense }: ExpenseListRowProps) {
  return (
    <ExpenseItem {...expense} onPressOverride={onPress} disableLongPressSelection />
  );
}

ExpenseListRow.propTypes = {
  onPress: PropTypes.func.isRequired,
};

export default ExpenseListRow;
