/**
 * MarketplaceEngine — abstract marketplace layer for NEX Protocol
 *
 * Current: MockMarketplaceEngine (localStorage with simulated delays)
 * Future:  OnchainMarketplaceEngine (Solana Anchor program, SPL transfers)
 *
 * The UI (Marketplace.tsx) consumes this interface exclusively.
 * To go on-chain: implement OnchainMarketplaceEngine → swap one import.
 */

import type { TokenEntry } from "@/lib/gameEngine";

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */

export type TxStatus = "idle" | "pending" | "confirming" | "confirmed" | "failed";

export interface TxUpdate {
  type: "list" | "buy" | "cancel" | "accept-offer" | "place-offer";
  id: string;                  // listingId or offerId
  status: TxStatus;
  error?: string;
  txId?: string;
  message?: string;
}

export interface MarketplaceListing {
  id: string;
  prestige: number;
  seed: number;
  seller: string;
  price: number;
  listedAt: number;
  status: "active" | "sold" | "cancelled";
}

export interface TradeRecord {
  id: string;
  listingId: string;
  prestige: number;
  seed: number;
  price: number;
  seller: string;
  buyer: string;
  tradedAt: number;
  fee: number;
}

export interface Offer {
  id: string;
  listingId: string;
  buyer: string;
  amount: number;
  message?: string;
  createdAt: number;
  status: "pending" | "accepted" | "rejected" | "cancelled";
}

export interface ListNftParams {
  prestige: number;
  seed: number;
  price: number;
  seller: string;
  mint: string;
}

export interface BuyNftParams {
  listingId: string;
  price: number;
  seller: string;
  buyer: string;
}

export interface BalanceSnapshot {
  walletAddress: string;
  xntBalance: number;
  totalListings: number;
  totalTrades: number;
}

export interface ListingFilters {
  searchQuery?: string;
  sortBy?: "price-low" | "price-high" | "prestige-low" | "prestige-high" | "newest";
  selectedTiers?: number[];
  priceMin?: number;
  priceMax?: number;
  seedSearch?: string;
}

/* ═══════════════════════════════════════════════════════════════
   ENGINE INTERFACE
   ═══════════════════════════════════════════════════════════════ */

export interface MarketplaceEngine {
  /** Human-readable name for debug UIs */
  readonly name: string;

  /** Base fee percentage (e.g. 1 = 1%) */
  readonly feePercent: number;

  /**
   * Get fee percentage for a specific prestige tier.
   * Low tiers pay less, high tiers pay more.
   * P1-P20:   0.5%
   * P21-P50:  0.75%
   * P51-P80:  1.0%
   * P81-P100: 1.25%
   */
  getFeeForPrestige(prestige: number): number;

  /** ── Lifecycle ── */
  connect(): Promise<void>;
  disconnect(): void;
  isAvailable(): boolean;

  /** ── List ── */
  list(params: ListNftParams): Promise<MarketplaceListing>;

  /** ── Cancel ── */
  cancel(listingId: string): Promise<void>;

  /** ── Buy ── */
  buy(params: BuyNftParams): Promise<TradeRecord>;

  /** ── Offers ── */
  placeOffer(listingId: string, buyer: string, amount: number): Promise<Offer>;
  acceptOffer(offerId: string, acceptBy: string): Promise<TradeRecord | null>;
  rejectOffer(offerId: string): Promise<void>;

  /** ── Queries ── */
  getActiveListings(): Promise<MarketplaceListing[]>;
  getMyListings(walletAddress: string): Promise<MarketplaceListing[]>;
  getTradeHistory(address?: string): Promise<TradeRecord[]>;
  getOffers(listingId?: string): Promise<Offer[]>;
  getBalance(address: string): Promise<BalanceSnapshot>;

  /** ── Subscriptions ── */
  onTxUpdate(cb: (update: TxUpdate) => void): () => void;
  onDataChange(cb: () => void): () => void;
}

/* ═══════════════════════════════════════════════════════════════
   MOCK ENGINE
   ═══════════════════════════════════════════════════════════════ */

export class MockMarketplaceEngine implements MarketplaceEngine {
  readonly name = "Mock (localStorage)";
  readonly feePercent = 1;

  /** Fee tiers by prestige level */
  getFeeForPrestige(prestige: number): number {
    if (prestige <= 20) return 0.5;
    if (prestige <= 50) return 0.75;
    if (prestige <= 80) return 1.0;
    return 1.25;
  }

  private txListeners = new Set<(u: TxUpdate) => void>();
  private dataListeners = new Set<() => void>();

  private static STORAGE_PREFIX = "void-mock-mkt-";

  private static key(k: string) { return `${MockMarketplaceEngine.STORAGE_PREFIX}${k}`; }

  private storageRead<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(MockMarketplaceEngine.key(key));
      if (!raw) return fallback;
      return JSON.parse(raw) as T;
    } catch { return fallback; }
  }

  private storageWrite<T>(key: string, data: T): void {
    try { localStorage.setItem(MockMarketplaceEngine.key(key), JSON.stringify(data)); } catch {}
  }

  private emitTx(u: TxUpdate) { this.txListeners.forEach(cb => cb(u)); }
  private emitData() { this.dataListeners.forEach(cb => cb()); }

  private simulateDelay(ms = 600): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /* ── Lifecycle ── */

  async connect(): Promise<void> { /* mock: no-op */ }
  disconnect(): void { /* mock: no-op */ }
  isAvailable(): boolean { return true; }

  /* ── List ── */

  async list(params: ListNftParams): Promise<MarketplaceListing> {
    const listing: MarketplaceListing = {
      id: `mkt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      prestige: params.prestige,
      seed: params.seed,
      seller: params.seller,
      price: params.price,
      listedAt: Date.now(),
      status: "active",
    };

    this.emitTx({ type: "list", id: listing.id, status: "pending" });

    await this.simulateDelay(400);
    this.emitTx({ type: "list", id: listing.id, status: "confirming" });

    await this.simulateDelay(400);
    const listings = this.storageRead<MarketplaceListing[]>("listings", []);
    listings.push(listing);
    this.storageWrite("listings", listings);

    this.emitTx({ type: "list", id: listing.id, status: "confirmed", message: "iNFT listed!" });
    this.emitData();

    return listing;
  }

  /* ── Cancel ── */

  async cancel(listingId: string): Promise<void> {
    this.emitTx({ type: "cancel", id: listingId, status: "pending" });
    await this.simulateDelay(300);

    const listings = this.storageRead<MarketplaceListing[]>("listings", []);
    const updated = listings.map(l =>
      l.id === listingId && l.status === "active"
        ? { ...l, status: "cancelled" as const }
        : l
    );
    this.storageWrite("listings", updated);

    this.emitTx({ type: "cancel", id: listingId, status: "confirmed", message: "Listing cancelled" });
    this.emitData();
  }

  /* ── Buy ── */

  async buy(params: BuyNftParams): Promise<TradeRecord> {
    // Find the listing to determine prestige for fee tier
    const listings = this.storageRead<MarketplaceListing[]>("listings", []);
    const listing = listings.find(l => l.id === params.listingId);
    const prestigeLevel = listing?.prestige ?? 1;
    const effectiveFeePct = this.getFeeForPrestige(prestigeLevel);
    const fee = Math.ceil(params.price * (effectiveFeePct / 100));
    const trade: TradeRecord = {
      id: `trade-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      listingId: params.listingId,
      prestige: 0,   // will be filled from listing
      seed: 0,
      price: params.price,
      seller: params.seller,
      buyer: params.buyer,
      tradedAt: Date.now(),
      fee,
    };

    this.emitTx({ type: "buy", id: params.listingId, status: "pending", message: `Sending ${params.price.toLocaleString()} XNT...` });
    await this.simulateDelay(500);
    this.emitTx({ type: "buy", id: params.listingId, status: "confirming", message: "Confirming transfer..." });
    await this.simulateDelay(700);

    // Mark listing as sold
    if (!listing || listing.status !== "active") {
      const err = "Listing no longer available";
      this.emitTx({ type: "buy", id: params.listingId, status: "failed", error: err });
      throw new Error(err);
    }

    trade.prestige = listing.prestige;
    trade.seed = listing.seed;

    const updatedListings = listings.map(l =>
      l.id === params.listingId ? { ...l, status: "sold" as const } : l
    );
    this.storageWrite("listings", updatedListings);

    // Record trade
    const trades = this.storageRead<TradeRecord[]>("trades", []);
    trades.push(trade);
    this.storageWrite("trades", trades);

    this.emitTx({ type: "buy", id: params.listingId, status: "confirmed", message: `Purchased for ${params.price.toLocaleString()} XNT!` });
    this.emitData();

    return trade;
  }

  /* ── Offers ── */

  async placeOffer(listingId: string, buyer: string, amount: number): Promise<Offer> {
    const offer: Offer = {
      id: `offer-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      listingId,
      buyer,
      amount,
      createdAt: Date.now(),
      status: "pending",
    };

    this.emitTx({ type: "place-offer", id: offer.id, status: "pending" });
    await this.simulateDelay(200);

    const offers = this.storageRead<Offer[]>("offers", []);
    offers.push(offer);
    this.storageWrite("offers", offers);

    this.emitTx({ type: "place-offer", id: offer.id, status: "confirmed", message: "Offer placed!" });
    this.emitData();

    return offer;
  }

  async acceptOffer(offerId: string, acceptBy: string): Promise<TradeRecord | null> {
    this.emitTx({ type: "accept-offer", id: offerId, status: "pending" });
    await this.simulateDelay(300);

    const offers = this.storageRead<Offer[]>("offers", []);
    const offer = offers.find(o => o.id === offerId);
    if (!offer || offer.status !== "pending") return null;

    // Mark offer accepted
    const updatedOffers = offers.map(o =>
      o.id === offerId ? { ...o, status: "accepted" as const } : o
    );
    this.storageWrite("offers", updatedOffers);

    // Find listing and trigger buy
    const listings = this.storageRead<MarketplaceListing[]>("listings", []);
    const listing = listings.find(l => l.id === offer.listingId);
    if (!listing || listing.status !== "active") return null;

    const offerFeePct = listing ? this.getFeeForPrestige(listing.prestige) : this.feePercent;
    const fee = Math.ceil(offer.amount * (offerFeePct / 100));
    const trade = await this.buy({
      listingId: offer.listingId,
      price: offer.amount,
      seller: listing.seller,
      buyer: offer.buyer,
    });

    this.emitTx({ type: "accept-offer", id: offerId, status: "confirmed", message: "Offer accepted!" });
    this.emitData();

    return trade;
  }

  async rejectOffer(offerId: string): Promise<void> {
    const offers = this.storageRead<Offer[]>("offers", []);
    const updated = offers.map(o =>
      o.id === offerId && o.status === "pending"
        ? { ...o, status: "rejected" as const }
        : o
    );
    this.storageWrite("offers", updated);
    this.emitData();
  }

  /* ── Queries ── */

  async getActiveListings(): Promise<MarketplaceListing[]> {
    const listings = this.storageRead<MarketplaceListing[]>("listings", []);
    return listings.filter(l => l.status === "active");
  }

  async getMyListings(walletAddress: string): Promise<MarketplaceListing[]> {
    const listings = this.storageRead<MarketplaceListing[]>("listings", []);
    return listings.filter(l => l.seller === walletAddress);
  }

  async getTradeHistory(address?: string): Promise<TradeRecord[]> {
    const trades = this.storageRead<TradeRecord[]>("trades", []);
    if (address) return trades.filter(t => t.seller === address || t.buyer === address);
    return trades;
  }

  async getOffers(listingId?: string): Promise<Offer[]> {
    const offers = this.storageRead<Offer[]>("offers", []);
    if (listingId) return offers.filter(o => o.listingId === listingId);
    return offers;
  }

  async getBalance(address: string): Promise<BalanceSnapshot> {
    const listings = this.storageRead<MarketplaceListing[]>("listings", []);
    const trades = this.storageRead<TradeRecord[]>("trades", []);
    return {
      walletAddress: address,
      xntBalance: 100_000, // mock: everyone has 100K XNT (not 1M)
      totalListings: listings.filter(l => l.seller === address).length,
      totalTrades: trades.filter(t => t.seller === address || t.buyer === address).length,
    };
  }

  /* ── Subscriptions ── */

  onTxUpdate(cb: (u: TxUpdate) => void): () => void {
    this.txListeners.add(cb);
    return () => this.txListeners.delete(cb);
  }

  onDataChange(cb: () => void): () => void {
    this.dataListeners.add(cb);
    return () => this.dataListeners.delete(cb);
  }
}

/* ═══════════════════════════════════════════════════════════════
   FACTORY
   ═══════════════════════════════════════════════════════════════ */

let _instance: MarketplaceEngine | null = null;
let _isOnchain = false;

export function getMarketplaceEngine(): MarketplaceEngine {
  if (!_instance) {
    _instance = new MockMarketplaceEngine();
  }
  return _instance;
}

export function setMarketplaceEngine(engine: MarketplaceEngine): void {
  _instance = engine;
  _isOnchain = engine.name !== "Mock (localStorage)";
}

export function resetMarketplaceEngine(): void {
  _instance = new MockMarketplaceEngine();
  _isOnchain = false;
}

export function isOnchainMode(): boolean {
  return _isOnchain;
}