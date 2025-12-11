/**
 * Currency utilities for multi-currency support
 */

export type Currency = 'USD' | 'TZS' | 'EUR' | 'GBP' | 'KES' | 'UGX' | 'RWF';

export const SUPPORTED_CURRENCIES: Currency[] = ['USD', 'TZS', 'EUR', 'GBP', 'KES', 'UGX', 'RWF'];

export const CURRENCY_INFO: Record<Currency, { name: string; symbol: string; locale: string }> = {
  USD: { name: 'US Dollar', symbol: '$', locale: 'en-US' },
  TZS: { name: 'Tanzanian Shilling', symbol: 'TSh', locale: 'en-TZ' },
  EUR: { name: 'Euro', symbol: '€', locale: 'en-EU' },
  GBP: { name: 'British Pound', symbol: '£', locale: 'en-GB' },
  KES: { name: 'Kenyan Shilling', symbol: 'KSh', locale: 'en-KE' },
  UGX: { name: 'Ugandan Shilling', symbol: 'USh', locale: 'en-UG' },
  RWF: { name: 'Rwandan Franc', symbol: 'RF', locale: 'en-RW' },
};

// Exchange rates relative to USD (base currency)
// In production, these should be fetched from an API and updated regularly
const EXCHANGE_RATES: Record<Currency, number> = {
  USD: 1.0,
  TZS: 2500.0, // 1 USD = 2500 TZS
  EUR: 0.92,   // 1 USD = 0.92 EUR
  GBP: 0.79,   // 1 USD = 0.79 GBP
  KES: 130.0,  // 1 USD = 130 KES
  UGX: 3700.0, // 1 USD = 3700 UGX
  RWF: 1300.0, // 1 USD = 1300 RWF
};

/**
 * Convert amount from one currency to another
 */
export function convertCurrency(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency
): number {
  if (fromCurrency === toCurrency) return amount;
  
  // Convert to USD first (base currency)
  const amountInUSD = amount / EXCHANGE_RATES[fromCurrency];
  // Convert from USD to target currency
  return amountInUSD * EXCHANGE_RATES[toCurrency];
}

/**
 * Format price in the specified currency
 */
export function formatPrice(price: number, currency: Currency = 'USD'): string {
  const currencyInfo = CURRENCY_INFO[currency];
  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: currency === 'USD' || currency === 'EUR' || currency === 'GBP' ? 2 : 0,
    maximumFractionDigits: currency === 'USD' || currency === 'EUR' || currency === 'GBP' ? 2 : 0,
  };

  try {
    return new Intl.NumberFormat(currencyInfo.locale, options).format(price);
  } catch {
    // Fallback formatting
    return `${currencyInfo.symbol}${price.toLocaleString('en-US', {
      minimumFractionDigits: options.minimumFractionDigits,
      maximumFractionDigits: options.maximumFractionDigits,
    })}`;
  }
}

/**
 * Format price with conversion from product currency to user's preferred currency
 */
export function formatPriceWithConversion(
  price: number,
  productCurrency: Currency,
  userCurrency: Currency
): string {
  if (productCurrency === userCurrency) {
    return formatPrice(price, userCurrency);
  }
  
  const convertedPrice = convertCurrency(price, productCurrency, userCurrency);
  return formatPrice(convertedPrice, userCurrency);
}

/**
 * Get exchange rate between two currencies
 */
export function getExchangeRate(fromCurrency: Currency, toCurrency: Currency): number {
  if (fromCurrency === toCurrency) return 1;
  return EXCHANGE_RATES[toCurrency] / EXCHANGE_RATES[fromCurrency];
}

/**
 * Detect user's currency preference based on browser locale or IP
 * Returns default currency (USD) if detection fails
 */
export function detectUserCurrency(): Currency {
  // Try to detect from browser locale
  if (typeof navigator !== 'undefined' && navigator.language) {
    const locale = navigator.language.toUpperCase();
    
    // Check for country codes in locale
    if (locale.includes('TZ')) return 'TZS';
    if (locale.includes('KE')) return 'KES';
    if (locale.includes('UG')) return 'UGX';
    if (locale.includes('RW')) return 'RWF';
    if (locale.includes('GB') || locale.includes('UK')) return 'GBP';
    if (locale.includes('EU') || locale.includes('DE') || locale.includes('FR')) return 'EUR';
  }
  
  // Default to USD
  return 'USD';
}

/**
 * Fetch real-time exchange rates from an API
 * This is a placeholder - in production, use a service like exchangerate-api.com
 */
export async function fetchExchangeRates(): Promise<Record<Currency, number> | null> {
  try {
    // Example: Using exchangerate-api.com (free tier)
    // const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    // const data = await response.json();
    // return data.rates;
    
    // For now, return cached rates
    // In production, implement actual API call with error handling
    return EXCHANGE_RATES;
  } catch (error) {
    console.error('Failed to fetch exchange rates:', error);
    return null;
  }
}

