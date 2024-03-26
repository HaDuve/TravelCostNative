import React, { View, Text, TextInput, StyleSheet } from "react-native";

import { GlobalStyles } from "../../constants/styles";
import PropTypes from "prop-types";
import { TouchableOpacity } from "react-native-gesture-handler";
import {
  dynamicScale,
  moderateScale,
  scale,
  verticalScale,
} from "../../util/scalingUtil";

function Input({
  label,
  keyboardType,
  secure,
  onUpdateValue,
  value,
  isInvalid,
  isInvalidInfoText,
  textContentType,
}) {
  const clearInput = value && value.length > 0 && (
    <TouchableOpacity
      style={styles.clearInputContainer}
      onPress={() => onUpdateValue("")}
    >
      <Text style={styles.clearInputText}>X</Text>
    </TouchableOpacity>
  );
  return (
    <View style={styles.inputContainer}>
      <Text style={[styles.label, isInvalid && styles.labelInvalid]}>
        {label}
      </Text>
      <View
        style={{
          flex: 1,
          minWidth: "100%",
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <TextInput
          style={[
            styles.input,
            isInvalid && styles.inputInvalid,
            { minWidth: "95%" },
          ]}
          autoCapitalize="none"
          keyboardType={keyboardType}
          secureTextEntry={secure}
          onChangeText={onUpdateValue}
          value={value}
          textContentType={textContentType}
          cursorColor={GlobalStyles.colors.textColor}
          selectionColor={GlobalStyles.colors.primary700}
          placeholderTextColor={GlobalStyles.colors.textColor}
        />
        {clearInput}
      </View>
      {isInvalid && isInvalidInfoText && (
        <Text style={styles.errorText}>{isInvalidInfoText}</Text>
      )}
    </View>
  );
}

export default Input;

Input.propTypes = {
  label: PropTypes.string,
  keyboardType: PropTypes.string,
  secure: PropTypes.bool,
  onUpdateValue: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired,
  isInvalid: PropTypes.bool,
  isInvalidInfoText: PropTypes.string,
  textContentType: PropTypes.string,
};

const styles = StyleSheet.create({
  inputContainer: {
    minHeight: dynamicScale(50, false, 0.5),
    marginVertical: 8,
  },
  label: {
    color: GlobalStyles.colors.gray600,
    marginBottom: 4,
    fontSize: dynamicScale(14, false, 0.5),
  },
  labelInvalid: {
    color: GlobalStyles.colors.error500,
  },
  input: {
    paddingVertical: verticalScale(8),
    paddingHorizontal: dynamicScale(6, false, 0.5),
    backgroundColor: GlobalStyles.colors.backgroundColor,
    borderRadius: 4,
    fontSize: dynamicScale(16, false, 0.5),
    borderBottomWidth: 1,
  },
  inputInvalid: {
    backgroundColor: GlobalStyles.colors.backgroundColor,
    borderBottomColor: GlobalStyles.colors.error300,
  },
  errorText: {
    fontSize: 12,
    color: GlobalStyles.colors.error500,
    fontWeight: "300",
    marginLeft: "2%",
  },
  clearInputContainer: { padding: 8 },
  clearInputText: { color: GlobalStyles.colors.textColor },
});
