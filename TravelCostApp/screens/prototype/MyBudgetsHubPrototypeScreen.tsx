/**
 * PROTOTYPE — My Budgets hub layout (#339). Delete when a variant wins.
 */
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { GlobalStyles } from "../../constants/styles";
import { dynamicScale } from "../../util/scalingUtil";
import BackButton from "../../components/UI/BackButton";
import {
  budgetsForScenario,
  PrototypeScenario,
  SCENARIO_LABELS,
} from "../../prototype/my-budgets-hub/mock-data";
import {
  PrototypeSwitcher,
  VariantKey,
} from "../../prototype/my-budgets-hub/PrototypeSwitcher";
import { VariantA, VARIANT_NAME as NAME_A } from "../../prototype/my-budgets-hub/VariantA";
import { VariantB, VARIANT_NAME as NAME_B } from "../../prototype/my-budgets-hub/VariantB";
import { VariantC, VARIANT_NAME as NAME_C } from "../../prototype/my-budgets-hub/VariantC";

const VARIANT_NAMES: Record<VariantKey, string> = {
  A: NAME_A,
  B: NAME_B,
  C: NAME_C,
};

const SCENARIOS: PrototypeScenario[] = [
  "implicit-only",
  "named-single",
  "multi",
];

export default function MyBudgetsHubPrototypeScreen({ navigation, route }) {
  const variant: VariantKey = route.params?.variant ?? "A";
  const scenario: PrototypeScenario =
    route.params?.scenario ?? "implicit-only";
  const [feedback, setFeedback] = useState<string | null>(null);

  const budgets = useMemo(() => budgetsForScenario(scenario), [scenario]);

  const setVariant = (next: VariantKey) => {
    navigation.setParams({ variant: next, scenario });
  };

  const setScenario = (next: PrototypeScenario) => {
    navigation.setParams({ variant, scenario: next });
    setFeedback(null);
  };

  const actions = {
    onJoin: () =>
      setFeedback("→ Would open Join budget (invite code / link)"),
    onAddAnother: () =>
      setFeedback(
        scenario === "implicit-only"
          ? "→ Would open Name your budget (promote in place)"
          : "→ Would open Add another budget (empty)"
      ),
    onBudgetPress: (budget) =>
      setFeedback(
        budget.isImplicit
          ? `→ Would open Name your budget for "${budget.name}"`
          : `→ Would switch active budget to "${budget.name}"`
      ),
  };

  const common = { budgets, feedback, ...actions };

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.protoBadge}>PROTOTYPE</Text>
      </View>

      <View style={styles.scenarioRow}>
        {SCENARIOS.map((key) => (
          <Pressable
            key={key}
            onPress={() => setScenario(key)}
            style={[
              styles.scenarioChip,
              scenario === key && styles.scenarioChipActive,
            ]}
          >
            <Text
              style={[
                styles.scenarioChipText,
                scenario === key && styles.scenarioChipTextActive,
              ]}
            >
              {SCENARIO_LABELS[key]}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.content}>
        {variant === "A" && <VariantA {...common} />}
        {variant === "B" && <VariantB {...common} />}
        {variant === "C" && <VariantC {...common} />}
      </View>

      <PrototypeSwitcher
        current={variant}
        currentName={VARIANT_NAMES[variant]}
        onChange={setVariant}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: GlobalStyles.colors.backgroundColor,
    paddingTop: dynamicScale(8, true),
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: dynamicScale(8),
  },
  protoBadge: {
    fontSize: dynamicScale(11, false, 0.5),
    fontWeight: "700",
    color: GlobalStyles.colors.error500,
    letterSpacing: 1,
    marginRight: dynamicScale(12),
  },
  scenarioRow: {
    flexDirection: "row",
    paddingHorizontal: dynamicScale(12),
    paddingVertical: dynamicScale(8, true),
    gap: dynamicScale(8),
  },
  scenarioChip: {
    paddingHorizontal: dynamicScale(10),
    paddingVertical: dynamicScale(6, true),
    borderRadius: 99,
    backgroundColor: GlobalStyles.colors.gray300,
  },
  scenarioChipActive: {
    backgroundColor: GlobalStyles.colors.primary400,
  },
  scenarioChipText: {
    fontSize: dynamicScale(12, false, 0.5),
    color: GlobalStyles.colors.gray700,
  },
  scenarioChipTextActive: {
    color: GlobalStyles.colors.backgroundColor,
    fontWeight: "600",
  },
  content: { flex: 1 },
});
