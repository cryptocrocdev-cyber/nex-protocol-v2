// ─── Game Engine — Pure Math, No React ──────────────────────────
// All reward calculations, milestone checks, and game rules live here.
// Nothing depends on React — testable anywhere.

export const NEX_PER_TAP = 1_000;
export const PRESTIGE_COST = 30_000;
export const MINT_COST = 5_000;

// ─── LP Challenge Milestones ────────────────────────────────────

export const LP_MILESTONES = [
  { at: 10, label: "🌊 Starter LP",    desc: "Provide LP to 10 pools",    boost: 1.1 },
  { at: 25, label: "🌊 LP Collector",  desc: "Provide LP to 25 pools",    boost: 1.25 },
  { at: 50, label: "🌊 LP Veteran",    desc: "Provide LP to 50 pools",    boost: 1.5 },
  { at: 75, label: "🌊 LP Elite",      desc: "Provide LP to 75 pools",    boost: 2.0 },
  { at: 90, label: "🌊 LP Master",     desc: "Provide LP to 90 pools",    boost: 2.5 },
  { at: 100, label: "🏆 LP CHAMPION",   desc: "Provide LP to ALL 100 pools", boost: 5.0 },
];

/** Get the LP tap multiplier based on how many LP challenges are completed */
export function getLpTapMult(lpProvided: Record<number, boolean>): number {
  const count = Object.keys(lpProvided).length;
  // Find highest milestone reached (only whole milestones)
  let mult = 1.0;
  for (const m of LP_MILESTONES) {
    if (count >= m.at) mult = m.boost;
  }
  return mult;
}

/** Get current LP challenge progress details */
export function getLpChallengeInfo(lpProvided: Record<number, boolean>): {
  count: number;
  nextMilestone: typeof LP_MILESTONES[0] | null;
  currentBoost: number;
  nextAt: number | null;
} {
  const count = Object.keys(lpProvided).length;
  let nextMilestone = null;
  for (const m of LP_MILESTONES) {
    if (count < m.at) { nextMilestone = m; break; }
  }
  const currentBoost = getLpTapMult(lpProvided);
  return { count, nextMilestone, currentBoost, nextAt: nextMilestone?.at ?? null };
}


// ─── Milestones ──────────────────────────────────────────────────

export interface Milestone {
  at: number;
  label: string;
  desc: string;
}

export const MILESTONES: Milestone[] = [
  { at: 0, label: "🏁 Starter", desc: "Tap to earn NEX" },
  { at: 5, label: "👑 Streak", desc: "Combo streak → bonus NEX" },
  { at: 50, label: "💎 2× Taps", desc: "Double NEX per tap" },
  { at: 100, label: "⭐ MAX", desc: "Final prestige — 1 iNFT only" },
];

// ─── Stat Accessors ───────────────────────────────────────────────

export function getNexMultAt(prestige: number): number {
  return prestige >= 50 ? 2 : 1;
}

export function getPrestigeCostAt(prestige: number): number {
  // Always 30,000 NEX — no free prestiges
  return PRESTIGE_COST;
}

export function getNextMilestone(prestige: number): { at: number; label: string } | null {
  for (const m of MILESTONES) {
    if (m.at > prestige) return { at: m.at, label: m.label };
  }
  return null;
}

export function getTapsPerPrestige(prestige: number): number {
  const cost = getPrestigeCostAt(prestige);
  const mult = getNexMultAt(prestige);
  return Math.ceil(cost / (NEX_PER_TAP * mult));
}

// ─── Tap Reward Calculation ───────────────────────────────────────

export interface TapContext {
  prestige: number;
  streak: number;
  crownBurst: boolean;
  nexMult: number;
  lpTapMult?: number;
}

export interface TapResult {
  reward: number;
  /** Human-readable multiplier suffix, e.g. " ×2.5" or empty */
  multLabel: string;
}

export function computeTapReward(ctx: TapContext): TapResult {
  let reward = NEX_PER_TAP * ctx.nexMult;
  let multLabel = "";

  // LP challenge boost
  const lpMult = ctx.lpTapMult ?? 1.0;
  if (lpMult > 1.0) {
    reward = Math.floor(reward * lpMult);
    multLabel = ` 🌊×${lpMult.toFixed(1)}`;
  }

  // Streak bonus (unlocks at prestige 5)
  if (ctx.prestige >= 5 && ctx.streak >= 5) {
    const streakMult = 1 + ctx.streak * 0.1;
    reward = Math.floor(reward * streakMult);
    multLabel = ` 👑×${streakMult.toFixed(1)}`;
  }

  // Crown burst overrides streak label
  if (ctx.crownBurst) {
    reward = Math.floor(reward * 3);
    multLabel = " 🔥×3";
  }

  return { reward, multLabel };
}

// ─── Forge ────────────────────────────────────────────────────────

export interface NftEntry {
  prestige: number;
  seed: number;
  /** base58 SPL mint address if minted on-chain, null if local-only */
  mintAddress?: string | null;
}

// ─── Token Ecosystem Constants ──────────────────────────────────
export const TOKEN_NAMES: string[] = [
  "CROWN", "ORACLE", "ANVIL", "ECHO", "FORGE",
  "TIDE", "VAULT", "RIFT", "PRIME",
];

export const TOKEN_COLORS: string[] = [
  "#ffaa00", "#aa44ff", "#888888", "#44aaff", "#ff4444",
  "#00ccaa", "#ffd700", "#ff66aa", "#ff00ff",
];

export const TIER_NAMES: string[] = ["Bronze", "Silver", "Gold", "Diamond"];
export const TIER_COLORS: string[] = ["#cd7f32", "#c0c0c0", "#ffd700", "#b9f2ff"];

export const BASE_PRODUCTION_RATES: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 10];

export interface HorizontalPair {
  a: number;
  b: number;
  desc: string;
}

/** All horizontal synergies from v3 doc */
export const HORIZONTAL_PAIRINGS: HorizontalPair[] = [
  { a: 0, b: 1, desc: "Crown Points become twice as effective (-20% cost instead of -10%)" },
  { a: 2, b: 4, desc: "Forged NEX becomes 4× efficient (was 3×)" },
  { a: 3, b: 5, desc: "Tidal Energy regenerates 2× faster" },
  { a: 6, b: 7, desc: "Rift Fragments generate +50% more" },
  { a: 8, b: 4, desc: "Prestige consumes less: only requires 6 tokens instead of all 9" },
  { a: 0, b: 5, desc: "Auto-burn milestone tracking — TIDE auto-burns count toward CROWN milestones" },
  { a: 1, b: 6, desc: "Protocol revenue distribution becomes visible in real-time" },
  { a: 2, b: 7, desc: "Combo multiplier applies to batch burns too" },
];

/** Get the description of what a pair produces */
export function getPairingResult(a: number, b: number): string {
  const pair = HORIZONTAL_PAIRINGS.find(
    (p) => (p.a === a && p.b === b) || (p.a === b && p.b === a)
  );
  return pair?.desc ?? "No synergy found for this pair";
}

/** Count active pairs involving a specific token */
export function getActivePairBonusForToken(activePairs: { a: number; b: number }[], tokenIndex: number): number {
  let count = 0;
  for (const pair of activePairs) {
    if (pair.a === tokenIndex || pair.b === tokenIndex) {
      // Verify this pair is in the recognized list
      const match = HORIZONTAL_PAIRINGS.find(
        (p) => (p.a === pair.a && p.b === pair.b) || (p.a === pair.b && p.b === pair.a)
      );
      if (match) count++;
    }
  }
  return count;
}

/** Extract tier counts for a token from the flat tier_counts array */
export function getTokenTierCounts(tierCounts: number[], tokenIndex: number): number[] {
  const base = tokenIndex * 4;
  return [
    tierCounts[base] ?? 0,
    tierCounts[base + 1] ?? 0,
    tierCounts[base + 2] ?? 0,
    tierCounts[base + 3] ?? 0,
  ];
}

/** Get highest tier held for a token (flat tier_counts array: [token0_Bronze, token0_Silver, ...]) */
export function getHighestTier(tierCounts: number[][], tokenIndex: number): number {
  const tiers = tierCounts[tokenIndex] ?? [0, 0, 0, 0];
  for (let t = 3; t >= 0; t--) {
    if (tiers[t] > 0) return t;
  }
  return -1;
}

/** Check if any tier of a token exists (2D array) */
export function hasAnyTier(tierCounts: number[][], tokenIndex: number): boolean {
  const tiers = tierCounts[tokenIndex] ?? [0, 0, 0, 0];
  return tiers.some((c) => c > 0);
}

/** Check if user can upgrade a token (has 3 of current highest tier) */
export function canUpgradeToken(tierCounts: number[][], tokenIndex: number): {
  can: boolean;
  highestTier: number;
  nextTier: number;
} {
  const tiers = tierCounts[tokenIndex] ?? [0, 0, 0, 0];
  let highest = -1;
  for (let t = 3; t >= 0; t--) {
    if (tiers[t] > 0) { highest = t; break; }
  }
  if (highest === -1 || highest >= 3) return { can: false, highestTier: highest, nextTier: -1 };
  return { can: tiers[highest] >= 3, highestTier: highest, nextTier: highest + 1 };
}

/** Try to forge 3 matching NFTs → 1 at next level.
 *  Returns { forged: true, consumed, produced } or { forged: false } */
export function tryForge(nfts: NftEntry[]): { forged: false } | {
  forged: true;
  consumed: NftEntry[];
  remaining: NftEntry[];
  produced: NftEntry;
} {
  const counts: Record<number, number> = {};
  for (const nft of nfts) {
    counts[nft.prestige] = (counts[nft.prestige] || 0) + 1;
  }
  const levels = Object.keys(counts).map(Number).sort((a, b) => a - b);
  for (const lvl of levels) {
    if (counts[lvl] >= 3) {
      let toRemove = 3;
      const consumed: NftEntry[] = [];
      const remaining: NftEntry[] = [];
      for (const nft of nfts) {
        if (nft.prestige === lvl && toRemove > 0) {
          consumed.push(nft);
          toRemove--;
          continue;
        }
        remaining.push(nft);
      }
      const newLevel = Math.min(100, lvl + 1);
      const produced: NftEntry = { prestige: newLevel, seed: Math.floor(Math.random() * 1_000_000) };
      return { forged: true, consumed, remaining, produced };
    }
  }
  return { forged: false };
}