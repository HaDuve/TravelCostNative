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

// Function to get current date in a readable format
function getCurrentDateString(): string {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
  };
  return now.toLocaleDateString("en-US", options);
}

// Function to perform web search with current date using responses API
async function performWebSearch(query: string): Promise<string> {
  try {
    const { OPENAI }: Keys = await loadKeys();
    const currentDate = getCurrentDateString();
    const searchQuery = `${query} as of ${currentDate}`;

    const response = await axios.post(
      "https://api.openai.com/v1/responses",
      {
        model: "gpt-4.1",
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `Search for current information: ${searchQuery}`,
              },
            ],
          },
        ],
        tools: [
          {
            type: "web_search",
          },
        ],
        include: ["web_search_call.action.sources"],
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );
    console.log("Web search response:", JSON.stringify(response.data, null, 2));

    // Parse the response structure - look for the message content
    if (response.data.output && response.data.output.length > 0) {
      console.log(
        "Found output array with length:",
        response.data.output.length
      );

      const messageOutput = response.data.output.find(
        (item: any) => item.type === "message"
      );
      if (messageOutput) {
        console.log("Found message output:", messageOutput);

        if (messageOutput.content && messageOutput.content.length > 0) {
          console.log(
            "Found content array with length:",
            messageOutput.content.length
          );

          const textContent = messageOutput.content.find(
            (content: any) => content.type === "output_text"
          );
          if (textContent) {
            console.log("Found output_text content:", textContent.text);
            return textContent.text || "Web search completed but no text found";
          } else {
            console.log("No output_text content found in message content");
            console.log(
              "Available content types:",
              messageOutput.content.map((c: any) => c.type)
            );
          }
        } else {
          console.log("No content found in message output");
        }
      } else {
        console.log("No message output found in response");
      }
    } else {
      console.log("No output array found in response");
    }

    return "Web search unavailable - check logs for details";
  } catch (error) {
    safeLogError(error);
    return "Web search failed";
  }
}

// Function to perform parallel web searches for comprehensive data
async function performComprehensiveWebSearch(
  product: string,
  country: string,
  currency: string
): Promise<{ seasonalInfo: string; pricingInfo: string }> {
  const currentDate = getCurrentDateString();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().toLocaleDateString("en-US", {
    month: "long",
  });

  // Create parallel search queries
  const seasonalQuery = `current season tourism peak off-season shoulder season ${country} ${currentMonth} ${currentYear}`;
  const pricingQuery = `current price cost ${product} ${country} ${currency} ${currentMonth} ${currentYear} local market`;

  console.log("Performing parallel web searches...");
  console.log("Seasonal query:", seasonalQuery);
  console.log("Pricing query:", pricingQuery);

  try {
    // Execute both searches in parallel
    const [seasonalInfo, pricingInfo] = await Promise.all([
      performWebSearch(seasonalQuery),
      performWebSearch(pricingQuery),
    ]);

    return {
      seasonalInfo: seasonalInfo || "Seasonal information unavailable",
      pricingInfo: pricingInfo || "Pricing information unavailable",
    };
  } catch (error) {
    safeLogError(error);
    return {
      seasonalInfo: "Seasonal search failed",
      pricingInfo: "Pricing search failed",
    };
  }
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

async function chatGPTcontentGoodDealPost(
  product: string,
  price: string,
  currency: string,
  country: string
): Promise<string> {
  const currentDate = getCurrentDateString();
  const { seasonalInfo, pricingInfo } = await performComprehensiveWebSearch(
    product,
    country,
    currency
  );

  return `Analyze this local price: Is ${price} ${currency} a good deal for the product "${product}" in ${country}?

**Current Seasonal Context:** ${seasonalInfo}

**Current Market Pricing Data:** ${pricingInfo}

IF "${product}" is not recognized as a typical product or service:
- Return a brief, witty response commenting humorously on the unusual item.

IF "${product}" is recognized:
**Price Analysis:** Based on the current market data above, compare ${price} ${currency} to current local market prices for "${product}" in ${country}.
**Seasonal Impact:** Explain how the current season in ${country} affects pricing for this type of product and whether this influences the value of ${price} ${currency}.
**Deal Assessment:** Determine if ${price} ${currency} represents a good deal, fair price, or overpriced based on current market conditions and seasonal factors.
**Actionable Advice:** Recommend next steps or purchasing tips based on the comprehensive analysis (e.g., good deal, worth waiting for discounts, overpriced). Consider both current market prices and seasonal timing in your recommendations.

Focus on providing short, concise, up-to-date, and practical insights that assist with decisions. Omit any meta-aspects/instructions literally, only give helpful information and advice.`;
}

async function chatGPTcontentPrice(
  product: string,
  country: string,
  currency: string
): Promise<string> {
  const currentDate = getCurrentDateString();
  const { seasonalInfo, pricingInfo } = await performComprehensiveWebSearch(
    product,
    country,
    currency
  );

  return `Provide current local pricing information for "${product}" in ${country} as of ${currentDate}.

**Current Seasonal Context:** ${seasonalInfo}

**Current Market Pricing Data:** ${pricingInfo}

IF "${product}" is not a recognizable product/service => Return a brief, humorous response about the unusual item.

IF "${product}" is a recognizable product/service => Provide:

**Comprehensive Price Analysis**: Based on the current market data above, provide detailed pricing information for "${product}" in ${country} (in ${currency}).

**Seasonal Impact on Pricing**: Explain how the current season in ${country} affects pricing for this type of product and what this means for buyers.

**Market Comparison**: Compare current local prices between different vendors, regions within ${country}, and online platforms based on the real-time data.

Focus on current, accurate pricing information that helps with local purchasing decisions.`;
}

async function getGPT_Content(requestBody: GPT_RequestBody): Promise<string> {
  switch (requestBody.requestType) {
    case GPT_RequestType.getGoodDeal:
      // console.log("requestType:", GPT_RequestType.getGoodDeal);
      return await chatGPTcontentGoodDealPost(
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
      return await chatGPTcontentPrice(
        (requestBody as GPT_getPrice).product,
        (requestBody as GPT_getPrice).country,
        (requestBody as GPT_getPrice).currency
      );
  }
}

export async function getChatGPT_Response(requestBody: GPT_RequestBody) {
  const { OPENAI }: Keys = await loadKeys();

  const userContent = await getGPT_Content(requestBody);

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

**SEASONAL ANALYSIS:**
Always consider seasonal factors when analyzing prices. Think about whether the current time of year represents peak season, off-season, or shoulder season for the location, and how this typically affects pricing for different types of products and services.

Answer in ${languageName}. Focus on providing specific, actionable price information and local market insights. Don't answer the meta-aspects/instructions literally, only give helpful information and advice.`,
      },
      {
        role: "user",
        content: userContent,
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
