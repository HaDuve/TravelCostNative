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
}) => {
  const inputStyles = [styles.input, inputStyle];
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
  label: PropTypes.string.isRequired,
  style: PropTypes.object,
  textInputConfig: PropTypes.object.isRequired,
  invalid: PropTypes.bool,
  inputAccessoryViewID: PropTypes.string,
  autoFocus: PropTypes.bool,
  inputStyle: PropTypes.any,
  placeholder: PropTypes.string,
  editable: PropTypes.bool,
  selectTextOnFocus: PropTypes.bool,
};

const styles = StyleSheet.create({
  inputContainer: {
    marginHorizontal: 16,
    marginVertical: 4,
  },
  label: {
    fontSize: 12,
    color: GlobalStyles.colors.textColor,
    marginBottom: 4,
  },
  input: {
    backgroundColor: GlobalStyles.colors.gray500,
    color: GlobalStyles.colors.primary700,
    padding: 6,
    borderRadius: 0,
    fontSize: 18,
    borderBottomColor: GlobalStyles.colors.gray700,
    borderBottomWidth: 1,
    textAlign: "center",
  },
  inputMultiline: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  invalidLabel: {
    color: GlobalStyles.colors.error500,
  },
  invalidInput: {
    backgroundColor: GlobalStyles.colors.error50,
  },
});
