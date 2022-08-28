import { StyleSheet, Picker, Text, View } from "react-native";
import { GlobalStyles } from "../../constants/styles";

const ExpensePicker = ({
  label,
  style,
  selectedValue,
  onValueChange,
  invalid,
  inputStyle,
  children,
}) => {
  return (
    <View style={[styles.inputContainer, style]}>
      <Text style={[styles.label, invalid && styles.invalidLabel]}>
        {label}
      </Text>
      <Picker
        style={[styles.input, inputStyle, invalid && styles.invalidInput]}
        selectedValue={selectedValue}
      >
        {children}
      </Picker>
    </View>
  );
};

export default ExpensePicker;

const styles = StyleSheet.create({
  inputContainer: {
    flex: 1,
    paddingTop: 40,
    alignItems: "center",
  },
  label: {
    fontSize: 12,
    color: GlobalStyles.colors.textColor,
    marginBottom: 4,
  },
  input: {
    height: 50,
    width: 150,
    backgroundColor: GlobalStyles.colors.gray500,
    color: GlobalStyles.colors.primary700,
    padding: 6,
    borderRadius: 0,
    fontSize: 18,
    borderBottomColor: GlobalStyles.colors.gray700,
    borderBottomWidth: 1,
  },
  invalidLabel: {
    color: GlobalStyles.colors.error500,
  },
  invalidInput: {
    backgroundColor: GlobalStyles.colors.error50,
  },
});
