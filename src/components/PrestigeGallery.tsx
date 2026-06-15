"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { fetchPrestigeMedals, fetchAllPrestigeSupplies, getVoidProgram, NETWORK } from "@/lib/void";
import { getPrestigeBadgePath, PRESTIGE_NAMES, PRESTIGE_TICKERS, PRESTIGE_COLORS, PRESTIGE_SYMBOLS, getPrestigeThreshold } from "@/lib/void";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import PrestigeDetailModal, { PrestigeTokenInfo } from "./PrestigeDetailModal";

interface PrestigeGalleryProps {
  program?: Program | null;
  prestigeCount?: number;
}

const TIERS = [
  { max: 10, name: "Initiate", color: "#0066ff" },
  { max: 25, name: "Adept", color: "#00ccff" },
  { max: 50, name: "Master", color: "#0066ff" },
  { max: 75, name: "Grandmaster", color: "#ff6b6b" },
  { max: Infinity, name: "NEXUS", color: "#ffffff" },
];

function getTierName(count: number): { name: string; color: string } {
  for (const t of TIERS) {
    if (count <= t.max) return t;
  }
  return TIERS[TIERS.length - 1];
}

function getNeonColor(color: string): string {
  // Ensure good visibility for dark backgrounds
  return color;
}

function extractSeed(visualSeed: number[] | undefined): number {
  if (!visualSeed || visualSeed.length < 4) return 0;
  return visualSeed.slice(0, 4).reduce((s, b) => s * 256 + b, 0);
}

function getMedalAttributes(medal: any, seed: number) {
  const num = medal.prestigeNumber?.toNumber() ?? 0;
  const tier = getTierName(num);
  const absorbed = medal.absorbedCount?.toNumber() ?? 0;
  const ts = medal.timestamp?.toNumber() ?? 0;
  const date = ts > 0 ? new Date(ts * 1000).toLocaleDateString() : "—";
  return { num, tier, absorbed, date };
}

export default function PrestigeGallery({ program, prestigeCount = 0 }: PrestigeGalleryProps) {
  const wallet = useWallet();
  const { connection } = useConnection();
  const [medals, setMedals] = useState<any[]>([]);
  const [supplies, setSupplies] = useState<Map<number, { totalMinted: number; totalBurned: number }>>(new Map());
  const [loading, setLoading] = useState(false);
  const [selectedToken, setSelectedToken] = useState<PrestigeTokenInfo | null>(null);

  // Build a set of owned prestige levels for quick lookup
  const ownedLevels = useMemo(() => {
    const set = new Set<number>();
    for (const medal of medals) {
      const num = medal.prestigeNumber?.toNumber() ?? 0;
      if (num > 0) set.add(num);
    }
    return set;
  }, [medals]);

  // Build owned medal data map (level -> medal data)
  const medalDataMap = useMemo(() => {
    const map = new Map<number, any>();
    for (const medal of medals) {
      const num = medal.prestigeNumber?.toNumber() ?? 0;
      if (num > 0) map.set(num, medal);
    }
    return map;
  }, [medals]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const promises: Promise<any>[] = [];

    // Fetch supplies raw — no Program object needed anymore
    promises.push(fetchAllPrestigeSupplies(connection, 100));

    // Fetch user medals only if wallet connected (needs Program object)
    const prog = program || (wallet.publicKey ? (() => {
      try {
        const dummyWallet = {
          publicKey: new PublicKey("11111111111111111111111111111111"),
          signTransaction: async (tx: any) => tx,
          signAllTransactions: async (txs: any[]) => txs,
        };
        const provider = new AnchorProvider(
          connection,
          dummyWallet as any,
          { commitment: "confirmed", skipPreflight: true }
        );
        return getVoidProgram(provider);
      } catch { return null; }
    })() : null);

    if (prog && wallet.publicKey && prestigeCount > 0) {
      promises.push(fetchPrestigeMedals(connection, wallet.publicKey, prestigeCount, prog));
    } else {
      promises.push(Promise.resolve([]));
    }

    Promise.all(promises)
      .then(([s, m]) => {
        if (!cancelled) {
          setSupplies(s);
          setMedals(m);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [connection, wallet.publicKey, program, prestigeCount]);

  // Build full 100-token array
  const allTokens: PrestigeTokenInfo[] = useMemo(() => {
    return Array.from({ length: 100 }, (_, i) => {
      const level = i + 1;
      const owned = ownedLevels.has(level);
      const medal = medalDataMap.get(level);
      const supply = supplies.get(level);

      const token: PrestigeTokenInfo = {
        level,
        name: PRESTIGE_NAMES[i] || `Level ${level}`,
        ticker: PRESTIGE_TICKERS[i] || "????",
        color: PRESTIGE_COLORS[i] || "#0066ff",
        symbol: PRESTIGE_SYMBOLS[i] || "Unknown",
        owned,
        totalMinted: supply?.totalMinted ?? 0,
        totalBurned: supply?.totalBurned ?? 0,
        prestigeNumber: level,
        absorbedCount: medal?.absorbedCount?.toNumber() ?? 0,
        timestamp: medal?.timestamp?.toNumber() ?? 0,
        burned: medal?.burned ?? false,
      };
      return token;
    });
  }, [ownedLevels, medalDataMap, supplies]);

  const handleTokenClick = useCallback((token: PrestigeTokenInfo) => {
    setSelectedToken(token);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedToken(null);
  }, []);

  return (
    <div>
      {/* Detail Modal */}
      {selectedToken && (
        <PrestigeDetailModal token={selectedToken} onClose={handleCloseModal} />
      )}

      {/* Loading state */}
      {loading && (
        <div className="p-6 rounded-2xl border border-[#0066ff]/20 bg-[#0066ff]/5 text-center mb-4">
          <p className="text-2xl mb-2 animate-pulse">✦</p>
          <p className="text-gray-400 text-sm">Fetching on-chain iNFT supply data...</p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-[#0066ff]">
          🎨 Prestige iNFT Gallery
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500">
            {ownedLevels.size} / 100 owned
          </span>
          <p className="text-[10px] text-gray-500">1-of-1 • generative • on-chain</p>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="p-6 rounded-2xl border border-[#0066ff]/20 bg-[#0066ff]/5 text-center mb-4">
          <p className="text-2xl mb-2 animate-pulse">✦</p>
          <p className="text-gray-400 text-sm">Loading iNFT gallery...</p>
        </div>
      )}

      {/* Grid: ALL 100 tokens */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-3">
        {allTokens.map((token) => {
          const tier = getTierName(token.level);
          const paddedNum = String(token.level).padStart(3, "0");
          const badgePath = getPrestigeBadgePath(token.level);

          return (
            <div
              key={token.level}
              onClick={() => handleTokenClick(token)}
              className={`group relative rounded-xl overflow-hidden transition-all duration-300 cursor-pointer ${
                token.owned
                  ? "hover:scale-[1.04] hover:shadow-[0_0_40px_rgba(0,255,100,0.15)]"
                  : "hover:scale-[1.03] hover:shadow-[0_0_30px_rgba(255,255,255,0.05)]"
              }`}
              style={{
                border: token.owned
                  ? `1.5px solid ${token.color}55`
                  : "1px solid rgba(255,255,255,0.06)",
                background: token.owned
                  ? "rgba(0,0,0,0.7)"
                  : "rgba(0,0,0,0.4)",
                opacity: token.owned ? 1 : 0.55,
                backdropFilter: "blur(4px)",
                boxShadow: token.owned
                  ? `0 0 15px ${token.color}15, inset 0 0 30px ${token.color}08`
                  : "none",
              }}
            >
              {/* Badge image */}
              <div className="w-full aspect-square bg-[#000005]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={badgePath}
                  alt={`Prestige #${paddedNum} badge`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              </div>

              {/* Info overlay */}
              <div className="p-2.5 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <h4
                      className="text-xs font-bold truncate"
                      style={{ color: token.color }}
                    >
                      #{paddedNum}
                    </h4>
                    <p className="text-[9px] text-gray-500 truncate">${token.ticker}</p>
                  </div>
                  <span
                    className="text-[8px] font-mono px-1.5 py-0.5 rounded-full whitespace-nowrap"
                    style={{
                      backgroundColor: `${tier.color}15`,
                      color: tier.color,
                      border: `1px solid ${tier.color}25`,
                    }}
                  >
                    {tier.name}
                  </span>
                </div>

                {/* Minted/burned stats */}
                <div className="flex items-center gap-2 text-[9px] text-gray-500">
                  <span>🖨️ {token.totalMinted}</span>
                  <span>🔥 {token.totalBurned}</span>
                </div>

                {/* Owned badge */}
                {token.owned && (
                  <div
                    className="text-[9px] font-bold text-center py-0.5 rounded"
                    style={{
                      background: "rgba(0,255,100,0.1)",
                      color: "#44ff88",
                      border: "1px solid rgba(0,255,100,0.2)",
                    }}
                  >
                    ✅ OWNED
                  </div>
                )}

                {/* Hover hint */}
                <div className="text-[8px] text-center text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  Click to view details
                </div>
              </div>

              {/* Owned glow ring */}
              {token.owned && (
                <div
                  className="absolute inset-0 rounded-xl pointer-events-none"
                  style={{
                    boxShadow: `inset 0 0 40px ${token.color}10`,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}