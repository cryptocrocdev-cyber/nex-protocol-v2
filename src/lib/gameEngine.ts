// ─── Game Engine — Pure Math, No React ──────────────────────────
// All reward calculations, milestone checks, and game rules live here.
// Nothing depends on React — testable anywhere.

export const XNT_PER_TAP = 0.001;

// ─── XEN Formula — Lives INSIDE Each Token ─────────────────────
// NEX is soulbound. Each prestige token (iNFT) is its own XEN terminal.
// The formula determines yield based on:
//   - Your serial number (earlier = more)
//   - Global mints at that level (more mints = less yield per token)
//   - Prestige level (higher levels = more yield)
//   - Lock term (longer lock = amplified yield)

export const XEN_G = 0.05;              // Global growth factor
const XEN_BASE_YIELD = 0.001;          // Base XNT per day per token
const XEN_MAX_TERM_DAYS = 365;         // Max lock duration
const XEN_MAX_TERM_MULT = 5;           // Max multiplier at 365 days
const XEN_LEVEL_YIELD_MULT = 0.5;      // How much yield scales per level

/**
 * Term multiplier: lock token for X days to amplify yield.
 * Linear from 1x (0 days) to XEN_MAX_TERM_MULT (365 days).
 */
export function getTermMultiplier(termDays: number): number {
  if (termDays <= 0) return 1;
  const clamped = Math.min(termDays, XEN_MAX_TERM_DAYS);
  return 1 + (XEN_MAX_TERM_MULT - 1) * (clamped / XEN_MAX_TERM_DAYS);
}

/**
 * Quadratic mint cost: 0.001 × level² XNT
 */
export function getMintCost(prestige: number): number {
  return 0.001 * prestige * prestige;
}

/**
 * Unlock threshold: tokens needed to unlock next level
 * Formula: 2 × (1 + 0.2 × ln(1 + globalMintsAtThisLevel))
 */
export function getUnlockThreshold(level: number, globalMintsAtLevel: number): number {
  const base = 2;
  return Math.max(2, Math.floor(base * (1 + 0.2 * Math.log(1 + globalMintsAtLevel))));
}

/**
 * XEN yield for a SINGLE token.
 * - prestigeLevel: 1-100 (higher = more yield)
 * - yourSerial: your position in the mint order for this level (1 = first)
 * - globalMintsAtLevel: total tokens minted at this level by ALL wallets
 * - termDays: how many days the token is locked (0 = not locked)
 *
 * Formula:
 *   baseYield = XEN_BASE_YIELD * (1 + prestigeLevel * XEN_LEVEL_YIELD_MULT)
 *   supplyFactor = 1 - 0.05 * ln(1 + globalMintsAtLevel)  [decay as more mint]
 *   rankFactor = 1 - 0.5 * ln(yourSerial) / ln(max(globalMintsAtLevel, 1))  [earlier = more]
 *   final = baseYield * max(0, supplyFactor) * max(0, rankFactor) * termMult
 */
export function getTokenXenYield(
  prestigeLevel: number,
  yourSerial: number,
  globalMintsAtLevel: number,
  termDays: number = 0
): number {
  // Base yield scales with prestige level
  const baseYield = XEN_BASE_YIELD * (1 + prestigeLevel * XEN_LEVEL_YIELD_MULT);

  // Supply decay: more mints at this level = less yield per token
  const supplyFactor = 1 - XEN_G * Math.log(1 + globalMintsAtLevel);
  if (supplyFactor <= 0) return 0; // Fully mined out

  // Rank factor: earlier serials earn more
  const rankFactor = globalMintsAtLevel > 1
    ? 1 - 0.5 * Math.log(yourSerial) / Math.log(globalMintsAtLevel)
    : 1;

  // Term multiplier
  const termMult = getTermMultiplier(termDays);

  return baseYield * supplyFactor * rankFactor * termMult;
}

/**
 * Get the XEN rank label for a token.
 */
export function getXenRankLabel(position: number, total: number): string {
  if (total <= 0) return "Genesis";
  const pct = (position / total) * 100;
  if (pct <= 1) return "👑 Genesis";
  if (pct <= 5) return "💎 Early";
  if (pct <= 20) return "⚡ Pioneer";
  if (pct <= 50) return "🌊 Settler";
  return "🏔️ Latecomer";
}

/**
 * How many tokens can be minted at a given prestige level.
 * P1 = 99, P2 = 98, ... P99 = 1, P100 = 1
 */
export function getMaxMintsAtPrestige(prestige: number): number {
  if (prestige >= 100) return 1;
  return Math.max(1, 100 - prestige);
}

/**
 * Total possible tokens across all 100 levels.
 */
export function getTotalPossibleTokens(): number {
  let total = 0;
  for (let p = 1; p <= 100; p++) {
    total += getMaxMintsAtPrestige(p);
  }
  return total; // 4,951
}

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
  { at: 0, label: "🏁 Starter", desc: "Tap to earn XNT" },
  { at: 5, label: "👑 Streak", desc: "Combo streak → bonus XNT" },
  { at: 50, label: "💎 2× Taps", desc: "Double XNT per tap" },
  { at: 100, label: "⭐ MAX", desc: "Final prestige — 1 token only" },
];

// ─── Stat Accessors ───────────────────────────────────────────────

export function getNextMilestone(prestige: number): { at: number; label: string } | null {
  for (const m of MILESTONES) {
    if (m.at > prestige) return { at: m.at, label: m.label };
  }
  return null;
}

// ─── Tap Reward Calculation ───────────────────────────────────────

export interface TapContext {
  prestige: number;
  streak: number;
  crownBurst: boolean;
  lpTapMult?: number;
}

export interface TapResult {
  reward: number;
  /** Human-readable multiplier suffix, e.g. " ×2.5" or empty */
  multLabel: string;
}

export function computeTapReward(ctx: TapContext): TapResult {
  let reward = XNT_PER_TAP;
  let multLabel = "";

  // LP challenge boost
  const lpMult = ctx.lpTapMult ?? 1.0;
  if (lpMult > 1.0) {
    reward = reward * lpMult;
    multLabel = ` 🌊×${lpMult.toFixed(1)}`;
  }

  // Streak bonus (unlocks at prestige 5)
  if (ctx.prestige >= 5 && ctx.streak >= 5) {
    const streakMult = 1 + ctx.streak * 0.1;
    reward = reward * streakMult;
    multLabel = ` 👑×${streakMult.toFixed(1)}`;
  }

  // Crown burst overrides streak label
  if (ctx.crownBurst) {
    reward = reward * 3;
    multLabel = " 🔥×3";
  }

  return { reward, multLabel };
}

// ─── Token (iNFT) Types ──────────────────────────────────────────

export interface TokenEntry {
  prestige: number;       // 1-100
  serial: number;          // Your position in the mint order for this level
  seed: number;
  mintAddress?: string | null;
  /** If locked, when it unlocks (unix ms) */
  lockedUntil?: number | null;
  /** Lock term in days (for display) */
  lockTermDays?: number;
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

/** Try to forge 3 matching tokens → 1 at next level.
 *  Returns { forged: true, consumed, produced } or { forged: false } */
export function tryForge(tokens: TokenEntry[]): { forged: false } | {
  forged: true;
  consumed: TokenEntry[];
  remaining: TokenEntry[];
  produced: TokenEntry;
} {
  const counts: Record<number, number> = {};
  for (const t of tokens) {
    counts[t.prestige] = (counts[t.prestige] || 0) + 1;
  }
  const levels = Object.keys(counts).map(Number).sort((a, b) => a - b);
  for (const lvl of levels) {
    if (counts[lvl] >= 3) {
      let toRemove = 3;
      const consumed: TokenEntry[] = [];
      const remaining: TokenEntry[] = [];
      for (const t of tokens) {
        if (t.prestige === lvl && toRemove > 0) {
          consumed.push(t);
          toRemove--;
          continue;
        }
        remaining.push(t);
      }
      const newLevel = Math.min(100, lvl + 1);
      const produced: TokenEntry = {
        prestige: newLevel,
        serial: 0, // Forged tokens get serial 0 (special)
        seed: Math.floor(Math.random() * 1_000_000),
      };
      return { forged: true, consumed, remaining, produced };
    }
  }
  return { forged: false };
}
