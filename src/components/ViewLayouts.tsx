"use client";

import React, { RefObject } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import type { GameState } from "@/lib/gameState";
import { getPrestigeBadgePath, PRESTIGE_NAMES, PRESTIGE_TICKERS, PRESTIGE_COLORS } from "@/lib/void";
import PrestigeGallery from "@/components/PrestigeGallery";
import { LP_MILESTONES, getLpChallengeInfo, getTokenXenYield, getMintCost, getUnlockThreshold } from "@/lib/gameEngine";
import Marketplace from "@/components/Marketplace";
import type { MarketplaceListing } from "@/lib/marketplaceEngine";
import type { TokenEntry } from "@/lib/gameEngine";

const BLUE = "#0066ff";
const BLUE_LIGHT = "#4488ff";
const BLUE_GLOW = "rgba(0,102,255,0.5)";
const BLUE_GLOW_WEAK = "rgba(0,102,255,0.2)";
const BG_DARK = "#000";
const BG_CARD = "#0c0c14";
const TEXT_PRIMARY = "#e8e4dd";
const TEXT_SECONDARY = "#888899";

interface LayoutProps {
  state: GameState;
  tab: string;
  setTab: (t: string) => void;
  walletAddress: string | null;
  walletConnecting: boolean;
  shortAddr: string | null;
  xntFeeLoading: boolean;
  isDemo: boolean;
  xntNativeBalance: number | null;
  payXntFee: () => void;
  walletDisconnect: () => void;
  handleTap: (e: React.MouseEvent<HTMLButtonElement>) => void;
  handlePrestige: () => void;
  handleMint: () => void;
  handleBurn: (lvl: number, seed: number) => void;
  handleBurnOne: (lvl: number, seed: number, originX?: number, originY?: number) => void;
  handleForge: () => void;
  handleAddMetadata: (lvl: number, seed: number, mintAddress: string) => Promise<void>;
  nexMult: number;
  prestigeCost: number;
  nextMilestone: { label: string; at: number } | null;
  tapsPerPrestige: number;
  orbRef: React.RefObject<HTMLDivElement>;
  effectsRef: React.RefObject<HTMLDivElement>;
  orbFlash: number;
  bottomTabs: readonly { key: string; label: string; title: string }[];
  marketplaceListings: MarketplaceListing[];
  onListNft: (nft: TokenEntry, price: number) => void;
  onBuyNft: (listing: MarketplaceListing) => void;
  onCancelListing: (listingId: string) => void;
  handleProvideLp: (prestige: number) => void;
  handleLockToken: (seed: number, termDays: number) => void;
  handleUnlockToken: (seed: number) => void;
  handleClaimAllYield: () => void;
}

/* ── Shared theme classes ── */
const theme = {
  bgPage: `bg-[${BG_DARK}]`,
  bgCard: `bg-[${BG_CARD}]`,
  accent: BLUE,
  accentLight: BLUE_LIGHT,
  textPrimary: TEXT_PRIMARY,
  textSecondary: TEXT_SECONDARY,
  btnPrimary: `bg-[${BLUE}]/10 border border-[${BLUE}]/30 text-[${BLUE}] hover:bg-[${BLUE}]/20`,
  btnDisabled: `bg-[${BG_CARD}]/30 border border-gray-800/40 text-gray-600`,
};

/* ═══════════════════════════════════════════════════════════════
   iNFT DETAIL MODAL
   ═══════════════════════════════════════════════════════════════ */

function INFTDetailModal({ nft, onClose, onBurn, onAddMetadata, onList, walletAddress }: {
  nft: TokenEntry;
  onClose: () => void;
  onBurn: (lvl: number, seed: number) => void;
  onAddMetadata: (lvl: number, seed: number, mintAddress: string) => void;
  onList: (lvl: number, seed: number, price: number) => void;
  walletAddress?: string | null;
}) {
  const idx = nft.prestige - 1;
  const color = PRESTIGE_COLORS[idx] ?? "#0066ff";
  const name = PRESTIGE_NAMES[idx] ?? "UNKNOWN";
  const ticker = PRESTIGE_TICKERS[idx] ?? "???";
  const [metaLoading, setMetaLoading] = React.useState(false);
  const [metaDone, setMetaDone] = React.useState(false);
  const [listPrice, setListPrice] = React.useState("");


  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div className="relative rounded-2xl p-8 max-w-sm w-full mx-4 text-center overflow-hidden border"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, #0c0c1e, #060810 80%)', borderColor: `${color}33`, boxShadow: `0 0 60px ${color}22, 0 0 120px ${color}11` }}
        onClick={e => e.stopPropagation()}
      >
        {/* Ambient glow background */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 50% 40%, ${color}11 0%, transparent 70%)`,
          }}
        />

        {/* Animated badge */}
        <div className="relative w-32 h-32 mx-auto mb-5">
          <div className="absolute inset-0 rounded-full animate-pulse-slow"
            style={{ background: `radial-gradient(circle, ${color}44 0%, transparent 70%)` }}
          />
          <div className="absolute inset-0 rounded-full animate-orb-slow"
            style={{
              background: `conic-gradient(from 0deg, transparent 0%, ${color} 25%, ${color}88 50%, ${color}22 75%, transparent 100%)`,
              mask: 'radial-gradient(circle, transparent 65%, black 66%)',
              WebkitMask: 'radial-gradient(circle, transparent 65%, black 66%)',
            }}
          />
          <img
            src={getPrestigeBadgePath(nft.prestige)}
            alt={`P${nft.prestige}`}
            className="relative w-28 h-28 rounded-full object-cover mx-auto mt-[6px]"
            style={{ boxShadow: `0 0 0 2px ${color}44, 0 0 20px ${color}22` }}
          />
        </div>

        {/* Prestige info */}
        <div className="relative space-y-1 mb-5">
          <h3 className="text-lg font-bold" style={{ color }}>{name}</h3>
          <p className="text-xs" style={{ color: `${color}99` }}>{ticker} — P{nft.prestige}</p>
          <p className="text-[9px]" style={{ color: TEXT_SECONDARY }}>Seed #{nft.seed}</p>
        </div>

        {/* Mint info */}
        {nft.mintAddress && (
          <div className="relative mb-4 px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[9px] text-gray-600 mb-1">On-chain Mint</p>
            <p className="text-[8px] font-mono break-all" style={{ color: `${color}77` }}>{nft.mintAddress}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="relative flex flex-wrap gap-2 justify-center">
          {/* Add metadata for wallet display */}
          {nft.mintAddress && !metaDone && (
            <button onClick={async () => {
              setMetaLoading(true);
              await onAddMetadata(nft.prestige, nft.seed, nft.mintAddress!);
              setMetaLoading(false);
              setMetaDone(true);
            }}
              disabled={metaLoading}
              className="text-[10px] px-4 py-2 rounded-full border transition-all hover:scale-105 active:scale-95"
              style={{ background: metaLoading ? 'rgba(100,100,255,0.05)' : 'rgba(100,100,255,0.1)', borderColor: 'rgba(100,100,255,0.3)', color: metaLoading ? '#666' : '#6688ff' }}
            >{metaLoading ? "⏳ Adding metadata..." : "✨ Add to Wallet"}</button>
          )}
          {metaDone && (
            <span className="text-[10px] px-4 py-2 rounded-full" style={{ background: 'rgba(0,255,100,0.08)', border: '1px solid rgba(0,255,100,0.2)', color: '#44ff88' }}>✅ Added!</span>
          )}
          <button onClick={() => {
            onBurn(nft.prestige, nft.seed);
            onClose();
          }}
            className="text-[10px] px-4 py-2 rounded-full border transition-all hover:scale-105 active:scale-95"
            style={{ background: 'rgba(255,50,0,0.1)', borderColor: 'rgba(255,50,0,0.3)', color: '#ff6622' }}
          >🔥 Burn for {ticker} Token</button>
          <div className="flex items-center gap-2 w-full">
            <input value={listPrice} onChange={e => setListPrice(e.target.value.replace(/\D/g, ''))}
              placeholder="Price"
              className="flex-1 text-[10px] px-2 py-2 rounded-lg border bg-black/50 text-center outline-none"
              style={{ borderColor: `${color}33`, color: TEXT_PRIMARY }}
            />
            <button onClick={() => {
              const price = parseInt(listPrice);
              if (!price || price <= 0) return;
              onList(nft.prestige, nft.seed, price);
              onClose();
            }}
              className="text-[10px] px-4 py-2 rounded-full border transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
              style={{ background: 'rgba(0,200,255,0.1)', borderColor: 'rgba(0,200,255,0.3)', color: '#44ddff' }}
            >🏪 List to Market</button>
          </div>
          <button onClick={onClose}
            className="text-[10px] px-4 py-2 rounded-full border transition-all hover:scale-105 active:scale-95"
            style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}
          >Close</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MOBILE LAYOUT
   ═══════════════════════════════════════════════════════════════ */
export function MobileLayout({
  state, tab, setTab,
  walletAddress, walletConnecting, shortAddr, xntFeeLoading, isDemo, xntNativeBalance,
  payXntFee, walletDisconnect,
  handleTap, handlePrestige, handleMint, handleBurnOne, handleForge, handleAddMetadata,
  nexMult, prestigeCost,
  nextMilestone, tapsPerPrestige,
  orbRef, effectsRef, orbFlash,
  bottomTabs,
  marketplaceListings, onListNft, onBuyNft, onCancelListing, handleProvideLp,
  handleLockToken, handleUnlockToken, handleClaimAllYield,
}: LayoutProps) {
  // ── iNFT detail modal state (shared across tabs) ──
  const [selectedNft, setSelectedNft] = React.useState<TokenEntry | null>(null);

  return (
    <div className="flex-1 overflow-y-auto pb-24 relative z-10" style={{ background: BG_DARK }}>
      <div ref={effectsRef} className="absolute inset-0 pointer-events-none z-50" />

      {/* Mobile XNT logo header */}
      <div className="flex items-center justify-center py-2 px-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
        <img src="/nex-logo.jpg" alt="XNT" className="h-6 w-auto rounded" />
      </div>

      {selectedNft && (
        <INFTDetailModal nft={selectedNft} onClose={() => setSelectedNft(null)} onBurn={handleBurnOne} onAddMetadata={handleAddMetadata}
          onList={(lvl, seed, price) => {
            onListNft({ prestige: lvl, seed, serial: 0, mintAddress: null }, price);
          }}
          walletAddress={walletAddress}
        />
      )}

      {/* Demo Mode Banner */}
      {isDemo && (
        <div className="sticky top-0 z-40 backdrop-blur-md border-b px-4 py-1.5 text-center" style={{ background: `${BLUE}15`, borderColor: `${BLUE}22` }}>
          <span className="text-[10px] font-medium" style={{ color: BLUE }}>🎮 Demo Mode — free taps, prestige & mint. Nothing saved.</span>
        </div>
      )}

      {tab === "tap" && (
        <MobileTapTab
          state={state}
          walletAddress={walletAddress} walletConnecting={walletConnecting}
          shortAddr={shortAddr} xntFeeLoading={xntFeeLoading} isDemo={isDemo}
          payXntFee={payXntFee} walletDisconnect={walletDisconnect}
          handleTap={handleTap} handlePrestige={handlePrestige}
          nexMult={nexMult} prestigeCost={prestigeCost}
          nextMilestone={nextMilestone} tapsPerPrestige={tapsPerPrestige}
          orbRef={orbRef} orbFlash={orbFlash}
        />
      )}

      {tab === "prestige" && (
        <MobilePrestigeTab
          state={state} isDemo={isDemo}
          handleMint={handleMint} handleForge={handleForge}
          handleBurnOne={handleBurnOne} handleAddMetadata={handleAddMetadata}
          onSelectNft={setSelectedNft}
        />
      )}

      {tab === "tokens" && state.tokens && state.tokens.length >= 0 && (
        <div id="nex-tokens" className="rounded-xl p-6 border space-y-4" style={{ background: BG_CARD, borderColor: 'rgba(255,255,255,0.05)' }}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold" style={{ color: BLUE }}>🪙 Token Portfolio</h2>
            <a href="https://x1scr.xyz" target="_blank" rel="noreferrer"
              className="text-[9px] px-2 py-1 rounded-lg transition-all"
              style={{ color: 'rgba(0,200,255,0.6)', border: '1px solid rgba(0,200,255,0.1)' }}
              onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(0,200,255,0.3)'; e.currentTarget.style.color = '#00ccff'; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(0,200,255,0.1)'; e.currentTarget.style.color = 'rgba(0,200,255,0.6)'; }}
            >📊 X1 Screener ↗</a>
          </div>
          {state.tokens.length === 0 ? (
            <p className="text-[10px] text-gray-600 py-3 text-center">No tokens yet. Mint an iNFT, then burn it.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
              {(() => {
                const levelCounts: Record<number, number> = {};
                for (const t of state.tokens) {
                  levelCounts[t.prestige] = (levelCounts[t.prestige] || 0) + 1;
                }
                return Object.entries(levelCounts).sort(([a], [b]) => Number(a) - Number(b)).map(([lvl, count]) => {
                  const idx = Number(lvl) - 1;
                  const color = PRESTIGE_COLORS[idx] ?? BLUE;
                  return (
                    <div key={lvl} className="rounded-lg border p-2" style={{ background: `${color}06`, borderColor: `${color}20` }}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <img src={getPrestigeBadgePath(Number(lvl))} alt={`P${lvl}`} className="w-7 h-7 rounded-full object-cover" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-medium text-gray-200 truncate">{PRESTIGE_NAMES[idx] ?? "UNKNOWN"}</p>
                          <p className="text-[8px]" style={{ color: `${color}88` }}>{PRESTIGE_TICKERS[idx] ?? "???"} · P{lvl}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold" style={{ color }}>{count}x</span>
                        <span className="text-[8px]" style={{ color: TEXT_SECONDARY }}>— XN</span>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </div>
      )}

      {tab === "pools" && (
        <MobilePoolsTab
          lpProvided={state.lpProvided ?? {}}
          xntBalance={state.xnt}
          onProvideLp={handleProvideLp}
        />
      )}

      {tab === "wallet" && (
        <MobileWalletTab
          state={state} walletAddress={walletAddress} shortAddr={shortAddr}
          xntNativeBalance={xntNativeBalance} onSelectNft={setSelectedNft}
        />
      )}

      {tab === "marketplace" && (
        <div className="px-4 pt-4 pb-2">
          <h2 className="text-lg font-bold text-center" style={{ color: BLUE }}>🏪 Marketplace</h2>
          <p className="text-[10px] text-center mt-1 mb-4" style={{ color: TEXT_SECONDARY }}>Buy and sell iNFTs from other players</p>
          <Marketplace
            marketplaceListings={marketplaceListings}
            onListNft={onListNft}
            onBuyNft={onBuyNft}
            onCancelListing={onCancelListing}
            walletAddress={walletAddress}
            mintedNfts={state.tokens}
            xntBalance={state.xnt}
          />
        </div>
      )}

      {/* Bottom tabs */}
      <div className="fixed bottom-0 left-0 right-0 z-30 backdrop-blur-md border-t overflow-x-auto" style={{ background: `${BG_DARK}/90`, borderColor: 'rgba(255,255,255,0.05)' }}>
        <div className="flex justify-around py-2 px-3 gap-1" style={{ minWidth: 'max-content' }}>
          {bottomTabs.map(t => (
            <button key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-lg transition-all text-[10px] shrink-0 ${
                tab === t.key ? "text-[#0066ff]" : "text-gray-600 hover:text-gray-400"
              }`}
            >
              <span className="text-base">{t.label}</span>
              <span>{t.title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DESKTOP LAYOUT
   ═══════════════════════════════════════════════════════════════ */
/* ── Scroll-to-section helper ── */
function scrollToSection(id: string) {
  const el = document.getElementById(`nex-${id}`);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function DesktopLayout({
  state, tab, setTab,
  walletAddress, walletConnecting, shortAddr, xntFeeLoading, isDemo, xntNativeBalance,
  payXntFee, walletDisconnect,
  handleTap, handlePrestige, handleMint, handleBurnOne, handleForge, handleAddMetadata,
  nexMult, prestigeCost,
  nextMilestone, tapsPerPrestige,
  orbRef, effectsRef, orbFlash,
  bottomTabs,
  marketplaceListings, onListNft, onBuyNft, onCancelListing, handleProvideLp,
  handleLockToken, handleUnlockToken, handleClaimAllYield,
}: LayoutProps) {
  // ── iNFT detail modal state ──
  const [selectedNft, setSelectedNft] = React.useState<TokenEntry | null>(null);

  return (
    <>
      {selectedNft && (
        <INFTDetailModal nft={selectedNft} onClose={() => setSelectedNft(null)} onBurn={handleBurnOne} onAddMetadata={handleAddMetadata}
          onList={(lvl, seed, price) => {
            onListNft({ prestige: lvl, seed, serial: 0, mintAddress: null }, price);
          }}
          walletAddress={walletAddress}
        />
      )}
      <div ref={effectsRef} className="absolute inset-0 pointer-events-none z-50" />

      {/* Demo Mode Banner */}
      {isDemo && (
        <div className="fixed top-0 left-0 right-0 z-40 backdrop-blur-md border-b px-4 py-1.5 text-center" style={{ background: `${BLUE}15`, borderColor: `${BLUE}22` }}>
          <span className="text-[10px] font-medium" style={{ color: BLUE }}>🎮 Demo Mode — free taps, prestige & mint. Nothing saved.</span>
          <span className="text-[9px] ml-2" style={{ color: "#888899" }}>On-chain: 0.01 XN entry + 0.01 XN/prestige + gas</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-8 py-8 space-y-6">
          {/* Header — premium nav bar */}
          <div className="relative flex items-center justify-between rounded-2xl px-5 py-3 border overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(0,102,255,0.08), rgba(0,102,255,0.02))',
              borderColor: 'rgba(0,102,255,0.15)',
              boxShadow: '0 0 40px rgba(0,102,255,0.05), inset 0 1px 0 rgba(255,255,255,0.05)'
            }}
          >
            {/* Ambient glow */}
            <div className="absolute -top-20 -left-20 w-40 h-40 rounded-full blur-3xl pointer-events-none opacity-30"
              style={{ background: 'radial-gradient(circle, rgba(0,102,255,0.3), transparent)' }}
            />
            <div className="flex items-center gap-2 relative">
              <img src="/nex-logo.jpg" alt="XNT" className="h-7 w-auto rounded" />
              <span className="text-[7px] px-1.5 py-0.5 rounded-full uppercase tracking-widest font-medium"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,184,0,0.15), rgba(255,184,0,0.05))',
                  color: '#ffb800',
                  border: '1px solid rgba(255,184,0,0.2)'
                }}
              >Testnet</span>
              {["tap", "prestige", "tokens", "wallet", "marketplace"].map(t => (
                <button
                  key={t}
                  onClick={() => scrollToSection(t)}
                  className={`relative text-[11px] font-medium px-3 py-1.5 rounded-lg transition-all duration-200 ${
                    tab === t ? '' : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]'
                  }`}
                  style={tab === t ? {
                    background: 'linear-gradient(135deg, rgba(0,102,255,0.2), rgba(0,102,255,0.08))',
                    color: BLUE,
                    boxShadow: '0 0 20px rgba(0,102,255,0.1), inset 0 1px 0 rgba(255,255,255,0.06)'
                  } : {}}
                >
                  {t === "tap" ? "👆" : t === "prestige" ? "🏛️" : t === "tokens" ? "🪙" : t === "wallet" ? "👛" : "🏪"}
                  <span className="ml-1.5 capitalize">{t}</span>
                </button>
              ))}
              <a href="/whitepaper" target="_blank"
                className="text-[10px] px-3 py-1.5 rounded-lg transition-all duration-200"
                style={{
                  color: 'rgba(0,102,255,0.6)',
                  border: '1px solid rgba(0,102,255,0.1)'
                }}
                onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(0,102,255,0.3)'; e.currentTarget.style.color = BLUE; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(0,102,255,0.1)'; e.currentTarget.style.color = 'rgba(0,102,255,0.6)'; }}
              >📄 Paper ↗</a>
            </div>
            <div className="flex items-center gap-4 text-xs relative">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(0,102,255,0.06)', border: '1px solid rgba(0,102,255,0.08)' }}>
                <span className="text-[11px]" style={{ color: BLUE }}>💎</span>
                <span className="text-sm font-semibold" style={{ color: '#fff' }}>{state.xnt.toLocaleString()}</span>
                <span className="text-[9px] font-medium uppercase tracking-wider" style={{ color: `${BLUE}99` }}>XNT</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="text-[10px]" style={{ color: `${BLUE}88` }}>P</span>
                  <span className="text-xs font-medium text-gray-300">{state.prestige}</span>
                </div>

              </div>
              <WalletMultiButton className="!bg-[#0066ff]/12 !border !border-[#0066ff]/25 !rounded-xl !text-[10px] !px-3.5 !py-2 !h-auto !text-[#0066ff] hover:!bg-[#0066ff]/20 !transition-all !font-medium !tracking-wide !min-w-0 hover:!scale-105 active:!scale-95"
                style={{ boxShadow: '0 0 20px rgba(0,102,255,0.08)' }}
              >
                {walletConnecting ? (
                  <span className="animate-pulse">⏳</span>
                ) : walletAddress ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 6px rgba(52,211,153,0.5)' }} />
                    {shortAddr}
                  </span>
                ) : (
                  <span>🔌 Connect X1</span>
                )}
              </WalletMultiButton>
              {walletAddress && (
                <button onClick={() => walletDisconnect()}
                  className="text-[10px] text-gray-600 hover:text-red-400 transition-colors px-1"
                >✕</button>
              )}
            </div>
          </div>

          {/* All panels — 2-col grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* TAP PANEL */}
            <div id="nex-tap" className="rounded-xl p-6 border flex flex-col items-center gap-4" style={{ background: BG_CARD, borderColor: 'rgba(255,255,255,0.05)' }}>
              <div className="text-center">
                {state.prestige >= 100 && <p className="text-yellow-400 text-sm">🏆 MAX PRESTIGE</p>}
              </div>
              <button
                onClick={handleTap}
                className="relative w-52 h-52 select-none touch-none focus:outline-none group"
              >
                <div className="absolute -inset-6 rounded-full transition-all duration-700 opacity-100 blur-3xl animate-pulse-slow" style={{ background: `radial-gradient(ellipse, ${BLUE}1A 0%, transparent 70%)` }} />
                <div className="absolute -inset-2 rounded-full transition-all duration-500 blur-xl" style={{ background: `radial-gradient(ellipse, ${BLUE}26 0%, transparent 60%)` }} />
                <>
                  <div className="absolute -inset-1.5 rounded-full animate-orb-slow pointer-events-none"
                    style={{ background: `conic-gradient(from 0deg, transparent 0%, ${BLUE} 25%, ${BLUE_LIGHT} 50%, ${BLUE}44 75%, transparent 100%)`, mask: 'radial-gradient(circle, transparent 65%, black 66%)', WebkitMask: 'radial-gradient(circle, transparent 65%, black 66%)' }} />
                  <div className="absolute -inset-1.5 rounded-full animate-orb-reverse pointer-events-none"
                    style={{ background: `conic-gradient(from 180deg, transparent 0%, ${BLUE_LIGHT}66 20%, transparent 40%, ${BLUE}44 70%, transparent 100%)`, mask: 'radial-gradient(circle, transparent 68%, black 69%)', WebkitMask: 'radial-gradient(circle, transparent 68%, black 69%)' }} />
                </>
                <div ref={orbRef}
                  className="relative w-full h-full rounded-full flex flex-col items-center justify-center overflow-hidden border"
                  style={{ background: 'radial-gradient(ellipse at 50% 40%, #0a1628, #060810 80%)', borderColor: `${BLUE}44`, boxShadow: orbFlash ? `0 0 60px ${BLUE_GLOW}, 0 0 120px ${BLUE}44` : `0 0 30px ${BLUE_GLOW_WEAK}` }}
                >
                  <div className="absolute inset-0 rounded-full opacity-80"
                    style={{ background: 'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.08) 0%, transparent 50%), radial-gradient(circle at 70% 70%, rgba(0,102,255,0.06) 0%, transparent 40%)' }} />
                  <div className={`absolute rounded-full transition-all duration-200 ${orbFlash ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}
                    style={{ width: '60%', height: '60%', top: '20%', left: '20%', background: `radial-gradient(circle, ${BLUE}44 0%, transparent 70%)` }} />
                  <span className={`relative text-4xl mb-1 transition-all duration-150 ${orbFlash ? 'scale-125' : ''}`}
                    style={{ filter: orbFlash ? `drop-shadow(0 0 12px ${BLUE_GLOW})` : `drop-shadow(0 0 8px ${BLUE_GLOW_WEAK})`, color: TEXT_PRIMARY }}>✦</span>
                  <span className={`relative text-xs font-light tracking-[0.2em] uppercase transition-all duration-300 ${orbFlash ? 'text-white/90' : ''}`} style={{ color: orbFlash ? 'rgba(255,255,255,0.9)' : `${BLUE}99` }}>tap</span>
                  <span className="relative text-[10px] font-mono mt-0.5 transition-all duration-300" style={{ color: orbFlash ? BLUE_LIGHT : `${BLUE}66` }}>+0.001 XNT</span>
                  <div className="absolute bottom-0 left-[15%] right-[15%] h-[2px] rounded-full transition-all duration-200" style={{ background: `linear-gradient(90deg, transparent, ${BLUE}, transparent)`, opacity: orbFlash ? 1 : 0.4 }} />
                </div>
              </button>
              <div className="text-center text-[10px]" style={{ color: TEXT_SECONDARY }}>&nbsp;</div>
              {state.prestige === 0 && <p className="text-[10px]" style={{ color: TEXT_SECONDARY }}>tap to begin your journey</p>}

              {/* Dev fee (only for real mode) */}
              {state.prestige >= 1 && !state.xntDevFeePaid && !isDemo && (
                <div className="text-center">
                  <button onClick={payXntFee} disabled={xntFeeLoading || !walletAddress}
                    className={`text-[10px] px-3 py-1 rounded-full transition-all border ${
                      xntFeeLoading ? "bg-yellow-900/20 border-yellow-700/20 text-yellow-400/50 cursor-wait"
                        : !walletAddress ? "bg-gray-900/30 border-gray-700/30 text-gray-500"
                          : "bg-yellow-900/30 hover:bg-yellow-800/40 border-yellow-700/40 text-yellow-400"
                    }`}
                  >
                    {xntFeeLoading ? "⏳ Sending 0.01 XN..." : !walletAddress ? "🔌 Connect X1 first" : "👑 Pay 0.01 XN Dev Fee"}
                  </button>
                  {!walletAddress && <p className="text-[9px] text-gray-600 mt-1">Connect X1 wallet to send 0.01 XN dev fee</p>}
                  {walletAddress && !xntFeeLoading && (
                    <p className="text-[8px] text-gray-600 mt-1">
                      0.01 XN gas fee required
                    </p>
                  )}
                </div>
              )}

              {/* Prestige */}
              {state.prestige < 100 && (
                <div className="text-center">
                  <p className="text-[10px] text-gray-600 mb-1">
                    Cost: {prestigeCost.toLocaleString()} XNT
                  </p>
                  <button onClick={handlePrestige}
                    disabled={state.xnt < prestigeCost}
                    className="text-xs px-6 py-2 rounded-full transition-all border"
                    style={{ 
                      background: state.xnt >= prestigeCost ? `${BLUE}1A` : 'rgba(255,255,255,0.03)',
                      borderColor: state.xnt >= prestigeCost ? `${BLUE}44` : 'rgba(255,255,255,0.08)',
                      color: state.xnt >= prestigeCost ? BLUE : 'rgba(255,255,255,0.2)',
                      cursor: state.xnt >= prestigeCost ? 'pointer' : 'not-allowed'
                    }}
                  >
                    🔄 Prestige → P{state.prestige + 1}
                  </button>
                </div>
              )}
            </div>

            {/* STUDIO / PRESTIGE PANEL */}
            <div id="nex-prestige" className="rounded-xl p-6 border space-y-4" style={{ background: BG_CARD, borderColor: 'rgba(255,255,255,0.05)' }}>
              <h2 className="text-sm font-bold" style={{ color: BLUE }}>🏛️ Prestige Studio</h2>
              <div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-gray-300">Mint iNFT (P{state.prestige})</span>
                  <span className="text-gray-500">{isDemo ? "Free" : "Gas only"}</span>
                </div>
                <p className="text-[10px] text-gray-600 mb-1">{(state.mintCounts[state.prestige] || 0)} / {Math.max(1, 100 - state.prestige)} minted</p>
                <button onClick={handleMint}
                  disabled={state.prestige < 1 || (state.mintCounts[state.prestige] || 0) >= (Math.max(1, 100 - state.prestige))}
                  className={`w-full text-xs py-2 rounded-xl transition-all ${
                    state.prestige >= 1 && (state.mintCounts[state.prestige] || 0) < Math.max(1, 100 - state.prestige)
                      ? "text-white"
                      : "bg-gray-800/30 border border-gray-800/40 text-gray-600"
                  }`}
                  style={state.prestige >= 1 && (state.mintCounts[state.prestige] || 0) < Math.max(1, 100 - state.prestige) ? { background: `${BLUE}1A`, border: `1px solid ${BLUE}44`, color: BLUE } : {}}
                >
                  {state.prestige < 1 ? "🔒 Prestige to unlock" : (state.mintCounts[state.prestige] || 0) >= (Math.max(1, 100 - state.prestige)) ? "✅ All minted" : "🎨 Mint iNFT"}
                </button>
              </div>
              {state.tokens.length >= 3 && (
                <div>
                  <p className="text-[10px] text-gray-600">Forge: 3 iNFTs → next prestige level</p>
                  <p className="text-[9px] text-gray-600 mb-1">{state.tokens.length} available</p>
                  <button onClick={handleForge}
                    className="w-full text-xs py-2 rounded-xl border"
                    style={{ background: 'rgba(255,184,0,0.08)', borderColor: 'rgba(255,184,0,0.25)', color: '#fbbf24' }}
                  >🔨 Forge (3 → next level)</button>
                </div>
              )}
              {state.tokens.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-gray-400 mb-2">Your iNFTs ({state.tokens.length})</h3>
                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                    {state.tokens.map((nft: TokenEntry, i: number) => (
                      <div key={i} data-inft-card="true" onClick={() => setSelectedNft(nft)} className="rounded-lg border p-2 text-center relative group cursor-pointer hover:border-opacity-50 transition-all" style={{ background: `${BG_DARK}66`, borderColor: 'rgba(255,255,255,0.06)' }}>
                        <img
                          src={getPrestigeBadgePath(nft.prestige)}
                          alt={`P${nft.prestige}`}
                          className="w-10 h-10 rounded-full object-cover mx-auto mb-1"
                        />
                        <p className="text-[9px]" style={{ color: TEXT_SECONDARY }}>P{nft.prestige}</p>
                        <p className="text-[8px] text-gray-600">#{nft.seed}</p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const cardEl = (e.currentTarget as HTMLElement).closest('[data-inft-card]');
                            const rect = cardEl?.getBoundingClientRect();
                            const ox = rect ? ((rect.left + rect.width / 2) / window.innerWidth * 100) : 50;
                            const oy = rect ? ((rect.top + rect.height / 2) / window.innerHeight * 100) : 50;
                            handleBurnOne(nft.prestige, nft.seed, ox, oy);
                          }}
                          className="absolute top-0.5 right-0.5 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity bg-red-900/60 hover:bg-red-800/80 rounded-full w-5 h-5 flex items-center justify-center border border-red-700/30"
                          title="Burn this iNFT"
                        >🔥</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* WALLET PANEL */}
            <div id="nex-wallet" className="rounded-xl p-6 border space-y-3" style={{ background: BG_CARD, borderColor: 'rgba(255,255,255,0.05)' }}>
              <h2 className="text-sm font-bold" style={{ color: BLUE }}>👛 Wallet</h2>
              {walletAddress ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Address</span>
                    <span className="text-gray-200 font-mono">{walletAddress}</span>
                  </div>
                  {xntNativeBalance !== null && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">XN Balance</span>
                      <span className="text-gray-200">{xntNativeBalance.toLocaleString(undefined, { maximumFractionDigits: 4 })} XN</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">XNT Balance</span>
                    <span className="text-gray-200">{state.xnt.toLocaleString()} XNT</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Prestige</span>
                    <span className="text-gray-200">P{state.prestige} / 100</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">iNFTs Minted</span>
                    <span className="text-gray-200">{state.tokens.length}</span>
                  </div>
                  <div className="text-center pt-2">
                    <button onClick={walletDisconnect}
                      className="text-[10px] px-4 py-1.5 rounded-full border transition-all"
                      style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}
                    >🔌 Disconnect Wallet</button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-[10px] text-gray-600 mb-3">Connect your X1 wallet to see balances</p>
                  <WalletMultiButton className="!bg-[#0066ff]/10 !border !border-[#0066ff]/20 !rounded-full !text-[10px] !px-4 !py-1.5 !h-auto !text-[#0066ff] hover:!bg-[#0066ff]/20 hover:!border-[#0066ff]/30 !transition-all !font-normal !tracking-wide">
                    <span>🔌 Connect X1 Wallet</span>
                  </WalletMultiButton>
                </div>
              )}
              <div className="pt-2 border-t border-white/5">
                <p className="text-[9px] text-gray-600 text-center">
                  0.01 XN gas fee
                </p>
              </div>
            </div>

            {/* TOKENS PANEL */}
            {/* TOKEN DASHBOARD */}
            <div id="nex-tokens" className="rounded-xl p-6 border space-y-4" style={{ background: BG_CARD, borderColor: 'rgba(255,255,255,0.05)' }}>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold" style={{ color: BLUE }}>🪙 Token Portfolio</h2>
                <a href="https://x1scr.xyz" target="_blank" rel="noreferrer"
                  className="text-[9px] px-2 py-1 rounded-lg transition-all"
                  style={{ color: 'rgba(0,200,255,0.6)', border: '1px solid rgba(0,200,255,0.1)' }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(0,200,255,0.3)'; e.currentTarget.style.color = '#00ccff'; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(0,200,255,0.1)'; e.currentTarget.style.color = 'rgba(0,200,255,0.6)'; }}
                >📊 X1 Screener ↗</a>
              </div>
              {Object.keys(state.tokens).length === 0 ? (
                <>
                  <p className="text-[10px] text-gray-600 py-3 text-center">No tokens yet. Mint an iNFT, then burn it.</p>
                </>
              ) : (
                <>
                  {/* Portfolio summary */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg border p-2 text-center" style={{ background: `${BLUE}06`, borderColor: `${BLUE}15` }}>
                      <p className="text-[9px]" style={{ color: TEXT_SECONDARY }}>Tokens Held</p>
                      <p className="text-lg font-bold" style={{ color: BLUE }}>{state.tokens.length}</p>
                    </div>
                    <div className="rounded-lg border p-2 text-center" style={{ background: `${BLUE}06`, borderColor: `${BLUE}15` }}>
                      <p className="text-[9px]" style={{ color: TEXT_SECONDARY }}>Total Supply</p>
                      <p className="text-lg font-bold" style={{ color: BLUE }}>{state.tokens.length}</p>
                    </div>
                    <div className="rounded-lg border p-2 text-center" style={{ background: `${BLUE}06`, borderColor: `${BLUE}15` }}>
                      <p className="text-[9px]" style={{ color: TEXT_SECONDARY }}>Est. Value</p>
                      <p className="text-lg font-bold" style={{ color: '#fbbf24' }}>— XN</p>
                    </div>
                  </div>
                  {/* Token catalog */}
                  <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                    {(() => {
                      const levelCounts: Record<number, number> = {};
                      for (const t of state.tokens) {
                        levelCounts[t.prestige] = (levelCounts[t.prestige] || 0) + 1;
                      }
                      return Object.entries(levelCounts).sort(([a], [b]) => Number(a) - Number(b)).map(([lvl, count]) => {
                        const idx = Number(lvl) - 1;
                        const color = PRESTIGE_COLORS[idx] ?? BLUE;
                        const provided = !!state.lpProvided?.[Number(lvl)];
                        return (
                          <div key={lvl} className="rounded-lg border p-2" style={{ background: `${color}06`, borderColor: provided ? `${color}66` : `${color}20` }}>
                            <div className="flex items-center gap-2 mb-1.5">
                              <img src={getPrestigeBadgePath(Number(lvl))} alt={`P${lvl}`} className="w-7 h-7 rounded-full object-cover" />
                              <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-medium text-gray-200 truncate">{PRESTIGE_NAMES[idx] ?? "UNKNOWN"}</p>
                                <p className="text-[8px]" style={{ color: `${color}88` }}>{PRESTIGE_TICKERS[idx] ?? "???"} · P{lvl}</p>
                              </div>
                              {provided && <span className="text-[8px] px-1.5 py-0.5 rounded-full" style={{ background: `${color}20`, color }}>LP✓</span>}
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold" style={{ color }}>{count}x</span>
                              <span className="text-[8px]" style={{ color: TEXT_SECONDARY }}>— XN</span>
                            </div>
                            <div className="mt-1 h-1.5 rounded-full overflow-hidden" style={{ background: `${color}10` }}>
                              <div className="h-full rounded-full transition-all" style={{
                                width: `${Math.min(100, count * 8 + 10)}%`,
                                background: `linear-gradient(90deg, ${color}, ${color}88)`,
                                boxShadow: `0 0 6px ${color}44`
                              }} />
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                  {/* LP Challenge removed — lives in the Pools tab now */}
                </>
              )}
            </div>

            {/* POOLS PANEL */}
            <div className="lg:col-span-2">
              <DesktopPoolsPanel lpProvided={state.lpProvided ?? {}} xntBalance={state.xnt} onProvideLp={handleProvideLp} />
            </div>

            {/* PRESTIGE iNFT GALLERY */}
            <div className="lg:col-span-2">
              <div className="rounded-xl p-4 sm:p-6 border" style={{ background: BG_CARD, borderColor: 'rgba(255,255,255,0.05)' }}>
                <PrestigeGallery />
              </div>
            </div>

            {/* MARKETPLACE PANEL */}
            <div id="nex-marketplace" className="rounded-xl p-6 border space-y-3 lg:col-span-2" style={{ background: BG_CARD, borderColor: 'rgba(255,255,255,0.05)' }}>
              <h2 className="text-sm font-bold" style={{ color: BLUE }}>🏪 Marketplace</h2>
              <Marketplace
                marketplaceListings={marketplaceListings}
                onListNft={onListNft}
                onBuyNft={onBuyNft}
                onCancelListing={onCancelListing}
                walletAddress={walletAddress}
                mintedNfts={state.tokens}
                xntBalance={state.xnt}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MOBILE TAB COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

function MobileTapTab({
  state, walletAddress, walletConnecting, shortAddr, xntFeeLoading, isDemo,
  payXntFee, walletDisconnect, handleTap, handlePrestige,
  nexMult, prestigeCost, nextMilestone, tapsPerPrestige,
  orbRef, orbFlash,
}: any) {
  return (
    <div className="flex flex-col items-center px-4 pt-8 pb-4 min-h-screen">
      {/* Top status row — premium */}
      <div className="w-full flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2.5">
          <span className="text-[7px] px-2 py-0.5 rounded-full uppercase tracking-widest font-medium"
            style={{
              background: 'linear-gradient(135deg, rgba(255,184,0,0.15), rgba(255,184,0,0.05))',
              color: '#ffb800',
              border: '1px solid rgba(255,184,0,0.2)'
            }}
          >Testnet</span>
          <a href="/whitepaper" target="_blank"
            className="text-[9px] px-2 py-1 rounded-lg transition-all duration-200"
            style={{
              color: 'rgba(0,102,255,0.6)',
              border: '1px solid rgba(0,102,255,0.1)'
            }}
            onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(0,102,255,0.3)'; e.currentTarget.style.color = BLUE; }}
            onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(0,102,255,0.1)'; e.currentTarget.style.color = 'rgba(0,102,255,0.6)'; }}
          >📄 Paper ↗</a>
        </div>
        <WalletMultiButton className="!bg-[#0066ff]/12 !border !border-[#0066ff]/25 !rounded-xl !text-[9px] !px-3 !py-1.5 !h-auto !text-[#0066ff] hover:!bg-[#0066ff]/20 !transition-all !font-medium !tracking-wide !min-w-0 hover:!scale-105 active:!scale-95"
          style={{ boxShadow: '0 0 20px rgba(0,102,255,0.08)' }}
        >
          {walletConnecting ? <span className="animate-pulse">⏳</span> : walletAddress ? (
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 6px rgba(52,211,153,0.5)' }} />
              {shortAddr}
            </span>
          ) : <span>🔌 Connect</span>}
        </WalletMultiButton>
        {walletAddress && (
          <button onClick={() => walletDisconnect()} className="text-[9px] text-gray-600 hover:text-red-400 transition-colors ml-0.5">✕</button>
        )}
      </div>

      {/* XNT counter — big and centered */}
      <div className="text-center mb-2">
        <h1 className="text-3xl md:text-4xl font-bold" style={{ color: BLUE }}>💎 {state.xnt.toLocaleString()}</h1>
        <p className="text-xs text-gray-500 mt-0.5">P{state.prestige} {state.prestige >= 100 ? '🏆' : `/ 100`}</p>
      </div>

      {/* Milestone */}
      <div className="text-center mb-2">
        {state.prestige >= 100 && <span className="text-yellow-400 text-xs">🏆 MAX PRESTIGE</span>}
        <p className="text-[9px] text-gray-600 mt-0.5">{state.prestige === 0 ? "tap to begin your journey" : `prestige ${state.prestige} / 100`}</p>
      </div>

      {/* Orb — the hero */}
      <div className="flex justify-center py-2">
        <button onClick={handleTap}
          className="relative w-52 h-52 select-none touch-none focus:outline-none group"
        >
          <div className="absolute -inset-6 rounded-full transition-all duration-700 opacity-100 blur-3xl animate-pulse-slow" style={{ background: `radial-gradient(ellipse, ${BLUE}1A 0%, transparent 70%)` }} />
          <div className="absolute -inset-2 rounded-full transition-all duration-500 blur-xl" style={{ background: `radial-gradient(ellipse, ${BLUE}26 0%, transparent 60%)` }} />
          <>
            <div className="absolute -inset-1.5 rounded-full animate-orb-slow pointer-events-none"
              style={{ background: `conic-gradient(from 0deg, transparent 0%, ${BLUE} 25%, ${BLUE_LIGHT} 50%, ${BLUE}44 75%, transparent 100%)`, mask: 'radial-gradient(circle, transparent 65%, black 66%)', WebkitMask: 'radial-gradient(circle, transparent 65%, black 66%)' }} />
            <div className="absolute -inset-1.5 rounded-full animate-orb-reverse pointer-events-none"
              style={{ background: `conic-gradient(from 180deg, transparent 0%, ${BLUE_LIGHT}66 20%, transparent 40%, ${BLUE}44 70%, transparent 100%)`, mask: 'radial-gradient(circle, transparent 68%, black 69%)', WebkitMask: 'radial-gradient(circle, transparent 68%, black 69%)' }} />
          </>
          <div ref={orbRef}
            className="relative w-full h-full rounded-full flex flex-col items-center justify-center overflow-hidden border"
            style={{ background: 'radial-gradient(ellipse at 50% 40%, #0a1628, #060810 80%)', borderColor: `${BLUE}44`, boxShadow: orbFlash ? `0 0 60px ${BLUE_GLOW}, 0 0 120px ${BLUE}44` : `0 0 30px ${BLUE_GLOW_WEAK}` }}
          >
            <div className="absolute inset-0 rounded-full opacity-80"
              style={{ background: 'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.08) 0%, transparent 50%), radial-gradient(circle at 70% 70%, rgba(0,102,255,0.06) 0%, transparent 40%)' }} />
            <div className={`absolute rounded-full transition-all duration-200 ${orbFlash ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}
              style={{ width: '60%', height: '60%', top: '20%', left: '20%', background: `radial-gradient(circle, ${BLUE}44 0%, transparent 70%)` }} />
            <span className={`relative text-4xl mb-1 transition-all duration-150 ${orbFlash ? 'scale-125' : ''}`}
              style={{ filter: orbFlash ? `drop-shadow(0 0 12px ${BLUE_GLOW})` : `drop-shadow(0 0 8px ${BLUE_GLOW_WEAK})`, color: TEXT_PRIMARY }}>✦</span>
            <span className={`relative text-xs font-light tracking-[0.2em] uppercase transition-all duration-300 ${orbFlash ? 'text-white/90' : ''}`} style={{ color: orbFlash ? 'rgba(255,255,255,0.9)' : `${BLUE}99` }}>tap</span>
            <span className="relative text-[10px] font-mono mt-0.5 transition-all duration-300" style={{ color: orbFlash ? BLUE_LIGHT : `${BLUE}66` }}>+0.001 XNT</span>
            <div className="absolute bottom-0 left-[15%] right-[15%] h-[2px] rounded-full transition-all duration-200" style={{ background: `linear-gradient(90deg, transparent, ${BLUE}, transparent)`, opacity: orbFlash ? 1 : 0.4 }} />
          </div>
        </button>
      </div>



      {/* Dev fee card */}
      {state.prestige >= 1 && !state.xntDevFeePaid && !isDemo && (
        <div className="w-full max-w-xs rounded-xl border p-3 mb-2" style={{ background: 'rgba(255,184,0,0.06)', borderColor: 'rgba(255,184,0,0.15)' }}>
          <p className="text-[10px] text-yellow-400 text-center mb-2">👑 Pay 0.01 XN dev fee to unlock full game</p>
          <button onClick={payXntFee} disabled={xntFeeLoading || !walletAddress}
            className={`w-full text-[10px] py-2 rounded-full border transition-all ${
              xntFeeLoading ? "bg-yellow-900/20 border-yellow-700/20 text-yellow-400/50 cursor-wait"
                : !walletAddress ? "bg-gray-900/30 border-gray-700/30 text-gray-500"
                  : "bg-yellow-900/30 hover:bg-yellow-800/40 border-yellow-700/40 text-yellow-400"
            }`}
          >
            {xntFeeLoading ? "⏳ Sending 0.01 XN..." : !walletAddress ? "🔌 Connect X1 first" : "👑 Pay 0.01 XN Dev Fee"}
          </button>
          {walletAddress && !xntFeeLoading && (
            <p className="text-[8px] text-gray-600 text-center mt-1">
              0.01 XN gas fee
            </p>
          )}
        </div>
      )}

      {/* Prestige button */}
      {state.prestige < 100 && (
        <div className="w-full max-w-xs text-center">
          <p className="text-[10px] text-gray-600 mb-1">
            Cost: {prestigeCost.toLocaleString()} XNT
          </p>
          <button onClick={handlePrestige}
            disabled={state.xnt < prestigeCost}
            className="w-full text-xs py-3 rounded-full transition-all border"
            style={{ 
              background: state.xnt >= prestigeCost ? `${BLUE}1A` : 'rgba(255,255,255,0.03)',
              borderColor: state.xnt >= prestigeCost ? `${BLUE}44` : 'rgba(255,255,255,0.08)',
              color: state.xnt >= prestigeCost ? BLUE : 'rgba(255,255,255,0.2)',
              cursor: state.xnt >= prestigeCost ? 'pointer' : 'not-allowed'
            }}
          >
            {state.xnt >= prestigeCost ? `🔄 Prestige → P${state.prestige + 1}` : `❌ Need ${(prestigeCost - state.xnt).toLocaleString()} more XNT`}
          </button>
        </div>
      )}
    </div>
  );
}

function MobilePrestigeTab({ state, isDemo, handleMint, handleForge, handleBurnOne, handleAddMetadata, onSelectNft }: any) {
  const mintCostLabel = isDemo ? "Free" : "Gas only";

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl font-bold" style={{ color: BLUE }}>🏛️ Prestige</h2>
        <p className="text-xs text-gray-500 mt-0.5">P{state.prestige} / 100</p>
      </div>

      {/* Mint card */}
      <div className="rounded-xl p-4 border" style={{ background: BG_CARD, borderColor: 'rgba(255,255,255,0.05)' }}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-gray-200">Mint iNFT</p>
          <span className="text-[10px] text-gray-500">{mintCostLabel}</span>
        </div>
        <p className="text-[10px] text-gray-600 mb-3">Slots at P{state.prestige}: {(state.mintCounts[state.prestige] || 0)} / {Math.max(1, 100 - state.prestige)}</p>
        <button onClick={handleMint}
          disabled={state.prestige < 1 || (state.mintCounts[state.prestige] || 0) >= (Math.max(1, 100 - state.prestige))}
          className={`w-full text-xs py-3 rounded-xl transition-all ${
            state.prestige >= 1 && (state.mintCounts[state.prestige] || 0) < (Math.max(1, 100 - state.prestige))
              ? "text-white"
              : "bg-gray-800/30 border border-gray-800/40 text-gray-600"
          }`}
          style={state.prestige >= 1 && (state.mintCounts[state.prestige] || 0) < Math.max(1, 100 - state.prestige) ? { background: `${BLUE}1A`, border: `1px solid ${BLUE}44`, color: BLUE } : {}}
        >
          {state.prestige < 1 ? "🔒 Prestige once to unlock minting" : (state.mintCounts[state.prestige] || 0) >= (Math.max(1, 100 - state.prestige)) ? "✅ All minted!" : "🎨 Mint iNFT"}
        </button>
      </div>

      {/* Forge card */}
      {state.tokens.length >= 3 && (
        <div className="rounded-xl p-4 border" style={{ background: BG_CARD, borderColor: 'rgba(255,255,255,0.05)' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-200">Forge</p>
            <span className="text-[10px] text-gray-500">3 same-tier → next tier</span>
          </div>
          <p className="text-[10px] text-gray-600 mb-3">Available: {state.tokens.length} iNFTs</p>
          <button onClick={handleForge}
            className="w-full text-xs py-3 rounded-xl border"
            style={{ background: 'rgba(255,184,0,0.08)', borderColor: 'rgba(255,184,0,0.25)', color: '#fbbf24' }}
          >🔨 Forge (3 → next tier)</button>
        </div>
      )}

      {/* iNFT collection */}
      {state.tokens.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-300 mb-3">Your iNFTs ({state.tokens.length})</h3>
          <div className="grid grid-cols-3 gap-3">
            {state.tokens.map((nft: any, i: number) => (
              <div key={i} data-inft-card="true" onClick={() => onSelectNft(nft)} className="rounded-lg border p-3 text-center relative group cursor-pointer hover:border-opacity-50 transition-all" style={{ background: `${BG_DARK}66`, borderColor: 'rgba(255,255,255,0.06)' }}>
                <img
                  src={getPrestigeBadgePath(nft.prestige)}
                  alt={`P${nft.prestige}`}
                  className="w-12 h-12 rounded-full object-cover mx-auto mb-2"
                />
                <p className="text-[10px] text-gray-300">P{nft.prestige}</p>
                <p className="text-[8px] text-gray-600">#{nft.seed}</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const cardEl = (e.currentTarget as HTMLElement).closest('[data-inft-card]');
                    const rect = cardEl?.getBoundingClientRect();
                    const ox = rect ? ((rect.left + rect.width / 2) / window.innerWidth * 100) : 50;
                    const oy = rect ? ((rect.top + rect.height / 2) / window.innerHeight * 100) : 50;
                    handleBurnOne(nft.prestige, nft.seed, ox, oy);
                  }}
                  className="absolute top-1 right-1 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity bg-red-900/60 hover:bg-red-800/80 rounded-full w-5 h-5 flex items-center justify-center border border-red-700/30"
                  title="Burn this iNFT"
                >🔥</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All 100 iNFT Gallery */}
      <div className="pt-4">
        <PrestigeGallery />
      </div>
    </div>
  );
}

function MobileWalletTab({ state, walletAddress, shortAddr, xntNativeBalance, onSelectNft }: any) {
  const totalNfts = state.tokens.length;
  const totalTokens = state.tokens.length;
  const tokenTiers = new Set(state.tokens.map((t: TokenEntry) => t.prestige)).size;

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      <div className="text-center">
        <h2 className="text-xl font-bold" style={{ color: BLUE }}>👛 Wallet</h2>
        <p className="text-xs text-gray-500 mt-0.5">Your on-chain holdings</p>
      </div>

      {/* Wallet address card */}
      {walletAddress ? (
        <div className="rounded-xl border p-4" style={{ background: BG_CARD, borderColor: 'rgba(255,255,255,0.05)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px]" style={{ color: TEXT_SECONDARY }}>Connected Wallet</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.5)]" />
            <span className="text-sm font-mono text-gray-200">{shortAddr}</span>
            <button
              onClick={() => navigator.clipboard.writeText(walletAddress)}
              className="text-[9px] px-1.5 py-0.5 rounded hover:bg-white/10"
              style={{ color: BLUE }}
            >📋</button>
          </div>
          <p className="text-[9px] mt-1 text-gray-600 break-all font-mono">{walletAddress}</p>
        </div>
      ) : (
        <div className="rounded-xl border p-6 text-center" style={{ background: BG_CARD, borderColor: 'rgba(255,255,255,0.05)' }}>
          <p className="text-sm text-gray-400 mb-3">No wallet connected</p>
          <WalletMultiButton className="!bg-[#0066ff]/10 !border !border-[#0066ff]/20 !rounded-full !text-[10px] !px-4 !py-2 !h-auto !text-[#0066ff] hover:!bg-[#0066ff]/20 !transition-all !font-normal !tracking-wide">
            <span>🔌 Connect X1 Wallet</span>
          </WalletMultiButton>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border p-3" style={{ background: `${BLUE}08`, borderColor: `${BLUE}22` }}>
          <p className="text-[10px]" style={{ color: TEXT_SECONDARY }}>iNFTs Minted</p>
          <p className="text-2xl font-bold mt-0.5" style={{ color: BLUE }}>{totalNfts}</p>
        </div>
        <div className="rounded-xl border p-3" style={{ background: `${BLUE}08`, borderColor: `${BLUE}22` }}>
          <p className="text-[10px]" style={{ color: TEXT_SECONDARY }}>Prestige Level</p>
          <p className="text-2xl font-bold mt-0.5" style={{ color: BLUE }}>P{state.prestige}</p>
        </div>
        <div className="rounded-xl border p-3" style={{ background: `${BLUE}08`, borderColor: `${BLUE}22` }}>
          <p className="text-[10px]" style={{ color: TEXT_SECONDARY }}>Token Rewards</p>
          <p className="text-2xl font-bold mt-0.5" style={{ color: BLUE }}>{totalTokens}</p>
          {tokenTiers > 0 && <p className="text-[9px] mt-0.5" style={{ color: TEXT_SECONDARY }}>Across {tokenTiers} tiers</p>}
        </div>
        <div className="rounded-xl border p-3" style={{ background: `${BLUE}08`, borderColor: `${BLUE}22` }}>
          <p className="text-[10px]" style={{ color: TEXT_SECONDARY }}>XN Balance</p>
          <p className="text-2xl font-bold mt-0.5" style={{ color: BLUE }}>
            {xntNativeBalance !== null ? `${xntNativeBalance.toLocaleString(undefined, { maximumFractionDigits: 4 })}` : "—"}
          </p>
        </div>
      </div>

      {/* Tokens section (merged from old MobileTokensTab) */}
      {Object.keys(state.tokens).length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-300 mb-3">🪙 Token Catalog</h3>
          <div className="grid grid-cols-2 gap-2">
            {(() => {
        // Group tokens by prestige level for display
        const levelCounts: Record<number, number> = {};
        for (const t of state.tokens) {
          levelCounts[t.prestige] = (levelCounts[t.prestige] || 0) + 1;
        }
        return Object.entries(levelCounts).sort(([a], [b]) => Number(a) - Number(b)).map(([lvl, count]) => {
              const idx = Number(lvl) - 1;
              return (
                <div key={lvl} className="rounded-lg border p-2 flex items-center gap-2" style={{ background: `${BLUE}08`, borderColor: `${BLUE}22` }}>
                  <img src={getPrestigeBadgePath(Number(lvl))} alt={`P${lvl}`} className="w-8 h-8 rounded-full object-cover" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium text-gray-200 truncate">{PRESTIGE_NAMES[idx] ?? "UNKNOWN"}</p>
                    <p className="text-[9px]" style={{ color: TEXT_SECONDARY }}>{PRESTIGE_TICKERS[idx] ?? "???"} · P{lvl}</p>
                    <p className="text-sm font-bold" style={{ color: BLUE }}>{count}x</p>
                  </div>
                </div>
              );
            })})()}
          </div>
        </div>
      )}

      {/* Demo badge */}
      {state.demoMode && (
        <div className="rounded-xl border p-3" style={{ background: `${BLUE}08`, borderColor: `${BLUE}22` }}>
          <p className="text-xs" style={{ color: BLUE }}>🎮 Demo Mode Active</p>
          <p className="text-[10px] mt-1 text-gray-500">Progress not saved to chain.</p>
        </div>
      )}

      {/* Recent iNFTs */}
      {state.tokens.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-300 mb-3">🧊 Recent iNFTs</h3>
          <div className="space-y-2">
            {state.tokens.slice(-5).reverse().map((nft: any, i: number) => {
              const realIndex = state.tokens.length - 1 - i;
              const idx = nft.prestige - 1;
              return (
                <div key={realIndex} onClick={() => onSelectNft(nft)} className="rounded-lg border p-2 flex items-center gap-2 cursor-pointer" style={{ background: BG_CARD, borderColor: 'rgba(255,255,255,0.05)' }}>
                  <img src={getPrestigeBadgePath(nft.prestige)} alt={`P${nft.prestige}`} className="w-8 h-8 rounded-full object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-200">{PRESTIGE_NAMES[idx] ?? "UNKNOWN"} · P{nft.prestige}</p>
                    <p className="text-[8px] text-gray-600">Seed: {nft.seed} {nft.mintAddress ? "📡" : "💾"}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function DesktopPoolsPanel({ lpProvided, xntBalance, onProvideLp }: { lpProvided: Record<number, boolean>; xntBalance: number; onProvideLp: (prestige: number) => void }) {
  const { totalProvided } = { totalProvided: Object.keys(lpProvided).length };
  const { count, currentBoost, nextAt } = getLpChallengeInfo(lpProvided);

  const allLevels = Array.from({ length: 100 }, (_, i) => i + 1);
  const canAfford = xntBalance >= 1;

  return (
    <div className="rounded-xl p-6 border space-y-4" style={{ background: BG_CARD, borderColor: 'rgba(255,255,255,0.05)' }}>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold" style={{ color: '#44ddff' }}>🌊 Pool Grid</h2>
        <div className="flex items-center gap-2">
          <span className="text-[9px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(0,200,255,0.08)', color: '#44ddff', border: '1px solid rgba(0,200,255,0.12)' }}>
            ×{currentBoost.toFixed(1)} boost
          </span>
          <span className="text-[9px]" style={{ color: TEXT_SECONDARY }}>{count}/100</span>
        </div>
      </div>
      <p className="text-[9px]" style={{ color: TEXT_SECONDARY }}>Deposit 0.01 XN worth of LP into each pool. Pulling LP = lose credit.</p>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <div className="h-full rounded-full transition-all duration-500" style={{
          width: `${nextAt ? Math.min(100, (count / nextAt) * 100) : 100}%`,
          background: 'linear-gradient(90deg, #44ddff, #00ff88)',
        }} />
      </div>

      {/* Milestone chips */}
      <div className="flex flex-wrap gap-1">
        {LP_MILESTONES.map(m => {
          const unlocked = count >= m.at;
          return (
            <span key={m.at} className={`text-[7px] px-1.5 py-0.5 rounded-full ${unlocked ? '' : 'opacity-40'}`}
              style={{
                background: unlocked ? '#44ddff20' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${unlocked ? '#44ddff' : 'rgba(255,255,255,0.06)'}`,
                color: unlocked ? '#44ddff' : 'rgba(255,255,255,0.3)'
              }}
            >{unlocked ? '✅' : '🔒'} {m.at} pools = ×{m.boost}</span>
          );
        })}
      </div>

      {/* 10×10 iNFT grid */}
      <div className="grid grid-cols-10 gap-1">
        {allLevels.map(lvl => {
          const provided = !!lpProvided[lvl];
          const idx = lvl - 1;
          const color = PRESTIGE_COLORS[idx] ?? BLUE;
          const badgePath = getPrestigeBadgePath(lvl);
          return (
            <button
              key={lvl}
              onClick={() => { if (!provided && canAfford) onProvideLp(lvl); }}
              disabled={provided}
              className="relative rounded overflow-hidden transition-all duration-200"
              style={{
                border: `1px solid ${provided ? color + '55' : 'rgba(255,255,255,0.06)'}`,
                background: provided ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.02)',
                opacity: !provided && !canAfford ? 0.35 : 1,
                cursor: provided ? 'default' : 'pointer',
                aspectRatio: '1/1.3',
              }}
              title={provided ? `P${lvl} — LP Deposited ✓` : `Deposit 0.01 XN LP into P${lvl}`}
            >
              <img src={badgePath} alt={`P${lvl}`} className="w-full h-full object-cover" loading="lazy" />
              <div className="absolute inset-0" style={{
                background: provided
                  ? 'linear-gradient(0deg, rgba(0,0,0,0.7) 0%, transparent 50%)'
                  : 'linear-gradient(0deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 100%)',
              }} />
              <div className="absolute top-0.5 left-0.5 text-[8px] font-mono font-bold"
                style={{ color: provided ? color : '#ffffffbb', textShadow: '0 0 6px rgba(0,0,0,0.9)' }}
              >#{String(lvl).padStart(3, '0')}</div>
              <div className="absolute bottom-0.5 left-0.5 right-0.5 flex items-center justify-between">
                <span className="text-[7px]" style={{ color: '#ffffffcc', textShadow: '0 0 6px rgba(0,0,0,0.9)' }}>1 XNT</span>
                <span className="text-[10px] font-bold" style={{
                  color: provided ? '#00ff88' : '#ffffff55',
                  textShadow: provided ? '0 0 8px rgba(0,255,136,0.5)' : '0 0 4px rgba(0,0,0,0.8)',
                }}>{provided ? '✅' : '❌'}</span>
              </div>
            </button>
          );
        })}
      </div>

      {!canAfford && count < 100 && (
        <p className="text-[8px] text-center" style={{ color: '#f59e0b' }}>⚠️ Not enough XN</p>
      )}
    </div>
  );
}

function LPChallengeSection({ lpProvided, tokens }: { lpProvided: Record<number, boolean>; tokens: Record<number, number> }) {
  const { count, nextMilestone, currentBoost, nextAt } = getLpChallengeInfo(lpProvided);
  const tokenKeys = Object.keys(tokens).map(Number).sort((a, b) => a - b);
  const progress = nextAt ? Math.min(100, (count / nextAt) * 100) : 100;

  return (
    <div className="rounded-lg border p-3 space-y-2.5" style={{ background: 'rgba(0,200,255,0.04)', borderColor: 'rgba(0,200,255,0.12)' }}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-medium" style={{ color: '#44ddff' }}>🌊 LP Challenge</p>
        <span className="text-[9px] px-2 py-0.5 rounded-full" style={{ background: '#44ddff15', color: '#44ddff', border: '1px solid #44ddff25' }}>
          ×{currentBoost.toFixed(1)} tap boost
        </span>
      </div>
      <p className="text-[9px]" style={{ color: TEXT_SECONDARY }}>
        Provide LP for tokens to unlock bigger tap rewards.
        {currentBoost > 1.0 && ` Active: 🌊×${currentBoost.toFixed(1)} XNT per tap!`}
      </p>

      {/* Milestone progress bar */}
      <div className="space-y-2">
        {LP_MILESTONES.map((m, i) => {
          const unlocked = count >= m.at;
          const active = !unlocked && count < m.at && (i === 0 || count >= LP_MILESTONES[i - 1].at);
          const nextActive = !unlocked && i === LP_MILESTONES.findIndex(mm => count < mm.at);
          const fillPct = nextActive ? Math.min(100, (count / m.at) * 100) : unlocked ? 100 : 0;
          return (
            <div key={m.at} className={`flex items-center gap-2 text-[9px] ${unlocked ? 'opacity-100' : active ? 'opacity-90' : 'opacity-30'}`}>
              <div className="w-4 text-center shrink-0">{unlocked ? '✅' : (nextActive ? '⏳' : '🔒')}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={unlocked ? 'text-green-400' : nextActive ? 'text-gray-200' : 'text-gray-600'}>
                    {m.label}
                    {unlocked && ` (×${m.boost})`}
                  </span>
                  {nextActive && <span className="text-gray-500">{count}/{m.at}</span>}
                </div>
                {(!unlocked || i === LP_MILESTONES.length - 1) && (
                  <div className="mt-0.5 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div className="h-full rounded-full transition-all duration-500" style={{
                      width: `${unlocked ? 100 : fillPct}%`,
                      background: unlocked ? 'linear-gradient(90deg, #44ddff, #00ff88)' : 'linear-gradient(90deg, #44ddff44, #44ddff22)',
                    }} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick token map */}
      {tokenKeys.length > 0 && (
        <div>
          <p className="text-[8px] mb-1" style={{ color: TEXT_SECONDARY }}>Your pool coverage:</p>
          <div className="flex flex-wrap gap-1">
            {tokenKeys.map(lvl => {
              const idx = lvl - 1;
              const color = PRESTIGE_COLORS[idx] ?? BLUE;
              const provided = !!lpProvided[lvl];
              return (
                <span key={lvl} className="text-[7px] px-1.5 py-0.5 rounded" style={{
                  background: provided ? `${color}25` : `${color}08`,
                  border: `1px solid ${provided ? color : `${color}15`}`,
                  color: provided ? color : 'rgba(255,255,255,0.2)',
                }}>
                  P{lvl}{provided ? '✓' : ''}
                </span>
              );
            })}
          </div>
        </div>
      )}

      <a href="https://x1scr.xyz" target="_blank" rel="noreferrer"
        className="block text-center text-[8px] py-1.5 rounded-lg transition-all"
        style={{ background: 'rgba(0,200,255,0.08)', color: '#44ddff', border: '1px solid rgba(0,200,255,0.15)' }}
      >📊 View LP Pools on X1 Screener ↗</a>
    </div>
  );
}

function MobilePoolsTab({ lpProvided, xntBalance, onProvideLp }: { lpProvided: Record<number, boolean>; xntBalance: number; onProvideLp: (prestige: number) => void }) {
  const { count, nextMilestone, currentBoost, nextAt } = getLpChallengeInfo(lpProvided);
  const totalProvided = Object.keys(lpProvided).length;
  const xntSpent = totalProvided;
  const remaining = 100 - totalProvided;
  const canAfford = xntBalance >= 1;

  // 10×10 grid — flattened then rendered in responsive columns
  const allLevels = Array.from({ length: 100 }, (_, i) => i + 1);

  return (
    <div className="px-4 pt-6 pb-4 space-y-4">
      {/* Title */}
      <div className="text-center">
        <h2 className="text-lg font-bold" style={{ color: '#44ddff' }}>🌊 LP Pools</h2>
        <p className="text-[9px] mt-0.5" style={{ color: TEXT_SECONDARY }}>Deposit 0.01 XN worth of LP into each pool. Pulling LP = lose credit.</p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-1.5">
        <div className="rounded-lg border p-2 text-center" style={{ background: 'rgba(0,200,255,0.04)', borderColor: 'rgba(0,200,255,0.12)' }}>
          <p className="text-[8px]" style={{ color: TEXT_SECONDARY }}>Pools</p>
          <p className="text-sm font-bold" style={{ color: '#44ddff' }}>{totalProvided}/100</p>
        </div>
        <div className="rounded-lg border p-2 text-center" style={{ background: 'rgba(0,200,255,0.04)', borderColor: 'rgba(0,200,255,0.12)' }}>
          <p className="text-[8px]" style={{ color: TEXT_SECONDARY }}>XNT Spent</p>
          <p className="text-sm font-bold" style={{ color: '#fbbf24' }}>{xntSpent}</p>
        </div>
        <div className="rounded-lg border p-2 text-center" style={{ background: 'rgba(0,200,255,0.04)', borderColor: 'rgba(0,200,255,0.12)' }}>
          <p className="text-[8px]" style={{ color: TEXT_SECONDARY }}>Multiplier</p>
          <p className="text-sm font-bold" style={{ color: currentBoost > 1 ? '#00ff88' : 'rgba(255,255,255,0.3)' }}>×{currentBoost.toFixed(1)}</p>
        </div>
        <div className="rounded-lg border p-2 text-center" style={{ background: 'rgba(0,200,255,0.04)', borderColor: 'rgba(0,200,255,0.12)' }}>
          <p className="text-[8px]" style={{ color: TEXT_SECONDARY }}>Remaining</p>
          <p className="text-sm font-bold" style={{ color: '#44ddff' }}>{remaining}</p>
        </div>
      </div>

      {/* Global progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[8px]" style={{ color: TEXT_SECONDARY }}>
          <span>Progress to next milestone</span>
          <span>{nextAt ? `${totalProvided}/${nextAt}` : `✅ COMPLETE`}</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div className="h-full rounded-full transition-all duration-500" style={{
            width: `${nextAt ? Math.min(100, (totalProvided / nextAt) * 100) : 100}%`,
            background: 'linear-gradient(90deg, #44ddff, #00ff88)',
            boxShadow: '0 0 12px rgba(0,200,255,0.3)'
          }} />
        </div>
      </div>

      {/* Milestone summary */}
      <div className="flex flex-wrap gap-1.5">
        {LP_MILESTONES.map(m => {
          const unlocked = totalProvided >= m.at;
          return (
            <div key={m.at} className={`text-[7px] px-1.5 py-0.5 rounded-full ${unlocked ? '' : 'opacity-40'}`}
              style={{
                background: unlocked ? '#44ddff20' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${unlocked ? '#44ddff' : 'rgba(255,255,255,0.06)'}`,
                color: unlocked ? '#44ddff' : 'rgba(255,255,255,0.3)'
              }}
            >
              {unlocked ? '✅' : '🔒'} {m.at} pools = ×{m.boost}
            </div>
          );
        })}
      </div>

      {/* 10×10 Grid — iNFT badges with completion markers */}
      <div>
        <div className="flex justify-between text-[8px] mb-2" style={{ color: TEXT_SECONDARY }}>
          <span>Deposit 0.01 XN LP into each pool</span>
          <span>{totalProvided}/100 ✅</span>
        </div>
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
          {allLevels.map(lvl => {
            const provided = !!lpProvided[lvl];
            const idx = lvl - 1;
            const color = PRESTIGE_COLORS[idx] ?? BLUE;
            const paddedNum = String(lvl).padStart(3, '0');
            const badgePath = getPrestigeBadgePath(lvl);
            return (
              <button
                key={lvl}
                onClick={() => { if (!provided && canAfford) onProvideLp(lvl); }}
                disabled={provided}
                className="relative rounded-lg overflow-hidden transition-all duration-200 text-left"
                style={{
                  border: `1px solid ${provided ? color + '55' : 'rgba(255,255,255,0.06)'}`,
                  background: provided ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.02)',
                  opacity: !provided && !canAfford ? 0.35 : 1,
                  cursor: provided ? 'default' : 'pointer',
                  aspectRatio: '1/1.3',
                }}
                title={provided ? `P${lvl} — LP Deposited ✓` : `Deposit 0.01 XN LP into P${lvl}`}
              >
                {/* iNFT badge */}
                <img
                  src={badgePath}
                  alt={`P${lvl}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />

                {/* Overlay gradient */}
                <div className="absolute inset-0" style={{
                  background: provided
                    ? 'linear-gradient(0deg, rgba(0,0,0,0.7) 0%, transparent 50%)'
                    : 'linear-gradient(0deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 100%)',
                }} />

                {/* Level label */}
                <div className="absolute top-1 left-1 text-[8px] font-mono font-bold"
                  style={{ color: provided ? color : '#ffffffbb', textShadow: '0 0 6px rgba(0,0,0,0.9)' }}
                >
                  #{paddedNum}
                </div>

                {/* Completion marker */}
                <div className="absolute bottom-1 left-1 right-1 flex items-center justify-between">
                  <span className="text-[7px]" style={{ color: '#ffffffcc', textShadow: '0 0 6px rgba(0,0,0,0.9)' }}>
                    1 XNT
                  </span>
                  <span className="text-[10px] font-bold" style={{
                    color: provided ? '#00ff88' : 'rgba(255,255,255,0.2)',
                    textShadow: provided ? '0 0 8px rgba(0,255,136,0.5)' : '0 0 4px rgba(0,0,0,0.8)',
                  }}>
                    {provided ? '✅' : '❌'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {!canAfford && totalProvided < 100 && (
        <p className="text-[8px] text-center" style={{ color: '#f59e0b' }}>⚠️ Not enough XN</p>
      )}
    </div>
  );
}

function MobileTokensTab({ state }: { state: any }) {
  const tokens = state.tokens as TokenEntry[];
  const totalTokens = tokens.length;
  const { currentBoost } = getLpChallengeInfo(state.lpProvided ?? {});

  // Group tokens by prestige level for display
  const levelCounts: Record<number, number> = {};
  for (const t of tokens) {
    levelCounts[t.prestige] = (levelCounts[t.prestige] || 0) + 1;
  }
  const levelEntries = Object.entries(levelCounts).sort(([a], [b]) => Number(a) - Number(b));

  return (
    <div className="px-4 pt-6 pb-4 space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-bold" style={{ color: BLUE }}>🪙 Token Portfolio</h2>
        <p className="text-xs text-gray-500 mt-0.5">Burn iNFTs to earn prestige-specific tokens</p>
        {currentBoost > 1.0 && (
          <div className="inline-block mt-1.5 text-[9px] px-2.5 py-0.5 rounded-full" style={{ background: '#44ddff15', color: '#44ddff', border: '1px solid #44ddff25' }}>
            🌊 LP boost active: ×{currentBoost.toFixed(1)} XNT per tap
          </div>
        )}
      </div>
      {/* Summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border p-3 text-center" style={{ background: `${BLUE}06`, borderColor: `${BLUE}15` }}>
          <p className="text-[9px]" style={{ color: TEXT_SECONDARY }}>Held</p>
          <p className="text-xl font-bold" style={{ color: BLUE }}>{totalTokens}</p>
        </div>
        <div className="rounded-lg border p-3 text-center" style={{ background: `${BLUE}06`, borderColor: `${BLUE}15` }}>
          <p className="text-[9px]" style={{ color: TEXT_SECONDARY }}>Supply</p>
          <p className="text-xl font-bold" style={{ color: BLUE }}>{totalTokens}</p>
        </div>
        <div className="rounded-lg border p-3 text-center" style={{ background: `${BLUE}06`, borderColor: `${BLUE}15` }}>
          <p className="text-[9px]" style={{ color: TEXT_SECONDARY }}>Value</p>
          <p className="text-xl font-bold" style={{ color: '#fbbf24' }}>—</p>
        </div>
      </div>
      {totalTokens === 0 ? (
        <div className="rounded-xl border p-8 text-center" style={{ background: BG_CARD, borderColor: 'rgba(255,255,255,0.05)' }}>
          <p className="text-sm text-gray-500">No tokens yet</p>
          <p className="text-[10px] text-gray-600 mt-1">Mint an iNFT, then burn it</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
          {levelEntries.map(([lvl, count]) => {
            const idx = Number(lvl) - 1;
            const color = PRESTIGE_COLORS[idx] ?? BLUE;
            const name = PRESTIGE_NAMES[idx] ?? "UNKNOWN";
            const ticker = PRESTIGE_TICKERS[idx] ?? "???";
            const provided = !!state.lpProvided?.[Number(lvl)];
            return (
              <div key={lvl} className="rounded-lg border p-3" style={{ background: `${color}06`, borderColor: provided ? `${color}66` : `${color}20` }}>
                <div className="flex items-center gap-2">
                  <img src={getPrestigeBadgePath(Number(lvl))} alt={`P${lvl}`} className="w-9 h-9 rounded-full object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-200 truncate">{name}</p>
                    <p className="text-[9px]" style={{ color: `${color}88` }}>{ticker} · P{lvl}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {provided && <span className="text-[8px] px-1.5 py-0.5 rounded-full" style={{ background: `${color}20`, color }}>LP✓</span>}
                    <span className="text-lg font-bold" style={{ color }}>{count}x</span>
                  </div>
                </div>
                <div className="mt-1.5 h-1.5 rounded-full overflow-hidden" style={{ background: `${color}10` }}>
                  <div className="h-full rounded-full transition-all" style={{
                    width: `${Math.min(100, count * 8 + 10)}%`,
                    background: `linear-gradient(90deg, ${color}, ${color}88)`,
                    boxShadow: `0 0 6px ${color}44`
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* LP Challenge removed — lives in the Pools tab */}

      <div className="rounded-lg border p-3" style={{ background: 'rgba(0,200,255,0.04)', borderColor: 'rgba(0,200,255,0.12)' }}>
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium" style={{ color: '#44ddff' }}>🌊 View on X1 Screener</p>
          <a href="https://x1scr.xyz" target="_blank" rel="noreferrer" className="text-[9px] px-2.5 py-1.5 rounded-lg" style={{ background: 'rgba(0,200,255,0.08)', color: '#44ddff', border: '1px solid rgba(0,200,255,0.15)' }}>Track Pools ↗</a>
        </div>
        <p className="text-[8px] mt-1" style={{ color: TEXT_SECONDARY }}>LP info, price action & volume on X1 Screener</p>
      </div>
    </div>
  );
}