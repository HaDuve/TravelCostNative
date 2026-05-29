import { getCatLocalized } from "./category";

export function shouldAutomapCategory(
  inputIdentifier: string,
  pickedCat: string
): boolean {
  return inputIdentifier === "description" && pickedCat === "undefined";
}

export function deriveCategoryFieldsOnAutomap(
  prev: { description: string; category: string },
  categoryValue: string
): { category: string; description: string } {
  const canSetNewDescription =
    categoryValue !== "undefined" &&
    prev.description === "" &&
    prev.category !== categoryValue;
  const description = canSetNewDescription
    ? getCatLocalized(categoryValue)
    : prev.description || "";

  return {
    category: categoryValue,
    description,
  };
}
