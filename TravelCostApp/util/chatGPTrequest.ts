// import { REACT_APP_GPT_API_KEY } from "@env";
const GPT_API_KEY = "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";
//  "ee892f25f1msh7b58e66c617672dp1d7c37jsn9339224154d5";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { LANGUAGE_LIST } from "../i18n/languageList";
import { en, de, fr, ru } from "../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";
const languageObj = LANGUAGE_LIST.find(
  (language) => language.code === i18n.locale
);
const languageName = languageObj?.name;
// console.log("languageName:", languageName);

import { Configuration, OpenAIApi } from "openai";
import { Keys, loadKeys } from "../components/Premium/PremiumConstants";
import safeLogError from "./error";

export enum GPT_RequestType {
  "getGoodDeal",
  "getKeywords",
  "getPrice",
}

export interface GPT_RequestBody {
  requestType: GPT_RequestType;
}

export interface GPT_getGoodDeal extends GPT_RequestBody {
  requestType: GPT_RequestType.getGoodDeal;
  product: string;
  price: string;
  currency: string;
  country: string;
}
export interface GPT_getPrice extends GPT_RequestBody {
  requestType: GPT_RequestType.getPrice;
  product: string;
  country: string;
  currency: string;
}

export interface GPT_getKeywords extends GPT_RequestBody {
  requestType: GPT_RequestType.getKeywords;
  customCategory: string;
}

function chatGPTcontentKeywords(customCategory: string) {
  return (
    "Give me a list of 50 strings containing single words that are semantically similar to " +
    customCategory +
    ". Choose the strings so any word that is vaguely related to " +
    customCategory +
    "can be mapped to this category in the context of a expense tracker. Be very careful to only add words to the list that contain activities or subjects in relation to" +
    customCategory +
    ', especially ones that you have to pay for. The format of your answer must be  ["string","string", ... ], not containing any flavour text or decoration at all, only the list.'
  );
}

function chatGPTcontentGoodDealPost(
  product: string,
  price: string,
  currency: string,
  country: string
) {
  return `Tell me: (Is ${price} ${currency} a good price for ${product} in ${country}?.) IF ${product} is not a recognizable word then => (Only return a very short and funny and creative and over-the-top-comedical and satirical answer. Ignore the rest of the prompt) // ELSE: IF ${product} is a recognizable word then => (Tell me the usual price range. Also give me some interesting or helpful facts about ${product} in ${country}.)`;
}

function chatGPTcontentPrice(
  product: string,
  country: string,
  currency: string
) {
  return `Tell me: (the usual price range for ${product} in ${country} in ${currency}.) IF ${product} is not a recognizable word then => (Only return a very short and funny and creative and over-the-top-comedical and satirical answer. Ignore the rest of the prompt) // ELSE:  IF ${product} is a recognizable word then => (Tell me the usual price range. Also give me some interesting or helpful facts about ${product} in ${country}.)`;
}

function getGPT_Content(requestBody: GPT_RequestBody) {
  switch (requestBody.requestType) {
    case GPT_RequestType.getGoodDeal:
      // console.log("requestType:", GPT_RequestType.getGoodDeal);
      return chatGPTcontentGoodDealPost(
        (requestBody as GPT_getGoodDeal).product,
        (requestBody as GPT_getGoodDeal).price,
        (requestBody as GPT_getGoodDeal).currency,
        (requestBody as GPT_getGoodDeal).country
      );
    case GPT_RequestType.getKeywords:
      // console.log("requestType:", GPT_RequestType.getKeywords);
      return chatGPTcontentKeywords(
        (requestBody as GPT_getKeywords).customCategory
      );
    case GPT_RequestType.getPrice:
      // console.log("requestType:", GPT_RequestType.getPrice);
      return chatGPTcontentPrice(
        (requestBody as GPT_getPrice).product,
        (requestBody as GPT_getPrice).country,
        (requestBody as GPT_getPrice).country
      );
  }
}

export async function getChatGPT_Response(requestBody: GPT_RequestBody) {
  const { OPENAI }: Keys = await loadKeys();
  const configuration = new Configuration({
    apiKey: OPENAI,
  });
  const openai = new OpenAIApi(configuration);

  try {
    const response = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a helpful and experienced traveller. Answer me in ${languageName}. Dont answer the meta-aspects/instructions literally, only give helpful information and advice.`,
        },
        {
          role: "user",
          content: getGPT_Content(requestBody),
        },
      ],
      temperature: 0.75,
      max_tokens: 1000,
      top_p: 0.9,
      frequency_penalty: 0.25,
      presence_penalty: 0.15,
    });
    const responseText = response.data.choices[0].message;
    // console.log("response.data: gpt-4:", response.data);
    // console.log("responseText: gpt-4:", responseText);
    return responseText;
  } catch (error) {
    try {
      const response = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: getGPT_Content(requestBody),
          },
        ],
        temperature: 0.75,
        max_tokens: 2780,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      });
      const responseText = response.data.choices[0].message;
      // console.log("response.data: gpt-3.5-turbo:", response.data);
      // console.log("responseText: gpt-3.5-turbo:", responseText);
    } catch (error) {
      safeLogError(error);
      return "Sorry, I am not sure about that.";
    }
  }
}
