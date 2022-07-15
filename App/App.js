import { StyleSheet, Text, View, Button } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.dummyText}>Hello World!</Text>
      <Text style={styles.dummyText}>Another Text</Text>
      <Button title="Save"></Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dummyText: {
    arginVertical: 16,
    borderWidth: 1,
    borderColor: 'blue',
    padding: 16,
    margin: 16,
  }
});
