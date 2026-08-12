import React from "react";
import { View, StyleSheet } from "react-native";
import PropTypes from "prop-types";

import ActionRow, { type ActionRowTier } from "./ActionRow";
import { ActionRowTokens } from "../../styles/action-row-tokens";
import { ControlFrame } from "../layout/ContentFrame";
import { useLayoutProfile } from "../../store/layout-context";

export type ActionRowAction = {
  testID?: string;
  label: string;
  hint?: string;
  icon?: React.ComponentProps<
    typeof import("@expo/vector-icons").Ionicons
  >["name"];
  tier?: ActionRowTier;
  onPress: () => void;
  disabled?: boolean;
};

type ActionRowStackProps = {
  actions: ActionRowAction[];
  showChevron?: boolean;
};

/** Vertical stack of ActionRows — modal footers, form actions, settings lists. */
function ActionRowStack({ actions, showChevron = false }: ActionRowStackProps) {
  const layout = useLayoutProfile();

  return (
    <ControlFrame layout={layout} testID="action-row-stack-frame">
      <View testID="action-row-stack" style={styles.stack}>
        {actions.map((action, index) => (
          <ActionRow
            key={action.testID ?? `${action.label}-${index}`}
            testID={action.testID}
            label={action.label}
            hint={action.hint}
            icon={action.icon}
            tier={action.tier ?? "secondary"}
            onPress={action.onPress}
            showChevron={showChevron}
            disabled={action.disabled}
            style={styles.row}
          />
        ))}
      </View>
    </ControlFrame>
  );
}

export default ActionRowStack;

ActionRowStack.propTypes = {
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      testID: PropTypes.string,
      label: PropTypes.string.isRequired,
      hint: PropTypes.string,
      icon: PropTypes.string,
      tier: PropTypes.oneOf(["primary", "secondary", "gradient"]),
      onPress: PropTypes.func.isRequired,
      disabled: PropTypes.bool,
    })
  ).isRequired,
  showChevron: PropTypes.bool,
};

const styles = StyleSheet.create({
  stack: {
    width: "100%",
    gap: ActionRowTokens.marginBottom,
  },
  row: {
    marginBottom: undefined,
  },
});
