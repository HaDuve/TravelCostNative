import { StyleSheet, Text, View, TextInput, Button } from 'react-native';

export default function App() {
  return (
    <View style={styles.appContainer}>
      <View style={styles.inputContainer}>
        <TextInput style={styles.textInput} placeholder="Your new Cost!"></TextInput>
        <Button title="New Cost"></Button>
      </View>
      <View>
        <Text>List of goals...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    padding: 50
  },
  inputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  textInput: {
    borderColor: '#000000',
    borderWidth: 1,
    width: "70%",
    marginRight: 10,
    marginBottom: 10,
    padding: 8,
  },
});
