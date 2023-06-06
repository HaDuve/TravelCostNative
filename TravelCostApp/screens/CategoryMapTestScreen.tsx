import { StyleSheet, Text, View } from "react-native";
import React, { useEffect } from "react";
import { TextInput } from "react-native-paper";
import { FlatList } from "react-native-gesture-handler";
import axios from "axios";
import { async } from "../util/tourUtil";

const CategoryMapTestScreen = () => {
  const [text, setText] = React.useState("Electronics Accessories");
  const [answer, setAnswer] = React.useState("Electronics Accessories");
  //   const w2v = require("word2vec");
  //   w2v.loadModel("./vectors.txt", function (error, model) {
  //     console.log(model);
  //   });
  const [keywords, setKeywords] = React.useState<string[]>(["test1", "test2"]);
  //   const tokenizer = new natural.WordTokenizer();
  const categoryName = text;
  //   const tokens = tokenizer.tokenize(categoryName);
  //   setKeywords(tokens);

  useEffect(() => {
    const options = {
      method: "POST",
      url: "https://chatgpt53.p.rapidapi.com/",
      headers: {
        "content-type": "application/json",
        "X-RapidAPI-Key": "ee892f25f1msh7b58e66c617672dp1d7c37jsn9339224154d5",
        "X-RapidAPI-Host": "chatgpt53.p.rapidapi.com",
      },
      data: {
        messages: [
          {
            role: "user",
            content:
              "Give me a list of 50 strings containing words that are semantically similar to " +
              "party" +
              ". Choose the strings so any word that is vaguely related to " +
              "party" +
              ' can be mapped to this category in the context of a expense tracker. the format of your answer should be  ["string","string", ... ], not containing any flavour text or decoration at all. only the list',
          },
        ],
        temperature: 1,
      },
    };

    async function getKeywords() {
      try {
        const response = await axios.request(options);
        console.log(response.data);
        if (response.data.choices[0].message.content) {
          console.log(response.data.choices[0].message.content);
          setAnswer(response.data.choices[0].message.content);
        }
      } catch (error) {
        console.error(error);
      }
    }
    getKeywords();
  }, [text]);

  return (
    <View>
      <Text>CategoryMapTestScreen</Text>
      <TextInput
        label="Email"
        value={text}
        onChangeText={(text) => setText(text)}
      ></TextInput>
      <Text>{answer}</Text>
      {/* <FlatList
        data={keywords}
        renderItem={({ item }) => <Text>{item}</Text>}
        keyExtractor={(item) => item}
      ></FlatList> */}
    </View>
  );
};

export default CategoryMapTestScreen;

const styles = StyleSheet.create({});
