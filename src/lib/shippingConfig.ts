/**
 * Shipping and Tax Configuration by Country
 * 
 * This file contains shipping rates and tax rates for different countries/regions.
 * Rates are in USD.
 */

export interface CountryShippingConfig {
  code: string;
  name: string;
  shippingRate: number; // Base shipping rate in USD
  freeShippingThreshold: number; // Order total in USD for free shipping
  taxRate: number; // Tax rate as decimal (e.g., 0.08 = 8%)
  taxExempt: boolean; // Whether this country is tax-exempt
  region?: string; // Region grouping (e.g., "East Africa", "Europe")
}

export const COUNTRY_SHIPPING_CONFIG: CountryShippingConfig[] = [
  // East Africa
  {
    code: "TZ",
    name: "Tanzania",
    shippingRate: 5.00,
    freeShippingThreshold: 100,
    taxRate: 0.08, // 8% VAT
    taxExempt: false,
    region: "East Africa",
  },
  {
    code: "KE",
    name: "Kenya",
    shippingRate: 7.00,
    freeShippingThreshold: 100,
    taxRate: 0.16, // 16% VAT
    taxExempt: false,
    region: "East Africa",
  },
  {
    code: "UG",
    name: "Uganda",
    shippingRate: 8.00,
    freeShippingThreshold: 100,
    taxRate: 0.18, // 18% VAT
    taxExempt: false,
    region: "East Africa",
  },
  {
    code: "RW",
    name: "Rwanda",
    shippingRate: 9.00,
    freeShippingThreshold: 100,
    taxRate: 0.18, // 18% VAT
    taxExempt: false,
    region: "East Africa",
  },
  {
    code: "ET",
    name: "Ethiopia",
    shippingRate: 10.00,
    freeShippingThreshold: 100,
    taxRate: 0.15, // 15% VAT
    taxExempt: false,
    region: "East Africa",
  },
  
  // Southern Africa
  {
    code: "ZA",
    name: "South Africa",
    shippingRate: 12.00,
    freeShippingThreshold: 150,
    taxRate: 0.15, // 15% VAT
    taxExempt: false,
    region: "Southern Africa",
  },
  {
    code: "ZW",
    name: "Zimbabwe",
    shippingRate: 10.00,
    freeShippingThreshold: 100,
    taxRate: 0.15, // 15% VAT
    taxExempt: false,
    region: "Southern Africa",
  },
  
  // West Africa
  {
    code: "NG",
    name: "Nigeria",
    shippingRate: 15.00,
    freeShippingThreshold: 150,
    taxRate: 0.075, // 7.5% VAT
    taxExempt: false,
    region: "West Africa",
  },
  {
    code: "GH",
    name: "Ghana",
    shippingRate: 12.00,
    freeShippingThreshold: 100,
    taxRate: 0.125, // 12.5% VAT
    taxExempt: false,
    region: "West Africa",
  },
  
  // North America
  {
    code: "US",
    name: "United States",
    shippingRate: 15.00,
    freeShippingThreshold: 200,
    taxRate: 0.0, // Varies by state - handled separately
    taxExempt: false,
    region: "North America",
  },
  {
    code: "CA",
    name: "Canada",
    shippingRate: 18.00,
    freeShippingThreshold: 200,
    taxRate: 0.13, // Average GST/HST
    taxExempt: false,
    region: "North America",
  },
  
  // Europe
  {
    code: "GB",
    name: "United Kingdom",
    shippingRate: 20.00,
    freeShippingThreshold: 200,
    taxRate: 0.20, // 20% VAT
    taxExempt: false,
    region: "Europe",
  },
  {
    code: "DE",
    name: "Germany",
    shippingRate: 18.00,
    freeShippingThreshold: 200,
    taxRate: 0.19, // 19% VAT
    taxExempt: false,
    region: "Europe",
  },
  {
    code: "FR",
    name: "France",
    shippingRate: 18.00,
    freeShippingThreshold: 200,
    taxRate: 0.20, // 20% VAT
    taxExempt: false,
    region: "Europe",
  },
  
  // Asia
  {
    code: "IN",
    name: "India",
    shippingRate: 12.00,
    freeShippingThreshold: 150,
    taxRate: 0.18, // 18% GST
    taxExempt: false,
    region: "Asia",
  },
  {
    code: "CN",
    name: "China",
    shippingRate: 10.00,
    freeShippingThreshold: 150,
    taxRate: 0.13, // 13% VAT
    taxExempt: false,
    region: "Asia",
  },
  {
    code: "AE",
    name: "United Arab Emirates",
    shippingRate: 15.00,
    freeShippingThreshold: 200,
    taxRate: 0.05, // 5% VAT
    taxExempt: false,
    region: "Asia",
  },
  
  // Other regions
  {
    code: "AU",
    name: "Australia",
    shippingRate: 22.00,
    freeShippingThreshold: 200,
    taxRate: 0.10, // 10% GST
    taxExempt: false,
    region: "Oceania",
  },
  {
    code: "BR",
    name: "Brazil",
    shippingRate: 20.00,
    freeShippingThreshold: 200,
    taxRate: 0.17, // Average tax rate
    taxExempt: false,
    region: "South America",
  },
];

// Helper function to get country config by name or code
export function getCountryConfig(countryNameOrCode: string): CountryShippingConfig | null {
  const normalized = countryNameOrCode.trim();
  
  // Try exact match by name first
  let config = COUNTRY_SHIPPING_CONFIG.find(
    (c) => c.name.toLowerCase() === normalized.toLowerCase()
  );
  
  // Try code match
  if (!config) {
    config = COUNTRY_SHIPPING_CONFIG.find(
      (c) => c.code.toLowerCase() === normalized.toLowerCase()
    );
  }
  
  // Return default Tanzania config if not found
  return config || COUNTRY_SHIPPING_CONFIG.find((c) => c.code === "TZ") || null;
}

// Calculate shipping cost based on country and order total
export function calculateShipping(
  country: string,
  orderTotal: number,
  isDigital: boolean,
  sellerCountry?: string | null
): number {
  if (isDigital) return 0;
  
  // Same-country exemption: if seller and buyer are in the same country, shipping is free
  if (sellerCountry && sellerCountry.trim().toLowerCase() === country.trim().toLowerCase()) {
    return 0;
  }
  
  const config = getCountryConfig(country);
  if (!config) return 9.99; // Default rate
  
  if (orderTotal >= config.freeShippingThreshold) {
    return 0;
  }
  
  return config.shippingRate;
}

// Calculate tax based on country and order total
export function calculateTax(
  country: string,
  orderTotal: number,
  isDigital: boolean,
  sellerCountry?: string | null
): number {
  if (isDigital) return 0;
  
  // Same-country exemption: if seller and buyer are in the same country, tax may be exempt
  // Note: This depends on local tax regulations. For now, we'll still apply tax
  // but this can be customized per country's tax rules
  // if (sellerCountry && sellerCountry.trim().toLowerCase() === country.trim().toLowerCase()) {
  //   return 0; // Uncomment if same-country tax exemption applies
  // }
  
  const config = getCountryConfig(country);
  if (!config) return orderTotal * 0.08; // Default 8% tax
  
  if (config.taxExempt) return 0;
  
  return orderTotal * config.taxRate;
}

// Get all countries for dropdown
export function getAllCountries(): Array<{ value: string; label: string; region?: string }> {
  return COUNTRY_SHIPPING_CONFIG.map((c) => ({
    value: c.name,
    label: c.name,
    region: c.region,
  }));
}

