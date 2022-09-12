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
    default:
      return "help-outline";
  }
}
