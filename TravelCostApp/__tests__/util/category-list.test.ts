import type { Category } from "../../util/category";
import {
  writeCategoryList,
  readCategoryList,
  commitCategoryRename,
  commitNewCategory,
  getAddCategoryReadiness,
  removeCategoryAt,
  insertCategoryAt,
  appendNewCategoryTile,
  defaultTripCategoryList,
  type CategoryListStore,
} from "../../util/category-list";

function makeCategory(
  overrides: Partial<Category> & Pick<Category, "cat" | "icon">
): Category {
  return {
    catString: overrides.catString ?? overrides.cat,
    ...overrides,
  };
}

function makeStore(
  overrides: Partial<CategoryListStore> & {
    cache?: Category[] | null;
  } = {}
): CategoryListStore & { cache: Category[] | null; remoteWrites: Category[][] } {
  const remoteWrites: Category[][] = [];
  const store = {
    cache: overrides.cache ?? null,
    remoteWrites,
    getCached: jest.fn(() => store.cache),
    setCached: jest.fn((list: Category[]) => {
      store.cache = list;
    }),
    fetchRemote: jest.fn(async () => null),
    saveRemote: jest.fn(async (_tripid: string, list: Category[]) => {
      remoteWrites.push(list);
    }),
    ...overrides,
  };
  return store;
}

describe("writeCategoryList", () => {
  it("writes the new category list to local cache and the trip on the server", async () => {
    const previous = [
      makeCategory({ cat: "food", icon: "fast-food-outline", catString: "Food" }),
    ];
    const next = [
      ...previous,
      makeCategory({
        cat: "Coffee",
        icon: "cafe-outline",
        catString: "Coffee",
      }),
    ];
    const store = makeStore({ cache: previous });

    const result = await writeCategoryList(store, "trip-1", next, {
      isOnline: true,
    });

    expect(result.status).toBe("saved");
    expect(store.cache).toEqual(next);
    expect(store.remoteWrites).toEqual([next]);
    expect(store.setCached).toHaveBeenCalledWith(next);
    expect(store.saveRemote).toHaveBeenCalledWith("trip-1", next);
  });

  it("never persists the + New Category tile on the trip category list", async () => {
    const real = [
      makeCategory({ cat: "food", icon: "fast-food-outline", catString: "Food" }),
    ];
    const withNewTile = [
      ...real,
      makeCategory({
        cat: "newCat",
        icon: "add-outline",
        catString: "+ New Category",
      }),
    ];
    const store = makeStore({ cache: real });

    const result = await writeCategoryList(store, "trip-1", withNewTile, {
      isOnline: true,
    });

    expect(result.status).toBe("saved");
    expect(store.cache).toEqual(real);
    expect(store.remoteWrites).toEqual([real]);
  });

  it("reports offline without writing the trip when not online", async () => {
    const previous = [
      makeCategory({ cat: "food", icon: "fast-food-outline", catString: "Food" }),
    ];
    const next = [
      ...previous,
      makeCategory({
        cat: "Coffee",
        icon: "cafe-outline",
        catString: "Coffee",
      }),
    ];
    const store = makeStore({ cache: previous });

    const result = await writeCategoryList(store, "trip-1", next, {
      isOnline: false,
    });

    expect(result).toEqual({ status: "offline", list: next });
    expect(store.saveRemote).not.toHaveBeenCalled();
    expect(store.cache).toEqual(previous);
  });

  it("keeps cache unchanged and returns error when the trip update fails", async () => {
    const previous = [
      makeCategory({ cat: "food", icon: "fast-food-outline", catString: "Food" }),
    ];
    const next = [
      makeCategory({ cat: "Meals", icon: "fast-food-outline", catString: "Meals" }),
    ];
    const store = makeStore({
      cache: previous,
      saveRemote: jest.fn(async () => {
        throw new Error("network down");
      }),
    });

    const result = await writeCategoryList(store, "trip-1", next, {
      isOnline: true,
    });

    expect(result.status).toBe("error");
    expect(store.cache).toEqual(previous);
    expect(store.setCached).not.toHaveBeenCalled();
  });
});

describe("readCategoryList", () => {
  it("returns the cached trip category list before contacting the server", async () => {
    const cached = [
      makeCategory({ cat: "food", icon: "fast-food-outline", catString: "Food" }),
    ];
    const store = makeStore({
      cache: cached,
      fetchRemote: jest.fn(async () => {
        throw new Error("should not fetch when offline");
      }),
    });

    const list = await readCategoryList(store, "trip-1", { isOnline: false });

    expect(list).toEqual(cached);
    expect(store.fetchRemote).not.toHaveBeenCalled();
  });

  it("refreshes from the trip when online and updates the local cache", async () => {
    const cached = [
      makeCategory({ cat: "food", icon: "fast-food-outline", catString: "Food" }),
    ];
    const remote = [
      makeCategory({ cat: "Meals", icon: "fast-food-outline", catString: "Meals" }),
      makeCategory({
        cat: "newCat",
        icon: "add-outline",
        catString: "+ New Category",
      }),
    ];
    const store = makeStore({
      cache: cached,
      fetchRemote: jest.fn(async () => remote),
    });

    const list = await readCategoryList(store, "trip-1", { isOnline: true });

    expect(list).toEqual([
      makeCategory({ cat: "Meals", icon: "fast-food-outline", catString: "Meals" }),
    ]);
    expect(store.cache).toEqual([
      makeCategory({ cat: "Meals", icon: "fast-food-outline", catString: "Meals" }),
    ]);
    expect(store.fetchRemote).toHaveBeenCalledWith("trip-1");
  });
});

describe("commitCategoryRename", () => {
  const list = [
    makeCategory({ cat: "food", icon: "fast-food-outline", catString: "Food" }),
    makeCategory({ cat: "other", icon: "basket-outline", catString: "Other" }),
  ];

  it("commits a rename into a new category list while keeping the category key for Expenses", () => {
    const result = commitCategoryRename(list, 0, "Meals");

    expect(result).toEqual({
      status: "committed",
      list: [
        makeCategory({
          cat: "food",
          icon: "fast-food-outline",
          catString: "Meals",
        }),
        makeCategory({
          cat: "other",
          icon: "basket-outline",
          catString: "Other",
        }),
      ],
    });
    expect(list[0].catString).toBe("Food");
  });

  it("rejects an empty name and keeps the previous category name", () => {
    const result = commitCategoryRename(list, 0, "   ");

    expect(result).toEqual({
      status: "rejected",
      reason: "empty",
      list,
    });
  });

  it("rejects a duplicate name and keeps the previous category name", () => {
    const result = commitCategoryRename(list, 0, "Other");

    expect(result).toEqual({
      status: "rejected",
      reason: "duplicate",
      list,
    });
  });
});

describe("defaultTripCategoryList / appendNewCategoryTile", () => {
  it("defaults omit the + New Category tile; pick UI can append it without persisting", () => {
    const defaults = defaultTripCategoryList();
    expect(defaults.every((category) => category.cat !== "newCat")).toBe(true);

    const tile = makeCategory({
      cat: "newCat",
      icon: "add-outline",
      catString: "New Category",
    });
    const withTile = appendNewCategoryTile(defaults, tile);
    expect(withTile[withTile.length - 1]).toEqual(tile);
    expect(defaults).not.toContainEqual(tile);
  });
});

describe("removeCategoryAt / insertCategoryAt", () => {
  it("removes a category and restores it in the original position on undo", () => {
    const list = [
      makeCategory({ cat: "food", icon: "fast-food-outline", catString: "Food" }),
      makeCategory({
        cat: "Coffee",
        icon: "cafe-outline",
        catString: "Coffee",
      }),
      makeCategory({ cat: "other", icon: "basket-outline", catString: "Other" }),
    ];

    const removed = removeCategoryAt(list, 1);
    expect(removed.list).toEqual([list[0], list[2]]);
    expect(removed.removed).toEqual(list[1]);
    expect(removed.index).toBe(1);

    const restored = insertCategoryAt(removed.list, removed.removed, removed.index);
    expect(restored).toEqual(list);
  });
});

describe("getAddCategoryReadiness", () => {
  it("reports a missing name when the field is blank", () => {
    expect(getAddCategoryReadiness("", "cafe-outline")).toEqual({
      status: "incomplete",
      missing: ["name"],
    });
  });

  it("reports a missing icon when none is selected", () => {
    expect(getAddCategoryReadiness("Coffee", "")).toEqual({
      status: "incomplete",
      missing: ["icon"],
    });
  });

  it("reports both missing fields when neither name nor icon is set", () => {
    expect(getAddCategoryReadiness("   ", "")).toEqual({
      status: "incomplete",
      missing: ["name", "icon"],
    });
  });

  it("is ready when both a name and an icon are present", () => {
    expect(getAddCategoryReadiness("Coffee", "cafe-outline")).toEqual({
      status: "ready",
    });
  });
});

describe("commitNewCategory", () => {
  const list = [
    makeCategory({ cat: "food", icon: "fast-food-outline", catString: "Food" }),
  ];

  it("appends a new category at the end of the trip category list", () => {
    const result = commitNewCategory(list, "Coffee", "cafe-outline");

    expect(result).toEqual({
      status: "committed",
      category: makeCategory({
        cat: "Coffee",
        icon: "cafe-outline",
        catString: "Coffee",
      }),
      list: [
        list[0],
        makeCategory({
          cat: "Coffee",
          icon: "cafe-outline",
          catString: "Coffee",
        }),
      ],
    });
    expect(list).toHaveLength(1);
  });

  it("rejects a duplicate name with the same rule as rename", () => {
    expect(commitNewCategory(list, "Food", "cafe-outline")).toEqual({
      status: "rejected",
      reason: "duplicate",
      list,
    });
  });

  it("reports incomplete instead of saving when name or icon is missing", () => {
    expect(commitNewCategory(list, "", "")).toEqual({
      status: "incomplete",
      missing: ["name", "icon"],
      list,
    });
  });
});
