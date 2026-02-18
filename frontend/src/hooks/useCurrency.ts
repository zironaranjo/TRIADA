/**
 * useCurrency hook
 * Reads the user's preferred currency from localStorage (set in Settings > Preferences)
 * Provides formatting and static EUR-based exchange rates for 12 currencies.
 * No external API needed — rates are updated periodically in this file.
 */

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  locale: string;
  rateFromEUR: number; // How many units of this currency = 1 EUR
}

// Static exchange rates (base: EUR) — approx Feb 2026
export const CURRENCIES: Record<string, CurrencyInfo> = {
  EUR: { code: 'EUR', symbol: '€',  name: 'Euro',              locale: 'de-DE', rateFromEUR: 1.00 },
  USD: { code: 'USD', symbol: '$',  name: 'US Dollar',         locale: 'en-US', rateFromEUR: 1.08 },
  GBP: { code: 'GBP', symbol: '£',  name: 'British Pound',     locale: 'en-GB', rateFromEUR: 0.86 },
  CHF: { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc',       locale: 'de-CH', rateFromEUR: 0.96 },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar',   locale: 'en-CA', rateFromEUR: 1.48 },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU', rateFromEUR: 1.68 },
  MXN: { code: 'MXN', symbol: '$',  name: 'Mexican Peso',      locale: 'es-MX', rateFromEUR: 21.5 },
  BRL: { code: 'BRL', symbol: 'R$', name: 'Brazilian Real',    locale: 'pt-BR', rateFromEUR: 6.20 },
  JPY: { code: 'JPY', symbol: '¥',  name: 'Japanese Yen',      locale: 'ja-JP', rateFromEUR: 163  },
  SEK: { code: 'SEK', symbol: 'kr', name: 'Swedish Krona',     locale: 'sv-SE', rateFromEUR: 11.6 },
  NOK: { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone',   locale: 'nb-NO', rateFromEUR: 11.8 },
  DKK: { code: 'DKK', symbol: 'kr', name: 'Danish Krone',      locale: 'da-DK', rateFromEUR: 7.46 },
  AED: { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham',       locale: 'ar-AE', rateFromEUR: 3.97 },
  THB: { code: 'THB', symbol: '฿',  name: 'Thai Baht',         locale: 'th-TH', rateFromEUR: 38.5 },
};

const STORAGE_KEY = 'triadak_preferences';

function getPreferredCurrency(): string {
  try {
    const prefs = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return prefs.currency || 'EUR';
  } catch {
    return 'EUR';
  }
}

export interface UseCurrencyReturn {
  currency: CurrencyInfo;
  /** Format an amount stored in EUR to the user's preferred currency */
  format: (amountInEUR: number, opts?: { decimals?: number; compact?: boolean }) => string;
  /** Convert an amount from EUR to the preferred currency */
  convert: (amountInEUR: number) => number;
  /** Convert from any currency to preferred currency */
  convertFrom: (amount: number, fromCode: string) => number;
  /** Get currency info by code */
  getCurrency: (code: string) => CurrencyInfo;
  /** All available currencies list */
  allCurrencies: CurrencyInfo[];
}

export function useCurrency(): UseCurrencyReturn {
  const code = getPreferredCurrency();
  const currency = CURRENCIES[code] || CURRENCIES['EUR'];

  function convert(amountInEUR: number): number {
    return amountInEUR * currency.rateFromEUR;
  }

  function convertFrom(amount: number, fromCode: string): number {
    const from = CURRENCIES[fromCode] || CURRENCIES['EUR'];
    const inEUR = amount / from.rateFromEUR;
    return inEUR * currency.rateFromEUR;
  }

  function format(
    amountInEUR: number,
    { decimals = 0, compact = false }: { decimals?: number; compact?: boolean } = {}
  ): string {
    const converted = convert(amountInEUR);
    if (compact && converted >= 1000) {
      const k = converted / 1000;
      return `${currency.symbol}${k.toFixed(1)}k`;
    }
    try {
      return new Intl.NumberFormat(currency.locale, {
        style: 'currency',
        currency: currency.code,
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(converted);
    } catch {
      return `${currency.symbol}${converted.toFixed(decimals)}`;
    }
  }

  function getCurrency(c: string): CurrencyInfo {
    return CURRENCIES[c] || CURRENCIES['EUR'];
  }

  return {
    currency,
    format,
    convert,
    convertFrom,
    getCurrency,
    allCurrencies: Object.values(CURRENCIES),
  };
}
