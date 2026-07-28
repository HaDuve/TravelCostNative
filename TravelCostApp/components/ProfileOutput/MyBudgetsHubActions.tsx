import React from "react";
import { View } from "react-native";
import { i18n } from "../../i18n/i18n";
import { trackEvent } from "../../util/vexo-tracking";
import { VexoEvents } from "../../util/vexo-constants";
import PropTypes from "prop-types";
import ActionRow from "../UI/ActionRow";

type MyBudgetsHubActionsProps = {
  onJoin: () => void;
  onAddAnother: () => void;
};

function MyBudgetsHubActions({ onJoin, onAddAnother }: MyBudgetsHubActionsProps) {
  return (
    <View testID="my-budgets-hub-actions">
      <ActionRow
        testID="my-budgets-add-another"
        tier="primary"
        label={i18n.t("addAnotherBudget")}
        hint={i18n.t("addAnotherBudgetHint")}
        icon="add-circle-outline"
        onPress={() => {
          trackEvent(VexoEvents.CREATE_TRIP_FROM_PROFILE_PRESSED);
          onAddAnother();
        }}
      />
      <ActionRow
        testID="my-budgets-join"
        tier="secondary"
        label={i18n.t("joinBudget")}
        hint={i18n.t("joinBudgetHint")}
        icon="people-outline"
        onPress={() => {
          trackEvent(VexoEvents.TRIP_JOINED);
          onJoin();
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
