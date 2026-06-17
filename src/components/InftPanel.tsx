"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey, Transaction, TransactionInstruction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, TOKEN_PROGRAM_ID } from "@solana/spl-token";

const PROGRAM_ID = new PublicKey("BtvSxxjf6vZ58qfTfjm9gLZWEZTPoUFH3iMZ2pi4Tsie");
const MINT_DISCRIMINATOR = new Uint8Array([80, 76, 226, 245, 220, 68, 129, 212]);
const RPC_ENDPOINT = "https://x1-testnet.xen.network";

const BG_DARK = "#000";
const BG_CARD = "#0c0c14";
const ACCENT = "#a78bfa";
const TEXT_SECONDARY = "#888899";

export interface VaultInfo {
  pubkey: string;
  owner: string;
  mintIndex: number;
  amount: number;
  mintedAt: number;
  nftMint: string;
  bump: number;
}

interface InftPanelProps {
  vaults: VaultInfo[];
  onMint: (amount: number, name: string, description: string) => Promise<void>;
  onBurn: (vaultPubkey: string) => Promise<void>;
  onRefresh: () => void;
}

const TIERS: { name: string; amount: number; icon: string }[] = [
  { name: "UNIT", amount: 0.5, icon: "⚪" },
  { name: "DUAL", amount: 1, icon: "⚫" },
  { name: "VECTOR", amount: 5, icon: "🔷" },
  { name: "CLUSTER", amount: 10, icon: "🔶" },
  { name: "SOVEREIGN", amount: 25, icon: "👑" },
  { name: "RESERVE", amount: 50, icon: "🔒" },
  { name: "PRIME", amount: 100, icon: "💎" },
  { name: "APEX", amount: 250, icon: "🔥" },
  { name: "CONSENSUS", amount: 500, icon: "⚡" },
  { name: "TREASURY", amount: 1000, icon: "🏆" },
];

function detectTier(amount: number): string {
  const exact = TIERS.find(t => t.amount === amount);
  if (exact) return exact.name;
  const closest = TIERS.reduce((prev, curr) => Math.abs(curr.amount - amount) < Math.abs(prev.amount - amount) ? curr : prev);
  return closest ? `${closest.name} (closest)` : "Custom";
}

function shortPubkey(pk: string): string {
  return `${pk.slice(0, 4)}...${pk.slice(-4)}`;
}

/* ─── TIER ICON ─── */
function TierIcon({ amount, size }: { amount: number; size?: number }) {
  const tier = TIERS.find(t => t.amount === amount);
  const s = size ?? 28;
  return (
    <div
      className="rounded-full flex items-center justify-center mx-auto"
      style={{
        width: s,
        height: s,
        background: `radial-gradient(circle, ${ACCENT}33, transparent)`,
        border: `1px solid ${ACCENT}44`,
        fontSize: s * 0.5,
      }}
    >
      {tier?.icon ?? "🪙"}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PANEL ROOT
   ═══════════════════════════════════════════════════════════════ */
export default function InftPanel({ vaults, onMint, onBurn, onRefresh }: InftPanelProps) {
  const [activeTab, setActiveTab] = useState<"mint" | "gallery" | "burn">("mint");
  const [mintAmount, setMintAmount] = useState("0.5");
  const [mintName, setMintName] = useState("");
  const [mintDesc, setMintDesc] = useState("");
  const [mintLoading, setMintLoading] = useState(false);
  const [burnVaultIndex, setBurnVaultIndex] = useState<number | null>(null);
  const [burnLoading, setBurnLoading] = useState(false);
  const [selectedVault, setSelectedVault] = useState<VaultInfo | null>(null);
  const [successTx, setSuccessTx] = useState<string | null>(null);
  const { publicKey } = useWallet();

  const numAmount = parseFloat(mintAmount) || 0;
  const detectedTier = detectTier(numAmount);

  const handleMint = async () => {
    if (!publicKey) return;
    setMintLoading(true);
    setSuccessTx(null);
    try {
      await onMint(numAmount, mintName, mintDesc);
      setSuccessTx("Mint successful!");
      setMintAmount("0.5");
      setMintName("");
      setMintDesc("");
    } catch (e: any) {
      console.error("Mint failed:", e);
    } finally {
      setMintLoading(false);
    }
  };

  const handleBurn = async () => {
    if (burnVaultIndex === null) return;
    const v = vaults[burnVaultIndex];
    if (!v) return;
    setBurnLoading(true);
    setSuccessTx(null);
    try {
      await onBurn(v.pubkey);
      setSuccessTx("Burn successful!");
      setBurnVaultIndex(null);
      setSelectedVault(null);
    } catch (e: any) {
      console.error("Burn failed:", e);
    } finally {
      setBurnLoading(false);
    }
  };

  const tabs = [
    { key: "mint", label: "🪙", title: "Mint" },
    { key: "gallery", label: "🏛️", title: "Gallery" },
    { key: "burn", label: "🔥", title: "Burn" },
  ] as const;

  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: BG_CARD, borderColor: 'rgba(255,255,255,0.05)' }}>
      {/* Tab bar */}
      <div className="flex border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => { setActiveTab(t.key); setSuccessTx(null); }}
            className={`flex-1 py-3 text-xs font-medium transition-all flex items-center justify-center gap-1 ${
              activeTab === t.key
                ? "text-white border-b-2"
                : "text-gray-600 hover:text-gray-400"
            }`}
            style={{ borderColor: activeTab === t.key ? ACCENT : 'transparent' }}
          >
            <span>{t.label}</span>
            <span>{t.title}</span>
          </button>
        ))}
      </div>

      <div className="p-4">
        {/* Success flash */}
        {successTx && (
          <div className="mb-3 p-2 rounded-lg text-center text-xs font-medium animate-pulse" style={{ background: `${ACCENT}15`, color: ACCENT, border: `1px solid ${ACCENT}33` }}>
            ✅ {successTx}
          </div>
        )}

        {/* ═══ MINT TAB ═══ */}
        {activeTab === "mint" && (
          <div className="space-y-4">
            {/* Tier grid */}
            <div className="grid grid-cols-5 gap-1.5">
              {TIERS.map(t => (
                <button
                  key={t.name}
                  onClick={() => setMintAmount(t.amount.toString())}
                  className="p-1.5 rounded-lg border text-center transition-all hover:scale-105 active:scale-95"
                  style={{
                    background: numAmount === t.amount ? `${ACCENT}20` : 'rgba(255,255,255,0.02)',
                    borderColor: numAmount === t.amount ? `${ACCENT}55` : 'rgba(255,255,255,0.06)',
                  }}
                >
                  <TierIcon amount={t.amount} size={22} />
                  <p className="text-[7px] font-medium text-gray-300 mt-0.5">{t.name}</p>
                  <p className="text-[6px]" style={{ color: TEXT_SECONDARY }}>{t.amount} XNT</p>
                </button>
              ))}
            </div>

            {/* Custom amount input */}
            <div>
              <p className="text-[9px] text-gray-500 mb-1">Custom Amount (XNT)</p>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={mintAmount}
                  onChange={e => setMintAmount(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg text-xs font-mono outline-none border"
                  style={{ background: '#000', borderColor: 'rgba(255,255,255,0.08)', color: '#ddd' }}
                  placeholder="0.5"
                />
                <div className="px-3 py-2 rounded-lg text-[9px] font-medium" style={{ background: `${ACCENT}10`, color: ACCENT, border: `1px solid ${ACCENT}22` }}>
                  {detectedTier}
                </div>
              </div>
            </div>

            {/* Name/Description */}
            <div className="space-y-2">
              <input
                type="text"
                value={mintName}
                onChange={e => setMintName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-xs font-mono outline-none border"
                style={{ background: '#000', borderColor: 'rgba(255,255,255,0.08)', color: '#ddd' }}
                placeholder="Name (optional)"
                maxLength={32}
              />
              <input
                type="text"
                value={mintDesc}
                onChange={e => setMintDesc(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-xs font-mono outline-none border"
                style={{ background: '#000', borderColor: 'rgba(255,255,255,0.08)', color: '#ddd' }}
                placeholder="Description (optional)"
                maxLength={64}
              />
            </div>

            {/* Mint button */}
            <button
              onClick={handleMint}
              disabled={mintLoading || !publicKey || numAmount <= 0}
              className="w-full py-3 rounded-xl text-xs font-bold transition-all active:scale-[0.98] disabled:opacity-30"
              style={{
                background: publicKey ? `linear-gradient(135deg, ${ACCENT}33, #0066ff33)` : 'rgba(255,255,255,0.03)',
                border: `1px solid ${publicKey ? `${ACCENT}55` : 'rgba(255,255,255,0.05)'}`,
                color: publicKey ? '#fff' : TEXT_SECONDARY,
              }}
            >
              {!publicKey
                ? "🔌 Connect Wallet to Mint"
                : mintLoading
                  ? "⏳ Minting..."
                  : `🔐 Mint ${numAmount} XNT iNFT`}
            </button>

            <p className="text-[8px] text-center" style={{ color: TEXT_SECONDARY }}>
              Vault program: {shortPubkey(PROGRAM_ID.toBase58())} · X1 testnet
            </p>
          </div>
        )}

        {/* ═══ GALLERY TAB ═══ */}
        {activeTab === "gallery" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] text-gray-500">
                Your iNFT Vaults: <span className="text-gray-300 font-medium">{vaults.length}</span>
              </p>
              <button
                onClick={onRefresh}
                className="text-[9px] px-2 py-1 rounded-lg transition-all"
                style={{ background: `${ACCENT}10`, color: ACCENT, border: `1px solid ${ACCENT}22` }}
              >
                🔄 Refresh
              </button>
            </div>

            {selectedVault ? (
              /* Detail view */
              <div className="rounded-xl p-4 border space-y-3" style={{ background: '#000', borderColor: 'rgba(255,255,255,0.08)' }}>
                <div className="flex items-center gap-3 mb-2">
                  <TierIcon amount={selectedVault.amount} size={40} />
                  <div>
                    <p className="text-sm font-bold text-gray-200">{TIERS.find(t => t.amount === selectedVault.amount)?.name ?? `iNFT #${selectedVault.mintIndex}`}</p>
                    <p className="text-[10px]" style={{ color: TEXT_SECONDARY }}>Index #{selectedVault.mintIndex}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-lg" style={{ background: BG_CARD }}>
                    <p className="text-[8px]" style={{ color: TEXT_SECONDARY }}>Amount</p>
                    <p className="text-xs font-mono text-gray-300">{selectedVault.amount} XNT</p>
                  </div>
                  <div className="p-2 rounded-lg" style={{ background: BG_CARD }}>
                    <p className="text-[8px]" style={{ color: TEXT_SECONDARY }}>Minted</p>
                    <p className="text-xs font-mono text-gray-300">{new Date(selectedVault.mintedAt * 1000).toLocaleDateString()}</p>
                  </div>
                </div>
                <p className="text-[8px] break-all" style={{ color: TEXT_SECONDARY }}>
                  Vault: {shortPubkey(selectedVault.pubkey)}
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setSelectedVault(null)}
                    className="flex-1 py-2 rounded-lg text-[10px] font-medium transition-all"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: TEXT_SECONDARY }}
                  >
                    ← Back
                  </button>
                  <button
                    onClick={() => { setBurnVaultIndex(vaults.findIndex(v => v.pubkey === selectedVault.pubkey)); setActiveTab("burn"); }}
                    className="flex-1 py-2 rounded-lg text-[10px] font-medium transition-all"
                    style={{ background: '#ff444415', border: '1px solid #ff444433', color: '#ff6666' }}
                  >
                    🔥 Burn
                  </button>
                </div>
              </div>
            ) : vaults.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <p className="text-2xl">📦</p>
                <p className="text-xs" style={{ color: TEXT_SECONDARY }}>No iNFT vaults yet. Mint one to see it here.</p>
              </div>
            ) : (
              /* Grid of vault cards */
              <div className="grid grid-cols-2 gap-2">
                {vaults.map((v, i) => {
                  const tier = TIERS.find(t => t.amount === v.amount);
                  return (
                    <button
                      key={v.pubkey}
                      onClick={() => setSelectedVault(v)}
                      className="p-3 rounded-xl border text-center transition-all hover:scale-[1.03] active:scale-[0.97]"
                      style={{ background: BG_CARD, borderColor: 'rgba(255,255,255,0.06)' }}
                    >
                      <TierIcon amount={v.amount} size={32} />
                      <p className="text-[9px] font-medium text-gray-300 mt-1 truncate">
                        {tier?.name ?? `iNFT #${v.mintIndex}`}
                      </p>
                      <p className="text-[8px]" style={{ color: TEXT_SECONDARY }}>
                        #{v.mintIndex} · {v.amount}XNT
                      </p>
                      <p className="text-[7px] mt-1 break-all" style={{ color: `${TEXT_SECONDARY}88` }}>
                        {shortPubkey(v.pubkey)}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══ BURN TAB ═══ */}
        {activeTab === "burn" && (
          <div className="space-y-3">
            <p className="text-[10px]" style={{ color: TEXT_SECONDARY }}>
              Select an iNFT vault to burn. Funds are returned as prestige credit.
            </p>

            {vaults.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-xl">🔥</p>
                <p className="text-xs mt-2" style={{ color: TEXT_SECONDARY }}>No vaults to burn.</p>
              </div>
            ) : (
              <>
                {/* Vault selector */}
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {vaults.map((v, i) => {
                    const tier = TIERS.find(t => t.amount === v.amount);
                    const isSelected = burnVaultIndex === i;
                    return (
                      <button
                        key={v.pubkey}
                        onClick={() => setBurnVaultIndex(isSelected ? null : i)}
                        className="w-full flex items-center gap-3 p-2.5 rounded-lg border text-left transition-all"
                        style={{
                          background: isSelected ? '#ff44441a' : BG_CARD,
                          borderColor: isSelected ? '#ff444466' : 'rgba(255,255,255,0.05)',
                        }}
                      >
                        <TierIcon amount={v.amount} size={24} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[9px] font-medium text-gray-300 truncate">{tier?.name ?? `iNFT #${v.mintIndex}`}</p>
                          <p className="text-[8px]" style={{ color: TEXT_SECONDARY }}>
                            #{v.mintIndex} · {v.amount} XNT
                          </p>
                        </div>
                        {isSelected && <span className="text-[10px] text-red-400">✓</span>}
                      </button>
                    );
                  })}
                </div>

                {/* Burn action */}
                {burnVaultIndex !== null && (
                  <div className="rounded-xl p-3 border space-y-2" style={{ background: '#ff44440a', borderColor: '#ff444420' }}>
                    <p className="text-[9px] text-red-300">
                      Burn vault <strong>{shortPubkey(vaults[burnVaultIndex]?.pubkey ?? "")}</strong> — returns {vaults[burnVaultIndex]?.amount ?? 0} XNT + creates Prestige PDA.
                    </p>
                    <button
                      onClick={handleBurn}
                      disabled={burnLoading}
                      className="w-full py-2.5 rounded-lg text-xs font-bold transition-all active:scale-[0.98]"
                      style={{
                        background: burnLoading ? '#666' : 'linear-gradient(135deg, #ef4444, #dc2626)',
                        color: '#fff',
                      }}
                    >
                      {burnLoading ? "⏳ Burning..." : "🔥 Confirm Burn"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
