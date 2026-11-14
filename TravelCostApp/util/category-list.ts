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

export function commitCategoryRename(
  list: Category[],
  index: number,
  newName: string
): CommitCategoryRenameResult {
  const trimmed = newName.trim();
  if (!trimmed) {
    return { status: "rejected", reason: "empty", list };
  }

  const duplicate = list.some(
    (category, i) =>
      i !== index &&
      (category.catString === trimmed || category.cat === trimmed)
  );
  if (duplicate) {
    return { status: "rejected", reason: "duplicate", list };
  }

  // Keep `cat` stable so existing Expenses still resolve this category's icon.
  const next = list.map((category, i) =>
    i === index ? { ...category, catString: trimmed } : category
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
