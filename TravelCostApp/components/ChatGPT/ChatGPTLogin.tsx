import * as React from "react";
import { Image, StyleSheet, View } from "react-native";
import { Button, Headline } from "react-native-paper";
import { useChatGpt } from "react-native-chatgpt";
import { GlobalStyles } from "../../constants/styles";

const Login: React.FC = () => {
  //   const { login } = useChatGpt();
  const stuff = useChatGpt();
  console.log("stuff:", stuff);
  return (
    <View style={styles.container}>
      <Image
        style={styles.image}
        source={require("../../assets/chatgpt-logo.jpeg")}
      />
      <Headline
        style={{ fontWeight: "bold", alignSelf: "center", marginBottom: 128 }}
      >
        RN ChatGPT Example
      </Headline>
      <Button
        contentStyle={{
          height: 56,
          backgroundColor: GlobalStyles.colors.primary400,
        }}
        labelStyle={{ fontSize: 16 }}
        mode="contained"
        onPress={() => {
          console.log("Login");
          stuff.login();
        }}
      >
        Login
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 32,
  },
  image: {
    alignSelf: "center",
    width: 128,
    height: 128,
    resizeMode: "contain",
    borderRadius: 64,
    marginBottom: 32,
  },
});

export default Login;
