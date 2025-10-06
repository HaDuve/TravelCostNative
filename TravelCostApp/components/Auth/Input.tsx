import { StyleSheet, Text, TextInput, View } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";

import { GlobalStyles } from "../../constants/styles";
import { dynamicScale } from "../../util/scalingUtil";

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

const styles = StyleSheet.create({
  clearInputContainer: { padding: 8 },
  clearInputText: { color: GlobalStyles.colors.textColor },
  errorText: {
    color: GlobalStyles.colors.error500,
    fontSize: 12,
    fontWeight: "300",
    marginLeft: "2%",
  },
  input: {
    backgroundColor: GlobalStyles.colors.backgroundColor,
    borderBottomWidth: 1,
    borderRadius: 4,
    fontSize: dynamicScale(16, false, 0.5),
    paddingHorizontal: dynamicScale(6, false, 0.5),
    paddingVertical: dynamicScale(8, true),
  },
  inputContainer: {
    marginVertical: 8,
    minHeight: dynamicScale(50, false, 0.5),
  },
  inputInvalid: {
    backgroundColor: GlobalStyles.colors.backgroundColor,
    borderBottomColor: GlobalStyles.colors.error300,
  },
  label: {
    color: GlobalStyles.colors.gray600,
    fontSize: dynamicScale(14, false, 0.5),
    marginBottom: 4,
  },
  labelInvalid: {
    color: GlobalStyles.colors.error500,
  },
});
