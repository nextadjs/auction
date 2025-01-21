import type { BaseBidResponseV26, BidV26 } from "./types";

export class BidFactory {
  public static createV26Bids(
    bidResponse: BaseBidResponseV26,
    itemIds: string[]
  ): BidV26[] {
    let bids: BidV26[] = [];

    if (bidResponse.seatbid) {
      bidResponse.seatbid.forEach((seatBid) => {
        seatBid.bid.forEach((bid) => {
          if (itemIds.some((itemId) => bid.impid === itemId)) {
            bids.push({
              ...bid,
              ext: {
                ...bid.ext,
                nextadjs: {
                  openrtbVersion: "2.6",
                  currency: bidResponse.cur || "USD",
                  seat: seatBid.seat,
                },
              },
            });
          }
        });
      });
    }

    return bids;
  }
}
