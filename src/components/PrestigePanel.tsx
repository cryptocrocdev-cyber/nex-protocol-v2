"use client";
import React from "react";
import { getPrestigeThreshold, getPrestigeBadgePath, activeTokenCount } from "@/lib/void";
import { generatePrestigeNftSvg, generatePrestigeNftMetadata } from "@/lib/prestigeNftArt";
import { PublicKey } from "@solana/web3.js";

interface PrestigePanelProps {
  prestigeCount: number;
  totalNexEarned: number;
  activeMask: number;
  allTokensReady: boolean;
  thresholdReady: boolean;
  onPrestige: () => void;
  onMintNft: () => void;
  loading: boolean;
  nftMinted: boolean;
  lastPrestigeNftSeed?: number;
  lastPrestigeNumber?: number;
  walletPublicKey?: PublicKey | null;
}

export default function PrestigePanel({
  prestigeCount, totalNexEarned, activeMask,
  allTokensReady, thresholdReady,
  onPrestige, onMintNft, loading,
  nftMinted, lastPrestigeNftSeed, lastPrestigeNumber,
  walletPublicKey,
}: PrestigePanelProps) {
  const threshold = getPrestigeThreshold(prestigeCount);
  const progress = Math.min(100, (totalNexEarned / threshold) * 100);
  const canPrestige = allTokensReady && thresholdReady && prestigeCount < 100;
  const tokenCount = activeTokenCount(activeMask);

  // Generate NFT preview if we have a seed
  let nftSvg: string | null = null;
  let nftMetadata: any = null;
  if (lastPrestigeNftSeed !== undefined && lastPrestigeNumber !== undefined) {
    const params = { seed: lastPrestigeNftSeed, prestigeNumber: lastPrestigeNumber };
    nftSvg = generatePrestigeNftSvg(params);
    nftMetadata = generatePrestigeNftMetadata(params);
  }

  return (
    <div className="p-6 rounded-2xl border border-[#0066ff]/30 bg-gradient-to-br from-[#0066ff]/10 to-[#0066ff]/10">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">🏅</span>
        <h3 className="font-bold text-[#0066ff]">Prestige System</h3>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 rounded-xl bg-[#0066ff]/5 border border-[#0066ff]/20">
          <p className="text-[10px] text-gray-400">Current Prestige</p>
          <p className="text-2xl font-bold text-[#0066ff]">{prestigeCount} / 100</p>
        </div>
        <div className="p-3 rounded-xl bg-[#0066ff]/5 border border-[#0066ff]/20">
          <p className="text-[10px] text-gray-400">Active Tokens</p>
          <p className="text-2xl font-bold text-[#0066ff]">{tokenCount} / 9</p>
        </div>
      </div>

      {/* Progress to next prestige */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>NEX threshold: {(threshold / 1_000_000_000).toLocaleString()} NEX</span>
          <span>{progress.toFixed(1)}%</span>
        </div>
        <div className="w-full h-3 rounded-full bg-gray-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#0066ff] to-[#00ccff] transition-all duration-500"
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
        <p className="text-[10px] text-gray-500 mt-1">
          Earned: {(totalNexEarned / 1_000_000_000).toLocaleString()} NEX
        </p>
      </div>

      {/* Requirements checklist */}
      <div className="space-y-1 mb-4 text-xs">
        <div className="flex items-center gap-2">
          {allTokensReady ? <span className="text-green-400">✅</span> : <span className="text-red-400">❌</span>}
          <span className="text-gray-400">All 9 tokens minted &amp; active</span>
        </div>
        <div className="flex items-center gap-2">
          {thresholdReady ? <span className="text-green-400">✅</span> : <span className="text-red-400">❌</span>}
          <span className="text-gray-400">{(threshold / 1_000_000_000).toLocaleString()} NEX total earned</span>
        </div>
      </div>

      {/* Prestige button */}
      <button
        onClick={onPrestige}
        disabled={!canPrestige || loading}
        className={`w-full py-3 px-4 rounded-xl font-bold text-lg transition-all mb-3 ${
          canPrestige
            ? "bg-gradient-to-r from-[#0066ff] to-[#00ccff] text-black hover:opacity-90 animate-pulse"
            : "bg-gray-800 text-gray-600 cursor-not-allowed"
        }`}
      >
        {loading ? "Prestiging..." : canPrestige ? "🔥 PRESTIGE 🔥" : "Requirements Not Met"}
      </button>

      {/* NFT Preview & Mint */}
      {prestigeCount > 0 && (
        <>
          <div className="mt-4 p-4 rounded-xl bg-black/80 border border-[#0066ff]/30">
            <h4 className="text-sm font-bold text-[#0066ff] mb-3 flex items-center gap-2">
              <span>🎨</span> Prestige iNFT #{prestigeCount}
            </h4>

            {lastPrestigeNumber !== undefined && lastPrestigeNumber ? (
              <div className="w-full max-w-xs mx-auto mb-3 rounded-lg border border-[#0066ff]/20 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getPrestigeBadgePath(lastPrestigeNumber)}
                  alt={`Prestige #${lastPrestigeNumber} badge`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            ) : nftSvg && (
              <div className="w-full max-w-xs mx-auto mb-3 rounded-lg border border-[#0066ff]/20 overflow-hidden">
                <div dangerouslySetInnerHTML={{ __html: nftSvg }} />
              </div>
            )}

            {nftMetadata && (
              <div className="grid grid-cols-2 gap-1 text-[10px] mb-3">
                {nftMetadata.attributes.slice(0, 4).map((attr: any, i: number) => (
                  <div key={i} className="p-1 rounded bg-[#0066ff]/5 border border-[#0066ff]/10">
                    <span className="text-gray-500">{attr.trait_type}:</span>
                    <span className="text-white ml-1">{attr.value}</span>
                  </div>
                ))}
              </div>
            )}

            {!nftMinted ? (
              <button
                onClick={onMintNft}
                disabled={loading}
                className={`w-full py-2 px-4 rounded-lg font-bold text-sm transition-all ${
                  loading
                    ? "bg-gray-800 text-gray-600 cursor-not-allowed"
                    : "bg-gradient-to-r from-[#0066ff] to-[#00ccff] text-white hover:opacity-90"
                }`}
              >
                {loading ? "Minting..." : "🎨 Mint Prestige iNFT"}
              </button>
            ) : (
              <div className="text-center text-green-400 text-sm">
                ✅ iNFT minted to your wallet!
              </div>
            )}
          </div>

          {/* NFT metadata help */}
          <p className="text-[10px] text-gray-600 mt-2 text-center">
            iNFT is a Token-2022 NFT (0 decimals). Minted directly to your wallet.{' '}
            <a href={`https://explorer.x1.xyz/address/${walletPublicKey?.toBase58() || ''}?tokenProgram=Token2022`}
               target="_blank" rel="noopener noreferrer" className="text-[#0066ff] underline">
              View on X1 Explorer →
            </a>
          </p>
        </>
      )}
    </div>
  );
}