import * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
// import { GiftedChat, IMessage } from "react-native-gifted-chat";
import { useChatGpt } from "react-native-chatgpt";
import { Button, Snackbar } from "react-native-paper";
import { Dimensions, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

const CHAT_GPT_THUMBNAIL_URL =
  "https://styles.redditmedia.com/t5_7hqomg/styles/communityIcon_yyc98alroh5a1.jpg?width=256&s=cb48e1046acd79d1cc52b59b34ae56b0c1a9b4b8";
const CHAT_GPT_ID = "CHAT_GPT_ID";

const createBotMessage = (text: string) => {
  return {
    _id: String(Date.now()),
    text,
    createdAt: new Date(),
    user: {
      _id: CHAT_GPT_ID,
      name: "react-native-chatgpt",
      avatar: CHAT_GPT_THUMBNAIL_URL,
    },
  };
};

const Chat = () => {
  const { sendMessage } = useChatGpt();
  const insets = useSafeAreaInsets();
  // const [messages, setMessages] = useState<IMessage[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const messageId = useRef("");
  const conversationId = useRef("");
  const navigation = useNavigation();

  // useEffect(() => {
  //   setMessages([createBotMessage("Ask me anything :)")]);
  // }, []);

  // useEffect(() => {
  //   if (messages.length) {
  //     const lastMessage = messages[0];
  //     if (!lastMessage || lastMessage.user._id === CHAT_GPT_ID) return;

  //     setMessages((prevMessages) => [createBotMessage("..."), ...prevMessages]);
  //   }
  // }, [messages]);

  // useEffect(() => {
  //   const lastMessage = messages[0];
  //   if (
  //     lastMessage &&
  //     lastMessage.user._id === CHAT_GPT_ID &&
  //     lastMessage.text === "..."
  //   ) {
  //     sendMessage({
  //       message: messages[1]?.text as string,
  //       options:
  //         messageId.current && conversationId.current
  //           ? {
  //               messageId: messageId.current,
  //               conversationId: conversationId.current,
  //             }
  //           : undefined,
  //       onAccumulatedResponse: (accumulatedResponse) => {
  //         messageId.current = accumulatedResponse.messageId;
  //         conversationId.current = accumulatedResponse.conversationId;
  //         // Attach to last message
  //         setMessages((previousMessages) => {
  //           const newMessages = [...previousMessages];
  //           newMessages[0] = {
  //             ...previousMessages[0],
  //             text: accumulatedResponse.message,
  //           };
  //           return newMessages;
  //         });
  //       },
  //       onError: (e) => {
  //         setErrorMessage(`${e.statusCode} ${e.message}`);
  //         setMessages((previousMessages) => {
  //           const newMessages = [...previousMessages];
  //           newMessages[0] = {
  //             ...previousMessages[0],
  //             text: "Sorry, I couldn't process your request",
  //           };
  //           return newMessages;
  //         });
  //       },
  //     });
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [messages]);

  // const onSend = useCallback((msgs: IMessage[] = []) => {
  //   // setMessages((previousMessages) =>
  //   // GiftedChat.append(previousMessages, msgs)
  //   console.log("GiftedChat not installed");
  //   // );
  // }, []);

  return (
    <View style={styles.container}>
      {/* <GiftedChat
        messages={messages}
        onSend={onSend}
        user={{
          _id: 1,
        }}
      /> */}
      <Snackbar
        visible={!!errorMessage}
        onDismiss={() => setErrorMessage("")}
        style={[
          styles.snackbar,
          { top: -Dimensions.get("window").height + insets.top + 32 },
        ]}
        duration={3000}
      >
        {errorMessage}
      </Snackbar>
      <Button onPress={() => navigation.pop()}>Back</Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  snackbar: {
    backgroundColor: "red",
    position: "absolute",
    left: 0,
    right: 0,
  },
});

export default Chat;
