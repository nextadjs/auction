import { openrtbFaker } from "@nextad/faker";
import { Auction } from "@/Auction";
import {
  AlreadyEndedAuctionException,
  BidNotFoundException,
} from "@/exceptions";

describe("Auction", () => {
  it("returns highest bid from bids with specified item(impression) when auction ends", () => {
    const sut = new Auction("impid-1");
    const bidResponse = openrtbFaker.v26.bidResponse
      .addBannerBid({ impid: "impid-1", price: 10 })
      .make();
    const bidResponse2 = openrtbFaker.v26.bidResponse
      .addBannerBid({ impid: "impid-1", price: 20 })
      .make();
    sut.placeBidResponseV26(bidResponse);
    sut.placeBidResponseV26(bidResponse2);

    const result = sut.end();

    expect(result.id).toBe(bidResponse2.seatbid![0].bid[0].id);
  });

  it("returns highest bid from bids with specified items(impressions) when auction ends", () => {
    const sut = new Auction(["impid-1", "impid-2"]);
    const bidResponse = openrtbFaker.v26.bidResponse
      .addBannerBid({ impid: "impid-1", price: 10 })
      .make();
    const bidResponse2 = openrtbFaker.v26.bidResponse
      .addBannerBid({ impid: "impid-1", price: 20 })
      .addVideoBid({ impid: "impid-2", price: 30 })
      .make();
    sut.placeBidResponseV26(bidResponse);
    sut.placeBidResponseV26(bidResponse2);

    const result = sut.end();

    expect(result.id).toBe(bidResponse2.seatbid![0].bid[1].id);
  });

  it("returns highest bid considering currency when auction ends", () => {
    const sut = new Auction("impid-1", {
      currencyConversionData: {
        dataAsOf: "2021-01-01",
        generatedAt: "2021-01-01",
        conversions: {
          JPY: {
            USD: 0.09,
          },
        },
      },
    });
    const bidResponse = openrtbFaker.v26.bidResponse
      .withCurrency("JPY")
      .addBannerBid({ impid: "impid-1", price: 10 })
      .make();
    const bidResponse2 = openrtbFaker.v26.bidResponse
      .withCurrency("USD")
      .addBannerBid({ impid: "impid-1", price: 5 })
      .make();
    sut.placeBidResponseV26(bidResponse);
    sut.placeBidResponseV26(bidResponse2);

    const result = sut.end();

    expect(result.id).toBe(bidResponse2.seatbid![0].bid[0].id);
  });

  it("throws error when attempting to end auction without bids", () => {
    const sut = new Auction("impid-1");

    expect(() => sut.end()).toThrow(BidNotFoundException);
  });
  it("returns losing bids when auction ends", () => {
    const sut = new Auction(["impid-1", "impid-2"]);
    const bidResponse = openrtbFaker.v26.bidResponse
      .addBannerBid({
        impid: "impid-1",
        price: 10,
      })
      .addBannerBid({
        impid: "impid-2",
        price: 20,
      })
      .make();
    sut.placeBidResponseV26(bidResponse);

    sut.end();

    const losingBids = sut.getLosingBids();
    expect(losingBids.v26.length).toBe(1);
    expect(losingBids.v26[0].id).toBe(bidResponse.seatbid![0].bid[0].id);
  });

  it("throws error when attempting to already ended auction", () => {
    const sut = new Auction("impid-1");
    const bidResponse = openrtbFaker.v26.bidResponse
      .addBannerBid({ impid: "impid-1", price: 10 })
      .make();
    sut.placeBidResponseV26(bidResponse);
    sut.end();

    expect(() => sut.end()).toThrow(AlreadyEndedAuctionException);
  });

  it("sends loss notification when bid contains loss notice url", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const sut = new Auction(["impid-1", "impid-2"]);
    const bidResponse = openrtbFaker.v26.bidResponse
      .addBannerBid({
        impid: "impid-1",
        price: 10,
        lurl: "https://example.com/lurl",
      })
      .addBannerBid({
        impid: "impid-2",
        price: 20,
      })
      .make();
    sut.placeBidResponseV26(bidResponse);

    sut.end();

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith("https://example.com/lurl", {
      keepalive: true,
    });
  });

  it("does not send loss notification when bid does not contain loss notice url", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const sut = new Auction(["impid-1", "impid-2"]);
    const bidResponse = openrtbFaker.v26.bidResponse
      .addBannerBid({
        impid: "impid-1",
        price: 10,
      })
      .addBannerBid({
        impid: "impid-2",
        price: 20,
      })
      .make();
    sut.placeBidResponseV26(bidResponse);

    sut.end();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not send loss notification when loss processing is specified as false", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const sut = new Auction(["impid-1", "impid-2"], {
      lossProcessing: false,
    });
    const bidResponse = openrtbFaker.v26.bidResponse
      .addBannerBid({
        impid: "impid-1",
        price: 10,
        lurl: "https://example.com/lurl",
      })
      .addBannerBid({
        impid: "impid-2",
        price: 20,
      })
      .make();
    sut.placeBidResponseV26(bidResponse);

    sut.end();

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
