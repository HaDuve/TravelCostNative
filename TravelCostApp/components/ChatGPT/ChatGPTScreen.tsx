import React, { ActivityIndicator, StyleSheet, View } from "react-native";
import { useChatGpt } from "react-native-chatgpt";
import ChatGPTChat from "./ChatGPTChat";
import Login from "./ChatGPTLogin";
import ChatGPTLogin from "./ChatGPTLogin";

const ChatGPTScreen = () => {
  const { status } = useChatGpt();
  console.log("ChatGPTScreen ~ status:", status);

  if (status === "initializing") return null;

  if (status === "logged-out" || status === "getting_auth_token") {
    return (
      <View style={{ flex: 1 }}>
        <Login />
        {status === "getting_auth_token" && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="white" />
          </View>
        )}
      </View>
    );
  }

  return <ChatGPTChat />;
};

export default ChatGPTScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
});
