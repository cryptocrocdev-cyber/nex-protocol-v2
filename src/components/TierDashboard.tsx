"use client";
import React from "react";
import { BN } from "@coral-xyz/anchor";
import {
  TOKEN_NAMES, TOKEN_COLORS, TIER_NAMES, TIER_COLORS, MAX_TIERS,
  getTierCount, getTokenTotal, getHighestTier, canUpgrade, hasAllTokens,
  formatNex, dynamicCost, LAMPORTS_PER_XNT,
} from "@/lib/voidTypes";

interface TierDashboardProps {
  tierCounts: number[];
  totalNexSupply: BN;
  activeMask: number;
  onMintBronze: (tokenIdx: number) => void;
  onUpgradeTier: (tokenIdx: number) => void;
  mintLoading: number | null;
  upgradeLoading: number | null;
}

const TIER_EFFECTS: string[][] = [
  ["Leaderboard", "Featured board", "Highlight", "Eternal frame"],
  ["Basic stats", "Charts", "Historical", "Predictive"],
  ["Batch burn pass", "+5% burn", "+10% burn", "+20% burn"],
  ["+2% cap", "+5%", "+10%", "+20%"],
  ["1.3× yield", "2.0×", "3.0×", "5.0×"],
  ["5% vault", "8%", "12%", "20%"],
  ["-20% mint", "-35%", "-50%", "-70%"],
  ["1.15× amp", "1.5×", "2.0×", "3.0×"],
  ["1.3× mult", "2.0×", "3.0×", "5.0×"],
];

export default function TierDashboard({
  tierCounts, totalNexSupply, activeMask,
  onMintBronze, onUpgradeTier, mintLoading, upgradeLoading,
}: TierDashboardProps) {
  const cost = dynamicCost(totalNexSupply);

  return (
    <div className="space-y-3">
      <h3 className="font-bold text-[#0066ff] mb-2 text-center">🏆 Soulbound Token Tiers</h3>
      <p className="text-xs text-gray-400 text-center mb-4">
        Mint Bronze, upgrade 3× same tier + NEX → next. Soulbound — never tradeable.
      </p>

      {TOKEN_NAMES.map((name, idx) => {
        const total = getTokenTotal(tierCounts, idx);
        const highest = getHighestTier(tierCounts, idx);
        const upgradeFrom = canUpgrade(tierCounts, idx);
        const hasToken = total > 0;
        const isActive = (activeMask & (1 << idx)) !== 0;
        const color = TOKEN_COLORS[idx];

        return (
          <div
            key={idx}
            className={`p-4 rounded-xl border transition-all ${
              isActive ? "border-opacity-50" : "border-opacity-10"
            }`}
            style={{
              borderColor: isActive ? `${color}88` : `${color}22`,
              background: `linear-gradient(135deg, ${color}08, ${color}03)`,
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <span className="font-bold text-sm" style={{ color }}>{name}</span>
                {highest >= 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${TIER_COLORS[highest]}22`,
                      color: TIER_COLORS[highest],
                      border: `1px solid ${TIER_COLORS[highest]}44`,
                    }}>
                    {TIER_NAMES[highest]}
                  </span>
                )}
                {!hasToken && (
                  <span className="text-[10px] text-gray-500">Not minted</span>
                )}
              </div>
              <span className="text-xs font-mono text-gray-400">{total} total</span>
            </div>

            {/* Tier slots */}
            <div className="flex gap-2 mb-2">
              {TIER_NAMES.map((tierName, t) => {
                const count = getTierCount(tierCounts, idx, t);
                const canUp = count >= 3 && t < MAX_TIERS - 1;
                return (
                  <div
                    key={t}
                    className="flex-1 p-2 rounded-lg text-center"
                    style={{
                      backgroundColor: `${TIER_COLORS[t]}08`,
                      border: count > 0 ? `1px solid ${TIER_COLORS[t]}44` : `1px solid rgba(255,255,255,0.05)`,
                    }}
                  >
                    <p className="text-[9px] font-bold"
                      style={{ color: count > 0 ? TIER_COLORS[t] : "#555" }}>
                      {tierName}
                    </p>
                    <p className="text-xs font-mono mt-0.5"
                      style={{ color: count > 0 ? TIER_COLORS[t] : "#444" }}>
                      {count > 0 ? `${count}×` : "—"}
                    </p>
                    <p className="text-[8px] text-gray-500 mt-0.5">{TIER_EFFECTS[idx][t]}</p>
                    {canUp && (
                      <button
                        onClick={() => onUpgradeTier(idx)}
                        disabled={upgradeLoading === idx}
                        className="mt-1 w-full py-0.5 rounded text-[9px] font-bold bg-gradient-to-r from-[#0066ff] to-orange-500 text-black disabled:opacity-30"
                      >
                        {upgradeLoading === idx ? "..." : "⬆ Upgrade"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Mint Bronze button */}
            {!hasToken && (
              <div className="flex justify-center">
                <button
                  onClick={() => onMintBronze(idx)}
                  disabled={mintLoading === idx}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-[#0066ff] to-[#00ccff] text-white disabled:opacity-30"
                >
                  {mintLoading === idx ? "..." : `🥉 Mint Bronze (${(cost / LAMPORTS_PER_XNT).toFixed(2)} NEX)`}
                </button>
              </div>
            )}

            {/* Has token — show mint more button */}
            {hasToken && highest < 3 && (
              <div className="flex justify-center mt-1">
                <button
                  onClick={() => onMintBronze(idx)}
                  disabled={mintLoading === idx}
                  className="px-3 py-1 text-[10px] rounded-lg bg-black border border-[#0066ff]/30 text-gray-400 hover:border-[#0066ff] hover:text-white disabled:opacity-30"
                >
                  {mintLoading === idx ? "..." : `+ More Bronze (${(cost / LAMPORTS_PER_XNT).toFixed(2)} NEX)`}
                </button>
              </div>
            )}

            {/* Diamond — maxed out */}
            {hasToken && highest === 3 && (
              <p className="text-[10px] text-center text-[#b9f2ff] mt-1">💎 DIAMOND — All tiers maxed</p>
            )}
          </div>
        );
      })}

      {/* PRIME check */}
      {hasAllTokens(tierCounts) && (
        <div className="p-3 rounded-xl border border-[#0066ff]/30 bg-[#0066ff]/5 text-center">
          <p className="text-sm text-[#0066ff] font-bold">🎯 All 9 tokens held — PRIME eligible!</p>
        </div>
      )}
    </div>
  );
}