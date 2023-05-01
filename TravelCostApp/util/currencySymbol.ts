import getSymbolFromCurrency from "currency-symbol-map";

export function getCurrencySymbol(currency: string) {
  if (!currency) return "";
  const symbol = getSymbolFromCurrency(currency);
  if (!symbol) return currency.slice(0, 3);
  return symbol;
}
