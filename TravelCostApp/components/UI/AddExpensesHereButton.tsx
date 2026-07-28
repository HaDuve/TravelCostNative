import React from "react";

import { i18n } from "../../i18n/i18n";

import ActionRow from "./ActionRow";
import { useNavigation } from "@react-navigation/native";
import { DateTime } from "luxon";
import PropTypes from "prop-types";
import { isIsoDate } from "../../util/date";
import type { ActionRowAction } from "./ActionRowStack";

type NavigateFn = (
  screen: string,
  params: Record<string, string>
) => void;

export function buildAddExpenseHereAction(
  dayISO: string | null | undefined,
  navigate: NavigateFn
): ActionRowAction | null {
  if (!isIsoDate(dayISO)) {
    return null;
  }

  return {
    testID: "add-expense-here",
    tier: "primary",
    label: i18n.t("addExp"),
    hint: i18n.t("addExpHereHint", {
      date: DateTime.fromISO(dayISO).toLocaleString(),
    }),
    icon: "add-circle-outline",
    onPress: () => {
      navigate("ManageExpense", {
        pickedCat: "undefined",
        dateISO: dayISO,
      });
    },
  };
}

const AddExpenseHereButton = ({ dayISO }) => {
  const navigation = useNavigation();
  const action = buildAddExpenseHereAction(dayISO, (screen, params) =>
    navigation.navigate(screen as never, params as never)
  );

  if (!action) {
    return null;
  }

  return (
    <ActionRow
      testID={action.testID}
      tier={action.tier}
      label={action.label}
      hint={action.hint}
      icon={action.icon}
      onPress={action.onPress}
      showChevron={false}
    />
  );
};

export default AddExpenseHereButton;

AddExpenseHereButton.propTypes = {
  dayISO: PropTypes.string,
};
