// import { GPT_API_KEY } from "@env";
const GPT_API_KEY = "ee892f25f1msh7b58e66c617672dp1d7c37jsn9339224154d5";

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
  const content = `Is ${price} ${currency} a good price for ${product} in ${country}? Also tell me the normal price range. Restrict your answer to two sentences of maximum 15 words. Translate me your answer in ${languageName}.`;
  return content;
}

export function chatGPT_getKeywords(customCategory: string) {
  const options = {
    method: "POST",
    url: "https://chatgpt53.p.rapidapi.com/",
    headers: {
      "content-type": "application/json",
      "X-RapidAPI-Key": GPT_API_KEY,
      "X-RapidAPI-Host": "chatgpt53.p.rapidapi.com",
    },
    data: {
      messages: [
        {
          role: "user",
          content: chatGPTcontentKeywords(customCategory),
        },
      ],
      temperature: 1,
    },
  };
  return options;
}

export function chatGPT_getGoodDeal(
  product: string,
  price: string,
  currency: string,
  country: string
) {
  const options = {
    method: "POST",
    url: "https://chatgpt53.p.rapidapi.com/",
    headers: {
      "content-type": "application/json",
      "X-RapidAPI-Key": GPT_API_KEY,
      "X-RapidAPI-Host": "chatgpt53.p.rapidapi.com",
    },
    data: {
      messages: [
        {
          role: "user",
          content: chatGPTcontentGoodDealPost(
            product,
            price,
            currency,
            country
          ),
        },
      ],
      temperature: 1,
    },
  };
  return options;
}
