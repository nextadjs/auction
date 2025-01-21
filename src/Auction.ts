import { BidComparator } from "./BidComparator";
import { BidFactory } from "./BidFactory";
import {
  AlreadyEndedAuctionException,
  BidNotFoundException,
} from "./exceptions";
import type { BaseBidResponseV26, BidV26, CurrencyConversionData } from "./types";

type AuctionType = "open" | "closed";

type AuctionOptions = {
  lossProcessing?: boolean;
  currencyConversionData?: CurrencyConversionData;
};

export class Auction {
  private losingBids: {
    v26: BidV26[];
  };
  private bids: {
    v26: BidV26[];
  };

  private itemIds: string[] = [];
  private currencyConversionData?: CurrencyConversionData;
  private status: AuctionType;
  private options: AuctionOptions;

  public constructor(
    itemOrImpressionIds: string | string[],
    options: AuctionOptions = {}
  ) {
    this.options = {
      lossProcessing: true,
      ...options,
    };

    this.bids = {
      v26: [],
    };
    this.losingBids = {
      v26: [],
    };
    this.currencyConversionData = options.currencyConversionData;
    this.status = "open";

    if (typeof itemOrImpressionIds === "string") {
      this.itemIds.push(itemOrImpressionIds);
    } else {
      this.itemIds.push(...itemOrImpressionIds);
    }
  }

  public getStatus(): AuctionType {
    return this.status;
  }

  public getLosingBids(): { v26: BidV26[] } {
    return this.losingBids;
  }

  public placeBidResponseV26(bidResponse: BaseBidResponseV26): this {
    if (bidResponse.seatbid) {
      this.bids.v26.push(
        ...BidFactory.createV26Bids(bidResponse, this.itemIds)
      );
    }

    return this;
  }

  public end(): BidV26 {
    if (this.status !== "open") {
      throw new AlreadyEndedAuctionException();
    }

    if (!this.bids.v26.length) {
      throw new BidNotFoundException();
    }

    const highestBid = BidComparator.getHighestBidV26(this.bids.v26, this.options.currencyConversionData);

    this.setLosingBids(highestBid);
    this.handleLossBids();
    this.status = "closed";

    return highestBid;
  }

  private setLosingBids(winningBid: BidV26): void {
    this.losingBids.v26.push(
      ...this.bids.v26.filter((bid) => bid.id !== winningBid.id)
    );
  }

  private handleLossBids(): void {
    this.losingBids.v26.forEach((bid) => {
      this.handleLossBid(bid);
    });
  }

  private handleLossBid(bid: BidV26): void {
    if (this.options.lossProcessing && bid.lurl) {
      fetch(bid.lurl, {
        keepalive: true,
      });
    }
  }
}
