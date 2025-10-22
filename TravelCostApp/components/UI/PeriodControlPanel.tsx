import React from "react";
import { StyleSheet, View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GlobalStyles } from "../../constants/styles";
import { dynamicScale } from "../../util/scalingUtil";
import PropTypes from "prop-types";

interface PeriodControlPanelProps {
  periodName: string;
  onReset: () => void;
  canReset: boolean;
  // New sliding window controls
  onSlideLeft?: () => void;
  onSlideRight?: () => void;
  canSlideLeft?: boolean;
  canSlideRight?: boolean;
}

const PeriodControlPanel = ({
  periodName,
  onReset,
  canReset,
  onSlideLeft,
  onSlideRight,
  canSlideLeft = true,
  canSlideRight = true,
}: PeriodControlPanelProps) => {
  return (
    <View style={styles.container}>
      {/* Sliding Window Controls */}
      <View style={styles.controlsRow}>
        {/* Slide Left Button */}
        <Pressable
          style={({ pressed }) => [
            styles.controlButton,
            !canSlideLeft && styles.disabledButton,
            pressed && GlobalStyles.pressed,
          ]}
          onPress={onSlideLeft}
          disabled={!canSlideLeft}
        >
          <Ionicons
            name="chevron-back"
            size={dynamicScale(20, false, 0.5)}
            color={
              canSlideLeft
                ? GlobalStyles.colors.primary500
                : GlobalStyles.colors.gray600
            }
          />
        </Pressable>

        {/* Period Text */}
        <View style={styles.textContainer}>
          <Text style={styles.periodText}>
            {periodName.charAt(0).toUpperCase() + periodName.slice(1)}s
          </Text>
        </View>

        {/* Reset Button */}
        {canReset && (
          <Pressable
            style={({ pressed }) => [
              styles.resetButton,
              pressed && GlobalStyles.pressed,
            ]}
            onPress={onReset}
          >
            <Ionicons
              name="refresh"
              size={dynamicScale(18, false, 0.5)}
              color={GlobalStyles.colors.gray700}
            />
          </Pressable>
        )}

        {/* Slide Right Button */}
        <Pressable
          style={({ pressed }) => [
            styles.controlButton,
            !canSlideRight && styles.disabledButton,
            pressed && GlobalStyles.pressed,
          ]}
          onPress={onSlideRight}
          disabled={!canSlideRight}
        >
          <Ionicons
            name="chevron-forward"
            size={dynamicScale(20, false, 0.5)}
            color={
              canSlideRight
                ? GlobalStyles.colors.primary500
                : GlobalStyles.colors.gray600
            }
          />
        </Pressable>
      </View>
    </View>
  );
};

export default PeriodControlPanel;

PeriodControlPanel.propTypes = {
  periodName: PropTypes.string.isRequired,
  onReset: PropTypes.func.isRequired,
  canReset: PropTypes.bool.isRequired,
  onSlideLeft: PropTypes.func,
  onSlideRight: PropTypes.func,
  canSlideLeft: PropTypes.bool,
  canSlideRight: PropTypes.bool,
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: GlobalStyles.colors.backgroundColor,
    borderRadius: dynamicScale(12, false, 0.5),
    padding: dynamicScale(16),
    marginVertical: dynamicScale(8, true),
    ...GlobalStyles.shadowPrimary,
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  controlButton: {
    width: dynamicScale(44, false, 0.5),
    height: dynamicScale(44, false, 0.5),
    borderRadius: dynamicScale(22, false, 0.5),
    backgroundColor: GlobalStyles.colors.gray300,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: GlobalStyles.colors.gray500,
  },
  disabledButton: {
    backgroundColor: GlobalStyles.colors.gray300,
    borderColor: GlobalStyles.colors.gray500,
  },
  textContainer: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: dynamicScale(16),
  },
  periodText: {
    fontSize: dynamicScale(16, false, 0.5),
    color: GlobalStyles.colors.textColor,
    fontWeight: "500",
  },
  resetButton: {
    width: dynamicScale(40, false, 0.5),
    height: dynamicScale(40, false, 0.5),
    borderRadius: dynamicScale(20, false, 0.5),
    backgroundColor: GlobalStyles.colors.gray300,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: GlobalStyles.colors.gray500,
    marginRight: dynamicScale(8),
  },
});
