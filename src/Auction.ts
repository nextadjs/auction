import { BidComparator } from "./BidComparator";
import {
  AlreadyEndedAuctionException,
  BidNotFoundException,
} from "./exceptions";
import {
  LossReasonCode,
  type BidResponse as BaseBidResponseV26,
  type Bid,
  type Bid as BidV26,
} from "iab-openrtb/v26";
import type { BidInformation, CurrencyConversionData } from "./types";

type AuctionType = "open" | "closed";

type AuctionOptions = {
  lossProcessing?: boolean;
  currencyConversionData?: CurrencyConversionData;
};

export class Auction {
  private losingBids: {
    v26: BidV26[];
  };
  private winningBid?: BidV26;
  private bids: {
    v26: BidV26[];
  };

  private itemIds: string[] = [];
  private status: AuctionType;
  private options: AuctionOptions;
  private bidInformation: WeakMap<BidV26, BidInformation>;

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
    this.status = "open";
    this.bidInformation = new WeakMap();

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

  public getBidInformation(bid: BidV26): BidInformation | undefined {
    return this.bidInformation.get(bid);
  }

  public getBidInformations(): WeakMap<Bid, BidInformation> {
    return this.bidInformation;
  }

  public placeBidResponseV26(bidResponse: BaseBidResponseV26): this {
    if (bidResponse.seatbid) {
      const bids: BidV26[] = bidResponse.seatbid.flatMap((seatbid) =>
        seatbid.bid
          .filter((bid) => this.itemIds.some((itemId) => itemId === bid.impid))
          .map((bid) => {
            this.bidInformation.set(bid, {
              currency: bidResponse.cur,
              version: "2.6",
              seat: seatbid.seat,
            });
            return bid;
          })
      );

      this.bids.v26.push(...bids);
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

    const highestBid = BidComparator.getHighestBidV26(
      this.bids.v26,
      this.bidInformation,
      this.options.currencyConversionData
    );

    this.setLosingBids(highestBid);
    this.handleLossBids();
    this.status = "closed";

    this.winningBid = highestBid;
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
      fetch(this.replaceMacro(bid.lurl), {
        keepalive: true,
      });
    }
  }

  private replaceMacro(url: string): string {
    const price = this.winningBid ? this.winningBid.price.toFixed(2) : '';
    const minToWin = this.winningBid ? (this.winningBid.price + 0.01).toFixed(2) : '';

    url = url.replaceAll("${AUCTION_PRICE}", price);
    url = url.replaceAll(
      "${AUCTION_MIN_TO_WIN}}",
      minToWin
    );
    url = url.replaceAll("${AUCTION_LOSS}", LossReasonCode.LOST_TO_HIGHER_BID.toString());

    return url;
  }
}
