//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr } from "../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

// interface of category objects with id, name, iconName and color
export interface Category {
  id: number;
  cat: string;
  catString: string;
  icon: string;
  color: string;
}

export function getCatSymbol(cat: string) {
  switch (cat) {
    case "food":
      return "fast-food-outline";
    case "Food":
      return "fast-food-outline";
    case "national-travel":
      return "car-outline";
    case "international-travel":
      return "airplane-outline";
    case "accomodation":
      return "bed-outline";
    case "other":
      return "basket-outline";
    case "traveller":
      return "happy-outline";

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
    default:
      return "help-outline";
  }
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
    default: {
      if (cat == "") return cat;
      const capitalized = cat.charAt(0).toUpperCase() + cat.slice(1);
      return capitalized;
    }
  }
}
