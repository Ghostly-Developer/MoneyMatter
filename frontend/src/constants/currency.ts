export type BaseCurrency = 'INR' | 'EUR' | 'USD';

export const CURRENCY_SYMBOLS: Record<BaseCurrency, string> = {
  INR: '₹',
  EUR: '€',
  USD: '$',
};

// This app's primary market is India - default/fallback to the rupee
// whenever no valid currency is known (e.g. a profile that hasn't set one).
export function currencySymbol(currency?: string): string {
  return CURRENCY_SYMBOLS[currency as BaseCurrency] ?? CURRENCY_SYMBOLS.INR;
}
