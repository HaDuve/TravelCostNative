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

import { Configuration, OpenAIApi } from "openai";
import { Keys, loadKeys } from "../components/Premium/PremiumConstants";

export function chatGPTcontentKeywords(customCategory: string) {
  const content =
    "Give me a list of 50 strings containing single words that are semantically similar to " +
    customCategory +
    ". Choose the strings so any word that is vaguely related to " +
    customCategory +
    "can be mapped to this category in the context of a expense tracker. Be very careful to only add words to the list that contain activities or subjects in relation to" +
    customCategory +
    ', especially ones that you have to pay for. The format of your answer must be  ["string","string", ... ], not containing any flavour text or decoration at all, only the list.';
  return content;
}

export function chatGPTcontentGoodDealPost(
  product: string,
  price: string,
  currency: string,
  country: string
) {
  // Is 3500Rs a good price for Surfboard Rental 1 hour in Sri Lanka? Tell me the normal price range. Restrict your answer to one sentence of maximum 15 words.
  const content = `Is ${price} ${currency} a good price for ${product} in ${country}? Answer me in ${languageName} with facts.  Also tell me the normal price range.`;
  return content;
}

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
  curency: string;
}

export interface GPT_getKeywords extends GPT_RequestBody {
  requestType: GPT_RequestType.getKeywords;
  customCategory: string;
}

export async function getChatGPT_Response(requestBody: GPT_RequestBody) {
  const { OPENAI }: Keys = await loadKeys();
  const configuration = new Configuration({
    apiKey: OPENAI,
  });
  const openai = new OpenAIApi(configuration);

  const response = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "user",
        content: getGPT_Content(requestBody),
      },
    ],
    temperature: 0.75,
    max_tokens: 1280,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  });
  const responseText = response.data.choices[0].message;
  console.log("response.data:", response.data);
  console.log("responseText:", responseText);
  return responseText;
}

function getGPT_Content(requestBody: GPT_RequestBody) {
  switch (requestBody.requestType) {
    case GPT_RequestType.getGoodDeal:
      return chatGPTcontentGoodDealPost(
        (requestBody as GPT_getGoodDeal).product,
        (requestBody as GPT_getGoodDeal).price,
        (requestBody as GPT_getGoodDeal).currency,
        (requestBody as GPT_getGoodDeal).country
      );
    case GPT_RequestType.getKeywords:
      return chatGPTcontentKeywords(
        (requestBody as GPT_getKeywords).customCategory
      );
    case GPT_RequestType.getPrice:
      return chatGPTcontentGoodDealPost(
        (requestBody as GPT_getPrice).product,
        (requestBody as GPT_getPrice).curency,
        (requestBody as GPT_getPrice).country,
        (requestBody as GPT_getPrice).country
      );
  }
}
