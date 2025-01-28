export type BidInformation = {
  currency?: string;
  seat?: string;
  version: string;
};


export interface CurrencyRates {
  /** ISO 4217 Currency Code (Example: USD, JPY, EUR) */
  [currency: string]: number;
}

interface ConversionRates {
  /** convert rate of base currency */
  [baseCurrency: string]: CurrencyRates;
}

export interface CurrencyConversionData {
  dataAsOf: string;
  generatedAt: string;
  conversions: ConversionRates;
}