import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import Modal from "react-native-modal";
import { i18n } from "../../i18n/i18n";
import { GlobalStyles } from "../../constants/styles";
import FlatButton from "../UI/FlatButton";
import { dynamicScale } from "../../util/scalingUtil";
import PropTypes from "prop-types";
import {
  BudgetOverviewContent,
  BudgetOverviewContentProps,
} from "./BudgetOverviewContent";
import * as Haptics from "expo-haptics";

interface ExpenseSummaryModalProps extends BudgetOverviewContentProps {
  isVisible: boolean;
  onClose: () => void;
  onDetailsPress?: () => void;
}

const ExpenseSummaryModal: React.FC<ExpenseSummaryModalProps> = ({
  isVisible,
  onClose,
  onDetailsPress,
  periodLabel,
  ...budgetOverviewProps
}) => {
  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const handleDetails = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onDetailsPress) {
      onDetailsPress();
    }
    onClose();
  };

  return (
    <Modal
      isVisible={isVisible}
      style={styles.modalStyle}
      backdropOpacity={0.5}
      onSwipeComplete={onClose}
      swipeDirection={["up", "left", "right", "down"]}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      animationIn="slideInUp"
      animationOut="slideOutDown"
    >
      <View style={styles.modalContainer}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <BudgetOverviewContent
            {...budgetOverviewProps}
            showCloseButton={false}
          />
        </ScrollView>
        <View style={styles.buttonContainer}>
          <FlatButton onPress={handleBack} textStyle={styles.buttonText}>
            {i18n.t("back")}
          </FlatButton>
          {onDetailsPress && (
            <FlatButton onPress={handleDetails} textStyle={styles.buttonText}>
              {i18n.t("details")}
            </FlatButton>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default ExpenseSummaryModal;

ExpenseSummaryModal.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onDetailsPress: PropTypes.func,
  periodLabel: PropTypes.string.isRequired,
  travellerList: PropTypes.array.isRequired,
  travellerBudgets: PropTypes.number.isRequired,
  travellerSplitExpenseSums: PropTypes.array.isRequired,
  currency: PropTypes.string.isRequired,
  noTotalBudget: PropTypes.bool.isRequired,
  periodName: PropTypes.string.isRequired,
  trafficLightActive: PropTypes.bool.isRequired,
  currentBudgetColor: PropTypes.string.isRequired,
  averageDailySpending: PropTypes.number.isRequired,
  dailyBudget: PropTypes.number.isRequired,
  expenseSumNum: PropTypes.number.isRequired,
  budgetNumber: PropTypes.number.isRequired,
};

const styles = StyleSheet.create({
  modalStyle: {
    justifyContent: "center",
    alignItems: "center",
    margin: 0,
  },
  modalContainer: {
    backgroundColor: GlobalStyles.colors.backgroundColor,
    borderRadius: dynamicScale(20),
    padding: dynamicScale(24),
    marginHorizontal: dynamicScale(20),
    maxWidth: "90%",
    maxHeight: "80%",
  },
  scrollContent: {
    flexGrow: 1,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: dynamicScale(16, true),
    paddingTop: dynamicScale(16, true),
    borderTopWidth: 1,
    borderTopColor: GlobalStyles.colors.primaryGrayed,
  },
  buttonText: {
    fontSize: dynamicScale(16, false, 0.5),
    fontWeight: "600",
  },
});

