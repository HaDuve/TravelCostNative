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

// Recent currencies storage (max 5)
const MAX_RECENT_CURRENCIES = 5;

export const getRecentCurrencies = (): string[] => {
  const currencies = getMMKVObject(MMKV_KEYS.RECENT_CURRENCIES);
  return Array.isArray(currencies) ? currencies : [];
};

export const addRecentCurrency = (currencyCode: string) => {
  if (!currencyCode) return;

  const recent = getRecentCurrencies();
  // Remove if already exists
  const filtered = recent.filter((c) => c !== currencyCode);
  // Add to front
  const updated = [currencyCode, ...filtered].slice(0, MAX_RECENT_CURRENCIES);
  setMMKVObject(MMKV_KEYS.RECENT_CURRENCIES, updated);
};

export const initializeRecentCurrencies = (tripCurrency: string) => {
  if (!tripCurrency) return;

  const recent = getRecentCurrencies();
  // Only initialize if empty
  if (recent.length === 0) {
    setMMKVObject(MMKV_KEYS.RECENT_CURRENCIES, [tripCurrency]);
  }
};
