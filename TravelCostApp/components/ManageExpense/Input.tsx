/* eslint-disable react/react-in-jsx-scope */
import React, {
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { GlobalStyles } from "../../constants/styles";
import PropTypes from "prop-types";
import {
  dynamicScale,
  moderateScale,
  scale,
  verticalScale,
} from "../../util/scalingUtil";

const Input = ({
  label,
  style,
  textInputConfig,
  invalid,
  autoFocus,
  inputStyle,
  inputAccessoryViewID,
  placeholder = "",
  editable = true,
  selectTextOnFocus = true,
  hasCurrency = false,
}) => {
  const inputStyles = [
    styles.input,
    hasCurrency && styles.hasCurrencyStyle,
    inputStyle,
  ];
  if (textInputConfig && textInputConfig.multiline) {
    inputStyles.push(styles.inputMultiline);
  }

  return (
    <View style={[styles.inputContainer, style]}>
      <Text style={[styles.label, invalid && styles.invalidLabel]}>
        {label}
      </Text>
      <TextInput
        style={[inputStyles, invalid && styles.invalidInput]}
        returnKeyLabel="Done"
        returnKeyType="done"
        onSubmitEditing={Keyboard.dismiss}
        {...textInputConfig}
        autoFocus={autoFocus ? autoFocus : false}
        editable={editable}
        selectTextOnFocus={selectTextOnFocus}
        autoCorrect={false}
        inputAccessoryViewID={inputAccessoryViewID}
        placeholder={placeholder}
        onChangeText={(entryValue) => {
          // replacing , with . for decimal-pad
          if (textInputConfig.keyboardType === "decimal-pad") {
            textInputConfig.onChangeText(entryValue.replace(",", "."));
          } else {
            textInputConfig.onChangeText(entryValue);
          }
        }}
      />
    </View>
  );
};

export default Input;

Input.propTypes = {
  label: PropTypes.string,
  style: PropTypes.object,
  textInputConfig: PropTypes.object.isRequired,
  invalid: PropTypes.bool,
  inputAccessoryViewID: PropTypes.string,
  autoFocus: PropTypes.bool,
  inputStyle: PropTypes.any,
  placeholder: PropTypes.string,
  editable: PropTypes.bool,
  selectTextOnFocus: PropTypes.bool,
  hasCurrency: PropTypes.bool,
};

const styles = StyleSheet.create({
  inputContainer: {
    marginHorizontal: dynamicScale(16),
    marginVertical: verticalScale(4),
  },
  label: {
    fontSize: moderateScale(12),
    color: GlobalStyles.colors.textColor,
    marginBottom: verticalScale(4),
  },
  input: {
    backgroundColor: GlobalStyles.colors.gray500,
    color: GlobalStyles.colors.primary700,
    padding: dynamicScale(6),
    borderRadius: 0,
    fontSize: moderateScale(18),
    borderBottomColor: GlobalStyles.colors.gray700,
    borderBottomWidth: 1,
    textAlign: "center",
  },
  hasCurrencyStyle: {
    paddingRight: dynamicScale(16),
    marginRight: dynamicScale(-10),
  },
  inputMultiline: {
    minHeight: verticalScale(100),
    textAlignVertical: "top",
  },
  invalidLabel: {
    color: GlobalStyles.colors.error500,
  },
  invalidInput: {
    backgroundColor: GlobalStyles.colors.error50,
  },
});
