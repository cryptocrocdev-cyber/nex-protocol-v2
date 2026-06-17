"use client";
import React, { useReducer, useCallback, useEffect, useRef, useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { gameReducer, createInitialState, saveGame, loadGame, clearSave } from "@/lib/gameState";
import type { GameState } from "@/lib/gameState";
import { getMintCost, getUnlockThreshold, getTokenXenYield, getMaxMintsAtPrestige, getNextMilestone } from "@/lib/gameEngine";
import type { TokenEntry } from "@/lib/gameEngine";
import {
  MobileLayout,
  DesktopLayout,
} from "@/components/ViewLayouts";
import PrestigeGallery from "@/components/PrestigeGallery";
import Marketplace from "@/components/Marketplace";
import type { MarketplaceListing } from "@/lib/marketplaceEngine";
import { getMarketplaceEngine } from "@/lib/marketplaceEngine";

const BLUE = "#0066ff";
const ACCENT = "#a78bfa";
const GOLD = "#fbbf24";

const BOTTOM_TABS: { key: string; label: string; title: string }[] = [
  { key: "tap", label: "👆", title: "Tap" },
  { key: "prestige", label: "🏛️", title: "Prestige" },
  { key: "pools", label: "🌊", title: "Pools" },
  { key: "tokens", label: "🪙", title: "Tokens" },
  { key: "wallet", label: "👛", title: "Wallet" },
  { key: "marketplace", label: "🏪", title: "Market" },
];

export default function DemoApp() {
  // ── Game state ──
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState);
  const [tab, setTab] = React.useState("tap");

  // ── Burn animation state ──
  const [burning, setBurning] = React.useState<{ x: number; y: number } | null>(null);
  const effectsRef = useRef<HTMLDivElement>(null);
  const orbRef = useRef<HTMLDivElement>(null);

  // ── X1 Wallet ──
  const { publicKey: walletPubkey, connecting: walletConnecting, disconnect: walletDisconnect, sendTransaction, wallet } = useWallet();
  const { connection } = useConnection();
  const walletAddress = walletPubkey?.toBase58() ?? null;
  const shortAddr = walletAddress ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}` : null;
  const [xntFeeLoading, setXntFeeLoading] = React.useState(false);
  const [xntNativeBalance, setXntNativeBalance] = React.useState<number | null>(null);

  // ── Fetch native XNT balance ──
  React.useEffect(() => {
    if (!walletPubkey || !connection) { setXntNativeBalance(null); return; }
    connection.getBalance(walletPubkey).then(bal => {
      setXntNativeBalance(bal / 1_000_000_000);
    }).catch(() => setXntNativeBalance(null));
  }, [walletPubkey, connection]);

  // ── View mode ──
  const [viewMode, setViewMode] = React.useState<"mobile" | "desktop">("mobile");
  const toggleViewMode = () => setViewMode(v => v === "mobile" ? "desktop" : "mobile");

  const isGameComplete = state.gameCompleted;
  const hasStarted = state.gameStarted;
  const isDemo = state.demoMode;

  // ── Reset game ──
  const handleResetGame = useCallback(() => {
    dispatch({ type: "RESET_GAME" });
  }, []);

  // ── Start demo ──
  const handleStartDemo = useCallback(() => {
    dispatch({ type: "START_DEMO" });
  }, []);

  // ── Pay dev fee ──
  const payXntFee = useCallback(async () => {
    if (!walletPubkey || !connection || !sendTransaction) return;
    setXntFeeLoading(true);
    try {
      const { SystemProgram } = await import("@solana/web3.js");
      const ix = SystemProgram.transfer({
        fromPubkey: walletPubkey,
        toPubkey: new (await import("@solana/web3.js")).PublicKey("BQLB3NPHGRfibY23qTDbEYBuhZu2KsdiD3pbxuu8Fpxh"),
        lamports: 10_000_000, // 0.01 XNT
      });
      const tx = new (await import("@solana/web3.js")).Transaction().add(ix);
      const sig = await sendTransaction(tx, connection);
      await connection.confirmTransaction(sig);
      dispatch({ type: "PAY_DEV_FEE" });
    } catch (err: any) {
      console.error("Dev fee failed:", err);
    } finally {
      setXntFeeLoading(false);
    }
  }, [walletPubkey, connection, sendTransaction]);

  // ── Floating text effects ──
  const [floats, setFloats] = React.useState<Array<{ id: number; text: string; color: string; x: number; y: number }>>([]);
  const floatIdRef = useRef(0);
  const spawnFloat = useCallback((text: string, color: string) => {
    const id = ++floatIdRef.current;
    setFloats(prev => [...prev, { id, text, color, x: 20 + Math.random() * 60, y: 20 + Math.random() * 40 }]);
    setTimeout(() => setFloats(prev => prev.filter(f => f.id !== id)), 1200);
  }, []);

  // ── Hydrate from localStorage ──
  useEffect(() => {
    const saved = loadGame();
    if (saved) dispatch({ type: "HYDRATE", saved });
  }, []);

  // ── Auto-save ──
  useEffect(() => {
    if (state._rev > 0 && !state.demoMode) saveGame(state);
  }, [state, state._rev, state.demoMode]);

  // ── Fetch marketplace listings ──
  const [marketplaceListings, setMarketplaceListings] = React.useState<MarketplaceListing[]>([]);
  useEffect(() => {
    const engine = getMarketplaceEngine();
    engine.getActiveListings().then(setMarketplaceListings).catch(() => {});
  }, [state._rev]);

  // ── Sync from X1 on connect ──
  useEffect(() => {
    if (!walletPubkey || !connection) return;
    const fetchOnChain = async () => {
      try {
        const saved = loadGame();
        if (saved) {
          // Merge on-chain prestige count
          const { PublicKey } = await import("@solana/web3.js");
          const userPda = PublicKey.findProgramAddressSync(
            [Buffer.from("user"), walletPubkey.toBytes()],
            new PublicKey("FgQ86Z5vvoPEvduoxUjTuXSqLFMGpMra8MSzV3E5BjFo")
          )[0];
          const acc = await connection.getAccountInfo(userPda).catch(() => null);
          if (acc) {
            const data = acc.data;
            const prestigeCount = data.readUInt32LE(8);
            const merged: GameState = { ...saved, prestige: Math.max(saved.prestige, prestigeCount) };
            dispatch({ type: "HYDRATE", saved: merged });
          }
        }
      } catch {}
    };
    fetchOnChain();
  }, [walletPubkey, connection]);

  // ── Orb flash ──
  const [orbFlash, setOrbFlash] = React.useState<number>(0);
  const handleTap = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    dispatch({ type: "TAP", now: Date.now() });
    spawnFloat(`+0.001 XNT`, "#00ff88");
    setOrbFlash(v => v + 1);
  }, [spawnFloat]);

  // ── Prestige ──
  const handlePrestige = useCallback(async () => {
    if (state.prestige >= 100) return;
    const tokensAtLevel = state.tokens.filter(t => t.prestige === state.prestige).length;
    const globalMintsAtLevel = state.globalMintCounts[state.prestige] || 0;
    const threshold = getUnlockThreshold(state.prestige, globalMintsAtLevel);
    if (tokensAtLevel < threshold) { spawnFloat(`❌ Need ${threshold} tokens at P${state.prestige} to prestige`, "#ef4444"); return; }
    if (isDemo) {
      dispatch({ type: "PRESTIGE" });
      spawnFloat(`🔄 Prestiged! → P${state.prestige + 1}`, GOLD);
      return;
    }
    if (!walletPubkey || !connection || !sendTransaction) {
      spawnFloat("⚠️ Connect X1 Wallet to prestige", "#00ccff");
      return;
    }
    try {
      const { PublicKey, SystemProgram, Transaction } = await import("@solana/web3.js");
      const devWallet = new PublicKey("BQLB3NPHGRfibY23qTDbEYBuhZu2KsdiD3pbxuu8Fpxh");
      const ix = SystemProgram.transfer({
        fromPubkey: walletPubkey,
        toPubkey: devWallet,
        lamports: 10_000_000,
      });
      const tx = new Transaction().add(ix);
      const signature = await sendTransaction(tx, connection);
      await connection.confirmTransaction(signature);
      spawnFloat(`🔄 Prestiged! → P${state.prestige + 1} (0.01 XN)`, GOLD);
      dispatch({ type: "PRESTIGE" });
    } catch (err: any) {
      console.error("Prestige tx failed:", err);
      spawnFloat(err?.message?.includes("UserRejected") ? "🚫 Transaction cancelled" : "❌ Prestige failed — insufficient XN or transaction rejected", "#ef4444");
    }
  }, [state.prestige, state.tokens, state.globalMintCounts, isDemo, walletPubkey, sendTransaction, connection]);

  // ── Mint ──
  const handleMint = useCallback(async () => {
    if (state.prestige < 1) return;
    const maxMints = getMaxMintsAtPrestige(state.prestige);
    const currentCount = state.mintCounts[state.prestige] || 0;
    if (currentCount >= maxMints) { spawnFloat(`❌ P${state.prestige} fully minted (${maxMints}/${maxMints})`, "#ef4444"); return; }
    if (state.xnt < getMintCost(state.prestige)) { spawnFloat(`❌ Need ${getMintCost(state.prestige).toFixed(4)} XNT to mint`, "#ef4444"); return; }
    const seed = Math.floor(Math.random() * 1_000_000);
    if (isDemo) {
      dispatch({ type: "MINT", seed, mintAddress: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` });
      spawnFloat(`🎨 Minted P${state.prestige} token! (-5,000 XNT)`, ACCENT);
      return;
    }
    if (!walletPubkey || !connection || !sendTransaction) {
      spawnFloat("⚠️ Connect X1 Wallet to mint", "#00ccff");
      return;
    }
    try {
      const { PublicKey, SystemProgram, Transaction } = await import("@solana/web3.js");
      const devWallet = new PublicKey("BQLB3NPHGRfibY23qTDbEYBuhZu2KsdiD3pbxuu8Fpxh");
      const ix = SystemProgram.transfer({
        fromPubkey: walletPubkey,
        toPubkey: devWallet,
        lamports: 1_000_000, // 0.001 XN gas
      });
      const tx = new Transaction().add(ix);
      const signature = await sendTransaction(tx, connection);
      await connection.confirmTransaction(signature);
      const mintAddress = new PublicKey(PublicKey.default.toBytes()); // placeholder
      dispatch({ type: "MINT", seed, mintAddress: mintAddress.toBase58() });
      spawnFloat(`🎨 Minted P${state.prestige} token! TX: ${signature.slice(0, 8)}...`, ACCENT);
    } catch (err: any) {
      console.error("Mint tx failed:", err);
      spawnFloat(err?.message?.includes("UserRejected") ? "🚫 Transaction cancelled" : "❌ Mint failed", "#ef4444");
    }
  }, [state.prestige, state.mintCounts, state.xnt, walletPubkey, isDemo]);

  // ── Burn ──
  const handleBurn = useCallback((prestigeLvl: number, seed: number) => {
    dispatch({ type: "BURN_TOKEN", prestigeLvl, seed });
  }, []);

  const handleBurnComplete = useCallback((prestigeLvl: number, seed: number, ticker: string) => {
    dispatch({ type: "BURN_TOKEN", prestigeLvl, seed });
  }, []);

  const handleBurnClose = useCallback(() => {}, []);

  const handleBurnOne = useCallback(async (prestigeLvl: number, seed: number, originX?: number, originY?: number) => {
    if (isDemo) {
      dispatch({ type: "BURN_TOKEN", prestigeLvl, seed });
      return;
    }
    dispatch({ type: "BURN_TOKEN", prestigeLvl, seed });
  }, [isDemo]);

  // ── Forge ──
  const handleForge = useCallback(() => {
    const counts: Record<number, number> = {};
    for (const t of state.tokens) counts[t.prestige] = (counts[t.prestige] || 0) + 1;
    const forgeable = Object.entries(counts).find(([, c]) => c >= 3);
    if (!forgeable) { spawnFloat("❌ Need 3 tokens of the same level to forge", "#ef4444"); return; }
    dispatch({ type: "FORGE" });
    spawnFloat(`🔨 Forged! 3× P${forgeable[0]} → P${Number(forgeable[0]) + 1}`, "#ffaa00");
  }, [state.tokens]);

  // ── Add metadata ──
  const handleAddMetadata = useCallback(async (lvl: number, seed: number, mintAddress: string) => {
    // No-op for now
  }, []);

  // ── LP ──
  const handleProvideLp = useCallback((prestige: number) => {
    dispatch({ type: "PROVIDE_LP", prestige });
    spawnFloat(`🌊 LP provided for P${prestige}!`, '#44ddff');
  }, []);

  // ── XEN Token Locking ──
  const handleLockToken = useCallback((seed: number, termDays: number) => {
    const token = state.tokens.find(t => t.seed === seed);
    if (!token) { spawnFloat("❌ Token not found", "#ef4444"); return; }
    if (token.lockedUntil) { spawnFloat("❌ Token already locked", "#ef4444"); return; }
    if (termDays <= 0) { spawnFloat("❌ Select a lock term", "#ef4444"); return; }
    dispatch({ type: "LOCK_TOKEN", seed, termDays, now: Date.now() });
    const globalCount = state.globalMintCounts[token.prestige] || 1;
    const yieldPerDay = getTokenXenYield(token.prestige, token.serial, globalCount, termDays);
    spawnFloat(`🔒 P${token.prestige} #${token.serial} locked ${termDays}d → +${yieldPerDay} XNT/day`, "#ffaa00");
  }, [state.tokens, state.globalMintCounts]);

  const handleUnlockToken = useCallback((seed: number) => {
    const token = state.tokens.find(t => t.seed === seed);
    if (!token) { spawnFloat("❌ Token not found", "#ef4444"); return; }
    if (!token.lockedUntil) { spawnFloat("❌ Token not locked", "#ef4444"); return; }
    if (Date.now() < token.lockedUntil) { spawnFloat("⏳ Token still locked", "#ffaa00"); return; }
    dispatch({ type: "UNLOCK_TOKEN", seed, now: Date.now() });
    spawnFloat(`🔓 Unlocked! Yield claimed`, "#44ff88");
  }, [state.tokens]);

  const handleClaimAllYield = useCallback(() => {
    dispatch({ type: "CLAIM_YIELD", now: Date.now() });
    spawnFloat(`💰 Claimed all unlocked yield!`, "#44ff88");
  }, []);

  // ── Marketplace ──
  const onListNft = useCallback(async (nft: TokenEntry, price: number) => {
    const engine = getMarketplaceEngine();
    try {
      await engine.list({
        prestige: nft.prestige,
        seed: nft.seed,
        price,
        seller: walletAddress ?? '',
        mint: nft.mintAddress ?? '',
      });
      spawnFloat(`📦 Listed P${nft.prestige} for ${price} XNT`, "#44ddff");
      const listings = await engine.getActiveListings();
      setMarketplaceListings(listings);
    } catch (err) {
      spawnFloat("❌ Failed to list", "#ef4444");
    }
  }, []);

  const onBuyNft = useCallback(async (listing: MarketplaceListing) => {
    if (state.xnt < listing.price) { spawnFloat("❌ Insufficient XNT", "#ef4444"); return; }
    const engine = getMarketplaceEngine();
    try {
      await engine.buy({
        listingId: listing.id,
        price: listing.price,
        seller: listing.seller,
        buyer: walletAddress ?? '',
      });
      dispatch({ type: "BUY_TOKEN", prestige: listing.prestige, seed: listing.seed, price: listing.price });
      spawnFloat(`🛒 Bought P${listing.prestige} for ${listing.price} XNT`, "#44ddff");
      const listings = await engine.getActiveListings();
      setMarketplaceListings(listings);
    } catch (err) {
      spawnFloat("❌ Failed to buy", "#ef4444");
    }
  }, [state.xnt]);

  const onCancelListing = useCallback(async (listingId: string) => {
    const engine = getMarketplaceEngine();
    try {
      await engine.cancel(listingId);
      spawnFloat("🗑️ Listing cancelled", "#ffaa00");
      const listings = await engine.getActiveListings();
      setMarketplaceListings(listings);
    } catch (err) {
      spawnFloat("❌ Failed to cancel", "#ef4444");
    }
  }, []);

  // ── Derived values ──
  const nextMilestone = getNextMilestone(state.prestige);

  // ── Layout ──
  return (
    <div className="min-h-screen text-white flex flex-col relative" style={{ background: "#000" }}>
      <ParticleBg />

      {/* ── Burn animation overlay ── */}
      {burning && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
          <div className="absolute w-64 h-64" style={{
            left: `${burning.x}%`,
            top: `${burning.y}%`,
            transform: 'translate(-50%, -50%)',
          }}>
            <div className="animate-burn-expand absolute inset-0 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(255,100,0,0.8) 0%, rgba(255,50,0,0.4) 30%, rgba(255,0,0,0.1) 60%, transparent 100%)',
                boxShadow: '0 0 80px rgba(255,100,0,0.6), 0 0 160px rgba(255,50,0,0.3)',
              }}
            />
            <div className="animate-burn-spark absolute inset-0 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(255,200,0,0.9) 0%, transparent 50%)',
              }}
            />
            {[...Array(8)].map((_, i) => (
              <div key={i} className="absolute w-2 h-2 rounded-full"
                style={{
                  background: ['#ff6600','#ff4400','#ffaa00','#ff2200'][i%4],
                  boxShadow: '0 0 6px currentColor',
                  left: `${50 + Math.cos(i/8*Math.PI*2)*40}%`,
                  top: `${50 + Math.sin(i/8*Math.PI*2)*40}%`,
                  animation: `burn-particle 0.6s ease-out ${i*0.05}s forwards`,
                  opacity: 0,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Floating text overlay ── */}
      {floats.length > 0 && (
        <div ref={effectsRef} className="fixed inset-0 pointer-events-none z-50">
          {floats.map(f => (
            <div
              key={f.id}
              className="absolute animate-float-up text-xs font-bold tracking-widest"
              style={{ left: `${f.x}%`, top: `${f.y}%`, color: f.color, textShadow: "0 0 12px currentColor" }}
            >
              {f.text}
            </div>
          ))}
        </div>
      )}

      {/* ── LANDING SCREEN — demo or pay 0.01 XN ── */}
      {!hasStarted && !isGameComplete && (
        <div className="flex-1 flex items-center justify-center relative z-10 px-4">
          <div className="text-center max-w-md space-y-6">
            <div className="flex justify-center">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center"
                style={{
                  background: "radial-gradient(circle, #a78bfa33, transparent 70%)",
                  boxShadow: "0 0 60px #a78bfa33",
                }}
              >
              <img src="/nex-logo.jpg" alt="XNT" className="h-12 w-auto rounded-lg" />
              </div>
            </div>

            <h1 className="text-3xl font-bold" style={{ color: '#fff' }}>XNT Protocol</h1>
            <p className="text-sm" style={{ color: "#888899" }}>
              The deflationary inverse of XEN. Tap. Prestige. Mint. Lock. Earn.
              Ascend through all 100 prestige tiers on X1.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 justify-center text-[11px]" style={{ color: "#888899" }}>
                <span>👆 Tap for XNT</span>
                <span>🔄 Prestige 100 tiers</span>
                <span>🎨 Mint tokens</span>
              </div>
              <div className="flex items-center gap-3 justify-center text-[11px]" style={{ color: "#888899" }}>
                <span>🔒 Lock for XEN yield</span>
                <span>🔥 Burn for tokens</span>
                <span>🏪 Trade</span>
              </div>
            </div>

            <div className="pt-4 space-y-3">
              {/* Demo Mode */}
              <div
                className="rounded-xl border p-4 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all"
                style={{ background: "#0c0c1488", borderColor: "#a78bfa22" }}
                onClick={handleStartDemo}
              >
                <p className="text-sm font-medium" style={{ color: ACCENT }}>🎮 Try Demo Mode</p>
                <p className="text-[10px] mt-1" style={{ color: "#888899cc" }}>
                  No wallet needed. Play through all 100 prestiges for free.
                  Nothing is saved when you exit.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
                <span className="text-[10px]" style={{ color: "#88889966" }}>OR</span>
                <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
              </div>

              {/* Wallet / Pay XNT */}
              <div
                className="rounded-xl border p-4"
                style={{ background: "#0c0c1488", borderColor: "#0066ff33" }}
              >
                {!walletAddress ? (
                  <div className="text-center">
                    <WalletMultiButton
                      className="!bg-[#0066ff]/10 !border !border-[#0066ff]/20 !rounded-full !text-[10px] !px-4 !py-1.5 !h-auto !text-[#0066ff] hover:!bg-[#0066ff]/20 !transition-all !font-normal !tracking-wide"
                    />
                    <p className="text-[10px] mt-2 text-center" style={{ color: "#88889999" }}>
                      0.01 XN dev fee · 0.01 XN prestige fee → dev · cheap mint gas
                    </p>
                  </div>
                ) : (
                  <div className="text-center space-y-2">
                    <p className="text-[9px]" style={{ color: "#888899" }}>
                      Wallet: {shortAddr}
                    </p>
                    {xntNativeBalance !== null && (
                      <p className="text-[10px]" style={{ color: xntNativeBalance >= 0.01 ? "#4ade80" : "#ffbb33" }}>
                        {xntNativeBalance.toFixed(4)} XN
                      </p>
                    )}
                    {xntNativeBalance !== null && xntNativeBalance < 0.01 && (
                      <div
                        className="text-[10px] px-3 py-1.5 rounded-lg"
                        style={{ background: "#44220044", border: "1px solid #88550044", color: "#ffbb33" }}
                      >
                        ⚠️ 0 XN in wallet —
                        <span className="underline ml-1">add XN via bridge</span>
                      </div>
                    )}
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={payXntFee}
                        disabled={xntFeeLoading}
                        className="text-xs px-5 py-2 rounded-full transition-all border"
                        style={{
                          background: xntFeeLoading ? "#55440033" : "#a78bfa22",
                          borderColor: xntFeeLoading ? "#88770033" : "#a78bfa44",
                          color: xntFeeLoading ? "#888" : ACCENT,
                        }}
                      >
                        {xntFeeLoading ? "⏳ Sending 0.01 XN..." : "👑 Pay 0.01 XN & Unlock"}
                      </button>
                    </div>
                    <p className="text-[10px]" style={{ color: "#88889999" }}>
                      0.01 XN dev fee · 0.01 XN prestige fee → dev
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── GAME COMPLETE ── */}
      {isGameComplete && hasStarted && (
        <div className="flex-1 flex items-center justify-center relative z-10 px-4">
          <div className="text-center max-w-sm space-y-6">
            <div
              className="w-28 h-28 rounded-full flex items-center justify-center mx-auto animate-pulse"
              style={{
                background: "radial-gradient(circle, #fbbf2444, transparent 70%)",
                boxShadow: "0 0 80px #fbbf2444",
              }}
            >
              <span className="text-5xl">⭐</span>
            </div>
            <h2 className="text-2xl font-bold" style={{ color: GOLD }}>You completed the game!</h2>
            <p className="text-sm" style={{ color: "#888899" }}>
              All 100 prestige tiers conquered. Your XNT legacy is sealed.
            </p>
            <button
              onClick={handleResetGame}
              disabled={xntFeeLoading}
              className="text-xs px-6 py-3 rounded-full transition-all border"
              style={{
                background: "#fbbf2411",
                borderColor: "#fbbf2433",
                color: xntFeeLoading ? "#666" : GOLD,
              }}
            >
              {xntFeeLoading ? "⏳ Processing..." : "🔄 Restart Game (send 0.01 XN)"}
            </button>
          </div>
        </div>
      )}

      {/* ── GAME VIEW ── */}
      {hasStarted && !isGameComplete && (
        <>
          <ParticleBg />

          {/* View mode toggle */}
          <div className="fixed top-3 right-3 z-50">
            <button
              onClick={toggleViewMode}
              className="text-[9px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/20 transition-all"
              title={`Switch to ${viewMode === 'mobile' ? 'desktop' : 'mobile'} view`}
            >
              {viewMode === "mobile" ? "🖥 Desktop" : "📱 Mobile"}
            </button>
          </div>

          {viewMode === "mobile" ? (
            <MobileLayout
              state={state} tab={tab} setTab={setTab}
              walletAddress={walletAddress} walletConnecting={walletConnecting}
              shortAddr={shortAddr} xntFeeLoading={xntFeeLoading} isDemo={isDemo}
              xntNativeBalance={xntNativeBalance}
              payXntFee={payXntFee} walletDisconnect={walletDisconnect}
              handleTap={handleTap} handlePrestige={handlePrestige} handleMint={handleMint}
              handleBurn={handleBurn} handleBurnOne={handleBurnOne} handleForge={handleForge}
              handleAddMetadata={handleAddMetadata}
              nexMult={0} prestigeCost={0}
              nextMilestone={nextMilestone} tapsPerPrestige={0}
              orbRef={orbRef} effectsRef={effectsRef} orbFlash={orbFlash}
              bottomTabs={BOTTOM_TABS}
              marketplaceListings={marketplaceListings}
              onListNft={onListNft}
              onBuyNft={onBuyNft}
              onCancelListing={onCancelListing}
              handleProvideLp={handleProvideLp}
              handleLockToken={handleLockToken}
              handleUnlockToken={handleUnlockToken}
              handleClaimAllYield={handleClaimAllYield}
            />
          ) : (
            <DesktopLayout
              state={state} tab={tab} setTab={setTab}
              walletAddress={walletAddress} walletConnecting={walletConnecting}
              shortAddr={shortAddr} xntFeeLoading={xntFeeLoading} isDemo={isDemo}
              xntNativeBalance={xntNativeBalance}
              payXntFee={payXntFee} walletDisconnect={walletDisconnect}
              handleTap={handleTap} handlePrestige={handlePrestige} handleMint={handleMint}
              handleBurn={handleBurn} handleBurnOne={handleBurnOne} handleForge={handleForge}
              handleAddMetadata={handleAddMetadata}
              nexMult={0} prestigeCost={0}
              nextMilestone={nextMilestone} tapsPerPrestige={0}
              orbRef={orbRef} effectsRef={effectsRef} orbFlash={orbFlash}
              bottomTabs={BOTTOM_TABS}
              marketplaceListings={marketplaceListings}
              onListNft={onListNft}
              onBuyNft={onBuyNft}
              onCancelListing={onCancelListing}
              handleProvideLp={handleProvideLp}
              handleLockToken={handleLockToken}
              handleUnlockToken={handleUnlockToken}
              handleClaimAllYield={handleClaimAllYield}
            />
          )}
        </>
      )}
      {/* Legal Disclaimer Footer */}
      <footer className="w-full border-t border-white/5 mt-8 pt-6 pb-8 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[10px] leading-relaxed text-white/30">
            <strong className="text-white/40">⚠ DISCLAIMER:</strong> XNT Protocol is an experimental on-chain game deployed on X1 Blockchain. 
            This is not a financial product, investment contract, or security. XNT tokens have no inherent monetary value 
            and are purely a game mechanic. There is no promise, guarantee, or expectation of profit. The protocol is 
            provided "as is" without any warranty. Participation is entirely at your own risk. XNT used for game fees 
            (0.01 XN entry, 0.01 XN prestige) is non-refundable. Smart contract risk, blockchain network risk, and 
            potential total loss of funds apply. By using this site you agree to hold the developers, deployers, and 
            all associated parties harmless from any losses, damages, or claims. Do not play if this is illegal in 
            your jurisdiction. Not available to US persons or residents where prohibited.
          </p>
          <p className="text-[10px] text-white/20 mt-2">
            Dev Wallet: <code className="text-[#4488ff]/40">BQLB3NPHGRfibY23qTDbEYBuhZu2KsdiD3pbxuu8Fpxh</code>
          </p>
        </div>
      </footer>
    </div>
  );
}

// ── Particle Background ──
function ParticleBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animId: number;
    const particles: { x: number; y: number; vx: number; vy: number; r: number; a: number }[] = [];
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.5 + 0.5,
        a: Math.random() * 0.3 + 0.1,
      });
    }
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(100, 150, 255, ${p.a})`;
        ctx.fill();
      }
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />;
}
