import type { Category } from "./category";
import { DEFAULTCATEGORIES } from "./category";
import { fetchCategories, updateTrip } from "./http";
import { getMMKVObject, MMKV_KEYS, setMMKVObject } from "../store/mmkv";

export const NEW_CATEGORY_CAT = "newCat";
export const UNDO_DELETE_CATEGORY_WINDOW_MS = 8000;

export type CategoryListStore = {
  getCached: () => Category[] | null | undefined;
  setCached: (list: Category[]) => void;
  fetchRemote: (tripid: string) => Promise<Category[] | null | undefined>;
  saveRemote: (tripid: string, list: Category[]) => Promise<void>;
};

export type WriteCategoryListResult =
  | { status: "saved"; list: Category[] }
  | { status: "offline"; list: Category[] }
  | { status: "error"; list: Category[]; error: unknown };

export function withoutNewCategoryTile(list: Category[]): Category[] {
  return list.filter((category) => category.cat !== NEW_CATEGORY_CAT);
}

/** Trip category list defaults — excludes the pick-screen-only "+ New Category" tile. */
export function defaultTripCategoryList(): Category[] {
  return withoutNewCategoryTile(DEFAULTCATEGORIES);
}

export function appendNewCategoryTile(
  list: Category[],
  tile: Category
): Category[] {
  return [...withoutNewCategoryTile(list), tile];
}

export function createCategoryListStore(
  overrides: Partial<CategoryListStore> = {}
): CategoryListStore {
  return {
    getCached: () => getMMKVObject(MMKV_KEYS.CATEGORY_LIST) as Category[] | null,
    setCached: (list) => setMMKVObject(MMKV_KEYS.CATEGORY_LIST, list),
    fetchRemote: (tripid) => fetchCategories(tripid),
    saveRemote: async (tripid, list) => {
      await updateTrip(tripid, {
        categories: JSON.stringify(list),
      });
    },
    ...overrides,
  };
}

export type CommitCategoryRenameResult =
  | { status: "committed"; list: Category[] }
  | { status: "rejected"; reason: "empty" | "duplicate"; list: Category[] };

export type CategoryNameValidation =
  | { status: "ok"; trimmed: string }
  | { status: "rejected"; reason: "empty" | "duplicate" };

/** Shared empty/duplicate rule for rename and add. */
export function validateCategoryName(
  list: Category[],
  name: string,
  options: { excludeIndex?: number } = {}
): CategoryNameValidation {
  const trimmed = name.trim();
  if (!trimmed) {
    return { status: "rejected", reason: "empty" };
  }

  const duplicate = list.some(
    (category, i) =>
      i !== options.excludeIndex &&
      (category.catString === trimmed || category.cat === trimmed)
  );
  if (duplicate) {
    return { status: "rejected", reason: "duplicate" };
  }

  return { status: "ok", trimmed };
}

export type AddCategoryMissingField = "name" | "icon";

export type AddCategoryReadiness =
  | { status: "ready" }
  | { status: "incomplete"; missing: AddCategoryMissingField[] };

export function getAddCategoryReadiness(
  name: string,
  iconName: string
): AddCategoryReadiness {
  const missing: AddCategoryMissingField[] = [];
  if (!name.trim()) {
    missing.push("name");
  }
  if (!iconName) {
    missing.push("icon");
  }
  if (missing.length > 0) {
    return { status: "incomplete", missing };
  }
  return { status: "ready" };
}

export type CommitNewCategoryResult =
  | { status: "committed"; list: Category[]; category: Category }
  | {
      status: "incomplete";
      missing: AddCategoryMissingField[];
      list: Category[];
    }
  | { status: "rejected"; reason: "empty" | "duplicate"; list: Category[] };

export function commitNewCategory(
  list: Category[],
  name: string,
  iconName: string
): CommitNewCategoryResult {
  const readiness = getAddCategoryReadiness(name, iconName);
  if (readiness.status === "incomplete") {
    return { status: "incomplete", missing: readiness.missing, list };
  }

  const validation = validateCategoryName(list, name);
  if (validation.status === "rejected") {
    return { status: "rejected", reason: validation.reason, list };
  }

  const category: Category = {
    cat: validation.trimmed,
    catString: validation.trimmed,
    icon: iconName,
  };
  return {
    status: "committed",
    list: [...list, category],
    category,
  };
}

export function commitCategoryRename(
  list: Category[],
  index: number,
  newName: string
): CommitCategoryRenameResult {
  const validation = validateCategoryName(list, newName, {
    excludeIndex: index,
  });
  if (validation.status === "rejected") {
    return { status: "rejected", reason: validation.reason, list };
  }

  // Keep `cat` stable so existing Expenses still resolve this category's icon.
  const next = list.map((category, i) =>
    i === index ? { ...category, catString: validation.trimmed } : category
  );
  return { status: "committed", list: next };
}

export function removeCategoryAt(
  list: Category[],
  index: number
): { list: Category[]; removed: Category; index: number } {
  const removed = list[index];
  return {
    list: [...list.slice(0, index), ...list.slice(index + 1)],
    removed,
    index,
  };
}

export function insertCategoryAt(
  list: Category[],
  category: Category,
  index: number
): Category[] {
  const clamped = Math.max(0, Math.min(index, list.length));
  return [...list.slice(0, clamped), category, ...list.slice(clamped)];
}

/** Move a category within the trip list; "+ New Category" tile stays last. */
export function moveCategoryAt(
  list: Category[],
  fromIndex: number,
  toIndex: number
): Category[] {
  const newTile = list.find((category) => category.cat === NEW_CATEGORY_CAT);
  const movable = withoutNewCategoryTile(list);
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= movable.length ||
    toIndex >= movable.length ||
    fromIndex === toIndex
  ) {
    return list;
  }

  const next = [...movable];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return newTile ? [...next, newTile] : next;
}

/**
 * Persist a reordered trip category list. On offline/error, returns the
 * previous order so the UI can revert.
 */
export async function persistReorderedCategoryList(
  store: CategoryListStore,
  tripid: string,
  previousList: Category[],
  nextList: Category[],
  options: { isOnline: boolean }
): Promise<WriteCategoryListResult> {
  const previousClean = withoutNewCategoryTile(previousList);
  const result = await writeCategoryList(store, tripid, nextList, options);

  if (result.status === "saved") {
    return result;
  }

  if (result.status === "offline") {
    return { status: "offline", list: previousClean };
  }

  return { status: "error", list: previousClean, error: result.error };
}

export async function readCategoryList(
  store: CategoryListStore,
  tripid: string,
  options: { isOnline: boolean }
): Promise<Category[]> {
  const cached = store.getCached();
  const cachedList = cached ? withoutNewCategoryTile(cached) : null;

  if (!options.isOnline) {
    return cachedList ?? defaultTripCategoryList();
  }

  try {
    const remote = await store.fetchRemote(tripid);
    if (remote != null) {
      const cleanRemote = withoutNewCategoryTile(remote);
      const next =
        cleanRemote.length > 0 ? cleanRemote : defaultTripCategoryList();
      store.setCached(next);
      return next;
    }
  } catch {
    // Fall back to cache / defaults when the trip cannot be reached.
  }

  return cachedList ?? defaultTripCategoryList();
}

export async function writeCategoryList(
  store: CategoryListStore,
  tripid: string,
  list: Category[],
  options: { isOnline: boolean }
): Promise<WriteCategoryListResult> {
  const cleanList = withoutNewCategoryTile(list);

  if (!options.isOnline) {
    return { status: "offline", list: cleanList };
  }

  try {
    await store.saveRemote(tripid, cleanList);
    store.setCached(cleanList);
    return { status: "saved", list: cleanList };
  } catch (error) {
    return { status: "error", list: cleanList, error };
  }
}
