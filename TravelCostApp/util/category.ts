//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { GlobalStyles } from "../constants/styles";
import { en, de, fr, ru } from "../i18n/supportedLanguages";
import { asyncStoreGetObject } from "../store/async-storage";
import { CATEGORY_KEYWORDS } from "./categoryKeywords";
import { ExpenseData } from "./expense";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

// interface of category objects with id, name, iconName and color
export interface Category {
  // name is deprecated, use catString instead
  name?: string;
  id?: number;
  cat: string;
  catString?: string;
  icon: string;
  color?: string;
  keywords?: string[];
}

export function getCatSymbol(cat: string) {
  switch (cat) {
    case "food":
    case "Food":
    case i18n.t("catFoodString"):
      return "fast-food-outline";
    case "national-travel":
    case i18n.t("catNatTravString"):
      return "car-outline";
    case "international-travel":
    case i18n.t("catIntTravString"):
      return "airplane-outline";

    case "accomodation":
    case i18n.t("catAccoString"):
      return "bed-outline";
    case "other":
    case i18n.t("catOtherString"):
      return "basket-outline";
    case "traveller":
      return "happy-outline";
    case "undefined":
      return "help-outline";

    // TODO: change this hotfix for GMR categories to real new categories (dynamically added)
    case "ANREISE":
      return "globe-outline";
    case "INLANDSFLUG":
      return "airplane-outline";
    case "FORTBEWEGUNG":
      return "car-outline";
    case "TOUREN & AKTIVITÄTEN":
      return "ios-bus-outline";
    case "UNTERKUNFT":
      return "bed-outline";
    case "ESSEN & TRINKEN":
      return "fast-food-outline";
    case "VISUM":
      return "calendar-outline";
    case "SIM KARTE":
      return "call-outline";
    case "VERGNÜGEN":
      return "happy-outline";
    default: {
      // if not, return "help-outline"
      // // console.log(`cat: ${cat} finally not found in categoryList`);
      return "help-outline";
    }
  }
}

export async function getCatSymbolAsync(cat: string) {
  const catList = await asyncStoreGetObject("categoryList");
  if (catList) {
    const catObj = catList.find((catObj: Category) => catObj.catString === cat);
    if (catObj) {
      return catObj.icon;
    }
  }
  return getCatSymbol(cat);
}

export function getCatString(cat: string) {
  switch (cat) {
    case "food":
      return i18n.t("catFoodString");
    case "Food":
      return i18n.t("catFoodString");
    case "national-travel":
      return i18n.t("catNatTravString");
    case "international-travel":
      return i18n.t("catIntTravString");
    case "accomodation":
      return i18n.t("catAccoString");
    case "other":
      return i18n.t("catOtherString");
    case "undefined":
      return "Undefined";
    default: {
      return cat;
    }
  }
}

function getMaxCategoryMap(categoryMap: any) {
  // return the category with the most matches
  let maxCategory = "";
  let maxCount = -1;
  Object.keys(categoryMap).forEach((category) => {
    if (categoryMap[category] > maxCount) {
      maxCount = categoryMap[category];
      maxCategory = category;
    }
  });
  if (maxCategory)
    // console.log("mapDescriptionToCategory ~ maxCategory:", maxCategory);
    return maxCategory;
}

export function mapDescriptionToCategory(
  description: string,
  categories: Category[],
  expenses: ExpenseData[]
) {
  if (!description) return "";
  if (!categories) return "";
  if (description?.length < 3) return "";
  const descriptionWords = description.trim().toLowerCase().split(" ");

  // check if the description contains a keyword of a category
  const categoryMap = {};
  categories.forEach((category) => {
    const keywords = category.keywords ?? [];
    keywords.push(category.cat);
    keywords.forEach((keyword) => {
      const keywordsSplit = keyword.trim().toLowerCase().split(" ");
      keywordsSplit.forEach((word) => {
        if (descriptionWords.includes(word)) {
          // console.log("match found: ", word, "in", descriptionWords);
          categoryMap[category.cat] = (categoryMap[category.cat] || 0) + 1;
        }
      });
    });
  });

  // check if the description matches the description of an expense
  expenses?.forEach((expense) => {
    const splitDescription = expense.description
      .trim()
      .toLowerCase()
      .split(" ");
    splitDescription.forEach((word) => {
      if (descriptionWords.includes(word)) {
        // console.log(description, "found a match with: ", expense.description);
        categoryMap[expense.category] =
          (categoryMap[expense.category] || 0) + 1;
      }
    });
  });
  const maxCategory = getMaxCategoryMap(categoryMap);

  return maxCategory;
}

export const DEFAULTCATEGORIES: Category[] = [
  {
    id: 1,
    icon: "fast-food-outline",
    color: GlobalStyles.colors.textColor,
    cat: "food",
    catString: i18n.t("catFoodString"),
    keywords: CATEGORY_KEYWORDS.find(
      (CATEGORY_KEYWORD) => CATEGORY_KEYWORD.cat === "food"
    ).keywords,
  },
  {
    id: 2,
    icon: "airplane-outline",
    color: GlobalStyles.colors.textColor,
    cat: "international-travel",
    catString: i18n.t("catIntTravString"),
    keywords: CATEGORY_KEYWORDS.find(
      (CATEGORY_KEYWORD) => CATEGORY_KEYWORD.cat === "international-travel"
    ).keywords,
  },
  {
    id: 3,
    icon: "bed-outline",
    color: GlobalStyles.colors.textColor,
    cat: "accomodation",
    catString: i18n.t("catAccoString"),
    keywords: CATEGORY_KEYWORDS.find(
      (CATEGORY_KEYWORD) => CATEGORY_KEYWORD.cat === "accomodation"
    ).keywords,
  },
  {
    id: 4,
    icon: "car-outline",
    color: GlobalStyles.colors.textColor,
    cat: "national-travel",
    catString: i18n.t("catNatTravString"),
    keywords: CATEGORY_KEYWORDS.find(
      (CATEGORY_KEYWORD) => CATEGORY_KEYWORD.cat === "national-travel"
    ).keywords,
  },
  {
    id: 5,
    icon: "basket-outline",
    color: GlobalStyles.colors.textColor,
    cat: "other",
    catString: i18n.t("catOtherString"),
    keywords: CATEGORY_KEYWORDS.find(
      (CATEGORY_KEYWORD) => CATEGORY_KEYWORD.cat === "other"
    ).keywords,
  },
  {
    id: 6,
    icon: "add-outline",
    color: GlobalStyles.colors.textColor,
    cat: "newCat",
    catString: i18n.t("catNewString"),
  },
];
