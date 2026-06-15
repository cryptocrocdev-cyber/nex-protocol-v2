"use client";

import React, { useReducer, useEffect, useCallback, useRef, useMemo } from "react";
import { getPrestigeBadgePath, PRESTIGE_NAMES, PRESTIGE_TICKERS, DEV_WALLET_STR } from "@/lib/void";
import { getPrestigeCostAt, getNexMultAt, getNextMilestone, getTapsPerPrestige } from "@/lib/gameEngine";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { createInitialState, gameReducer, saveGame, loadGame } from "@/lib/gameState";
import type { GameState } from "@/lib/gameState";
import type { NftEntry } from "@/lib/gameEngine";
import { VoidSdk } from "@/lib/voidSdk";
import {
  MobileLayout,
  DesktopLayout,
} from "./ViewLayouts";

// ── Constants ──
const ACCENT = "#a78bfa";
const GOLD = "#fbbf24";

// ── Clean background (no particles) ──
function ParticleBg() {
  return null;
}

// ── Floating text effect ──
interface FloatEntry {
  id: number;
  text: string;
  color: string;
  x: number;
  y: number;
}
let nextFloatId = 1;

const BOTTOM_TABS: { key: string; label: string; title: string }[] = [
  { key: "tap", label: "👆", title: "Tap" },
  { key: "prestige", label: "🏛️", title: "Prestige" },
  { key: "pools", label: "🌊", title: "Pools" },
  { key: "tokens", label: "🪙", title: "Tokens" },
  { key: "wallet", label: "👛", title: "Wallet" },
  { key: "marketplace", label: "🏪", title: "Market" },
];

// ── Marketplace types ──
import type { MarketplaceListing } from "@/lib/marketplaceEngine";
import { getMarketplaceEngine } from "@/lib/marketplaceEngine";

export default function DemoApp() {
  // ── Game state ──
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState);
  const [tab, setTab] = React.useState("tap");

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
      setXntNativeBalance(bal / LAMPORTS_PER_SOL);
    }).catch(() => setXntNativeBalance(null));
  }, [walletPubkey, connection]);

  // ── Check game completion ──
  const isGameComplete = state.gameCompleted;
  const hasStarted = state.gameStarted;
  const isDemo = state.demoMode;

  // ── Reset game after completion ──
  const handleResetGame = useCallback(async () => {
    if (!walletPubkey || !sendTransaction || !connection) {
      dispatch({ type: "RESET_GAME" });
      spawnFloat("✅ Game Reset (Demo)", GOLD);
      return;
    }
    try {
      setXntFeeLoading(true);
      const devPubkey = new PublicKey(DEV_WALLET_STR);
      const feeLamports = LAMPORTS_PER_SOL;
      const tx = new Transaction().add(
        SystemProgram.transfer({ fromPubkey: walletPubkey, toPubkey: devPubkey, lamports: feeLamports })
      );
      const signature = await sendTransaction(tx, connection);
      try { await connection.confirmTransaction(signature, "processed"); } catch (e) {}
      dispatch({ type: "RESET_GAME" });
      spawnFloat(`✅ 0.01 XN Paid — Reset!`, GOLD);
    } catch (err: any) {
      console.error("Reset fee tx failed:", err);
      spawnFloat(err?.message?.includes("UserRejected") ? "🚫 Cancelled" : "❌ Reset failed", "#ef4444");
    } finally {
      setXntFeeLoading(false);
    }
  }, [walletPubkey, sendTransaction, connection]);

  // ── Start Demo Mode ──
  const handleStartDemo = useCallback(() => {
    dispatch({ type: "START_DEMO" });
    spawnFloat("🎮 Demo Mode — play for free!", ACCENT);
  }, []);

  // Marketplace state — driven by engine
  const [marketplaceListings, setMarketplaceListings] = React.useState<MarketplaceListing[]>([]);
  // ── Marketplace engine ──
  // Auto-detects on-chain availability. If the OnchainMarketplaceEngine
  // detects a deployed program ID, it swaps in automatically.
  const engineRef = useRef(getMarketplaceEngine());
  // Check if on-chain marketplace is available and swap
  React.useEffect(() => {
    try {
      const OnchainEngine = require("@/lib/onchainMarketplaceEngine").OnchainMarketplaceEngine;
      const { setMarketplaceEngine, isOnchainMode } = require("@/lib/marketplaceEngine");
      if (!isOnchainMode() && wallet?.adapter?.publicKey && connection) {
        const sdk = getVoidSdk();
        if (sdk) {
          const engine = new OnchainEngine(connection, sdk);
          engine.connect();
          setMarketplaceEngine(engine);
          engineRef.current = engine;
          console.log("🟢 On-chain marketplace engine activated");
        }
      }
    } catch (e) {
      // Onchain engine not available / not deployed — stay on mock
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet?.adapter?.publicKey, connection]);

  useEffect(() => {
    engineRef.current.getActiveListings().then(setMarketplaceListings);
    const unsub = engineRef.current.onDataChange(() => {
      engineRef.current.getActiveListings().then(setMarketplaceListings);
    });
    return unsub;
  }, []);

  const onListNft = useCallback((nft: NftEntry, price: number) => {
    engineRef.current.list({
      prestige: nft.prestige, seed: nft.seed, mint: nft.mintAddress ?? "",
      price, seller: walletAddress ?? "unknown",
    });
  }, [walletAddress]);

  const onBuyNft = useCallback((listing: MarketplaceListing) => {
    // handled by Marketplace component via engine
  }, []);

  const onCancelListing = useCallback((listingId: string) => {
    engineRef.current.cancel(listingId);
  }, []);

  // ── Void SDK (on-chain mint/burn) ──
  const voidSdkRef = useRef<VoidSdk | null>(null);
  const getVoidSdk = useCallback(() => {
    if (!voidSdkRef.current && connection && walletPubkey) {
      // Use the wallet adapter (X1WalletAdapter / BackpackWalletAdapter / etc.)
      // instead of raw window.x1wallet — works with any Solana wallet
      const signer = wallet?.adapter as any;
      const provider = {
        publicKey: walletPubkey,
        signTransaction: async (tx: Transaction) => {
          if (signer?.signTransaction) return signer.signTransaction(tx);
          throw new Error("Wallet does not support signTransaction");
        },
        signAllTransactions: async (txs: Transaction[]) => {
          if (signer?.signAllTransactions) return signer.signAllTransactions(txs);
          throw new Error("Wallet does not support signAllTransactions");
        },
        signAndSendTransaction: async (tx: Transaction) => {
          if (!sendTransaction) throw new Error("sendTransaction not available");
          const sig = await sendTransaction(tx, connection);
          try { await connection.confirmTransaction(sig, "processed"); } catch (_) {}
          return sig;
        },
      };
      voidSdkRef.current = new VoidSdk(connection, provider);
    }
    return voidSdkRef.current;
  }, [connection, walletPubkey, wallet?.adapter, sendTransaction]);

  // ── View mode ──
  const [viewMode, setViewMode] = React.useState<"mobile" | "desktop">(
    typeof window !== "undefined"
      ? (localStorage.getItem("nex_view_mode") as "mobile" | "desktop") || "mobile"
      : "mobile"
  );
  const toggleViewMode = useCallback(() => {
    setViewMode(prev => {
      const next = prev === "mobile" ? "desktop" : "mobile";
      localStorage.setItem("nex_view_mode", next);
      return next;
    });
  }, []);

  // ── Floating text system ──
  const [floats, setFloats] = React.useState<FloatEntry[]>([]);
  const spawnFloat = useCallback((text: string, color: string) => {
    const id = nextFloatId++;
    setFloats(prev => [...prev, { id, text, color, x: Math.random() * 80 + 10, y: Math.random() * 60 + 20 }]);
    setTimeout(() => setFloats(prev => prev.filter(f => f.id !== id)), 2500);
  }, []);

  // ── Persist on state change ──
  useEffect(() => { saveGame(state); }, [state]);

  // ── Hydrate from localStorage on mount ──
  useEffect(() => {
    const saved = loadGame();
    if (saved) dispatch({ type: "HYDRATE", saved });
  }, []);

  // ── Sync from on-chain when wallet connects ──
  useEffect(() => {
    if (!walletPubkey || !connection) return;
    let cancelled = false;
    (async () => {
      try {
        const sdk = getVoidSdk();
        if (!sdk) return;
        const exists = await sdk.userStateExists(walletPubkey);
        if (!exists || cancelled) return;
        const data = await sdk.syncWalletData(walletPubkey);
        if (cancelled || !data.userState) return;
        const localSave = loadGame();
        const merged: GameState = localSave ? { ...localSave } : createInitialState();
        if (!localSave || (localSave._rev === 0 && localSave.prestige === 0 && localSave.mintedNfts.length === 0)) {
          merged.prestige = data.userState.prestigeCount;
          merged.mintedNfts = data.mintedNfts;
          merged.tokens = data.tokens;
          merged.xntDevFeePaid = data.userState.hasMintPass;
          if (data.userState.hasMintPass) merged.gameStarted = true;
          const counts: Record<number, number> = {};
          for (const nft of data.mintedNfts) counts[nft.prestige] = (counts[nft.prestige] || 0) + 1;
          merged.mintCounts = counts;
        }
        if (!cancelled) dispatch({ type: "HYDRATE", saved: merged });
      } catch (err) {
        if (!cancelled) console.warn("Chain sync skipped:", err);
      }
    })();
    return () => { cancelled = true; };
  }, [walletPubkey]);

  // ── Orb flash ref for desktop view ──
  const orbRef = useRef<HTMLDivElement>(null);

  // ── Tap handler ──
  // ── Tap handler ──
  const [orbFlash, setOrbFlash] = React.useState<number>(0);
  const handleTap = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    dispatch({ type: "TAP", now: Date.now() });
    spawnFloat(`+${getNexMultAt(state.prestige) * 1000} NEX`, "#00ff88");
    setOrbFlash(1);
    setTimeout(() => setOrbFlash(0), 300);
  }, [state.prestige, spawnFloat]);

  // ── Effect handler for Crown Burst ──
  const effectsRef = useRef<HTMLDivElement>(null);

  // ── Pay 0.01 XN dev fee ──
  const payXntFee = useCallback(async () => {
    if (!walletPubkey || !sendTransaction || !connection) {
      spawnFloat("⚠️ Connect X1 Wallet first", "#00ccff");
      return;
    }
    try {
      setXntFeeLoading(true);
      const sdk = getVoidSdk();
      if (!sdk) { spawnFloat("⚠️ SDK not ready", "#ef4444"); return; }
      const signature = await sdk.payDevFee(walletPubkey);
      spawnFloat(`💰 0.01 XN Dev Fee Paid! TX: ${signature.slice(0, 8)}...`, GOLD);
      dispatch({ type: "PAY_DEV_FEE" });
    } catch (err: any) {
      console.error("XNT fee tx failed:", err);
      spawnFloat(err?.message?.includes("UserRejected") ? "🚫 Transaction cancelled" : "❌ Fee failed — insufficient XN balance", "#ef4444");
    } finally {
      setXntFeeLoading(false);
    }
  }, [walletPubkey, sendTransaction, connection]);

  // ── Prestige ──
  const handlePrestige = useCallback(async () => {
    if (state.prestige >= 100) return;
    const cost = getPrestigeCostAt(state.prestige);
    if (state.nex < cost) { spawnFloat(`❌ Need ${cost.toLocaleString()} NEX to prestige`, "#ef4444"); return; }
    if (isDemo) {
      dispatch({ type: "PRESTIGE" });
      spawnFloat(`🔄 Prestiged! → P${state.prestige + 1}`, GOLD);
      return;
    }
    if (!walletPubkey || !sendTransaction || !connection) {
      spawnFloat("⚠️ Connect X1 Wallet to prestige", "#00ccff");
      return;
    }
    try {
      setXntFeeLoading(true);
      const sdk = getVoidSdk();
      if (!sdk) { spawnFloat("⚠️ SDK not ready", "#ef4444"); return; }
      const signature = await sdk.prestige(walletPubkey);
      spawnFloat(`🔄 Prestiged! → P${state.prestige + 1} (0.01 XN)`, GOLD);
      dispatch({ type: "PRESTIGE" });
    } catch (err: any) {
      console.error("Prestige tx failed:", err);
      spawnFloat(err?.message?.includes("UserRejected") ? "🚫 Transaction cancelled" : "❌ Prestige failed — insufficient XN or transaction rejected", "#ef4444");
    } finally {
      setXntFeeLoading(false);
    }
  }, [state.prestige, state.nex, isDemo, walletPubkey, sendTransaction, connection]);

  // ── Mint iNFT ──
  const handleMint = useCallback(async () => {
    if (state.prestige < 1) return;
    const maxMints = Math.max(1, 100 - state.prestige);
    const currentCount = state.mintCounts[state.prestige] || 0;
    if (currentCount >= maxMints) return;
    if (state.nex < 5000) { spawnFloat("❌ Need 5,000 NEX to mint", "#ef4444"); return; }
    const seed = Math.floor(Math.random() * 1_000_000);
    if (isDemo) {
      dispatch({ type: "MINT", seed, mintAddress: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` });
      spawnFloat(`🎨 Minted P${state.prestige} iNFT! (-5,000 NEX)`, ACCENT);
      return;
    }
    try {
      const sdk = getVoidSdk();
      if (!sdk || !walletPubkey) { spawnFloat("⚠️ SDK not ready", "#ef4444"); return; }
      const { signature, mintAddress } = await sdk.mintInft(walletPubkey);
      dispatch({ type: "MINT", seed, mintAddress: mintAddress.toBase58() });
      spawnFloat(`🎨 Minted P${state.prestige} iNFT! TX: ${signature.slice(0, 8)}...`, ACCENT);
    } catch (err: any) {
      console.error("Mint failed:", err);
      spawnFloat("❌ Mint failed — check gas balance", "#ef4444");
    }
  }, [state.prestige, state.mintCounts, state.nex, walletPubkey, isDemo]);

  // ── Burn iNFT ──
  const handleBurn = useCallback((prestigeLvl: number, seed: number) => {
    setTimeout(() => spawnFloat(`🔥 Burned!`, GOLD), 100);
  }, []);

  const handleBurnComplete = useCallback((prestigeLvl: number, seed: number, ticker: string) => {
    dispatch({ type: "BURN_NFT", prestigeLvl, seed });
    spawnFloat(`🔥 Burned! +1 ${ticker}`, GOLD);
  }, []);

  const handleBurnClose = useCallback(() => {}, []);

  // ── Burn animation state ──
  const [burning, setBurning] = React.useState<{ x: number; y: number } | null>(null);

  const handleBurnOne = useCallback(async (prestigeLvl: number, seed: number, originX?: number, originY?: number) => {
    // Fire burn animation
    const bx = originX ?? 50;
    const by = originY ?? 50;
    setBurning({ x: bx, y: by });
    // Dispatch after a beat to let animation play
    setTimeout(() => {
      dispatch({ type: "BURN_NFT", prestigeLvl, seed });
      spawnFloat(`🔥 Burned! +${PRESTIGE_TICKERS[prestigeLvl - 1] || "TOKEN"}`, GOLD);
    }, 400);
    // Clear animation
    setTimeout(() => setBurning(null), 800);
  }, []);

  // ── Forge 3→1 ──
  const handleForge = useCallback(() => {
    // Quick pre-check to give feedback
    const counts: Record<number, number> = {};
    for (const nft of state.mintedNfts) counts[nft.prestige] = (counts[nft.prestige] || 0) + 1;
    const forgeable = Object.values(counts).some(c => c >= 3);
    if (!forgeable) {
      spawnFloat("⚠️ Need 3 same-tier iNFTs to forge", "#ff8800");
      return;
    }
    dispatch({ type: "FORGE" });
    spawnFloat("🔨 Forging 3 iNFTs into 1!", ACCENT);
  }, [state.mintedNfts]);


  // ── Add Metaplex metadata to an iNFT (for wallet display) ──
  const handleAddMetadata = useCallback(async (lvl: number, seed: number, mintAddress: string) => {
    const sdk = getVoidSdk();
    if (!sdk) { spawnFloat("⚠️ Connect wallet first", "#00ccff"); return; }
    try {
      const sig = await sdk.addMetadataToInft(new PublicKey(mintAddress), lvl, seed);
      spawnFloat(`✨ iNFT metadata added! TX: ${sig.slice(0, 8)}...`, ACCENT);
    } catch (err: any) {
      console.error("Add metadata failed:", err);
      const msg = err?.message?.includes("already in use")
        ? "✅ Metadata already exists"
        : "❌ Failed to add metadata";
      spawnFloat(msg, msg.startsWith("✅") ? GOLD : "#ef4444");
    }
  }, []);

  const handleProvideLp = useCallback((prestige: number) => {
    dispatch({ type: "PROVIDE_LP", prestige });
    spawnFloat(`🌊 LP provided for P${prestige}!`, '#44ddff');
  }, []);

  // ── Derived values ──
  const nexMult = getNexMultAt(state.prestige);
  const prestigeCost = getPrestigeCostAt(state.prestige);
  const tapsPerPrestige = getTapsPerPrestige(state.prestige);
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
              <img src="/nex-logo.jpg" alt="NEX" className="h-12 w-auto rounded-lg" />
              </div>
            </div>

            <h1 className="text-3xl font-bold" style={{ color: '#fff' }}>Prestige Protocol</h1>
            <p className="text-sm" style={{ color: "#888899" }}>
              The deflationary inverse of XEN. Tap. Prestige. Mint. Burn. Forge.
              Ascend through all 100 prestige tiers on X1.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 justify-center text-[11px]" style={{ color: "#888899" }}>
                <span>👆 Tap for NEX</span>
                <span>🔄 Prestige 100 tiers</span>
                <span>🎨 Mint 10 iNFTs/tier</span>
              </div>
              <div className="flex items-center gap-3 justify-center text-[11px]" style={{ color: "#888899" }}>
                <span>🔥 Burn for tokens</span>
                <span>🔨 Forge 3→1</span>
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
              All 100 prestige tiers conquered. Your NEX legacy is sealed.
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
              nexMult={nexMult} prestigeCost={prestigeCost}
              nextMilestone={nextMilestone} tapsPerPrestige={tapsPerPrestige}
              orbRef={orbRef} effectsRef={effectsRef} orbFlash={orbFlash}
              bottomTabs={BOTTOM_TABS}
              marketplaceListings={marketplaceListings}
              onListNft={onListNft}
              onBuyNft={onBuyNft}
              onCancelListing={onCancelListing}
              handleProvideLp={handleProvideLp}

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
              nexMult={nexMult} prestigeCost={prestigeCost}
              nextMilestone={nextMilestone} tapsPerPrestige={tapsPerPrestige}
              orbRef={orbRef} effectsRef={effectsRef} orbFlash={orbFlash}
              bottomTabs={BOTTOM_TABS}
              marketplaceListings={marketplaceListings}
              onListNft={onListNft}
              onBuyNft={onBuyNft}
              onCancelListing={onCancelListing}
              handleProvideLp={handleProvideLp}
            />
          )}
        </>
      )}
      {/* Legal Disclaimer Footer */}
      <footer className="w-full border-t border-white/5 mt-8 pt-6 pb-8 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[10px] leading-relaxed text-white/30">
            <strong className="text-white/40">⚠ DISCLAIMER:</strong> Prestige Protocol is an experimental on-chain game deployed on X1 Blockchain. 
            This is not a financial product, investment contract, or security. NEX tokens have no inherent monetary value 
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