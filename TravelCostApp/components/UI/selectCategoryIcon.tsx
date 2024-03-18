import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React from "react";
import { GlobalStyles } from "../../constants/styles";
import { Ionicons } from "@expo/vector-icons";
import PropTypes from "prop-types";
import { moderateScale } from "../../util/scalingUtil";

const SelectCategoryIcon = ({
  selectedIconName,
  iconName,
  setSelectedIconName,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.iconButton,
        selectedIconName === iconName && styles.selectedIconButton,
      ]}
      onPress={() => setSelectedIconName(iconName)}
    >
      <Ionicons
        name={iconName}
        size={moderateScale(42, 0.3)}
        color={GlobalStyles.colors.primary400}
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
    padding: 4,
    marginHorizontal: 4,
    borderRadius: 16,
  },
  selectedIconButton: {
    backgroundColor: GlobalStyles.colors.primary50,
  },
});
