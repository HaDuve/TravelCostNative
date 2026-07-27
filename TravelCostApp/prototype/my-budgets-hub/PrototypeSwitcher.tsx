import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { GlobalStyles } from "../../constants/styles";
import { dynamicScale } from "../../util/scalingUtil";

const VARIANTS = ["A", "B", "C"] as const;
export type VariantKey = (typeof VARIANTS)[number];

export function PrototypeSwitcher({
  current,
  currentName,
  onChange,
}: {
  current: VariantKey;
  currentName: string;
  onChange: (next: VariantKey) => void;
}) {
  const index = VARIANTS.indexOf(current);
  const prev = VARIANTS[(index - 1 + VARIANTS.length) % VARIANTS.length];
  const next = VARIANTS[(index + 1) % VARIANTS.length];

  return (
    <View style={styles.bar} pointerEvents="box-none">
      <Pressable onPress={() => onChange(prev)} style={styles.arrow}>
        <Text style={styles.arrowText}>‹</Text>
      </Pressable>
      <Text style={styles.label}>
        {current} — {currentName}
      </Text>
      <Pressable onPress={() => onChange(next)} style={styles.arrow}>
        <Text style={styles.arrowText}>›</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    bottom: dynamicScale(24, true),
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 999,
    paddingHorizontal: dynamicScale(12),
    paddingVertical: dynamicScale(8, true),
    opacity: 0.92,
    zIndex: 999,
  },
  arrow: { paddingHorizontal: dynamicScale(12) },
  arrowText: {
    color: "#fff",
    fontSize: dynamicScale(22, false, 0.5),
    fontWeight: "700",
  },
  label: {
    color: "#fff",
    fontSize: dynamicScale(13, false, 0.5),
    fontWeight: "600",
    minWidth: dynamicScale(160),
    textAlign: "center",
  },
});
