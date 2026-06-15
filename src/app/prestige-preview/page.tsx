"use client";
import React from "react";
import {
  PRESTIGE_NAMES,
  PRESTIGE_TICKERS,
  PRESTIGE_COLORS,
  PRESTIGE_SYMBOLS,
  getPrestigeThreshold,
} from "@/lib/void";

const SEED = 42;

// Updated tier system for 100 tokens
const TIER_DEFS = [
  { max: 10, name: "Initiate" },
  { max: 30, name: "Adept" },
  { max: 50, name: "Master" },
  { max: 80, name: "Grandmaster" },
  { max: 100, name: "NEXUS" },
];

function getTier(level: number): string {
  for (const t of TIER_DEFS) {
    if (level <= t.max) return t.name;
  }
  return "NEXUS";
}

function getRarity(level: number): { name: string; color: string } {
  if (level <= 10) return { name: "Common", color: "#00ff88" };
  if (level <= 30) return { name: "Uncommon", color: "#4499ff" };
  if (level <= 50) return { name: "Rare", color: "#0066ff" };
  if (level <= 80) return { name: "Legendary", color: "#0066ff" };
  return { name: "Mythic", color: "#4488ff" };
}

function formatNex(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString();
}

function getBadgePath(index: number, ticker: string): string {
  const level = index + 1;
  const padded = level < 10 ? `0${level}` : `${level}`;
  return `/prestige-icons/${padded}-${ticker.toLowerCase()}.jpg`;
}

export default function PrestigePreviewPage() {
  const totalTokens = PRESTIGE_NAMES.length; // dynamic from data
  
  return (
    <div className="min-h-screen bg-[#05050a] text-white p-4 sm:p-8 relative overflow-x-hidden">
      {/* Background gradient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-[#00ddff]/5 blur-[120px]" />
        <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] rounded-full bg-[#bb44ff]/5 blur-[120px]" />
        <div className="absolute -bottom-40 left-1/3 w-[500px] h-[500px] rounded-full bg-[#4499ff]/5 blur-[120px]" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] rounded-full bg-[#4488ff]/5 blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* ─── HEADER ─── */}
        <div className="text-center mb-10">
          <div className="inline-block relative mb-4">
            <div className="absolute inset-0 bg-gradient-to-r from-[#0066ff]/20 via-[#00ccff]/20 to-[#4488ff]/20 blur-2xl rounded-full" />
            <h1 className="relative text-4xl sm:text-5xl font-black tracking-tight bg-gradient-to-r from-[#0066ff] via-[#00ccff] to-[#4488ff] bg-clip-text text-transparent">
              🏅 PRESTIGE iNFT COLLECTION
            </h1>
          </div>
          <p className="text-gray-500 text-sm max-w-xl mx-auto">
            {totalTokens} unique tokens across 10 tiers. Exponential difficulty. Verifiable on-chain scarcity.
            Each prestige level mints its own Token-2022 NFT forming its own community.
          </p>
          {/* Search/filter bar */}
          <div className="mt-6 flex items-center justify-center gap-4 flex-wrap">
            <div className="relative">
              <input
                type="text"
                placeholder="Search tokens..."
                className="w-64 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white/60 placeholder-gray-600 focus:outline-none focus:border-white/20 focus:text-white/90 transition-all"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {["All", "Common", "Uncommon", "Rare", "Legendary", "Mythic"].map((f) => (
                <button
                  key={f}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 hover:text-white transition-all"
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          {/* Tier info bar */}
          <div className="mt-4 flex items-center justify-center gap-3 text-[10px] text-gray-600 flex-wrap">
            <span className="text-green-400">● P1-P10 Initiate</span>
            <span className="text-yellow-400">● P11-P30 Adept</span>
            <span className="text-[#4499ff]">● P31-P50 Master</span>
            <span className="text-red-400">● P51-P80 Grandmaster</span>
            <span className="text-[#4488ff]">● P81-P100 NEXUS</span>
          </div>
        </div>

        {/* ─── PRESTIGE CARDS GRID ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-3">
          {Array.from({ length: totalTokens }, (_, i) => {
            const level = i + 1;
            const threshold = getPrestigeThreshold(level - 1);
            const color = PRESTIGE_COLORS[i];
            const rgb = hexToRgb(color);
            const tier = getTier(level);
            const rarity = getRarity(level);
            const numStr = level < 10 ? `0${level}` : `${level}`;
            const ticker = PRESTIGE_TICKERS[i];
            const name = PRESTIGE_NAMES[i];
            const symbol = PRESTIGE_SYMBOLS[i];

            return (
              <div
                key={level}
                className="group relative rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:z-10"
                style={{ boxShadow: `0 0 0 1px rgba(${rgb},0.08), 0 0 20px rgba(${rgb},0.03)` }}
              >
                {/* Glow overlay on hover */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-20"
                  style={{
                    background: `radial-gradient(ellipse at center, rgba(${rgb},0.12) 0%, transparent 70%)`,
                  }}
                />

                {/* ─── BADGE SECTION ─── */}
                <div
                  className="w-full aspect-square relative overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, #0a0e1a 0%, rgba(${rgb},0.06) 50%, #0a0e1a 100%)`,
                  }}
                >
                  {/* Tick icon */}
                  <div
                    className="absolute top-2 left-2 z-10 px-1.5 py-0.5 rounded text-[8px] font-bold tracking-widest"
                    style={{
                      color: color,
                      background: `rgba(${rgb},0.12)`,
                      border: `1px solid rgba(${rgb},0.25)`,
                    }}
                  >
                    ${ticker}
                  </div>

                  {/* Level badge top-right */}
                  <div
                    className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black"
                    style={{
                      background: `rgba(${rgb},0.12)`,
                      border: `1px solid rgba(${rgb},0.25)`,
                      color: color,
                    }}
                  >
                    {level}
                  </div>

                  {/* Real badge image */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getBadgePath(i, ticker)}
                    alt={`${name} prestige badge`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>

                {/* ─── INFO SECTION (glassmorphism) ─── */}
                <div
                  className="p-2.5 space-y-2 relative"
                  style={{
                    background: `linear-gradient(180deg, rgba(${rgb},0.02) 0%, rgba(5,5,10,0.95) 100%)`,
                    backdropFilter: "blur(8px)",
                  }}
                >
                  {/* Token name + prestige level */}
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <h3
                        className="text-xs font-black tracking-tight truncate"
                        style={{ color }}
                      >
                        {name}
                      </h3>
                      <p className="text-[8px] text-gray-500 font-mono truncate">
                        ${ticker} · {symbol}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="text-sm font-black font-mono" style={{ color }}>
                        {numStr}
                      </p>
                    </div>
                  </div>

                  {/* NEX Threshold bar */}
                  <div className="pt-0.5">
                    <div className="flex items-center justify-between text-[8px] mb-1">
                      <span className="text-gray-500">NEX</span>
                      <span className="font-bold font-mono" style={{ color }}>
                        {formatNex(threshold)}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.min(100, (level / 100) * 100)}%`,
                          background: `linear-gradient(90deg, ${color}40, ${color})`,
                          boxShadow: `0 0 6px ${color}40`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Rarity + Tier tags */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className="text-[7px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-widest"
                      style={{
                        color: rarity.color,
                        background: `rgba(${hexToRgb(rarity.color)},0.1)`,
                        border: `1px solid rgba(${hexToRgb(rarity.color)},0.2)`,
                      }}
                    >
                      {rarity.name}
                    </span>
                    <span
                      className="text-[7px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider"
                      style={{
                        color: color,
                        background: `rgba(${rgb},0.08)`,
                        border: `1px solid rgba(${rgb},0.15)`,
                      }}
                    >
                      {tier.toUpperCase()}
                    </span>
                  </div>

                  {/* Minimal metadata */}
                  <div className="grid grid-cols-2 gap-1 pt-1 border-t border-white/5">
                    <div className="p-1 rounded bg-white/[0.02] border border-white/[0.04]">
                      <p className="text-[6px] text-gray-600 uppercase tracking-widest">LVL</p>
                      <p className="text-[8px] font-bold font-mono text-white/70">{level}</p>
                    </div>
                    <div className="p-1 rounded bg-white/[0.02] border border-white/[0.04]">
                      <p className="text-[6px] text-gray-600 uppercase tracking-widest">TIER</p>
                      <p className="text-[8px] font-bold text-white/70 truncate">{tier}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ─── TIER SUMMARY TABLE ─── */}
        <div className="mt-12 p-6 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-sm">
          <h2 className="text-xl font-bold mb-4 bg-gradient-to-r from-[#0066ff] to-[#00ccff] bg-clip-text text-transparent">
            📊 Prestige Ecosystem
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-white/10 text-gray-400">
                  <th className="text-left p-2">Tier</th>
                  <th className="text-left p-2">Range</th>
                  <th className="text-left p-2">Rarity</th>
                  <th className="text-left p-2">Theme</th>
                  <th className="text-right p-2">Count</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { tier: "Initiate", range: "P1-P10", rarity: "Common", color: "#00ff88", theme: "Elemental / Arcane" },
                  { tier: "Adept", range: "P11-P30", rarity: "Uncommon", color: "#4499ff", theme: "Mythical Beasts & Celestial" },
                  { tier: "Master", range: "P31-P50", rarity: "Rare", color: "#0066ff", theme: "Ancient Warriors & Dark Arts" },
                  { tier: "Grandmaster", range: "P51-P80", rarity: "Legendary", color: "#0066ff", theme: "Tech / Nature / Cosmic" },
                  { tier: "NEXUS", range: "P81-P100", rarity: "Mythic", color: "#4488ff", theme: "Legendary Weapons & Transcendent" },
                ].map((row) => (
                  <tr key={row.tier} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="p-2 font-bold" style={{ color: row.color }}>{row.tier}</td>
                    <td className="p-2 text-gray-400">{row.range}</td>
                    <td className="p-2">
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                        style={{
                          color: row.color,
                          background: `${row.color}15`,
                          border: `1px solid ${row.color}30`,
                        }}
                      >
                        {row.rarity}
                      </span>
                    </td>
                    <td className="p-2 text-gray-500">{row.theme}</td>
                    <td className="p-2 text-right font-mono">
                      {row.tier === "Initiate" ? "10" :
                       row.tier === "Adept" ? "20" :
                       row.tier === "Master" ? "20" :
                       row.tier === "Grandmaster" ? "30" : "20"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ─── BACK LINK ─── */}
        <div className="mt-8 text-center">
          <a
            href="/"
            className="inline-block text-sm text-gray-500 hover:text-white transition-colors underline underline-offset-4 decoration-white/20 hover:decoration-white/60"
          >
            ← Back to App
          </a>
        </div>
      </div>
    </div>
  );
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}