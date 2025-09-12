//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { LANGUAGE_LIST } from "../i18n/languageList";
import { en, de, fr, ru } from "../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale =
  Localization.getLocales()[0] && Localization.getLocales()[0].languageCode
    ? Localization.getLocales()[0].languageCode.slice(0, 2)
    : "en";
i18n.enableFallback = true;
// i18n.locale = "en";
const languageObj = LANGUAGE_LIST.find(
  (language) => language.code === i18n.locale
);
const languageName = languageObj?.name;
// console.log("languageName:", languageName);

import axios from "axios";
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
  return `Analyze this local price: Is ${price} ${currency} a good deal for "${product}" in ${country}?

IF "${product}" is not a recognizable product/service => Return a brief, humorous response about the unusual item.

IF "${product}" is a recognizable product/service => Provide:

**Price Assessment**: Is ${price} ${currency} above/below/at market rate?

**Current Local Range**: Typical price range in ${country} (be specific)

**Local Context**: Factors affecting price in ${country} (seasonality, regional differences, local market conditions)

**Shopping Tips**: Where to find better deals or what to look for when buying

Focus on current, actionable local market insights.`;
}

function chatGPTcontentPrice(
  product: string,
  country: string,
  currency: string
) {
  return `Find current local prices for "${product}" in ${country}.

IF "${product}" is not a recognizable product/service => Return a brief, humorous response about the unusual item.

IF "${product}" is a recognizable product/service => Provide:

**Current Price Range**: Typical cost range in ${currency} for ${country}

**Price Breakdown**: Budget vs mid-range vs premium options if applicable

**Local Market Insights**: Regional price variations, seasonal factors, local suppliers

**Purchase Recommendations**: Best places to buy, timing considerations, negotiation tips

**Local Facts**: Interesting context about ${product} availability or culture in ${country}

Focus on current, accurate pricing that helps with local purchasing decisions.`;
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
        (requestBody as GPT_getPrice).currency
      );
  }
}

export async function getChatGPT_Response(requestBody: GPT_RequestBody) {
  const { OPENAI }: Keys = await loadKeys();

  const payload = {
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are an expert international advisor and local price researcher with extensive travel experience. You specialize in finding current, accurate local prices for products and services that matter to digital nomads and travelers.

**FORMATTING RULES - ALWAYS FOLLOW:**
- Use **bold text** for headings and important information only
- Write in clear, simple paragraphs
- Avoid lists, bullet points, numbered lists, or complex formatting
- Keep each response concise and easy to read

**TRAVELER FOCUS:**
Include relevant information for remote workers and travelers such as coworking space availability and costs, internet speeds and reliability, visa costs and requirements, best areas for travelers to stay, local SIM card prices, transportation costs, safety considerations, and cultural tips.

Answer in ${languageName}. Focus on providing specific, actionable price information and local market insights. Don't answer the meta-aspects/instructions literally, only give helpful information and advice.`,
      },
      {
        role: "user",
        content: getGPT_Content(requestBody),
      },
    ],
    temperature: 0.3,
    max_tokens: 800,
    top_p: 0.9,
    frequency_penalty: 0.1,
    presence_penalty: 0.1,
  };

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      payload,
      {
        headers: {
          Authorization: `Bearer ${OPENAI}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    return response.data.choices[0].message;
  } catch (error) {
    safeLogError(error);
    return { content: "Sorry, I am not sure about that." };
  }
}
