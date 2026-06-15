"use client";
import React, { useState } from "react";
import { BN } from "@coral-xyz/anchor";
import { formatNex, formatXnt, ashBurnBoost, effectiveBurnTax, LAMPORTS_PER_XNT } from "@/lib/voidTypes";

interface VoltPanelProps {
  voltBalance: BN;
  voltStaked: BN;
  globalVoltSupply: BN;
  burnCount: BN;
  burnSlider: number;
  onStake: (amount: BN) => void;
  onUnstake: (amount: BN) => void;
  onSetSlider: (mult: number) => void;
  loading: boolean;
}

export default function VoltPanel({
  voltBalance, voltStaked, globalVoltSupply, burnCount, burnSlider,
  onStake, onUnstake, onSetSlider, loading,
}: VoltPanelProps) {
  const [stakeAmount, setStakeAmount] = useState("");
  const [unstakeAmount, setUnstakeAmount] = useState("");

  const bal = voltBalance?.toNumber() ?? 0;
  const staked = voltStaked?.toNumber() ?? 0;
  const global = globalVoltSupply?.toNumber() ?? 0;
  const boost = ashBurnBoost(staked);
  const taxPct = effectiveBurnTax(1000, burnCount?.toNumber() ?? 0, burnSlider);

  const sliderOptions = [1, 2, 3, 4, 5];

  return (
    <div className="p-6 rounded-2xl border border-[#0066ff]/30 bg-[#0066ff]/5">
      <div className="flex items-center gap-3 mb-4">
        <img src="/volt-logo.jpg" alt="VOLT" className="h-10 w-10 rounded-xl object-cover ring-2 ring-[#0066ff]/30" />
        <div>
          <h3 className="font-bold text-lg text-white">VOLT — Inflation Token</h3>
          <p className="text-xs text-gray-400">Earned from the forced burn tax on tick production. Stake to boost your NEX burn rate.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        <div className="p-3 rounded-xl border border-[#0066ff]/20 bg-[#0066ff]/5">
          <p className="text-[10px] text-gray-400">Liquid VOLT</p>
          <p className="text-sm font-bold text-[#00ccff] font-mono">{formatXnt(bal)}</p>
        </div>
        <div className="p-3 rounded-xl border border-[#0066ff]/20 bg-[#0066ff]/5">
          <p className="text-[10px] text-gray-400">Staked VOLT</p>
          <p className="text-sm font-bold text-[#00ccff] font-mono">{formatXnt(staked)}</p>
        </div>
        <div className="p-3 rounded-xl border border-[#0066ff]/20 bg-[#0066ff]/5">
          <p className="text-[10px] text-gray-400">Global Supply</p>
          <p className="text-sm font-bold text-[#00ccff] font-mono">{formatXnt(global)}</p>
        </div>
        <div className="p-3 rounded-xl border border-[#0066ff]/20 bg-[#0066ff]/5">
          <p className="text-[10px] text-gray-400">Burn Boost</p>
          <p className="text-sm font-bold text-[#0066ff] font-mono">{boost}×</p>
        </div>
      </div>

      {/* Stake / Unstake */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <p className="text-xs text-gray-400 mb-1">Stake VOLT</p>
          <div className="flex gap-1">
            <input
              type="number"
              placeholder="Amount"
              value={stakeAmount}
              onChange={e => setStakeAmount(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-black border border-[#0066ff]/30 text-white text-xs font-mono outline-none focus:border-[#00ccff]"
            />
            <button
              onClick={() => {
                const v = parseFloat(stakeAmount);
                if (v > 0) onStake(new BN(v * LAMPORTS_PER_XNT));
              }}
              disabled={loading || !stakeAmount || parseFloat(stakeAmount) <= 0}
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-[#0066ff] to-[#00ccff] text-white text-xs font-bold disabled:opacity-30"
            >
              Stake
            </button>
          </div>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">Unstake VOLT</p>
          <div className="flex gap-1">
            <input
              type="number"
              placeholder="Amount"
              value={unstakeAmount}
              onChange={e => setUnstakeAmount(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-black border border-[#0066ff]/30 text-white text-xs font-mono outline-none focus:border-[#00ccff]"
            />
            <button
              onClick={() => {
                const v = parseFloat(unstakeAmount);
                if (v > 0) onUnstake(new BN(v * LAMPORTS_PER_XNT));
              }}
              disabled={loading || !unstakeAmount || parseFloat(unstakeAmount) <= 0}
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-[#0066ff] to-[#00ccff] text-white text-xs font-bold disabled:opacity-30"
            >
              -Unstake
            </button>
          </div>
        </div>
      </div>

      {/* Burn Boost Slider */}
      <div className="p-4 rounded-xl border border-[#0066ff]/20 bg-[#0066ff]/5">
        <p className="text-xs text-gray-400 mb-2">
          🔥 Active Burn Boost · Current tax: <span className="text-[#0066ff] font-bold">{taxPct.toFixed(1)}%</span>
        </p>
        <div className="flex gap-2">
          {sliderOptions.map(m => (
            <button
              key={m}
              onClick={() => onSetSlider(m)}
              disabled={loading}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                burnSlider === m
                  ? "bg-gradient-to-r from-[#0066ff] to-[#0066ff] text-white"
                  : "bg-black border border-[#0066ff]/20 text-gray-400 hover:border-[#0066ff]/50"
              }`}
            >
              {m}×{m === 1 ? " (default)" : ""}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-gray-500 mt-2">
          Higher burn = more VOLT per tick = higher burn boost. Max 5× (50% tick tax).
        </p>
      </div>

      {/* Current boost info */}
      <div className="mt-3 p-3 rounded-xl border border-[#0066ff]/10 bg-[#0066ff]/5">
        <p className="text-xs text-[#00ccff]">
          💨 VOLT Burn Boost — {staked > 0 
            ? `${formatXnt(staked)} VOLT staked → ${boost}× NEX multiplier on XNT burns`
            : "No VOLT staked. Stake to boost burn rate."}
        </p>
      </div>
    </div>
  );
}