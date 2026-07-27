/**
 * MMKV Helper Functions
 *
 * This file contains all utility functions that use MMKV storage.
 * These are higher-level abstractions built on top of the core MMKV functions.
 */

import { ExpenseData } from "../util/expense";
import { setMMKVObject, getMMKVObject, deleteMMKVObject } from "./mmkv";
import { MMKV_KEY_PATTERNS, MMKV_KEYS } from "./mmkv-keys";

export type IDCat = {
  expenseId: string;
  category: string;
};

// SECTION : UTILITY FUNCTIONS

// Change cat via CategoryPickScreen
export const setExpenseCat = (expenseId: string, data: IDCat) => {
  setMMKVObject(MMKV_KEY_PATTERNS.EXPENSE_CAT(expenseId), data);
};

export const getExpenseCat = (expenseId: string) => {
  return getMMKVObject(MMKV_KEY_PATTERNS.EXPENSE_CAT(expenseId));
};

export const clearExpenseCat = (expenseId: string) => {
  deleteMMKVObject(MMKV_KEY_PATTERNS.EXPENSE_CAT(expenseId));
};

// Restore changes via draft storage
export const setExpenseDraft = (expenseId: string, data: ExpenseData) => {
  setMMKVObject(MMKV_KEY_PATTERNS.EXPENSE_DRAFT(expenseId), data);
};

export const getExpenseDraft = (expenseId: string) => {
  return getMMKVObject(MMKV_KEY_PATTERNS.EXPENSE_DRAFT(expenseId));
};

export const clearExpenseDraft = (expenseId: string) => {
  deleteMMKVObject(MMKV_KEY_PATTERNS.EXPENSE_DRAFT(expenseId));
};
