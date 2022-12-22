export function getCatSymbol(cat) {
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
