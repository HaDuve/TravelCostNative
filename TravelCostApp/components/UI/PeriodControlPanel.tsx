import React from "react";
import { StyleSheet, View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GlobalStyles } from "../../constants/styles";
import { dynamicScale } from "../../util/scalingUtil";
import PropTypes from "prop-types";

interface PeriodControlPanelProps {
  periodName: string;
  onMore: () => void;
  onLess: () => void;
  onReset: () => void;
  canShowMore: boolean;
  canShowLess: boolean;
  canReset: boolean;
}

const PeriodControlPanel = ({
  periodName,
  onMore,
  onLess,
  onReset,
  canShowMore,
  canShowLess,
  canReset,
}: PeriodControlPanelProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.controlsRow}>
        {/* Less Button */}
        <Pressable
          style={({ pressed }) => [
            styles.controlButton,
            !canShowLess && styles.disabledButton,
            pressed && GlobalStyles.pressed,
          ]}
          onPress={onLess}
          disabled={!canShowLess}
        >
          <Ionicons 
            name="remove" 
            size={dynamicScale(20, false, 0.5)} 
            color={canShowLess ? GlobalStyles.colors.primary500 : GlobalStyles.colors.gray600} 
          />
        </Pressable>

        {/* Period Text */}
        <View style={styles.textContainer}>
          <Text style={styles.periodText}>
            {periodName.charAt(0).toUpperCase() + periodName.slice(1)}s
          </Text>
        </View>

        {/* More Button */}
        <Pressable
          style={({ pressed }) => [
            styles.controlButton,
            !canShowMore && styles.disabledButton,
            pressed && GlobalStyles.pressed,
          ]}
          onPress={onMore}
          disabled={!canShowMore}
        >
          <Ionicons 
            name="add" 
            size={dynamicScale(20, false, 0.5)} 
            color={canShowMore ? GlobalStyles.colors.primary500 : GlobalStyles.colors.gray600} 
          />
        </Pressable>

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
              color={GlobalStyles.colors.gray500} 
            />
          </Pressable>
        )}
      </View>
    </View>
  );
};

export default PeriodControlPanel;

PeriodControlPanel.propTypes = {
  periodName: PropTypes.string.isRequired,
  onMore: PropTypes.func.isRequired,
  onLess: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
  canShowMore: PropTypes.bool.isRequired,
  canShowLess: PropTypes.bool.isRequired,
  canReset: PropTypes.bool.isRequired,
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
  },
});
