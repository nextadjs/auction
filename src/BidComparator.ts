import type { BidInformation, CurrencyConversionData } from "./types";
import type { Bid as BidV26 } from "iab-openrtb/v26";

export class BidComparator {
  public static getHighestBidV26(
    bids: BidV26[],
    bidInformation: WeakMap<BidV26, BidInformation>,
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
      const highestPrice = this.convertPrice(
        highest,
        bidInformation,
        currencyConversionData
      );
      const currentPrice = this.convertPrice(
        current,
        bidInformation,
        currencyConversionData
      );
      return currentPrice > highestPrice ? current : highest;
    });
  }

  private static convertPrice(
    bid: BidV26,
    bidInformation: WeakMap<BidV26, BidInformation>,
    conversionData: CurrencyConversionData
  ): number {
    const price = bid.price;
    const rates =
      conversionData.conversions[bidInformation.get(bid)?.currency || "USD"];

    if (!rates) {
      return price * 100;
    }

    const targetCurrency = "USD";
    const rate = rates[targetCurrency];
    return price * (rate || 1) * 100;
  }
}
