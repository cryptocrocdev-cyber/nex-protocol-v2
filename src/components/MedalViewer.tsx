"use client";
import React, { useState } from "react";
import { PrestigeMedal } from "@/lib/voidTypes";

interface MedalViewerProps {
  medals: any[];
  onAbsorb: (count: number) => void;
  loading: boolean;
}

function medalColor(seed: number[]): string {
  const r = seed[0] % 256;
  const g = seed[4] % 256;
  const b = seed[8] % 256;
  return `rgb(${r}, ${g}, ${b})`;
}

function medalBorder(seed: number[]): string {
  const r = seed[1] % 256;
  const g = seed[5] % 256;
  const b = seed[9] % 256;
  return `rgb(${r}, ${g}, ${b})`;
}

function MedalCard({ medal, isLatest }: { medal: any; isLatest: boolean }) {
  const num = medal.prestigeNumber?.toNumber() ?? 0;
  const seed: number[] = medal.visualSeed ?? new Array(32).fill(0);
  const absorbed = medal.absorbedCount?.toNumber() ?? 0;
  const color = medalColor(seed);
  const border = medalBorder(seed);
  const ts = medal.timestamp?.toNumber() ?? 0;
  const date = ts > 0 ? new Date(ts * 1000).toLocaleDateString() : "—";

  return (
    <div
      className={`relative p-4 rounded-xl border-2 transition-all ${
        isLatest ? "scale-105 shadow-lg" : ""
      }`}
      style={{ borderColor: border, background: `linear-gradient(135deg, ${color}20, ${color}05)` }}
    >
      {/* Medal visual — abstract gem */}
      <div className="flex justify-center mb-2">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
          style={{
            background: `radial-gradient(circle, ${color}80, ${border}40)`,
            borderColor: border,
            borderWidth: "3px",
            borderStyle: "solid",
          }}
        >
          🏅
        </div>
      </div>
      <p className="text-center font-bold text-sm" style={{ color }}>#{num}</p>
      <p className="text-center text-[10px] text-gray-400">{date}</p>
      {absorbed > 0 && (
        <p className="text-center text-[10px] text-[#0066ff]">
          +{absorbed} absorbed
        </p>
      )}
      {/* Generate abstract pattern based on seed */}
      <div className="mt-2 flex gap-1 justify-center">
        {seed.slice(0, 5).map((s, i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full"
            style={{ opacity: 0.3 + ((s % 10) / 10) * 0.7, backgroundColor: color }}
          />
        ))}
      </div>
    </div>
  );
}

export default function MedalViewer({ medals, onAbsorb, loading }: MedalViewerProps) {
  const [showAll, setShowAll] = useState(false);
  const display = showAll ? medals : medals.slice(-5);

  if (medals.length === 0) {
    return (
      <div className="p-6 rounded-2xl border border-[#0066ff]/20 bg-[#0066ff]/5 text-center">
        <p className="text-4xl mb-2">🏅</p>
        <p className="text-gray-400 text-sm">No prestige medals yet</p>
        <p className="text-gray-600 text-xs">Complete a prestige to mint your first medal</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-[#0066ff]">🏅 Prestige Medals ({medals.length})</h3>
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-xs text-[#0066ff]/60 hover:text-[#0066ff]"
        >
          {showAll ? "Show Recent" : "Show All"}
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {display.map((medal: any, i: number) => {
          const num = medal.prestigeNumber?.toNumber() ?? 0;
          const total = medals.length;
          const isLatest = total > 0 && (display === medals ? i === medals.length - 1 : i === display.length - 1);
          return <MedalCard key={num} medal={medal} isLatest={isLatest} />;
        })}
      </div>
      {/* Absorption button */}
      {medals.length >= 2 && (
        <div className="mt-4 text-center">
          <button
            onClick={() => onAbsorb(medals.length - 1)}
            disabled={loading}
            className="px-4 py-2 rounded-lg border border-[#0066ff]/30 text-[#0066ff] text-xs hover:bg-[#0066ff]/10 transition-all"
          >
            {loading ? "Absorbing..." : `⚗️ Absorb ${medals.length - 1} medals into latest`}
          </button>
        </div>
      )}
    </div>
  );
}