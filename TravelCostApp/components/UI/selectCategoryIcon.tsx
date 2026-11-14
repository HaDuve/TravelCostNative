import { StyleSheet, TouchableOpacity } from "react-native";
import React from "react";
import { GlobalStyles } from "../../constants/styles";
import { Ionicons } from "@expo/vector-icons";
import PropTypes from "prop-types";
import { dynamicScale } from "../../util/scalingUtil";
import { formatCategoryIconLabel } from "../../util/category-icons";

const TOUCH_TARGET_MIN = 48;

const SelectCategoryIcon = ({
  selectedIconName,
  iconName,
  setSelectedIconName,
}) => {
  const selected = selectedIconName === iconName;

  return (
    <TouchableOpacity
      style={[styles.iconButton, selected && styles.selectedIconButton]}
      onPress={() => setSelectedIconName(iconName)}
      accessibilityRole="button"
      accessibilityLabel={formatCategoryIconLabel(iconName)}
      accessibilityState={{ selected }}
    >
      <Ionicons
        name={iconName}
        size={dynamicScale(28, false, 0.3)}
        color={GlobalStyles.colors.primary700}
      />
    </TouchableOpacity>
  );
};

export default SelectCategoryIcon;

SelectCategoryIcon.propTypes = {
  selectedIconName: PropTypes.string.isRequired,
  iconName: PropTypes.string.isRequired,
  setSelectedIconName: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  iconButton: {
    minWidth: TOUCH_TARGET_MIN,
    minHeight: TOUCH_TARGET_MIN,
    padding: dynamicScale(4, false, 0.5),
    margin: dynamicScale(4, false, 0.5),
    borderRadius: dynamicScale(16, false, 0.5),
    alignItems: "center",
    justifyContent: "center",
  },
  selectedIconButton: {
    backgroundColor: GlobalStyles.colors.primary50,
  },
});
