"use client";
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { getPrestigeBadgePath, PRESTIGE_NAMES, PRESTIGE_TICKERS } from "@/lib/void";
import type { NftEntry } from "@/lib/gameEngine";
import type {
  MarketplaceListing, TradeRecord, Offer, TxUpdate,
  MarketplaceEngine,
} from "@/lib/marketplaceEngine";
import { getMarketplaceEngine } from "@/lib/marketplaceEngine";

interface MarketplaceProps {
  marketplaceListings: MarketplaceListing[];
  /** @deprecated unused — engine handles listing */
  onListNft?: (nft: NftEntry, price: number) => void;
  /** @deprecated unused — engine handles buying */
  onBuyNft?: (listing: MarketplaceListing) => void;
  /** @deprecated unused — engine handles cancellation */
  onCancelListing?: (listingId: string) => void;
  walletAddress: string | null;
  mintedNfts: NftEntry[];
  xntBalance: number;
  txPending?: boolean;
  engine?: MarketplaceEngine;
}

// ─── Theme ─────────────────────────────────────────────────────────────────

const BLUE = "#0066ff";
const BLUE_LIGHT = "#4488ff";
const BLUE_DARK = "#003399";
const BG_DARK = "#08080c";
const BG_CARD = "#0c0c14";
const CARD_BORDER = "rgba(255,255,255,0.06)";
const CARD_BORDER_HOVER = "rgba(0,102,255,0.35)";
const TXT = "#e8e4dd";
const TXT_MUTED = "#8989ac";
const TXT_DIM = "#68687e";
const GREEN = "#22c55e";
const RED = "#ef4444";
const AMBER = "#f59e0b";

const MAX_PRESTIGE_TIER = 100;

// ─── Sub-components ───────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {[1,2,3,4].map(i => (
        <div
          key={i}
          className="rounded-xl border p-3 flex flex-col items-center gap-2 animate-pulse"
          style={{ background: BG_CARD, borderColor: CARD_BORDER }}
        >
          <div className="w-14 h-14 rounded-full" style={{ background: "rgba(255,255,255,0.04)" }} />
          <div className="h-3 w-20 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
          <div className="h-2 w-16 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
          <div className="h-6 w-24 rounded-full" style={{ background: "rgba(255,255,255,0.04)" }} />
          <div className="h-8 w-full rounded-lg" style={{ background: "rgba(255,255,255,0.04)" }} />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ icon, title, desc, action }: { icon: string; title: string; desc: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="text-4xl opacity-30">{icon}</div>
      <p className="text-sm font-medium" style={{ color: TXT_MUTED }}>{title}</p>
      <p className="text-[10px] text-center max-w-[240px]" style={{ color: TXT_DIM }}>{desc}</p>
      {action}
    </div>
  );
}

// ─── Offers Modal ─────────────────────────────────────────────────────────

function OffersSidebar({
  listingId,
  offers,
  walletAddress,
  onAcceptOffer,
  onRejectOffer,
  onPlaceOffer,
  onClose,
}: {
  listingId: string;
  offers: Offer[];
  walletAddress: string | null;
  onAcceptOffer: (offerId: string) => void;
  onRejectOffer: (offerId: string) => void;
  onPlaceOffer: (listingId: string, amount: number) => void;
  onClose: () => void;
}) {
  const [offerAmount, setOfferAmount] = useState("");
  const listingOffers = offers.filter(o => o.listingId === listingId);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const keydown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', keydown);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', keydown); };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl border p-5 max-h-[70vh] overflow-y-auto"
        style={{
          background: `${BG_DARK}ee`,
          borderColor: CARD_BORDER,
          backdropFilter: "blur(20px)",
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold" style={{ color: TXT }}>🤝 Offers</h3>
          <button onClick={onClose} className="text-xs" style={{ color: TXT_MUTED }} aria-label="Close">✕</button>
        </div>

        {!walletAddress ? (
          <p className="text-xs text-center py-6" style={{ color: TXT_DIM }}>Connect wallet to place offers</p>
        ) : (
          <>
            {/* Place offer */}
            <div className="flex gap-2 mb-4">
              <input
                type="number"
                min="1"
                max="9999999999999"
                step="1"
                value={offerAmount}
                onChange={e => setOfferAmount(e.target.value)}
                placeholder="Offer amount"
                className="flex-1 rounded-lg border px-3 py-2 text-xs font-mono outline-none focus:ring-2 focus:ring-[#0066ff]/50"
                style={{
                  background: "rgba(8,8,15,0.8)",
                  borderColor: CARD_BORDER,
                  color: BLUE_LIGHT,
                }}
              />
              <button
                onClick={() => {
                  const amt = Number(offerAmount);
                  if (amt > 0) { onPlaceOffer(listingId, amt); setOfferAmount(""); }
                }}
                disabled={!offerAmount || Number(offerAmount) <= 0 || !walletAddress}
                className="px-4 py-2 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: `linear-gradient(135deg, ${BLUE}, ${BLUE_DARK})`,
                  color: "#fff",
                  opacity: !offerAmount || Number(offerAmount) <= 0 ? 0.4 : 1,
                }}
              >
                Offer
              </button>
            </div>

            {/* Existing offers */}
            {listingOffers.length === 0 ? (
              <p className="text-xs text-center py-4" style={{ color: TXT_DIM }}>No offers yet</p>
            ) : (
              <div className="space-y-2">
                {listingOffers.map(o => {
                  const isSentByMe = o.buyer === walletAddress;
                  const canRespond = !isSentByMe && o.status === "pending";
                  return (
                    <div
                      key={o.id}
                      className="rounded-xl border p-3"
                      style={{ background: BG_CARD, borderColor: CARD_BORDER }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono" style={{ color: BLUE_LIGHT }}>
                          {o.amount.toLocaleString()} XN
                        </span>
                        <span className="text-[9px]" style={{
                          color: o.status === "pending" ? AMBER : o.status === "accepted" ? GREEN : RED,
                        }}>
                          {o.status}
                        </span>
                      </div>
                      <p className="text-[9px] mt-1" style={{ color: TXT_DIM }}>
                        {isSentByMe ? "Your offer" : `by ${o.buyer.slice(0, 4)}...${o.buyer.slice(-4)}`}
                      </p>
                      {canRespond && (
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => onAcceptOffer(o.id)}
                            className="flex-1 text-[9px] py-1 rounded-lg font-medium"
                            style={{ background: `${GREEN}22`, color: GREEN, border: `1px solid ${GREEN}44` }}
                          >
                            ✓ Accept
                          </button>
                          <button
                            onClick={() => onRejectOffer(o.id)}
                            className="flex-1 text-[9px] py-1 rounded-lg font-medium"
                            style={{ background: `${RED}22`, color: RED, border: `1px solid ${RED}44` }}
                          >
                            ✕ Reject
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────

export default function Marketplace({
  marketplaceListings,
  onListNft: _onListNft,
  onBuyNft: _onBuyNft,
  onCancelListing: _onCancelListing,
  walletAddress,
  mintedNfts,
  xntBalance,
  engine: engineProp,
  txPending: txPendingProp,
}: MarketplaceProps) {
  // ── Tabs ──
  const [activeTab, setActiveTab] = useState<"browse" | "my-listings" | "list" | "history">("browse");

  // ── Browse filters ──
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"price-low" | "price-high" | "prestige-low" | "prestige-high" | "newest">("newest");
  const [selectedTiers, setSelectedTiers] = useState<number[]>([]);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [seedSearch, setSeedSearch] = useState("");

  // ── List NFT form ──
  const [selectedNftIndex, setSelectedNftIndex] = useState<number | null>(null);
  const [listPrice, setListPrice] = useState("");

  // ── Engine ──
  const engine = engineProp ?? getMarketplaceEngine();

  // ── Notifications ──
  const [notification, setNotification] = useState<{ text: string; color: string } | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | '7d'>('all');
  const [buyConfirm, setBuyConfirm] = useState<MarketplaceListing | null>(null);

  // ── Local state (reactivity layer over engine) ──
  const [offers, setOffers] = useState<Offer[]>([]);
  const [tradeHistory, setTradeHistory] = useState<TradeRecord[]>([]);
  const [offersSidebarListing, setOffersSidebarListing] = useState<string | null>(null);
  const [localTxPending, setLocalTxPending] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // ── Featured carousel scroll ──
  const carouselRef = useRef<HTMLDivElement>(null);

  // ── Refresh all data from engine ──
  const refreshData = useCallback(async () => {
    try {
      const [activeOffers, trades] = await Promise.all([
        engine.getOffers(),
        engine.getTradeHistory(),
      ]);
      setOffers(activeOffers);
      setTradeHistory(trades);
    } catch (err) {
      console.warn("[Marketplace] refresh failed:", err);
    }
  }, [engine]);

  // ── Load + subscribe to engine changes ──
  useEffect(() => {
    refreshData();
    const unsubTx = engine.onTxUpdate((u: TxUpdate) => {

      setLocalTxPending(u.status === "pending" || u.status === "confirming");
    });
    const unsubData = engine.onDataChange(() => {
      refreshData();
    });
    return () => { unsubTx(); unsubData(); };
  }, [engine, refreshData]);

  // ── Auto-dismiss notification ──
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 3500);
    return () => clearTimeout(timer);
  }, [notification]);

  useEffect(() => {
    const timer = setTimeout(() => setInitialLoading(false), 200);
    return () => clearTimeout(timer);
  }, []);

  const showNotification = useCallback((text: string, color: string = BLUE) => {
    setNotification({ text, color });
  }, []);

  // ── Active listings ──
  const activeListings = marketplaceListings.filter(l => l.status === "active");

  // ── Floor price per tier ──
  const floorPrices = useMemo(() => {
    const floors: Record<number, number | null> = {};
    for (let t = 1; t <= MAX_PRESTIGE_TIER; t++) {
      const tier = activeListings.filter(l => l.prestige === t);
      floors[t] = tier.length > 0 ? Math.min(...tier.map(l => l.price)) : null;
    }
    return floors;
  }, [activeListings]);

  // ── Dismiss loading once data arrives ──
  useEffect(() => {
    if (activeListings.length > 0) setInitialLoading(false);
  }, [activeListings.length]);

  // ── Tiers that have active listings ──
  const tiersWithFloor = useMemo(() => {
    return Object.entries(floorPrices)
      .map(([t, p]) => ({ tier: Number(t), floor: p }))
      .filter(x => x.floor !== null)
      .sort((a, b) => a.tier - b.tier);
  }, [floorPrices]);

  // ── Featured listings (pick highest-priced 6) ──
  const featured = useMemo(() => {
    return [...activeListings].sort((a, b) => b.price - a.price).slice(0, 6);
  }, [activeListings]);

  // ── Filtered listings ──
  const filteredListings = useMemo(() => {
    let list = [...activeListings];

    // Prestige tier filter
    if (selectedTiers.length > 0) {
      list = list.filter(l => selectedTiers.includes(l.prestige));
    }

    // Text search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(l => {
        const name = (PRESTIGE_NAMES[l.prestige - 1] ?? "").toLowerCase();
        const ticker = (PRESTIGE_TICKERS[l.prestige - 1] ?? "").toLowerCase();
        return name.includes(q) || ticker.includes(q) || `p${l.prestige}`.includes(q);
      });
    }

    // Seed search
    if (seedSearch) {
      const seedNum = parseInt(seedSearch);
      if (!isNaN(seedNum) && seedSearch.length >= 1) {
        const exactNum = parseInt(seedSearch, 10);
        if (!isNaN(exactNum)) {
          list = list.filter(l => l.seed === exactNum);
        }
      }
    }

    // Price range
    if (priceMin) {
      const min = Number(priceMin);
      if (!isNaN(min)) list = list.filter(l => l.price >= min);
    }
    if (priceMax) {
      const max = Number(priceMax);
      if (!isNaN(max)) list = list.filter(l => l.price <= max);
    }

    // Sort
    list.sort((a, b) => {
      switch (sortBy) {
        case "price-low": return a.price - b.price;
        case "price-high": return b.price - a.price;
        case "prestige-low": return a.prestige - b.prestige;
        case "prestige-high": return b.prestige - a.prestige;
        case "newest": return b.listedAt - a.listedAt;
        default: return 0;
      }
    });

    return list;
  }, [activeListings, searchQuery, sortBy, selectedTiers, priceMin, priceMax, seedSearch]);

  // ── My listings ──
  const myListings = marketplaceListings.filter(l => l.seller === walletAddress);
  const myActiveListings = myListings.filter(l => l.status === "active");
  const myHistoryListings = myListings.filter(l => l.status !== "active");

  // ── Incoming offers for my listings ──
  const myListingIds = new Set(myActiveListings.map(l => l.id));
  const incomingOffers = offers.filter(o => myListingIds.has(o.listingId) && o.status === "pending");
  const incomingOfferCount = incomingOffers.length;

  // ── Available to list ──
  const listedSeeds = new Set(myActiveListings.map(l => `${l.prestige}-${l.seed}`));
  const availableToList = mintedNfts.filter(n => !listedSeeds.has(`${n.prestige}-${n.seed}`));

  // ── Trades for my history ──
  const myTrades = tradeHistory.filter(t => t.seller === walletAddress || t.buyer === walletAddress);
  const allTrades = tradeHistory;

  // ── Filtered trades for history tab ──
  const filteredTrades = useMemo(() => {
    let trades = [...allTrades];
    if (timeFilter === 'today') {
      trades = trades.filter(t => Date.now() - t.tradedAt < 86400000);
    } else if (timeFilter === '7d') {
      trades = trades.filter(t => Date.now() - t.tradedAt < 604800000);
    }
    return trades;
  }, [allTrades, timeFilter]);

  const myFilteredTrades = useMemo(() => {
    let trades = myTrades;
    if (timeFilter === 'today') {
      trades = trades.filter(t => Date.now() - t.tradedAt < 86400000);
    } else if (timeFilter === '7d') {
      trades = trades.filter(t => Date.now() - t.tradedAt < 604800000);
    }
    return trades;
  }, [myTrades, timeFilter]);

  // ── Handlers (via engine) ──

  const [pendingTimeout, setPendingTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  const withPendingGuard = (fn: () => Promise<void>) => {
    setLocalTxPending(true);
    const guard = setTimeout(() => { setLocalTxPending(false); }, 30000);
    setPendingTimeout(guard);
    return fn().finally(() => {
      clearTimeout(guard);
      setPendingTimeout(null);
      setLocalTxPending(false);
    });
  };

  const handleList = async () => {
    if (selectedNftIndex === null || selectedNftIndex < 0 || selectedNftIndex >= availableToList.length) return;
    const price = Math.max(1, Math.floor(Number(listPrice)));
    if (!price || price < 1) {
      showNotification("⚠️ Enter a valid price", RED);
      return;
    }
    setLocalTxPending(true);
    try {
      await engine.list({
        prestige: availableToList[selectedNftIndex].prestige,
        seed: availableToList[selectedNftIndex].seed,
        mint: availableToList[selectedNftIndex].mintAddress ?? "",
        price,
        seller: walletAddress ?? "unknown",
      });
      setSelectedNftIndex(null);
      setListPrice("");
      showNotification("✅ iNFT listed on marketplace!", GREEN);
    } catch (err: any) {
      showNotification(`⚠️ ${err.message ?? "Failed to list"}`, RED);
    } finally {
      setLocalTxPending(false);
    }
  };

  const handleBuy = async (listing: MarketplaceListing) => {
    const feePct = engine.getFeeForPrestige(listing.prestige);
    const fee = Math.ceil(listing.price * (feePct / 100));
    const total = listing.price + fee;
    if (listing.seller === walletAddress) {
      showNotification("⚠️ You cannot buy your own listing", RED);
      return;
    }
    const balanceSnapshot = xntBalance;
    if (balanceSnapshot < total) {
      showNotification(`⚠️ Need ${total.toLocaleString()} XN (${listing.price.toLocaleString()} + ${fee.toLocaleString()} fee)`, RED);
      return;
    }
    setLocalTxPending(true);
    try {
      await engine.buy({
        listingId: listing.id,
        price: listing.price,
        seller: listing.seller,
        buyer: walletAddress ?? "unknown",
      });
      showNotification(`✅ Purchased P${listing.prestige} for ${listing.price.toLocaleString()} XN (+${fee.toLocaleString()} fee)`, GREEN);
    } catch (err: any) {
      showNotification(`⚠️ ${err.message ?? "Purchase failed"}`, RED);
    } finally {
      setLocalTxPending(false);
    }
  };

  const confirmBuy = () => {
    if (!buyConfirm) return;
    const l = buyConfirm;
    setBuyConfirm(null);
    handleBuy(l);
  };

  const handleCancel = async (listingId: string) => {
    setLocalTxPending(true);
    try {
      await engine.cancel(listingId);
      showNotification("📦 Listing cancelled", AMBER);
    } catch (err: any) {
      showNotification(`⚠️ ${err.message ?? "Cancel failed"}`, RED);
    } finally {
      setLocalTxPending(false);
    }
  };

  // ── Offer handlers (via engine) ──
  const handlePlaceOffer = useCallback(async (listingId: string, amount: number) => {
    return withPendingGuard(async () => {
      await engine.placeOffer(listingId, walletAddress ?? "unknown", amount);
      showNotification("📩 Offer placed", BLUE_LIGHT);
      refreshData();
    }).catch((err: any) => {
      showNotification(`⚠️ ${err.message ?? "Failed to place offer"}`, RED);
    });
  }, [walletAddress, engine, showNotification, refreshData, RED, BLUE_LIGHT]);

  const handleAcceptOffer = useCallback(async (offerId: string) => {
    return withPendingGuard(async () => {
      const trade = await engine.acceptOffer(offerId, walletAddress ?? "unknown");
      if (trade) {
        showNotification("✅ Offer accepted! Trade completed", GREEN);
        refreshData();
      } else {
        showNotification("⚠️ Could not accept offer (listing may be gone)", RED);
      }
    }).catch((err: any) => {
      showNotification(`⚠️ ${err.message ?? "Failed to accept offer"}`, RED);
    });
  }, [walletAddress, engine, showNotification, refreshData, GREEN, RED]);

  const handleRejectOffer = useCallback(async (offerId: string) => {
    return withPendingGuard(async () => {
      await engine.rejectOffer(offerId);
      showNotification("📩 Offer rejected", TXT_MUTED);
      refreshData();
    }).catch((err: any) => {
      showNotification(`⚠️ ${err.message ?? "Failed to reject offer"}`, RED);
    });
  }, [engine, showNotification, refreshData, TXT_MUTED, RED]);

  // Determine if a TX is in flight
  const effectiveTxPending = txPendingProp || localTxPending;



  // ── Carousel scroll ──
  const scrollCarousel = (dir: "left" | "right") => {
    if (!carouselRef.current) return;
    const scroll = carouselRef.current;
    const amt = 320;
    scroll.scrollBy({ left: dir === "left" ? -amt : amt, behavior: "smooth" });
  };

  // ── Pill style helper ──
  const pillStyle = (isActive: boolean) => ({
    background: isActive ? `${BLUE}18` : `${BG_CARD}66`,
    borderColor: isActive ? `${BLUE}55` : CARD_BORDER,
    color: isActive ? "#fff" : TXT_MUTED,
  });

  // ═══════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════

  if (initialLoading && activeListings.length === 0) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 py-6" style={{ color: TXT }}>
        <div className="text-center space-y-1 mb-5">
          <h2 className="text-lg font-bold" style={{ color: BLUE }}>🏪 Marketplace</h2>
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6" style={{ color: TXT }}>
      {/* ── Notification ── */}
      {notification && (
        <div
          className="fixed top-16 left-1/2 -translate-x-1/2 z-[500] px-4 py-2.5 rounded-xl text-xs font-medium shadow-2xl animate-float-up"
          style={{
            background: `${notification.color}18`,
            border: `1px solid ${notification.color}44`,
            color: notification.color,
            backdropFilter: "blur(16px)",
            boxShadow: `0 0 30px ${notification.color}22`,
          }}
        >
          {notification.text}
        </div>
      )}

      {/* ── Offers sidebar ── */}
      {offersSidebarListing && (
        <OffersSidebar
          listingId={offersSidebarListing}
          offers={offers}
          walletAddress={walletAddress}
          onAcceptOffer={handleAcceptOffer}
          onRejectOffer={handleRejectOffer}
          onPlaceOffer={handlePlaceOffer}
          onClose={() => setOffersSidebarListing(null)}
        />
      )}

      {/* ── Header ── */}
      <div className="text-center space-y-1 mb-5">
        <h2 className="text-lg font-bold" style={{ color: BLUE }}>🏪 Marketplace</h2>
        <p className="text-[10px]" style={{ color: TXT_MUTED }}>
          {walletAddress
            ? `${xntBalance.toLocaleString()} XN · ${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
            : "Connect X1 Wallet to trade"}
        </p>
      </div>

      {/* ── Tab bar ── */}
      <div className="flex gap-2 justify-center mb-4">
        {[
          { key: "browse" as const, label: "🔍 Browse" },
          { key: "my-listings" as const, label: `📦 My Listings${incomingOfferCount > 0 ? ` (${incomingOfferCount})` : ""}` },
          { key: "list" as const, label: "📤 List" },
          { key: "history" as const, label: "📊 History" },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className="text-xs px-4 py-1.5 rounded-full border transition-all"
            style={pillStyle(activeTab === t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════ BROWSE ═══════════════════════ */}
      {activeTab === "browse" && (
        <div className="space-y-4">

          {/* ── Featured Carousel ── */}
          {featured.length >= 2 && (
            <>
              <div className="relative group">
                <div className="flex items-center gap-1 mb-2">
                  <span className="text-[9px] font-medium uppercase tracking-widest" style={{ color: BLUE }}>✦ Featured</span>
                </div>
                <div
                  ref={carouselRef}
                  className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory"
                  style={{ scrollbarWidth: "none" }}
                >
                  {featured.map(listing => {
                    const idx = listing.prestige - 1;
                    const name = PRESTIGE_NAMES[idx] ?? "???";
                    return (
                      <div
                        key={listing.id}
                        className="flex-shrink-0 snap-start rounded-xl border p-3 flex items-center gap-3 transition-all cursor-pointer hover:scale-[1.02]"
                        style={{
                          background: BG_CARD,
                          borderColor: CARD_BORDER_HOVER,
                          boxShadow: `0 0 30px ${BLUE}18`,
                        }}
                        onClick={() => setBuyConfirm(listing)}
                      >
                        <img
                          src={getPrestigeBadgePath(listing.prestige)}
                          alt={`P${listing.prestige}`}
                          className="w-16 h-16 rounded-xl object-cover"
                        />
                        <div>
                          <p className="text-xs font-medium text-gray-200">{name}</p>
                          <p className="text-[9px]" style={{ color: TXT_MUTED }}>
                            P{listing.prestige} · #{listing.seed}
                          </p>
                          <div className="mt-1 text-sm font-bold" style={{ color: BLUE }}>
                            {listing.price.toLocaleString()} XN
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Scroll arrows */}
                <button
                  onClick={() => scrollCarousel("left")}
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center text-xs opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                  style={{ background: `${BG_DARK}cc`, color: TXT, border: `1px solid ${CARD_BORDER}` }}
                  aria-label="Scroll left"
                >
                  ‹
                </button>
                <button
                  onClick={() => scrollCarousel("right")}
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center text-xs opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                  style={{ background: `${BG_DARK}cc`, color: TXT, border: `1px solid ${CARD_BORDER}` }}
                  aria-label="Scroll right"
                >
                  ›
                </button>
              </div>
              {/* Carousel dots */}
              {featured.length > 1 && (
                <div className="flex justify-center gap-1.5 mt-2">
                  {featured.slice(0, Math.min(featured.length, 7)).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        if (carouselRef.current && carouselRef.current.children[i]) {
                          (carouselRef.current.children[i] as HTMLElement).scrollIntoView({
                            behavior: 'smooth', block: 'nearest', inline: 'start'
                          });
                        }
                      }}
                      className="w-1.5 h-1.5 rounded-full transition-all"
                      style={{
                        background: i === 0 ? BLUE : 'rgba(255,255,255,0.12)',
                        width: i === 0 ? '12px' : '6px',
                        borderRadius: i === 0 ? '3px' : '50%',
                      }}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── Buy Confirmation Modal ── */}
          {buyConfirm && (
            <div
              className="fixed inset-0 z-[300] flex items-center justify-center"
              onClick={() => setBuyConfirm(null)}
              onKeyDown={e => { if (e.key === 'Escape') setBuyConfirm(null); }}
              tabIndex={-1}
              ref={el => { if (el) el.focus(); }}
            >
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
              <div
                className="relative w-[300px] rounded-2xl border p-5 text-center"
                style={{
                  background: `${BG_DARK}ee`,
                  borderColor: CARD_BORDER,
                  backdropFilter: "blur(20px)",
                }}
                onClick={e => e.stopPropagation()}
              >
                <p className="text-sm font-bold mb-3" style={{ color: TXT }}>Confirm Buy</p>
                <div className="flex flex-col items-center gap-2 mb-4">
                  <img src={getPrestigeBadgePath(buyConfirm.prestige)} alt="" className="w-16 h-16 rounded-full" />
                  <p className="text-xs font-medium" style={{ color: TXT }}>
                    {(PRESTIGE_NAMES[buyConfirm.prestige - 1] ?? "???")} · P{buyConfirm.prestige} #{buyConfirm.seed}
                  </p>
                  <p className="text-lg font-bold" style={{ color: BLUE }}>
                    {buyConfirm.price.toLocaleString()} XN
                  </p>
                  <p className="text-[10px]" style={{ color: TXT_DIM }}>
                    +{Math.ceil(buyConfirm.price * engine.getFeeForPrestige(buyConfirm.prestige) / 100).toLocaleString()} XN fee
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setBuyConfirm(null)}
                    className="flex-1 text-xs py-2 rounded-lg border"
                    style={{ borderColor: CARD_BORDER, color: TXT_MUTED }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmBuy}
                    className="flex-1 text-xs py-2 rounded-lg font-medium"
                    style={{ background: `linear-gradient(135deg, ${BLUE}, ${BLUE_DARK})`, color: "#fff" }}
                  >
                    ✓ Confirm Buy
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Floor Price Bar ── */}
          <div className="rounded-xl border p-3" style={{ background: BG_CARD, borderColor: CARD_BORDER }}>
            <div className="flex items-center gap-1 mb-2">
              <span className="text-[9px] font-medium uppercase tracking-widest" style={{ color: TXT_MUTED }}>Floor Prices</span>
            </div>
            <div className="relative">
              <div className="flex gap-3 overflow-x-auto scrollbar-hide before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-6 before:bg-gradient-to-r before:from-[#08080c] before:to-transparent before:pointer-events-none before:z-10 after:content-[''] after:absolute after:right-0 after:top-0 after:bottom-0 after:w-6 after:bg-gradient-to-l after:from-[#08080c] after:to-transparent after:pointer-events-none after:z-10" style={{ scrollbarWidth: "none" }}>
              {tiersWithFloor.length === 0 ? (
                <span className="text-[10px]" style={{ color: TXT_DIM }}>No active listings</span>
              ) : tiersWithFloor.map(({ tier, floor }) => {
                const name = PRESTIGE_TICKERS[tier - 1] ?? "";
                return (
                  <div
                    key={tier}
                    className="flex-shrink-0 flex items-center gap-2 rounded-lg px-3 py-1.5 border transition-all"
                    style={{
                      background: floor !== null ? `${BLUE}0a` : "transparent",
                      borderColor: floor !== null ? `${BLUE}22` : CARD_BORDER,
                      opacity: floor !== null ? 1 : 0.3,
                    }}
                  >
                    <img
                      src={getPrestigeBadgePath(tier)}
                      alt={`P${tier}`}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-[9px] font-medium" style={{ color: TXT }}>{name}</p>
                      <p className="text-[8px] font-mono" style={{ color: floor !== null ? BLUE_LIGHT : TXT_DIM }}>
                        {floor !== null ? `${floor.toLocaleString()} XN` : "——"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            </div>
            {tiersWithFloor.length > 6 && (
              <p className="text-[8px] mt-1.5 text-right" style={{ color: TXT_DIM }}>scroll →</p>
            )}
          </div>

          {/* ── Search / Sort / Filters ── */}
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search name, ticker, prestige..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border px-3 py-2 text-xs font-mono outline-none focus:ring-2 focus:ring-[#0066ff]/50 transition-all"
                  style={{ background: "rgba(8,8,15,0.8)", borderColor: CARD_BORDER, color: BLUE_LIGHT }}
                  onFocus={e => { e.currentTarget.style.borderColor = `${BLUE}66`; }}
                  onBlur={e => { e.currentTarget.style.borderColor = CARD_BORDER; }}
                />
              </div>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="rounded-xl border px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-[#0066ff]/50"
                style={{ background: "rgba(8,8,15,0.8)", borderColor: CARD_BORDER, color: BLUE_LIGHT }}
              >
                <option value="newest">🕐 Newest</option>
                <option value="price-low">💰 Low→High</option>
                <option value="price-high">💰 High→Low</option>
                <option value="prestige-low">🏅 Low→High</option>
                <option value="prestige-high">🏅 High→Low</option>
              </select>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-3 py-2 rounded-xl border text-xs transition-all focus:ring-2 focus:ring-[#0066ff]/50"
                style={{
                  background: showFilters ? `${BLUE}18` : "rgba(8,8,15,0.8)",
                  borderColor: showFilters ? `${BLUE}44` : CARD_BORDER,
                  color: showFilters ? BLUE_LIGHT : TXT_MUTED,
                }}
              >
                ⚙
              </button>
            </div>

            {showFilters && (
              <div
                className="rounded-xl border p-3 space-y-3"
                style={{ background: BG_CARD, borderColor: CARD_BORDER }}
              >
                {/* Prestige tier checkboxes */}
                <div>
                  <p className="text-[9px] mb-1.5" style={{ color: TXT_MUTED }}>Prestige Tier</p>
                  <div className="flex flex-wrap gap-1.5">
                    {tiersWithFloor.map(({ tier }) => {
                      const isSelected = selectedTiers.includes(tier);
                      return (
                        <button
                          key={tier}
                          onClick={() => setSelectedTiers(prev =>
                            isSelected ? prev.filter(t => t !== tier) : [...prev, tier]
                          )}
                          className="text-[10px] px-2.5 py-1 rounded-lg border transition-all"
                          style={{
                            background: isSelected ? `${BLUE}18` : "transparent",
                            borderColor: isSelected ? `${BLUE}44` : CARD_BORDER,
                            color: isSelected ? BLUE_LIGHT : TXT_MUTED,
                          }}
                        >
                          P{tier}
                        </button>
                      );
                    })}
                    {selectedTiers.length > 0 && (
                      <button
                        onClick={() => setSelectedTiers([])}
                        className="text-[10px] px-2.5 py-1 rounded-lg border"
                        style={{ borderColor: RED + "44", color: RED }}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Price range + seed */}
                <div className="flex gap-2">
                  <div className="flex-1">
                    <p className="text-[9px] mb-1" style={{ color: TXT_MUTED }}>Min Price</p>
                    <input
                      type="number"
                      min="0"
                      max="9999999999999"
                      value={priceMin}
                      onChange={e => setPriceMin(e.target.value)}
                      placeholder="0"
                      className="w-full rounded-lg border px-2.5 py-1.5 text-[10px] font-mono outline-none"
                      style={{ background: "rgba(8,8,15,0.8)", borderColor: CARD_BORDER, color: BLUE_LIGHT }}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-[9px] mb-1" style={{ color: TXT_MUTED }}>Max Price</p>
                    <input
                      type="number"
                      min="0"
                      max="9999999999999"
                      value={priceMax}
                      onChange={e => setPriceMax(e.target.value)}
                      placeholder="∞"
                      className="w-full rounded-lg border px-2.5 py-1.5 text-[10px] font-mono outline-none"
                      style={{ background: "rgba(8,8,15,0.8)", borderColor: CARD_BORDER, color: BLUE_LIGHT }}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-[9px] mb-1" style={{ color: TXT_MUTED }}>Seed #</p>
                    <input
                      type="text"
                      value={seedSearch}
                      onChange={e => setSeedSearch(e.target.value)}
                      placeholder="e.g. 42"
                      className="w-full rounded-lg border px-2.5 py-1.5 text-[10px] font-mono outline-none"
                      style={{ background: "rgba(8,8,15,0.8)", borderColor: CARD_BORDER, color: BLUE_LIGHT }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Listings Grid ── */}
          {filteredListings.length === 0 ? (
            <EmptyState
              icon="🏪"
              title="No listings found"
              desc={searchQuery || seedSearch || selectedTiers.length > 0 || priceMin || priceMax
                ? "Try adjusting your filters"
                : "Be the first to list an iNFT!"
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filteredListings.map(listing => {
                  const idx = listing.prestige - 1;
                  const name = PRESTIGE_NAMES[idx] ?? "???";
                  const ticker = PRESTIGE_TICKERS[idx] ?? "???";
                  const isOwn = listing.seller === walletAddress;
                  const listingOffers = offers.filter(o => o.listingId === listing.id && o.status === "pending");
                  return (
                    <div
                      key={listing.id}
                      className="rounded-xl border p-3 flex flex-col items-center gap-2 transition-all duration-300"
                      style={{ background: BG_CARD, borderColor: CARD_BORDER }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = CARD_BORDER_HOVER;
                        e.currentTarget.style.boxShadow = `0 0 24px ${BLUE}18`;
                        e.currentTarget.style.transform = "translateY(-2px)";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = CARD_BORDER;
                        e.currentTarget.style.boxShadow = "none";
                        e.currentTarget.style.transform = "none";
                      }}
                    >
                      <div className="relative">
                        <img
                          src={getPrestigeBadgePath(listing.prestige)}
                          alt={`P${listing.prestige}`}
                          className="w-14 h-14 rounded-full object-cover"
                        />
                        {effectiveTxPending && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full animate-ping" style={{ background: BLUE }} />
                        )}
                      </div>
                      <div className="text-center min-w-0">
                        <p className="text-xs font-medium text-gray-200 truncate w-full">{name}</p>
                        <p className="text-[9px]" style={{ color: TXT_MUTED }}>
                          {ticker} · P{listing.prestige} · #{listing.seed}
                        </p>
                      </div>
                      <div
                        className="text-xs font-bold px-3 py-0.5 rounded-full flex items-center gap-1"
                        style={{ color: BLUE, background: `${BLUE}12`, border: `1px solid ${BLUE}33` }}
                      >
                        {listing.price.toLocaleString()} <span className="text-[8px]" style={{ color: BLUE + "88" }}>XNT</span>
                      </div>
                      <div className="text-[9px]" style={{ color: TXT_DIM }}>
                        Tier fee: {(() => {
                          const f = engine.getFeeForPrestige(listing.prestige);
                          return `${f}% (${Math.ceil(listing.price * f / 100).toLocaleString()} XN)`;
                        })()} → LP
                      </div>
                      <div className="flex gap-1.5 w-full">
                        <button
                          onClick={() => {
                            if (!walletAddress) {
                              const w = (window as any).solana || (window as any).phantom;
                              if (w?.connect) w.connect();
                            } else {
                              setBuyConfirm(listing);
                            }
                          }}
                          disabled={isOwn}
                          className="flex-1 text-xs py-1.5 rounded-lg font-medium transition-all active:scale-[0.97] active:opacity-90"
                          style={
                            isOwn || !walletAddress
                              ? { background: "rgba(255,255,255,0.03)", color: TXT_DIM, cursor: "not-allowed" }
                              : { background: `linear-gradient(135deg, ${BLUE}, ${BLUE_DARK})`, color: "#fff" }
                          }
                          onMouseEnter={e => {
                            if (!isOwn && walletAddress) e.currentTarget.style.boxShadow = `0 0 16px ${BLUE}44`;
                          }}
                          onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; }}
                        >
                          {!walletAddress ? "Connect" : isOwn ? "Yours" : "Buy"}
                        </button>
                        {walletAddress && !isOwn && (
                          <button
                            onClick={() => setOffersSidebarListing(listing.id)}
                            className="text-[10px] px-2 py-1.5 rounded-lg border transition-all relative"
                            style={{ borderColor: `${AMBER}44`, color: AMBER }}
                          >
                            🤝
                            {listingOffers.length > 0 && (
                              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold" style={{ background: AMBER, color: "#000" }}>
                                {listingOffers.length}
                              </span>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Market stats */}
              <div className="text-center text-[9px]" style={{ color: TXT_DIM }}>
                {filteredListings.length} listing{filteredListings.length !== 1 ? "s" : ""}
                {filteredListings.length > 0 && (
                  <> · Floor: {Math.min(...filteredListings.map(l => l.price)).toLocaleString()} XN</>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══════════════════════ MY LISTINGS ═══════════════════════ */}
      {activeTab === "my-listings" && (
        <div className="space-y-4">
          {!walletAddress ? (
            <EmptyState
              icon="🔌"
              title="Wallet not connected"
              desc="Connect your X1 wallet to manage listings"
              action={
                <button
                  onClick={() => {
                    const w = (window as any).solana || (window as any).phantom;
                    if (w?.connect) w.connect();
                  }}
                  className="mt-3 text-xs px-6 py-2 rounded-lg font-medium"
                  style={{ background: 'linear-gradient(135deg, #0066ff, #003399)', color: '#fff' }}
                >
                  Connect Wallet
                </button>
              }
            />
          ) : myActiveListings.length === 0 && myHistoryListings.length === 0 ? (
            <EmptyState icon="📦" title="No listings yet" desc="Go to the List tab to sell your iNFTs" />
          ) : (
            <>
              {/* Active */}
              {myActiveListings.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium mb-2 flex items-center gap-2" style={{ color: TXT_MUTED }}>
                    Active ({myActiveListings.length})
                    {incomingOfferCount > 0 && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full" style={{ background: `${AMBER}22`, color: AMBER }}>
                        {incomingOfferCount} offer{incomingOfferCount !== 1 ? "s" : ""}
                      </span>
                    )}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {myActiveListings.map(listing => {
                      const idx = listing.prestige - 1;
                      const name = PRESTIGE_NAMES[idx] ?? "???";
                      const ticker = PRESTIGE_TICKERS[idx] ?? "???";
                      const listingOffers = offers.filter(o => o.listingId === listing.id && o.status === "pending");
                      return (
                        <div
                          key={listing.id}
                          className="rounded-xl border p-3 flex flex-col items-center gap-2"
                          style={{ background: BG_CARD, borderColor: CARD_BORDER }}
                        >
                          <img
                            src={getPrestigeBadgePath(listing.prestige)}
                            alt={`P${listing.prestige}`}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div className="text-center">
                            <p className="text-xs font-medium text-gray-200">{name}</p>
                            <p className="text-[9px]" style={{ color: TXT_MUTED }}>
                              {ticker} · #{listing.seed}
                            </p>
                          </div>
                          <div
                            className="text-xs font-bold px-3 py-0.5 rounded-full"
                            style={{ color: BLUE, background: `${BLUE}12`, border: `1px solid ${BLUE}33` }}
                          >
                            {listing.price.toLocaleString()} XN
                          </div>
                          <div className="flex gap-1.5 w-full">
                            <button
                              onClick={() => setOffersSidebarListing(listing.id)}
                              className="flex-1 text-[10px] py-1.5 rounded-lg border transition-all relative"
                              style={{ borderColor: `${AMBER}33`, color: AMBER }}
                            >
                              🤝 Offers{listingOffers.length > 0 ? ` (${listingOffers.length})` : ""}
                            </button>
                            <button
                              onClick={() => handleCancel(listing.id)}
                              className="text-[10px] px-3 py-1.5 rounded-lg border transition-all"
                              style={{ borderColor: `${RED}33`, color: RED }}
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* History */}
              {myHistoryListings.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium mb-2" style={{ color: TXT_MUTED }}>History ({myHistoryListings.length})</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {myHistoryListings.map(listing => {
                      const idx = listing.prestige - 1;
                      const ticker = PRESTIGE_TICKERS[idx] ?? "???";
                      return (
                        <div
                          key={listing.id}
                          className="rounded-xl border p-3 flex flex-col items-center gap-2"
                          style={{ background: BG_CARD, borderColor: CARD_BORDER }}
                        >
                          <img
                            src={getPrestigeBadgePath(listing.prestige)}
                            alt={`P${listing.prestige}`}
                            className="w-10 h-10 rounded-full object-cover opacity-50"
                          />
                          <p className="text-[10px]" style={{ color: TXT_MUTED }}>
                            {ticker} · #{listing.seed}
                          </p>
                          <span className="text-[9px] px-2 py-0.5 rounded-full" style={{
                            background: listing.status === "sold" ? `${GREEN}18` : `${RED}18`,
                            color: listing.status === "sold" ? GREEN : RED,
                          }}>
                            {listing.status === "sold" ? "Sold" : "Cancelled"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ═══════════════════════ LIST TAB ═══════════════════════ */}
      {activeTab === "list" && (
        <div className="space-y-4">
          {!walletAddress ? (
            <EmptyState icon="🔌" title="Wallet not connected" desc="Connect your X1 wallet to list iNFTs for sale" />
          ) : availableToList.length === 0 ? (
            <EmptyState icon="🏅" title="No iNFTs available to list" desc="Mint or forge iNFTs first, or check your active listings" />
          ) : (
            <>
              {/* Select NFT */}
              <div>
                <h3 className="text-xs font-medium mb-2" style={{ color: TXT_MUTED }}>
                  Select an iNFT to sell ({availableToList.length} available)
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {availableToList.map((nft, i) => {
                    const idx = nft.prestige - 1;
                    const name = PRESTIGE_NAMES[idx] ?? "???";
                    const isSelected = selectedNftIndex === i;
                    return (
                      <button
                        key={i}
                        onClick={() => { setSelectedNftIndex(i); setListPrice(""); }}
                        className="rounded-xl border p-2 flex flex-col items-center gap-1 transition-all"
                        style={
                          isSelected
                            ? { background: `${BLUE}18`, borderColor: BLUE, boxShadow: `0 0 16px ${BLUE}22` }
                            : { background: BG_CARD, borderColor: CARD_BORDER }
                        }
                      >
                        <img
                          src={getPrestigeBadgePath(nft.prestige)}
                          alt={`P${nft.prestige}`}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <p className="text-[9px] text-gray-300 truncate w-full text-center">{name}</p>
                        <p className="text-[8px]" style={{ color: TXT_DIM }}>#{nft.seed}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price input & confirm */}
              {selectedNftIndex !== null && (
                <div
                  className="rounded-xl border p-4 space-y-3"
                  style={{ background: BG_CARD, borderColor: CARD_BORDER }}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={getPrestigeBadgePath(availableToList[selectedNftIndex].prestige)}
                      alt=""
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <p className="text-xs text-gray-300">
                        P{availableToList[selectedNftIndex].prestige} #{availableToList[selectedNftIndex].seed}
                      </p>
                      <p className="text-[9px]" style={{ color: TXT_MUTED }}>
                        {PRESTIGE_NAMES[availableToList[selectedNftIndex].prestige - 1] ?? ""}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] block mb-1" style={{ color: TXT_MUTED }}>Listing Price (XNT)</label>
                    <input
                      type="number"
                      min="1"
                      max="9999999999999"
                      step="1"
                      value={listPrice}
                      onChange={e => setListPrice(e.target.value)}
                      placeholder="e.g. 10000"
                      className="w-full rounded-xl border px-3 py-2 text-sm font-mono outline-none transition-all"
                      style={{ background: "rgba(8,8,15,0.8)", borderColor: CARD_BORDER, color: BLUE_LIGHT }}
                      onFocus={e => { e.currentTarget.style.borderColor = `${BLUE}66`; }}
                      onBlur={e => { e.currentTarget.style.borderColor = CARD_BORDER; }}
                    />
                    <p className="text-[8px] mt-1" style={{ color: TXT_DIM }}>
                      {(() => {
                        const p = availableToList[selectedNftIndex].prestige;
                        const feePct = engine.getFeeForPrestige(p);
                        const fee = listPrice ? Math.ceil(Number(listPrice) * feePct / 100) : 0;
                        return `P${p} fee: ${feePct}% (${fee ? fee.toLocaleString() : '...'} XN) — funds LP`;
                      })()}
                    </p>
                  </div>
                  <button
                    onClick={handleList}
                    disabled={!listPrice || Number(listPrice) <= 0}
                    className="w-full text-xs py-2 rounded-xl font-medium transition-all"
                    style={
                      listPrice && Number(listPrice) > 0
                        ? { background: `linear-gradient(135deg, ${BLUE}, ${BLUE_DARK})`, color: "#fff" }
                        : { background: "rgba(255,255,255,0.03)", color: TXT_DIM, cursor: "not-allowed" }
                    }
                    onMouseEnter={e => {
                      if (listPrice && Number(listPrice) > 0) e.currentTarget.style.boxShadow = `0 0 20px ${BLUE}44`;
                    }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; }}
                  >
                    📤 List for {listPrice ? `${Number(listPrice).toLocaleString()} XN` : "..."}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ═══════════════════════ HISTORY ═══════════════════════ */}
      {activeTab === "history" && (
        <div className="space-y-4">

          {/* Time filter */}
          <div className="flex gap-2 justify-center">
            {[
              { key: 'all' as const, label: 'All Time' },
              { key: 'today' as const, label: 'Today' },
              { key: '7d' as const, label: '7 Days' },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setTimeFilter(t.key)}
                className="text-xs px-4 py-1.5 rounded-full border transition-all"
                style={pillStyle(timeFilter === t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {filteredTrades.length === 0 ? (
            <EmptyState icon="📊" title="No trades yet" desc="Completed purchases and sales will appear here" />
          ) : (
            <>
              {/* Stats summary */}
              <div className="flex gap-3 justify-center text-[10px]">
                <div className="rounded-xl border px-3 py-2 text-center" style={{ background: BG_CARD, borderColor: CARD_BORDER }}>
                  <p className="font-bold" style={{ color: BLUE }}>{filteredTrades.length}</p>
                  <p style={{ color: TXT_MUTED }}>Total Trades</p>
                </div>
                <div className="rounded-xl border px-3 py-2 text-center" style={{ background: BG_CARD, borderColor: CARD_BORDER }}>
                  <p className="font-bold" style={{ color: GREEN }}>
                    {filteredTrades.reduce((s, t) => s + t.price, 0).toLocaleString()}
                  </p>
                  <p style={{ color: TXT_MUTED }}>Volume (XNT)</p>
                </div>
                <div className="rounded-xl border px-3 py-2 text-center" style={{ background: BG_CARD, borderColor: CARD_BORDER }}>
                  <p className="font-bold" style={{ color: AMBER }}>
                    {filteredTrades.reduce((s, t) => s + t.fee, 0).toLocaleString()}
                  </p>
                  <p style={{ color: TXT_MUTED }}>Dev Fees → LP</p>
                </div>
              </div>

              {/* Trade table */}
              <div className="overflow-x-auto">
                <table className="w-full text-[10px] border-collapse">
                  <thead>
                    <tr style={{ color: TXT_MUTED }}>
                      <th className="text-left py-2 pr-3 font-medium">iNFT</th>
                      <th className="text-left py-2 pr-3 font-medium">Price</th>
                      <th className="text-left py-2 pr-3 font-medium hidden sm:table-cell">Seller</th>
                      <th className="text-left py-2 pr-3 font-medium hidden md:table-cell">Buyer</th>
                      <th className="text-left py-2 pr-3 font-medium hidden sm:table-cell">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...filteredTrades].sort((a, b) => b.tradedAt - a.tradedAt).map(trade => {
                      const ticker = PRESTIGE_TICKERS[trade.prestige - 1] ?? "?";
                      const time = new Date(trade.tradedAt);
                      const timeStr = time.toLocaleDateString() + " " + time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                      return (
                        <tr key={trade.id} className="border-t" style={{ borderColor: CARD_BORDER }}>
                          <td className="py-2 pr-3">
                            <div className="flex items-center gap-2">
                              <img
                                src={getPrestigeBadgePath(trade.prestige)}
                                alt={`P${trade.prestige}`}
                                className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                              />
                              <span style={{ color: TXT }}>{ticker} · #{trade.seed}</span>
                            </div>
                          </td>
                          <td className="py-2 pr-3 font-mono" style={{ color: BLUE }}>{trade.price.toLocaleString()}</td>
                          <td className="py-2 pr-3 hidden sm:table-cell" style={{ color: TXT_DIM }}>{trade.seller.slice(0, 4)}...{trade.seller.slice(-4)}</td>
                          <td className="py-2 pr-3 hidden md:table-cell" style={{ color: TXT_DIM }}>{trade.buyer.slice(0, 4)}...{trade.buyer.slice(-4)}</td>
                          <td className="py-2 pr-3 hidden sm:table-cell" style={{ color: TXT_DIM }}>{timeStr}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* My trades */}
          {walletAddress && myFilteredTrades.length > 0 && (
            <div>
              <h3 className="text-xs font-medium mb-2" style={{ color: TXT_MUTED }}>Your Trades ({myFilteredTrades.length})</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-[10px] border-collapse">
                  <thead>
                    <tr style={{ color: TXT_MUTED }}>
                      <th className="text-left py-2 pr-3 font-medium">iNFT</th>
                      <th className="text-left py-2 pr-3 font-medium">Role</th>
                      <th className="text-left py-2 pr-3 font-medium">Price</th>
                      <th className="text-left py-2 pr-3 font-medium hidden sm:table-cell">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...myFilteredTrades].sort((a, b) => b.tradedAt - a.tradedAt).map(trade => {
                      const ticker = PRESTIGE_TICKERS[trade.prestige - 1] ?? "?";
                      const isBuyer = trade.buyer === walletAddress;
                      const time = new Date(trade.tradedAt);
                      const timeStr = time.toLocaleDateString() + " " + time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                      return (
                        <tr key={trade.id} className="border-t" style={{ borderColor: CARD_BORDER }}>
                          <td className="py-2 pr-3">
                            <div className="flex items-center gap-2">
                              <img
                                src={getPrestigeBadgePath(trade.prestige)}
                                alt={`P${trade.prestige}`}
                                className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                              />
                              <span style={{ color: TXT }}>{ticker} · #{trade.seed}</span>
                            </div>
                          </td>
                          <td className="py-2 pr-3">
                            <span className="text-[9px] px-1.5 py-0.5 rounded" style={{
                              background: isBuyer ? `${GREEN}18` : `${RED}18`,
                              color: isBuyer ? GREEN : RED,
                            }}>
                              {isBuyer ? "Bought" : "Sold"}
                            </span>
                          </td>
                          <td className="py-2 pr-3 font-mono" style={{ color: BLUE }}>{trade.price.toLocaleString()}</td>
                          <td className="py-2 pr-3 hidden sm:table-cell" style={{ color: TXT_DIM }}>{timeStr}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}