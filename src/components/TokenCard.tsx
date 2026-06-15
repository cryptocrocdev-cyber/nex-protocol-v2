"use client";
import React from "react";
import { TOKEN_NAMES, TOKEN_UTILITIES, TOKEN_COLORS } from "@/lib/voidTypes";

interface TokenCardProps {
  index: number;
  isActive: boolean;
  isMinted: boolean;
  isLocked: boolean;
  cost: string;
  onMint: () => void;
  loading: boolean;
}

export default function TokenCard({
  index, isActive, isMinted, isLocked, cost, onMint, loading,
}: TokenCardProps) {
  const color = TOKEN_COLORS[index];
  return (
    <div
      className={`p-4 rounded-xl border transition-all duration-300 ${
        isActive
          ? "border-opacity-60 shadow-lg"
          : isMinted
          ? "border-opacity-30 opacity-70"
          : "border-opacity-10 opacity-50"
      }`}
      style={{
        borderColor: isActive ? `${color}99` : `${color}33`,
        background: `linear-gradient(135deg, ${color}15, ${color}05)`,
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
        <span className="font-bold text-sm" style={{ color }}>{TOKEN_NAMES[index]}</span>
        {isActive && <span className="text-xs text-green-400 ml-auto">✅</span>}
        {isMinted && !isActive && <span className="text-xs text-yellow-400 ml-auto">⏸️</span>}
        {isLocked && !isMinted && <span className="text-xs text-gray-500 ml-auto">🔒</span>}
      </div>
      <p className="text-[10px] text-gray-400 mb-2">{TOKEN_UTILITIES[index]}</p>
      {isLocked && !isMinted && (
        <p className="text-[10px] text-gray-500">Requires previous token</p>
      )}
      {isMinted && !isActive && (
        <p className="text-[10px] text-yellow-400/70">Deactivated after prestige</p>
      )}
      {cost !== "—" && !isMinted && (
        <div className="mt-2">
          <p className="text-[10px] text-gray-500">Cost: <span className="text-white font-mono">{cost} NEX</span></p>
          <button
            onClick={onMint}
            disabled={loading || isLocked}
            className={`mt-1 w-full py-1 px-2 rounded-lg text-xs font-bold transition-all ${
              isLocked
                ? "bg-gray-800 text-gray-600 cursor-not-allowed"
                : "bg-gradient-to-r from-[#0066ff] to-[#00ccff] text-white hover:opacity-90"
            }`}
          >
            {loading ? "Processing..." : `Mint ${TOKEN_NAMES[index]}`}
          </button>
        </div>
      )}
    </div>
  );
}