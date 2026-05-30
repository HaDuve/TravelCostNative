import React from "react";
import { FlatList, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import PropTypes from "prop-types";

import AppModal from "../UI/AppModal";
import ExpenseListRow from "../ExpensesOutput/ExpenseListRow";
import { GlobalStyles } from "../../constants/styles";
import { i18n } from "../../i18n/i18n";
import type { ExpenseData } from "../../util/expense";
import { templatePickerModalContentWidth } from "../../util/modal-layout";
import { dynamicScale } from "../../util/scalingUtil";
import FlatButton from "../UI/FlatButton";

export type ExpenseTemplatePickerModalProps = {
  isVisible: boolean;
  onClose: () => void;
  templates: ExpenseData[];
  topDuplicateCount: number;
  onSelectTemplate: (expense: ExpenseData) => void;
  onLoadMore: () => void;
};

const ExpenseTemplatePickerModal = ({
  isVisible,
  onClose,
  templates,
  topDuplicateCount,
  onSelectTemplate,
  onLoadMore,
}: ExpenseTemplatePickerModalProps) => {
  const { width: screenWidth } = useWindowDimensions();
  const contentWidth = templatePickerModalContentWidth(screenWidth);
  const hasTopSection = topDuplicateCount > 0;

  const renderItem = ({
    item,
    index,
  }: {
    item: ExpenseData;
    index: number;
  }) => {
    const isFirst = index === 0;
    const isThird = index === 3;

    return (
      <View>
        {isFirst && hasTopSection && (
          <Text style={styles.sectionSubtitle}>{i18n.t("mostUsedExpenses")}</Text>
        )}
        {isThird && hasTopSection && (
          <Text style={styles.sectionSubtitle}>{i18n.t("lastUsedExpenses")}</Text>
        )}
        {isFirst && !hasTopSection && (
          <Text style={styles.sectionSubtitle}>{i18n.t("lastUsedExpenses")}</Text>
        )}
        <ExpenseListRow
          {...item}
          layoutVariant="templatePicker"
          onPress={() => onSelectTemplate(item)}
        />
      </View>
    );
  };

  return (
    <AppModal
      isVisible={isVisible}
      onClose={onClose}
      testID="expense-template-picker-modal"
      backdropTestID="expense-template-picker-backdrop"
      contentTestID="expense-template-picker-content"
      contentStyle={[
        styles.modalContent,
        {
          width: contentWidth,
          maxWidth: contentWidth,
          marginHorizontal: 0,
        },
      ]}
    >
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>{i18n.t("templateExpenses")}</Text>
        <View testID="expense-template-picker-close">
          <FlatButton onPress={onClose} textStyle={styles.closeButtonText}>
            {i18n.t("cancel")}
          </FlatButton>
        </View>
      </View>
      <FlatList
        data={templates}
        keyExtractor={(item, index) => item.id ?? `${item.description}-${index}`}
        renderItem={renderItem}
        onEndReachedThreshold={0.5}
        onEndReached={onLoadMore}
        style={styles.list}
      />
    </AppModal>
  );
};

ExpenseTemplatePickerModal.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  templates: PropTypes.array.isRequired,
  topDuplicateCount: PropTypes.number.isRequired,
  onSelectTemplate: PropTypes.func.isRequired,
  onLoadMore: PropTypes.func.isRequired,
};

export default ExpenseTemplatePickerModal;

const styles = StyleSheet.create({
  modalContent: {
    maxHeight: "85%",
    padding: dynamicScale(12, false, 0.5),
    paddingVertical: dynamicScale(12, false, 0.5),
    paddingHorizontal: 6,
    alignSelf: "center",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: dynamicScale(12, true),
  },
  modalTitle: {
    flex: 1,
    paddingLeft: dynamicScale(8, false, 0.5),
    fontWeight: "300",
    fontSize: dynamicScale(22, false, 0.5),
    color: GlobalStyles.colors.textColor,
  },
  closeButtonText: {
    fontSize: dynamicScale(16, false, 0.5),
  },
  sectionSubtitle: {
    fontWeight: "300",
    fontSize: dynamicScale(16, false, 0.5),
    color: GlobalStyles.colors.gray700,
    marginTop: dynamicScale(8, true),
    marginBottom: dynamicScale(4, true),
    marginLeft: dynamicScale(8),
  },
  list: {
    flexGrow: 1,
    maxHeight: dynamicScale(520, true),
  },
});
