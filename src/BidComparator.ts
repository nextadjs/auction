import type { BidV26, CurrencyConversionData } from "./types";

export class BidComparator {
  public static getHighestBidV26(
    bids: BidV26[],
    currencyConversionData?: CurrencyConversionData
  ): BidV26 {
    if (!currencyConversionData) {
      return bids.reduce((highest, current) => {
        const highestPrice = highest.price * 100;
        const currentPrice = current.price * 100;
        return currentPrice > highestPrice ? current : highest;
      });
    }

    return bids.reduce((highest, current) => {
      const highestPrice = this.convertPrice(highest, currencyConversionData);
      const currentPrice = this.convertPrice(current, currencyConversionData);
      return currentPrice > highestPrice ? current : highest;
    });
  }

  private static convertPrice(
    bid: BidV26, 
    conversionData: CurrencyConversionData
  ): number {
    const price = bid.price;
    const rates = conversionData.conversions[bid.ext.nextadjs.currency];
    
    if (!rates) {
      return price * 100;
    }

    const targetCurrency = "USD";
    const rate = rates[targetCurrency];
    return price * (rate || 1) * 100;
  }
}