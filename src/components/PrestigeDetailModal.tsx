"use client";
import React, { useEffect, useState } from "react";
import { getPrestigeBadgePath, getPrestigeThreshold } from "@/lib/void";
import { PRESTIGE_NAMES, PRESTIGE_TICKERS, PRESTIGE_COLORS, PRESTIGE_SYMBOLS } from "@/lib/void";

export interface PrestigeTokenInfo {
  level: number;
  name: string;
  ticker: string;
  color: string;
  symbol: string;
  owned: boolean;
  totalMinted: number;
  totalBurned: number;
  prestigeNumber: number;
  absorbedCount?: number;
  timestamp?: number;
  burned?: boolean;
}

const TIER_DEFS = [
  { max: 10, name: "Initiate", color: "#0066ff" },
  { max: 25, name: "Adept", color: "#00ccff" },
  { max: 50, name: "Master", color: "#0066ff" },
  { max: 75, name: "Grandmaster", color: "#ff6b6b" },
  { max: Infinity, name: "NEXUS", color: "#ffffff" },
];

function getTier(level: number): { name: string; color: string } {
  for (const t of TIER_DEFS) {
    if (level <= t.max) return t;
  }
  return TIER_DEFS[TIER_DEFS.length - 1];
}

function getRarity(level: number): { label: string; color: string } {
  if (level <= 10) return { label: "Common", color: "#88aacc" };
  if (level <= 25) return { label: "Uncommon", color: "#44ff88" };
  if (level <= 50) return { label: "Rare", color: "#4488ff" };
  if (level <= 75) return { label: "Epic", color: "#bb44ff" };
  return { label: "Legendary", color: "#ffdd00" };
}

function formatNumber(n: number): string {
  return n.toLocaleString();
}

interface PrestigeDetailModalProps {
  token: PrestigeTokenInfo;
  onClose: () => void;
}

export default function PrestigeDetailModal({ token, onClose }: PrestigeDetailModalProps) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation on mount
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  const handleClose = () => {
    setExiting(true);
    setTimeout(() => onClose(), 1200);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !exiting) handleClose();
  };

  const tier = getTier(token.level);
  const rarity = getRarity(token.level);
  const nexThreshold = getPrestigeThreshold(token.level - 1);
  const badgePath = getPrestigeBadgePath(token.level);
  const paddedNum = String(token.level).padStart(3, "0");
  const explorerUrl = `https://explorer.x1.xyz/address/${token.ticker}?tokenProgram=Token2022`;

  return (
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center transition-all duration-300 ${
        visible && !exiting ? "opacity-100" : "opacity-0"
      }`}
      style={{
        background: visible && !exiting ? "rgba(0,0,0,0.85)" : "rgba(0,0,0,0)",
        backdropFilter: "blur(10px)",
      }}
      onClick={handleBackdropClick}
    >
      {/* Fire overlay — completely independent of card, so it doesn't fade with it */}
      {exiting && (
        <div className="fixed inset-0 pointer-events-none z-[202] flex items-center justify-center">
          <div className="relative max-w-md w-full mx-4" style={{height: '480px'}}>
            {/* Bright fire glow rising from bottom */}
            <div className="absolute bottom-0 left-[-10%] right-[-10%] h-full"
              style={{
                background: `linear-gradient(0deg, ${token.color} 0%, ${token.color}cc 20%, ${token.color}66 40%, ${token.color}22 60%, transparent 80%)`,
                filter: "blur(30px)",
                animation: 'burn-rise 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
              }}
            />
            {/* Center white flash */}
            <div className="absolute top-1/2 left-1/2"
              style={{
                width: '60px', height: '60px',
                borderRadius: '50%',
                background: '#fff',
                boxShadow: `0 0 60px ${token.color}, 0 0 120px #fff8, 0 0 200px ${token.color}88`,
                transform: 'translate(-50%, -50%)',
                animation: 'fire-flash 0.8s ease-out forwards',
              }}
            />
            {/* Ember sparks */}
            {Array.from({ length: 50 }).map((_, i) => (
              <div key={i}
                className="absolute rounded-full"
                style={{
                  width: `${1.5 + Math.random() * 3}px`,
                  height: `${1.5 + Math.random() * 3}px`,
                  background: i % 4 === 0 ? '#fff8e0' : i % 3 === 0 ? '#ffdd00' : '#ff4400',
                  left: `${5 + Math.random() * 90}%`,
                  top: `${30 + Math.random() * 60}%`,
                  animation: `ember ${0.6 + Math.random() * 0.8}s ease-out ${Math.random() * 0.5}s forwards`,
                  boxShadow: `0 0 8px ${i % 4 === 0 ? '#fff' : '#ff6600'}`,
                }}
              />
            ))}
          </div>
        </div>
      )}
      {/* Modal card */}
      <div
        className={`relative rounded-2xl overflow-hidden max-w-md w-full mx-4 ${
          exiting ? 'opacity-0 scale-75 rotate-6' : visible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
        }`}
        style={{
          background: "radial-gradient(ellipse at 50% 0%, #0c0c1e 0%, #060810 100%)",
          border: `1px solid ${token.color}22`,
          transition: exiting
            ? 'all 0.6s cubic-bezier(0.68, -0.55, 0.27, 1.55) 0.5s'
            : visible ? 'all 0.3s ease-out' : 'all 0s',
          boxShadow: exiting
            ? `0 0 200px ${token.color}aa, 0 0 400px ${token.color}55`
            : `0 0 60px ${token.color}22, 0 0 120px ${token.color}11`,
          zIndex: 1,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full transition-all hover:scale-110"
          style={{
            background: "rgba(0,0,0,0.6)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.5)",
          }}
          aria-label="Close modal"
        >
          ✕
        </button>

        {/* Glow background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 50% 35%, ${token.color}15 0%, transparent 70%)`,
          }}
        />

        {/* Badge section */}
        <div className="relative pt-8 pb-4 flex flex-col items-center">
          {/* Badge + ring wrapper — ring is centered on the badge itself */}
          <div className="relative w-36 h-36 mb-4">
            {/* Spinning ring — centered exactly on badge */}
            <div className="absolute inset-[-6px] rounded-full animate-orb-slow pointer-events-none"
              style={{
                background: `conic-gradient(from 0deg, transparent 0%, ${token.color} 25%, ${token.color}88 50%, ${token.color}22 75%, transparent 100%)`,
                mask: "radial-gradient(circle, transparent 65%, black 66%)",
                WebkitMask: "radial-gradient(circle, transparent 65%, black 66%)",
              }}
            />
            {/* Second ring counter-rotating */}
            <div className="absolute inset-[-10px] rounded-full animate-orb-reverse pointer-events-none"
              style={{
                background: `conic-gradient(from 180deg, transparent 0%, ${token.color}44 20%, transparent 40%, ${token.color}22 70%, transparent 100%)`,
                mask: "radial-gradient(circle, transparent 68%, black 69%)",
                WebkitMask: "radial-gradient(circle, transparent 68%, black 69%)",
              }}
            />
            {/* Badge image */}
            <div className="relative w-full h-full rounded-full overflow-hidden"
              style={{
                boxShadow: `0 0 0 3px ${token.color}33, 0 0 40px ${token.color}22, inset 0 0 40px ${token.color}11`,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={badgePath}
                alt={`${token.name} badge`}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Prestige number */}
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-sm font-mono font-bold px-3 py-0.5 rounded-full"
              style={{
                background: `${token.color}15`,
                color: token.color,
                border: `1px solid ${token.color}30`,
              }}
            >
              #{paddedNum}
            </span>
          </div>

          {/* Name & ticker */}
          <h2 className="text-xl font-bold" style={{ color: token.color }}>
            {token.name}
          </h2>
          <p
            className="text-sm font-mono tracking-wider"
            style={{ color: `${token.color}99` }}
          >
            ${token.ticker}
          </p>
        </div>

        {/* Attributes grid */}
        <div className="relative px-6 pb-6 space-y-3">
          {/* Tier badge */}
          <div className="flex justify-center mb-4">
            <span
              className="text-[10px] font-bold px-4 py-1 rounded-full tracking-widest uppercase"
              style={{
                background: `${tier.color}15`,
                color: tier.color,
                border: `1px solid ${tier.color}30`,
                boxShadow: `0 0 20px ${tier.color}11`,
              }}
            >
              {tier.name}
            </span>
          </div>

          {/* Attribute rows */}
          <div className="grid grid-cols-2 gap-2">
            <AttributeCell label="Symbol" value={token.symbol} color={token.color} />
            <AttributeCell label="Rarity" value={rarity.label} color={rarity.color} />
            <AttributeCell
              label="NEX Threshold"
              value={`${formatNumber(nexThreshold)} NEX`}
              color={token.color}
            />
            <AttributeCell
              label="Total Minted"
              value={formatNumber(token.totalMinted)}
              color={token.color}
            />
            <AttributeCell
              label="Total Burned"
              value={formatNumber(token.totalBurned)}
              color={token.color}
            />
            {token.absorbedCount !== undefined && token.absorbedCount > 0 && (
              <AttributeCell
                label="Absorbed"
                value={`+${token.absorbedCount}`}
                color="#00ccff"
              />
            )}
            {token.owned && (
              <div
                className="col-span-2 rounded-lg px-3 py-2 text-center text-xs font-bold tracking-wider"
                style={{
                  background: "rgba(0,255,100,0.08)",
                  border: "1px solid rgba(0,255,100,0.25)",
                  color: "#44ff88",
                  boxShadow: "0 0 20px rgba(0,255,100,0.1)",
                }}
              >
                ✅ YOU OWN THIS iNFT
              </div>
            )}
          </div>

          {/* Explorer link */}
          <div className="pt-2 text-center">
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-full transition-all hover:scale-105"
              style={{
                background: `${token.color}10`,
                border: `1px solid ${token.color}25`,
                color: token.color,
              }}
            >
              🔍 View on X1 Explorer ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function AttributeCell({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      className="rounded-lg px-3 py-2"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <p className="text-[9px] text-gray-500 mb-0.5">{label}</p>
      <p className="text-xs font-medium" style={{ color }}>
        {value}
      </p>
    </div>
  );
}