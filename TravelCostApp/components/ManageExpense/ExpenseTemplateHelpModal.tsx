import React from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import PropTypes from "prop-types";

import AppModal from "../UI/AppModal";
import FlatButton from "../UI/FlatButton";
import { GlobalStyles } from "../../constants/styles";
import { i18n } from "../../i18n/i18n";
import { dynamicScale } from "../../util/scalingUtil";

export type ExpenseTemplateHelpModalProps = {
  isVisible: boolean;
  onClose: () => void;
};

const ExpenseTemplateHelpModal = ({
  isVisible,
  onClose,
}: ExpenseTemplateHelpModalProps) => {
  return (
    <AppModal
      isVisible={isVisible}
      onClose={onClose}
      testID="expense-template-help-modal"
      backdropTestID="expense-template-help-backdrop"
      contentTestID="expense-template-help-content"
      contentStyle={styles.modalContent}
    >
      <Text style={styles.title}>{i18n.t("templateExpensesHelpTitle")}</Text>
      <ScrollView style={styles.bodyScroll}>
        <Text style={styles.body}>{i18n.t("templateExpensesHelpText")}</Text>
      </ScrollView>
      <FlatButton onPress={onClose} textStyle={styles.dismissButtonText}>
        {i18n.t("confirm")}
      </FlatButton>
    </AppModal>
  );
};

ExpenseTemplateHelpModal.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default ExpenseTemplateHelpModal;

const styles = StyleSheet.create({
  modalContent: {
    maxHeight: "70%",
    padding: dynamicScale(20, false, 0.5),
  },
  title: {
    fontSize: dynamicScale(20, false, 0.5),
    fontWeight: "600",
    color: GlobalStyles.colors.textColor,
    marginBottom: dynamicScale(12, true),
    textAlign: "center",
  },
  bodyScroll: {
    maxHeight: dynamicScale(320, true),
    marginBottom: dynamicScale(16, true),
  },
  body: {
    fontSize: dynamicScale(14, false, 0.5),
    color: GlobalStyles.colors.textColor,
    lineHeight: dynamicScale(20, false, 0.5),
  },
  dismissButtonText: {
    fontSize: dynamicScale(16, false, 0.5),
  },
});
