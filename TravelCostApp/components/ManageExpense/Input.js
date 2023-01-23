/* eslint-disable react/react-in-jsx-scope */
import { Keyboard, StyleSheet, Text, TextInput, View } from "react-native";
import { GlobalStyles } from "../../constants/styles";

const Input = ({
  label,
  style,
  textInputConfig,
  invalid,
  autoFocus,
  inputStyle,
  placeholder = "",
  editable = true,
  selectTextOnFocus = true,
}) => {
  let inputStyles = [styles.input, inputStyle];
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
        placeholder={placeholder}
      />
    </View>
  );
};

export default Input;

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
