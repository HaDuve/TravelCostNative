import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import GradientButton from "../../components/UI/GradientButton";
import FlatButton from "../../components/UI/FlatButton";
import { GlobalStyles } from "../../constants/styles";
import { dynamicScale } from "../../util/scalingUtil";
import type { PrototypeBudget } from "./mock-data";
import {
  ActionFeedback,
  BudgetList,
  HubActions,
  JoinIcon,
  SectionTitle,
} from "./shared";

export const VARIANT_NAME = "Footer actions";

export function VariantA({
  budgets,
  feedback,
  onJoin,
  onAddAnother,
  onBudgetPress,
}: {
  budgets: PrototypeBudget[];
  feedback: string | null;
} & HubActions) {
  return (
    <View style={styles.root}>
      <View style={styles.main}>
        <SectionTitle>My Budgets</SectionTitle>
        <ActionFeedback message={feedback} />
        <BudgetList budgets={budgets} onBudgetPress={onBudgetPress} />
      </View>
      <View style={styles.footer}>
        <FlatButton onPress={onJoin} textStyle={styles.footerSecondary}>
          Join budget
        </FlatButton>
        <GradientButton style={styles.footerPrimary} onPress={onAddAnother}>
          Add another budget
        </GradientButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  main: { flex: 1, paddingHorizontal: dynamicScale(16) },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: dynamicScale(8),
    paddingVertical: dynamicScale(12, true),
    borderTopWidth: 1,
    borderTopColor: GlobalStyles.colors.gray500,
    backgroundColor: GlobalStyles.colors.backgroundColor,
  },
  footerPrimary: { flex: 1.2, marginLeft: dynamicScale(4) },
  footerSecondary: {
    flex: 1,
    textAlign: "center",
    color: GlobalStyles.colors.primary500,
    fontWeight: "600",
  },
});
