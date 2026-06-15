import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

// ─── Constants ─────────────────────────────────────────────────────────────
export const LAMPORTS_PER_XNT = 1_000_000_000;

export const TOKEN_NAMES: string[] = [
  "CROWN", "ORACLE", "ANVIL", "ECHO", "FORGE",
  "TIDE", "VAULT", "RIFT", "PRIME",
];

export const TOKEN_SEEDS: string[] = [
  "crown", "oracle", "anvil", "echo", "forge",
  "tide", "vault", "rift", "prime",
];

export const TOKEN_PRICES: number[] = [
  500, 1000, 2000, 4000, 8000, 16000, 32000, 64000, 128000,
];

export const TOKEN_UTILITIES: string[] = [
  "Public leaderboard status",
  "Analytics & leaderboard access",
  "Batch burn without Mint Pass",
  "Extend claim bonus range",
  "Double staked NEX yield",
  "Lock → earn XNT from treasury",
  "Share of Mint Pass fees",
  "+50% on other token burns",
  "Doubles ALL other token effects",
];

export const TOKEN_COLORS: string[] = [
  "#ffaa00", "#aa44ff", "#888888", "#44aaff", "#ff4444",
  "#00ccaa", "#ffd700", "#ff66aa", "#ff00ff",
];

export const TIER_NAMES = ["Bronze", "Silver", "Gold", "Diamond"];
export const TIER_COLORS = ["#cd7f32", "#c0c0c0", "#ffd700", "#b9f2ff"];

export const MAX_TOKENS = 9;
export const MAX_TIERS = 4;

// Fee descriptions
export const FEE_LABELS: string[] = [
  "Mint (2%)", "Pair XNT (1%)", "Pair NEX (0.5%)", "Prestige (0.5%)", "Cosmetic (5%)",
];

export const DEV_WALLET_STR = "BQLB3NPHGRfibY23qTDbEYBuhZu2KsdiD3pbxuu8Fpxh";

// ─── Account Type Interfaces ───────────────────────────────────────────────

export interface ProtocolState {
  authority: PublicKey;
  devWallet: PublicKey;
  totalXntBurned: BN;
  totalNexSupply: BN;
  totalBurns: BN;
  tokenPrices: BN[];
  devFeeBps: number[];
  vaultTreasuryBalance: BN;
  cosmeticPrices: BN[];
  // V2 fields
  ashTotalSupply: BN;
  burnTaxBaselineBps: number;
  ashStakingPool: BN;
}

export interface UserState {
  user: PublicKey;
  totalXntBurned: BN;
  currentNexBalance: BN;
  pendingNex: BN;
  lastBurnTime: BN;
  lastClaimTime: BN;
  multiplier: BN;
  burnCount: BN;
  totalNexEarned: BN;
  hasMintPass: boolean;
  prestigeCount: BN;
  lastTickTime: BN;
  activeTokenMask: number;
  bump: number;
  // V2 fields
  ashBalance: BN;
  ashStaked: BN;
  tierCounts: number[]; // flat [36], [token*4 + tier] = count
  burnBoostSlider: number;
}

export interface ChildTokenAccount {
  owner: PublicKey;
  tokenIndex: number;
  mintedAt: BN;
  isActive: boolean;
  resourceBalance: BN;
}

export interface PrestigeMedal {
  owner: PublicKey;
  prestigeNumber: BN;
  timestamp: BN;
  visualSeed: number[];
  absorbedCount: BN;
}

export interface TokenPair {
  owner: PublicKey;
  tokenA: number;
  tokenB: number;
  createdAt: BN;
  isActive: boolean;
}

export interface VaultRecord {
  owner: PublicKey;
  lastClaimEpoch: BN;
}

// ─── Tier Helpers ──────────────────────────────────────────────────────────

/** Get count of a specific token+tier */
export function getTierCount(tierCounts: number[], tokenIdx: number, tier: number): number {
  const i = tokenIdx * 4 + tier;
  return tierCounts?.[i] ?? 0;
}

/** Get total count across all tiers for a token */
export function getTokenTotal(tierCounts: number[], tokenIdx: number): number {
  let sum = 0;
  for (let t = 0; t < MAX_TIERS; t++) sum += getTierCount(tierCounts, tokenIdx, t);
  return sum;
}

/** Get highest tier held for a token (-1 = none) */
export function getHighestTier(tierCounts: number[], tokenIdx: number): number {
  for (let t = MAX_TIERS - 1; t >= 0; t--) {
    if (getTierCount(tierCounts, tokenIdx, t) > 0) return t;
  }
  return -1;
}

/** Check if any tier exists */
export function hasAnyTier(tierCounts: number[], tokenIdx: number): boolean {
  return getTokenTotal(tierCounts, tokenIdx) > 0;
}

/** Check if user has 3+ of a tier (can upgrade) */
export function canUpgrade(tierCounts: number[], tokenIdx: number): number {
  for (let t = 0; t < MAX_TIERS - 1; t++) {
    if (getTierCount(tierCounts, tokenIdx, t) >= 3) return t; // current tier
  }
  return -1;
}

/** Check all 9 tokens held (for PRIME mint) */
export function hasAllTokens(tierCounts: number[]): boolean {
  for (let i = 0; i < MAX_TOKENS; i++) {
    if (!hasAnyTier(tierCounts, i)) return false;
  }
  return true;
}

// ─── Math Helpers ──────────────────────────────────────────────────────────

export function formatNex(bn: BN | null | undefined): string {
  if (!bn) return "0";
  const val = bn.toNumber();
  return (val / LAMPORTS_PER_XNT).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function formatXnt(lamports: BN | number | null | undefined): string {
  if (lamports == null) return "0";
  const val = typeof lamports === "number" ? lamports : lamports.toNumber();
  return (val / LAMPORTS_PER_XNT).toLocaleString(undefined, { maximumFractionDigits: 4 });
}

export function getTokenCost(index: number, prices: BN[] | null): string {
  if (!prices || !prices[index]) return "—";
  return formatNex(prices[index]);
}

export function shortPubkey(pk: PublicKey | string): string {
  const s = typeof pk === "string" ? pk : pk.toBase58();
  return `${s.slice(0, 6)}...${s.slice(-4)}`;
}

/** Calculate dynamic cost: totalNexSupply / 100 */
export function dynamicCost(totalNexSupply: BN | null): number {
  if (!totalNexSupply) return 500; // fallback
  return Math.max(1, totalNexSupply.toNumber() / 100);
}

/** Calculate VOLT burn boost: 1 + log10(1 + ash_staked / 1000) */
export function ashBurnBoost(ashStaked: number): number {
  if (ashStaked <= 0) return 1;
  const logArg = 1 + ashStaked / 1000;
  const log10 = Math.log10(logArg);
  return 1 + Math.floor(log10);
}

/** Calculate effective burn tax % */
export function effectiveBurnTax(
  baselineBps: number,
  burnCount: number,
  sliderMult: number
): number {
  const phaseEst = Math.floor(burnCount / 1000);
  const phaseBps = phaseEst * 5;
  const effectiveBps = (baselineBps + phaseBps) * sliderMult;
  return effectiveBps / 100;
}