import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GlobalStyles } from "../../constants/styles";
import { shadowRegressionStyles } from "../../styles/shadow-regression-styles";
import { dynamicScale } from "../../util/scalingUtil";
import { i18n } from "../../i18n/i18n";
import { trackEvent } from "../../util/vexo-tracking";
import { VexoEvents } from "../../util/vexo-constants";
import PropTypes from "prop-types";

type MyBudgetsHubActionsProps = {
  onJoin: () => void;
  onAddAnother: () => void;
};

function ActionRow({
  testID,
  label,
  hint,
  icon,
  onPress,
}: {
  testID: string;
  label: string;
  hint: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  onPress: () => void;
}) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionRow,
        shadowRegressionStyles.tripHistoryCard,
        pressed && GlobalStyles.pressed,
      ]}
    >
      <View style={styles.actionIcon}>
        <Ionicons
          name={icon}
          size={dynamicScale(20, false, 0.5)}
          color={GlobalStyles.colors.primary500}
        />
      </View>
      <View style={styles.actionText}>
        <Text style={styles.actionLabel}>{label}</Text>
        <Text style={styles.actionHint}>{hint}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

/** Variant B hub actions: Join + Add another full-width rows above the budget list. */
function MyBudgetsHubActions({ onJoin, onAddAnother }: MyBudgetsHubActionsProps) {
  return (
    <View testID="my-budgets-hub-actions">
      <ActionRow
        testID="my-budgets-join"
        label={i18n.t("joinBudget")}
        hint={i18n.t("joinBudgetHint")}
        icon="people-outline"
        onPress={() => {
          trackEvent(VexoEvents.TRIP_JOINED);
          onJoin();
        }}
      />
      <ActionRow
        testID="my-budgets-add-another"
        label={i18n.t("addAnotherBudget")}
        hint={i18n.t("addAnotherBudgetHint")}
        icon="add-circle-outline"
        onPress={() => {
          trackEvent(VexoEvents.CREATE_TRIP_FROM_PROFILE_PRESSED);
          onAddAnother();
        }}
      />
    </View>
  );
}

export default MyBudgetsHubActions;

MyBudgetsHubActions.propTypes = {
  onJoin: PropTypes.func.isRequired,
  onAddAnother: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: GlobalStyles.colors.backgroundColorLight,
    borderRadius: 16,
    padding: dynamicScale(14),
    marginBottom: dynamicScale(10, true),
  },
  actionIcon: { marginRight: dynamicScale(12) },
  actionText: { flex: 1 },
  actionLabel: {
    fontSize: dynamicScale(16, false, 0.5),
    fontWeight: "600",
    color: GlobalStyles.colors.textColor,
  },
  actionHint: {
    fontSize: dynamicScale(12, false, 0.5),
    color: GlobalStyles.colors.textHidden,
    marginTop: dynamicScale(2, true),
  },
  chevron: {
    fontSize: dynamicScale(22, false, 0.5),
    color: GlobalStyles.colors.gray600,
  },
});
