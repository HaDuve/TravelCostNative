import {
  deriveCategoryFieldsOnAutomap,
  shouldAutomapCategory,
} from "../../util/expense-form-category";

describe("shouldAutomapCategory", () => {
  it("runs only for description when picked category is undefined", () => {
    expect(shouldAutomapCategory("description", "undefined")).toBe(true);
    expect(shouldAutomapCategory("amount", "undefined")).toBe(false);
    expect(shouldAutomapCategory("description", "food")).toBe(false);
  });
});

describe("deriveCategoryFieldsOnAutomap", () => {
  it("fills localized description when category changes from empty description", () => {
    const patch = deriveCategoryFieldsOnAutomap(
      { description: "", category: "undefined" },
      "food"
    );

    expect(patch.category).toBe("food");
    expect(patch.description).toBeTruthy();
    expect(patch.description).not.toBe("");
  });

  it("keeps existing description when category already set", () => {
    const patch = deriveCategoryFieldsOnAutomap(
      { description: "my note", category: "transport" },
      "food"
    );

    expect(patch).toEqual({
      category: "food",
      description: "my note",
    });
  });
});
