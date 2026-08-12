import React from "react";
import { View, StyleSheet } from "react-native";
import PropTypes from "prop-types";

import ActionRow, { type ActionRowTier } from "./ActionRow";
import { ActionRowTokens } from "../../styles/action-row-tokens";
import { ControlFrame } from "../layout/ContentFrame";
import ResponsiveGrid from "../layout/ResponsiveGrid";
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
  gridOnWide?: boolean;
};

export type ActionRowGridItem = {
  key: string;
  render: () => React.ReactNode;
};

type ActionRowGridProps = {
  items: ActionRowGridItem[];
  testID?: string;
};

/** Responsive 50/50 grid for heterogeneous profile-style action rows. */
export function ActionRowGrid({ items, testID }: ActionRowGridProps) {
  const layout = useLayoutProfile();

  return (
    <ResponsiveGrid
      layout={layout}
      items={items}
      testID={testID}
      columnWidths={[1, 1]}
    />
  );
}

/** Vertical stack of ActionRows — modal footers, form actions, settings lists. */
function ActionRowStack({
  actions,
  showChevron = false,
  gridOnWide = false,
}: ActionRowStackProps) {
  const layout = useLayoutProfile();

  if (gridOnWide && layout.breakpoint !== "narrow") {
    return (
      <ControlFrame layout={layout} testID="action-row-stack-frame">
        <ResponsiveGrid
          layout={layout}
          testID="action-row-stack-grid"
          columnWidths={[1, 1]}
          items={actions.map((action, index) => ({
            key: action.testID ?? `${action.label}-${index}`,
            render: () => (
              <ActionRow
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
            ),
          }))}
        />
      </ControlFrame>
    );
  }

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
  gridOnWide: PropTypes.bool,
};

ActionRowGrid.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      render: PropTypes.func.isRequired,
    })
  ).isRequired,
  testID: PropTypes.string,
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
