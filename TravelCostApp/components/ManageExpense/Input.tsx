/* eslint-disable react/react-in-jsx-scope */
import { Keyboard, StyleSheet, Text, TextInput, View } from "react-native";

import { GlobalStyles } from "../../constants/styles";
import { dynamicScale } from "../../util/scalingUtil";

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
        onChangeText={entryValue => {
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

const styles = StyleSheet.create({
  hasCurrencyStyle: {
    marginRight: dynamicScale(-10),
    paddingRight: dynamicScale(16),
  },
  input: {
    backgroundColor: GlobalStyles.colors.gray500,
    borderBottomColor: GlobalStyles.colors.gray700,
    borderBottomWidth: 1,
    borderRadius: 0,
    color: GlobalStyles.colors.primary700,
    fontSize: dynamicScale(18, false, 0.5),
    padding: dynamicScale(6),
    textAlign: "center",
  },
  inputContainer: {
    marginHorizontal: dynamicScale(16),
    marginVertical: dynamicScale(4, true),
  },
  inputMultiline: {
    minHeight: dynamicScale(100, true),
    textAlignVertical: "top",
  },
  invalidInput: {
    backgroundColor: GlobalStyles.colors.error50,
  },
  invalidLabel: {
    color: GlobalStyles.colors.error500,
  },
  label: {
    color: GlobalStyles.colors.textColor,
    fontSize: dynamicScale(12, false, 0.5),
    marginBottom: dynamicScale(4, true),
  },
});
