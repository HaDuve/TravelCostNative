import { Ionicons } from "@expo/vector-icons";
import PropTypes from "prop-types";
import { StyleSheet, TouchableOpacity } from "react-native";

import { GlobalStyles } from "../../constants/styles";
import { dynamicScale } from "../../util/scalingUtil";

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

const styles = StyleSheet.create({
  iconButton: {
    borderRadius: 16,
    marginHorizontal: 4,
    padding: 4,
  },
  selectedIconButton: {
    backgroundColor: GlobalStyles.colors.primary50,
  },
});
