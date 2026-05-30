import React from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import PropTypes from "prop-types";

import { GlobalStyles } from "../../constants/styles";
import { dynamicScale } from "../../util/scalingUtil";
import BudgetOverviewContent, {
  type BudgetOverviewContentProps,
} from "./BudgetOverviewContent";

export type BudgetOverviewModalProps = {
  isVisible: boolean;
  onClose: () => void;
} & Omit<BudgetOverviewContentProps, "onClose">;

const BudgetOverviewModal = ({
  isVisible,
  onClose,
  ...contentProps
}: BudgetOverviewModalProps) => {
  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.modalOverlay}
        onPress={onClose}
        testID="budget-overview-backdrop"
        accessibilityRole="button"
      >
        <Pressable onPress={(event) => event.stopPropagation()}>
          <View style={styles.modalContainer}>
            <BudgetOverviewContent {...contentProps} onClose={onClose} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

BudgetOverviewModal.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default BudgetOverviewModal;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: GlobalStyles.colors.backgroundColor,
    borderRadius: dynamicScale(20, false, 0.5),
    padding: dynamicScale(24, false, 0.5),
    marginHorizontal: dynamicScale(20, false, 0.5),
    maxWidth: dynamicScale(400, false, 0.5),
    width: "90%",
    ...GlobalStyles.strongShadow,
  },
});
