import { StyleSheet, TouchableOpacity } from "react-native";
import React from "react";
import { GlobalStyles } from "../../constants/styles";
import { useGlobalStyles } from "../../store/theme-context";
import { Ionicons } from "@expo/vector-icons";
import PropTypes from "prop-types";
import { dynamicScale } from "../../util/scalingUtil";

const SelectCategoryIcon = ({
  selectedIconName,
  iconName,
  setSelectedIconName,
}) => {
  const GlobalStyles = useGlobalStyles();
  const styles = getStyles(GlobalStyles);
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
        size={dynamicScale(42, false, 0.3)}
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

const getStyles = (GlobalStyles) =>
  StyleSheet.create({
  iconButton: {
    padding: 4,
    marginHorizontal: 4,
    borderRadius: 16,
  },
  selectedIconButton: {
    backgroundColor: GlobalStyles.colors.primary50,
  },
});
