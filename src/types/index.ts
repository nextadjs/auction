import type {
  Bid as BaseBidV26,
  BidResponse as BaseBidResponseV26,
  SeatBid as BaseSeatBidV26,
} from "iab-openrtb/v26";
export type {
  BidResponse as BaseBidResponseV26,
  Bid as BaseBidV26,
} from "iab-openrtb/v26";

export interface BidResponseV26 extends BaseBidResponseV26 {
  seatbid?: SeatBidV26[];
}
export interface SeatBidV26 extends BaseSeatBidV26 {
  bid: BidV26[];
}

export interface BidV26 extends BaseBidV26 {
  ext: {
    nextadjs: {
      openrtbVersion: "2.6";
      seat?: string;
      currency: string;
    };
  };
}


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