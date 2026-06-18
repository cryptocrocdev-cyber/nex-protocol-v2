"use client";
import React, { useReducer, useCallback, useEffect, useRef, useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PublicKey } from "@solana/web3.js";
import { gameReducer, createInitialState, saveGame, loadGame, clearSave } from "@/lib/gameState";
import type { GameState } from "@/lib/gameState";
import {
  getBurnCost,
  isTierExhausted,
  getSupplyRemaining,
  getSupplyPercent,
  getSupplyPerTier,
  getPrestigeLabel,
  getPrestigeColor,
  getNextMilestone,
  MAX_PRESTIGE,
  MILESTONES,
} from "@/lib/gameEngine";
import {
  MobileLayout,
  DesktopLayout,
} from "@/components/ViewLayouts";
import { useNexProgram, getPrestigeMintPDA, getUserStatePDA, getAssociatedTokenAddress } from "@/lib/useNexProgram";
import { NETWORK } from "@/lib/network";

const BLUE = "#0066ff";
const ACCENT = "#a78bfa";
const GOLD = "#fbbf24";

const BOTTOM_TABS: { key: string; label: string; title: string }[] = [
  { key: "tap", label: "👆", title: "Tap" },
  { key: "prestige", label: "🏛️", title: "Prestige" },
  { key: "tokens", label: "🪙", title: "Tokens" },
  { key: "gallery", label: "📊", title: "Gallery" },
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
  const { publicKey: walletPubkey, connecting: walletConnecting, disconnect: walletDisconnect, connected } = useWallet();
  const { connection } = useConnection();
  const walletAddress = walletPubkey?.toBase58() ?? null;
  const shortAddr = walletAddress ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}` : null;

  // ── On-chain program ──
  const { program, initializing, initUser, tap: onChainTap, prestige: onChainPrestige } = useNexProgram();
  const [txPending, setTxPending] = useState(false);
  const [userTokens, setUserTokens] = useState<{ prestige: number; mint: string; balance: number }[]>([]);

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

  // ── Floating text effects ──
  const [floats, setFloats] = React.useState<Array<{ id: number; text: string; color: string; x: number; y: number }>>([]);
  const floatIdRef = useRef(0);
  const spawnFloat = useCallback((text: string, color: string) => {
    const id = ++floatIdRef.current;
    setFloats(prev => [...prev, { id, text, color, x: 20 + Math.random() * 60, y: 20 + Math.random() * 40 }]);
    setTimeout(() => setFloats(prev => prev.filter(f => f.id !== id)), 1200);
  }, []);

  // ── Start on-chain game ──
  const handleStartOnChain = useCallback(async () => {
    if (!walletPubkey || !initUser) {
      spawnFloat("❌ Wallet not connected or program not ready", "#ef4444");
      return;
    }
    setTxPending(true);
    try {
      await initUser();
      dispatch({ type: "START_DEMO" });
      spawnFloat("✅ On-chain game started!", "#22c55e");
    } catch (e: any) {
      console.error("Start on-chain error:", e);
      const msg = e.message || "unknown error";
      if (msg.includes("0x1") || msg.includes("insufficient") || msg.includes("0 lamports")) {
        spawnFloat("❌ Need test XN for gas — faucet: xolana.xen.network", "#ef4444");
      } else if (msg.includes("already in use") || msg.includes("UserAlreadyInitialized")) {
        dispatch({ type: "START_DEMO" });
        spawnFloat("✅ Game resumed!", "#22c55e");
      } else {
        spawnFloat("❌ " + msg.slice(0, 70), "#ef4444");
      }
    } finally {
      setTxPending(false);
    }
  }, [walletPubkey, initUser, spawnFloat]);

  // ── Hydrate from localStorage ──
  useEffect(() => {
    const saved = loadGame();
    if (saved) dispatch({ type: "HYDRATE", saved });
  }, []);

  // ── Auto-save ──
  useEffect(() => {
    if (state._rev > 0 && !state.demoMode) saveGame(state);
  }, [state, state._rev, state.demoMode]);

  // ── Orb flash ──
  const [orbFlash, setOrbFlash] = React.useState<number>(0);

  // ── Tap handler ──
  const lastTapRef = useRef(0);
  const handleTap = useCallback(async (e: React.MouseEvent<HTMLButtonElement>) => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) return;
    lastTapRef.current = now;

    if (isTierExhausted(state.supplyMinted, state.prestige)) {
      spawnFloat(`❌ P${state.prestige} supply exhausted!`, "#ef4444");
      return;
    }

    if (connected && onChainTap && !isDemo) {
      // On-chain tap
      setTxPending(true);
      try {
        await onChainTap();
        dispatch({ type: "TAP" });
        spawnFloat(`+1 P${state.prestige} Token`, getPrestigeColor(state.prestige));
        setOrbFlash(v => v + 1);
      } catch (e: any) {
        spawnFloat(`❌ ${e.message?.slice(0, 40) || "TX failed"}`, "#ef4444");
      } finally {
        setTxPending(false);
      }
    } else {
      // Demo tap
      dispatch({ type: "TAP" });
      spawnFloat(`+1 P${state.prestige} Token`, getPrestigeColor(state.prestige));
      setOrbFlash(v => v + 1);
    }
  }, [state.prestige, state.supplyMinted, spawnFloat, connected, onChainTap, isDemo]);

  // ── Prestige handler ──
  const handlePrestige = useCallback(async () => {
    if (state.prestige >= MAX_PRESTIGE) return;
    const cost = getBurnCost(state.prestige);
    if (state.tokens < cost) {
      spawnFloat(`❌ Need ${cost} tokens to prestige (have ${state.tokens})`, "#ef4444");
      return;
    }

    if (connected && onChainPrestige && !isDemo) {
      // On-chain prestige → mints SPL token to wallet
      setTxPending(true);
      try {
        const nextP = state.prestige + 1;
        // prestige() auto-creates the mint + ATA + mints in one TX
        await onChainPrestige(state.prestige);
        dispatch({ type: "PRESTIGE" });
        spawnFloat(`🔄 Prestiged! → P${nextP} 🪙 SPL minted!`, GOLD);
        setOrbFlash(v => v + 1);
      } catch (e: any) {
        spawnFloat(`❌ ${e.message?.slice(0, 50) || "TX failed"}`, "#ef4444");
      } finally {
        setTxPending(false);
      }
    } else {
      // Demo prestige
      dispatch({ type: "PRESTIGE" });
      spawnFloat(`🔄 Prestiged! → P${state.prestige + 1}`, GOLD);
    }
  }, [state.prestige, state.tokens, spawnFloat, connected, onChainPrestige, isDemo]);

  // ── Fetch user's SPL token balances ──
  useEffect(() => {
    if (!walletPubkey || !connected) return;
    const fetchTokens = async () => {
      const tokens: { prestige: number; mint: string; balance: number }[] = [];
      // Check first 10 prestige levels for token balances
      for (let p = 1; p <= 10; p++) {
        try {
          const mintPda = getPrestigeMintPDA(p);
          const ata = getAssociatedTokenAddress(mintPda, walletPubkey);
          const info = await connection.getTokenAccountBalance(ata);
          if (info.value.uiAmount && info.value.uiAmount > 0) {
            tokens.push({ prestige: p, mint: mintPda.toBase58(), balance: info.value.uiAmount });
          }
        } catch {}
      }
      setUserTokens(tokens);
    };
    fetchTokens();
    const interval = setInterval(fetchTokens, 10000);
    return () => clearInterval(interval);
  }, [walletPubkey, connected, connection]);

  // ── Derived values ──
  const nextMilestone = getNextMilestone(state.prestige);
  const burnCost = state.prestige < MAX_PRESTIGE ? getBurnCost(state.prestige) : 0;
  const supplyRemaining = getSupplyRemaining(state.supplyMinted, state.prestige);
  const supplyPercent = getSupplyPercent(state.supplyMinted, state.prestige);
  const tierExhausted = isTierExhausted(state.supplyMinted, state.prestige);
  const prestigeLabel = getPrestigeLabel(state.prestige);
  const prestigeColor = getPrestigeColor(state.prestige);

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

      {/* ── LANDING SCREEN ── */}
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

            <h1 className="text-3xl font-bold" style={{ color: '#fff' }}>NEX Protocol V2</h1>
            <p className="text-sm" style={{ color: "#888899" }}>
              Pure tap/burn/prestige on X1 Mainnet. 1 tap = 1 token. Burn to ascend.
              Each prestige mints a unique SPL token to your wallet.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 justify-center text-[11px]" style={{ color: "#888899" }}>
                <span>👆 Tap for tokens</span>
                <span>🔥 Burn to prestige</span>
                <span>🪙 SPL tokens to wallet</span>
              </div>
            </div>

            <div className="pt-4 space-y-3">
              {/* Connect Wallet — Primary CTA */}
              {!connected ? (
                <div className="flex justify-center">
                  <WalletMultiButton />
                </div>
              ) : (
                <div
                  className="rounded-xl border p-4 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all"
                  style={{ background: "#0066ff11", borderColor: "#0066ff44" }}
                  onClick={handleStartOnChain}
                >
                  <p className="text-sm font-medium" style={{ color: BLUE }}>
                    {txPending ? "⏳ Initializing..." : "🚀 Start On-Chain Game"}
                  </p>
                  <p className="text-[10px] mt-1" style={{ color: "#888899cc" }}>
                    Wallet: {shortAddr} · Each prestige mints an SPL token to your wallet
                  </p>
                </div>
              )}

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
              <span className="text-5xl">🏆</span>
            </div>
            <h2 className="text-2xl font-bold" style={{ color: GOLD }}>LEGENDARY — P100!</h2>
            <p className="text-sm" style={{ color: "#888899" }}>
              You conquered all 100 prestige tiers. P100 — the ultimate SPL token.
            </p>
            <div className="text-xs" style={{ color: "#888899" }}>
              <p>Total tokens minted: {state.totalMinted.toLocaleString()}</p>
              <p>Total tokens burned: {state.totalBurned.toLocaleString()}</p>
            </div>
            <button
              onClick={handleResetGame}
              className="text-xs px-6 py-3 rounded-full transition-all border"
              style={{
                background: "#fbbf2411",
                borderColor: "#fbbf2433",
                color: GOLD,
              }}
            >
              🔄 Restart Game
            </button>
          </div>
        </div>
      )}

      {/* ── GAME VIEW ── */}
      {hasStarted && !isGameComplete && (
        <>
          <ParticleBg />

          {/* Wallet bar */}
          <div className="fixed top-3 left-3 right-3 z-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {connected && (
                <div className="text-[10px] font-mono px-2 py-1 rounded-full bg-white/5 border border-white/10 text-white/50">
                  {shortAddr}
                </div>
              )}
              {isDemo && (
                <div className="text-[10px] font-mono px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  DEMO
                </div>
              )}
              {connected && !isDemo && (
                <div className="text-[10px] font-mono px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400">
                  ON-CHAIN
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {userTokens.length > 0 && (
                <div className="text-[10px] font-mono px-2 py-1 rounded-full bg-[#0066ff]/10 border border-[#0066ff]/20 text-[#0066ff]">
                  🪙 {userTokens.length} tokens
                </div>
              )}
              <button
                onClick={toggleViewMode}
                className="text-[9px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/20 transition-all"
              >
                {viewMode === "mobile" ? "🖥 Desktop" : "📱 Mobile"}
              </button>
            </div>
          </div>

          {viewMode === "mobile" ? (
            <MobileLayout
              state={state} tab={tab} setTab={setTab}
              walletAddress={walletAddress} walletConnecting={walletConnecting}
              shortAddr={shortAddr} isDemo={isDemo}
              walletDisconnect={walletDisconnect}
              handleTap={handleTap} handlePrestige={handlePrestige}
              orbRef={orbRef} effectsRef={effectsRef} orbFlash={orbFlash}
              bottomTabs={BOTTOM_TABS}
              burnCost={burnCost}
              supplyRemaining={supplyRemaining}
              supplyPercent={supplyPercent}
              tierExhausted={tierExhausted}
              prestigeLabel={prestigeLabel}
              prestigeColor={prestigeColor}
              txPending={txPending}
              userTokens={userTokens}
            />
          ) : (
            <DesktopLayout
              state={state} tab={tab} setTab={setTab}
              walletAddress={walletAddress} walletConnecting={walletConnecting}
              shortAddr={shortAddr} isDemo={isDemo}
              walletDisconnect={walletDisconnect}
              handleTap={handleTap} handlePrestige={handlePrestige}
              orbRef={orbRef} effectsRef={effectsRef} orbFlash={orbFlash}
              bottomTabs={BOTTOM_TABS}
              burnCost={burnCost}
              supplyRemaining={supplyRemaining}
              supplyPercent={supplyPercent}
              tierExhausted={tierExhausted}
              prestigeLabel={prestigeLabel}
              prestigeColor={prestigeColor}
              txPending={txPending}
              userTokens={userTokens}
            />
          )}
        </>
      )}
      {/* Legal Disclaimer Footer */}
      <footer className="w-full border-t border-white/5 mt-8 pt-6 pb-8 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[10px] leading-relaxed text-white/30">
            <strong className="text-white/40">⚠ DISCLAIMER:</strong> NEX Protocol V2 is an experimental on-chain game. 
            This is not a financial product, investment contract, or security. NEX tokens have no inherent monetary value 
            and are purely a game mechanic. There is no promise, guarantee, or expectation of profit. The protocol is 
            provided "as is" without any warranty. Participation is entirely at your own risk. Smart contract risk, blockchain network risk, and 
            potential total loss of funds apply. By using this site you agree to hold the developers, deployers, and 
            all associated parties harmless from any losses, damages, or claims. Do not play if this is illegal in 
            your jurisdiction. Not available to US persons or residents where prohibited.
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
