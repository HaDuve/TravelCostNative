import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { callDebounced } from "../components/Hooks/useDebounce";
import {
  DEFAULTCATEGORIES,
  getCatSymbolMMKV,
  mapDescriptionToCategory,
  type Category,
} from "../util/category";
import {
  deriveCategoryFieldsOnAutomap,
  shouldAutomapCategory,
} from "../util/expense-form-category";
import type { ExpenseData } from "../util/expense";

export type UseCategoryAutomapOptions = {
  pickedCat: string;
  categories?: Category[];
  recentExpenses: ExpenseData[];
  onApplyCategory: (fields: {
    category: string;
    description: string;
  }) => void;
  initialIcon?: string;
  mapDescription?: typeof mapDescriptionToCategory;
  getIconForCategory?: (category: string) => string;
  debounceMs?: number;
};

export function useCategoryAutomap({
  pickedCat,
  categories = DEFAULTCATEGORIES,
  recentExpenses,
  onApplyCategory,
  initialIcon = "",
  mapDescription = mapDescriptionToCategory,
  getIconForCategory = getCatSymbolMMKV,
  debounceMs = 250,
}: UseCategoryAutomapOptions) {
  const [icon, setIcon] = useState(initialIcon);

  const updateCategoryAndIcon = useCallback(
    (
      categoryValue: string,
      prevFields: { description: string; category: string }
    ) => {
      setIcon(getIconForCategory(categoryValue));
      onApplyCategory(deriveCategoryFieldsOnAutomap(prevFields, categoryValue));
    },
    [getIconForCategory, onApplyCategory]
  );

  const autoCategory = useCallback(
    (inputIdentifier: string, enteredValue: string) => {
      if (!shouldAutomapCategory(inputIdentifier, pickedCat)) {
        return;
      }
      const mappedCategory = mapDescription(
        enteredValue,
        categories,
        recentExpenses
      );
      if (mappedCategory) {
        updateCategoryAndIcon(mappedCategory, {
          description: enteredValue,
          category: pickedCat,
        });
      }
    },
    [
      categories,
      mapDescription,
      pickedCat,
      recentExpenses,
      updateCategoryAndIcon,
    ]
  );

  const autoCategoryRef = useRef(autoCategory);
  useEffect(() => {
    autoCategoryRef.current = autoCategory;
  }, [autoCategory]);

  const debouncedAutoCategory = useMemo(
    () =>
      callDebounced((inputIdentifier: string, enteredValue: string) => {
        autoCategoryRef.current(inputIdentifier, enteredValue);
      }, debounceMs),
    [debounceMs]
  );

  const syncIconForCategory = useCallback(
    (categoryValue: string) => {
      setIcon(getIconForCategory(categoryValue));
    },
    [getIconForCategory]
  );

  return {
    icon,
    setIcon,
    updateCategoryAndIcon,
    debouncedAutoCategory,
    syncIconForCategory,
  };
}
