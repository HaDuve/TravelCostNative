import { StyleSheet, Text, TextInput, View } from "react-native";

const Input = ({ label, textInputConfig }) => {
  return (
    <View>
      <Text>{label}</Text>
      <TextInput {...textInputConfig} />
    </View>
  );
};

export default Input;

const styles = StyleSheet.create({});
