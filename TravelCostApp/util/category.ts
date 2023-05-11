//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { GlobalStyles } from "../constants/styles";
import { en, de, fr } from "../i18n/supportedLanguages";
import { asyncStoreGetObject } from "../store/async-storage";
const i18n = new I18n({ en, de, fr });
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
      // console.log(`cat: ${cat} finally not found in categoryList`);
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

export function mapDescriptionToCategory(
  description: string,
  categories: Category[]
) {
  const categoryMap = {};
  categories.forEach((category) => {
    const keywords = category.keywords ?? [];
    keywords.push(category.cat);
    keywords.forEach((keyword) => {
      if (description.toLowerCase().includes(keyword.toLowerCase())) {
        categoryMap[category.cat] = (categoryMap[category.cat] || 0) + 1;
      }
    });
  });
  let maxCategory = "";
  let maxCount = -1;
  Object.keys(categoryMap).forEach((category) => {
    if (categoryMap[category] > maxCount) {
      maxCount = categoryMap[category];
      maxCategory = category;
    }
  });
  console.log("mapDescriptionToCategory ~ maxCategory:", maxCategory);
  return maxCategory;
}

export const DEFAULTCATEGORIES: Category[] = [
  {
    id: 1,
    icon: "fast-food-outline",
    color: GlobalStyles.colors.textColor,
    cat: "food",
    catString: i18n.t("catFoodString"),
    keywords: [
      "restaurant",
      "groceries",
      "meal",
      "snack",
      "beverage",
      "coffee",
      "dessert",
      "takeout",
      "delivery",
      "catering",
      "street food",
      "hut",
      "pizza",
      "sushi",
      "ramen",
      "pho",
      "curry",
      "tacos",
      "burger",
      "hot dog",
      "fries",
      "chicken",
      "noodles",
      "rice",
      "stir-fry",
      "fried",
      "dumplings",
      "falafel",
      "wrap",
      "kebab",
      "gyro",
      "shawarma",
      "pasta",
      "seafood",
      "poke",
      "sandwich",
      "bagel",
      "croissant",
      "pancake",
      "waffle",
      "ice",
      "cream",
      "baklava",
      "pad thai",
      "restaurant",
      "groceries",
      "meal",
      "snack",
      "beverage",
      "coffee",
      "dessert",
      "takeout",
      "delivery",
      "catering",
      "street food",
      "pizza",
      "sushi",
      "ramen",
      "pho",
      "curry",
      "tacos",
      "burger",
      "hot dog",
      "fries",
      "chicken",
      "noodles",
      "rice",
      "stir-fry",
      "kebab",
      "gyro",
      "pasta",
      "seafood",
      "poke",
      "sandwich",
      "bagel",
      "croissant",
      "pancake",
      "waffle",
      "ice cream",
      "baklava",
      "pad thai",
      "curry",
      "roti",
      "rotti",
      "naan",
      "tandoori",
      "biryani",
      "masala",
      "dal",
      "paneer",
      "chana",
      "saag",
      "chutney",
      "samosa",
      "papadum",
      "lassi",
      "chai",
      "dosa",
      "idli",
      "paratha",
      "parata",
      "porridge",
      "tikka",
      "korma",
      "vindaloo",
      "butter",
      "chicken",
      "bowl",
      "smoothie",
      "burrito",
      "taco",
      "enchilada",
      "quesadilla",
      "tortilla",
      "chips",
      "salsa",
      "guacamole",
      "margarita",
      "mole",
      "churro",
      "tostada",
      "tamale",
      "empanada",
      "arepa",
      "patacon",
      "pabellon",
      "ceviche",
      "bandeja paisa",
      "aji",
      "pisco",
      "sangria",
      "paella",
      "tapas",
      "gazpacho",
      "tortilla",
      "gambas",
      "patatas",
      "croqueta",
      "churro",
      "flan",
      "churros",
      "chocolate",
      "beer",
      "sangria",
      "sambol",
      "juice",
      "kiribath",
      "milk",
      "breakfast",
      "lunch",
      "dinner",
      "brunch",
      "buffet",
      "dining",
      "cuisine",
      "plates",
      "cafe",
      "coffee",
      "bar",
      "pub",
      "bistro",
      "diner",
      "bakery",
      "deli",
      "food",
      "truck",
      "food",
      "court",
      "hall",
      "market",
      "stall",
      "stand",
      "cart",
      "vendor",
    ],
  },
  {
    id: 2,
    icon: "airplane-outline",
    color: GlobalStyles.colors.textColor,
    cat: "international-travel",
    catString: i18n.t("catIntTravString"),
    keywords: [
      "flight",
      "plane",
      "airline",
      "airport",
      "airfare",
      "ticket",
      "boat",
      "cruise",
      "visa",
      "passport",
      "tour",
      "language",
      "culture",
      "currency",
      "souvenir",
      "international",
      "duty-free",
      "currency exchange",
      "travel insurance",
      "baggage fees",
      "overseas",
      "language translator",
      "power adapter",
      "travel pillow",
      "earplugs",
      "eye mask",
      "compression socks",
      "neck pillow",
    ],
  },
  {
    id: 3,
    icon: "bed-outline",
    color: GlobalStyles.colors.textColor,
    cat: "accomodation",
    catString: i18n.t("catAccoString"),
    keywords: [
      "hotel",
      "hostel",
      "motel",
      "resort",
      "bed & breakfast",
      "apartment",
      "room",
      "lodging",
      "reservation",
      "amenity",
      "hotel",
      "motel",
      "hostel",
      "guesthouse",
      "airbnb",
      "resort",
      "camping",
      "glamping",
      "vacation",
      "apartment",
      "cabin",
      "villa",
      "boutique",
      "bed and breakfast",
      "bnb",
      "luxury",
      "budget",
      "pet-friendly",
      "family-friendly",
      "room service",
      "housekeeping",
      "laundry",
      "free wifi",
      "swimming pool",
      "concierge",
      "airport shuttle",
      "parking",
      "breakfast included",
    ],
  },
  {
    id: 4,
    icon: "car-outline",
    color: GlobalStyles.colors.textColor,
    cat: "national-travel",
    catString: i18n.t("catNatTravString"),
    keywords: [
      "rental",
      "train",
      "bus",
      "road",
      "trip",
      "fuel",
      "parking",
      "toll",
      "route",
      "vehicle",
      "transportation",
      "gas",
      "tolls",
      "public",
      "car",
      "bike",
      "scooter",
      "taxi",
      "ride",
      "share",
      "hiking",
      "guidebook",
      "maps",
    ],
  },
  {
    id: 5,
    icon: "basket-outline",
    color: GlobalStyles.colors.textColor,
    cat: "other",
    catString: i18n.t("catOtherString"),
    keywords: [
      "miscellaneous",
      "bill",
      "fee",
      "subscription",
      "entertainment",
      "shopping",
      "groceries",
      "health",
      "education",
      "personal",
      "care",
      "mobile",
      "phone",
      "plan",
      "internet service",
      "utilities",
      "rent",
      "mortgage",
      "home",
      "health",
      "life",
      "insurance",
      "pet expenses",
      "childcare",
      "school",
      "tuition",
      "books",
      "supplies",
      "subscriptions",
      "memberships",
      "gym membership",
      "streaming services",
      "e-books",
      "audiobooks",
      "podcast",
      "personal",
      "grooming",
      "clothing",
      "shoes",
      "accessories",
      "gifts",
      "donations",
      "taxes",
      "investment",
      "bank",
      "fees",
      "Toiletries",
      "Sunscreen",
      "Insect repellent",
      "First aid kit",
      "Bandages",
      "Pain relievers",
      "Cold medicine",
      "Allergy medicine",
      "Contact lens solution",
      "Glasses cleaner",
      "Hand sanitizer",
      "Tissues",
      "Wet wipes",
      "Batteries",
      "Flashlight",
      "Umbrella",
      "Rain poncho",
      "Travel pillow",
      "Ear plugs",
      "Eye mask",
      "Notebook",
      "Pens",
      "Map",
      "Guidebook",
      "Phrasebook",
      "Travel adapter",
      "Charging cables",
      "Earbuds",
      "Portable charger",
      "Camera",
      "Memory card",
      "Books",
      "Magazines",
      "Playing cards",
      "Gifts",
      "Postcards",
      "Souvenirs",
      "Clothing",
      "Shoes",
      "Hats",
      "Sunglasses",
      "Jewelry",
      "Scarves",
      "Gloves",
      "Wallet",
      "Passport holder",
      "Luggage tags",
      "Lock",
      "Laundry detergent",
      "Ziploc bags",
      "tampons",
    ],
  },
  {
    id: 6,
    icon: "add-outline",
    color: GlobalStyles.colors.textColor,
    cat: "newCat",
    catString: i18n.t("catNewString"),
  },
];
