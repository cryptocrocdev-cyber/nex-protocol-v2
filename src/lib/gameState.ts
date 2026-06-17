// ─── Game State — Reducer + Persistence ──────────────────────────
import { computeTapReward, getTokenXenYield, getMaxMintsAtPrestige, tryForge, getUnlockThreshold, getMintCost } from "./gameEngine";
import type { TokenEntry } from "./gameEngine";

// ─── Types ────────────────────────────────────────────────────────

/** Schema version — bump when GameState shape changes */
export const GAME_STATE_VERSION = 5;
export const STORAGE_KEY = "void-protocol-save-v5";

export interface GameState {
  xnt: number;
  prestige: number;
  streak: number;
  lastTap: number;
  crownBurst: boolean;
  crownBurstTaps: number;
  tokens: TokenEntry[];
  mintCounts: Record<number, number>;
  tokenPortfolio: Record<number, number>;
  lpProvided: Record<number, boolean>;
  lpPoolByTier: Record<number, number>;
  xntDevFeePaid: boolean;
  gameStarted: boolean;
  gameCompleted: boolean;
  demoMode: boolean;
  /** Monotonic clock bumped every time game state changes (for hydration detection) */
  _rev: number;
  marketDevFeePool: number;
  gameRun: number;
  // ─── XEN Token State ─────────────────────────────────────────
  /** Per prestige level: how many tokens have been minted globally (across ALL wallets) */
  globalMintCounts: Record<number, number>;
  /** Per prestige level: next serial number to assign */
  nextSerials: Record<number, number>;
  /** Total yield claimed from all tokens */
  totalYieldClaimed: number;
}

export type GameAction =
  | { type: "TAP"; now: number }
  | { type: "PRESTIGE" }
  | { type: "MINT"; seed: number; mintAddress?: string | null }
  | { type: "BURN_TOKEN"; prestigeLvl: number; seed: number; mintAddress?: string | null }
  | { type: "FORGE" }
  | { type: "ACTIVATE_CROWN_BURST" }
  | { type: "PAY_DEV_FEE" }
  | { type: "HYDRATE"; saved: GameState }
  | { type: "BUY_TOKEN"; prestige: number; seed: number; price: number }
  | { type: "RESET_GAME" }
  | { type: "START_DEMO" }
  | { type: "PROVIDE_LP"; prestige: number }
  // ─── XEN Token Actions ──────────────────────────────────────
  | { type: "LOCK_TOKEN"; seed: number; termDays: number; now: number }
  | { type: "UNLOCK_TOKEN"; seed: number; now: number }
  | { type: "CLAIM_YIELD"; now: number };

const STREAK_TIMEOUT_MS = 8_000;

export function createInitialState(): GameState {
  return {
    xnt: 0,
    prestige: 0,
    streak: 0,
    lastTap: 0,
    crownBurst: false,
    crownBurstTaps: 0,
    tokens: [],
    mintCounts: {},
    tokenPortfolio: {},
    lpProvided: {},
    lpPoolByTier: {},
    xntDevFeePaid: false,
    gameStarted: false,
    gameCompleted: false,
    demoMode: false,
    _rev: 0,
    marketDevFeePool: 0,
    gameRun: 0,
    // XEN state
    globalMintCounts: {},
    nextSerials: {},
    totalYieldClaimed: 0,
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "TAP": {
      // Streak
      const isInStreak = action.now - state.lastTap < STREAK_TIMEOUT_MS;
      const newStreak = isInStreak ? state.streak + 1 : 1;

      // Crown burst tap count
      let newCrownBurst = state.crownBurst;
      let newCrownBurstTaps = state.crownBurstTaps;
      if (state.crownBurst) {
        newCrownBurstTaps = state.crownBurstTaps + 1;
        if (newCrownBurstTaps >= 10) {
          newCrownBurst = false;
          newCrownBurstTaps = 0;
        }
      }

      const { reward, multLabel } = computeTapReward({
        prestige: state.prestige,
        streak: newStreak,
        crownBurst: state.crownBurst,
      });

      return {
        ...state,
        xnt: state.xnt + reward,
        streak: newStreak,
        lastTap: action.now,
        crownBurst: newCrownBurst,
        crownBurstTaps: newCrownBurstTaps,
        _rev: state._rev + 1,
      };
    }

    case "PRESTIGE": {
      if (state.prestige >= 100) return state;
      // Count how many tokens the player has at current prestige level
      const tokensAtLevel = state.tokens.filter(t => t.prestige === state.prestige).length;
      const globalMintsAtLevel = state.globalMintCounts[state.prestige] || 0;
      const threshold = getUnlockThreshold(state.prestige, globalMintsAtLevel);
      if (tokensAtLevel < threshold) return state;
      return {
        ...state,
        prestige: state.prestige + 1,
        streak: 0,
        crownBurst: false,
        crownBurstTaps: 0,
        gameCompleted: state.prestige + 1 >= 100,
        _rev: state._rev + 1,
      };
    }

    case "MINT": {
      if (state.prestige < 1) return state;
      const maxMints = getMaxMintsAtPrestige(state.prestige);
      const currentCount = state.mintCounts[state.prestige] || 0;
      if (currentCount >= maxMints) return state;
      const cost = getMintCost(state.prestige);
      if (state.xnt < cost) return state;

      // Assign serial number
      const nextSerial = (state.nextSerials[state.prestige] || 0) + 1;
      const newToken: TokenEntry = {
        prestige: state.prestige,
        serial: nextSerial,
        seed: action.seed ?? Math.floor(Math.random() * 1_000_000),
        mintAddress: action.mintAddress ?? null,
        lockedUntil: null,
        lockTermDays: 0,
      };

      const newMintCounts = { ...state.mintCounts, [state.prestige]: currentCount + 1 };
      const newGlobalCounts = { ...state.globalMintCounts, [state.prestige]: (state.globalMintCounts[state.prestige] || 0) + 1 };
      const newSerials = { ...state.nextSerials, [state.prestige]: nextSerial };

      return {
        ...state,
        xnt: state.xnt - cost,
        tokens: [...state.tokens, newToken],
        mintCounts: newMintCounts,
        globalMintCounts: newGlobalCounts,
        nextSerials: newSerials,
        _rev: state._rev + 1,
      };
    }

    case "BURN_TOKEN": {
      const tokenIndex = state.tokens.findIndex(
        t => t.prestige === action.prestigeLvl && t.seed === action.seed
      );
      if (tokenIndex === -1) return state;
      const newTokens = [...state.tokens];
      newTokens.splice(tokenIndex, 1);
      const lvl = action.prestigeLvl;
      const newCounts = { ...state.mintCounts };
      newCounts[lvl] = (newCounts[lvl] || 0) - 1;
      if (newCounts[lvl] <= 0) delete newCounts[lvl];
      return {
        ...state,
        tokens: newTokens,
        mintCounts: newCounts,
        tokenPortfolio: { ...state.tokenPortfolio, [lvl]: (state.tokenPortfolio[lvl] || 0) + 1 },
        _rev: state._rev + 1,
      };
    }

    case "FORGE": {
      const result = tryForge(state.tokens);
      if (!result.forged) return state;
      const newCounts = { ...state.mintCounts };
      for (const consumed of result.consumed) {
        const lvl = consumed.prestige;
        newCounts[lvl] = (newCounts[lvl] || 0) - 1;
        if (newCounts[lvl] <= 0) delete newCounts[lvl];
      }
      return {
        ...state,
        tokens: [...result.remaining, result.produced],
        mintCounts: newCounts,
        _rev: state._rev + 1,
      };
    }

    case "ACTIVATE_CROWN_BURST": {
      if (state.prestige < 30 || state.crownBurst) return state;
      return {
        ...state,
        crownBurst: true,
        crownBurstTaps: 0,
        _rev: state._rev + 1,
      };
    }

    case "PAY_DEV_FEE": {
      return { ...state, xntDevFeePaid: true, gameStarted: true, demoMode: false, _rev: state._rev + 1 };
    }

    case "HYDRATE": {
      return { ...action.saved, _rev: state._rev + 1 };
    }

    case "BUY_TOKEN": {
      const tier = action.prestige;
      let feeBps: number;
      if (tier <= 20) feeBps = 50;
      else if (tier <= 50) feeBps = 75;
      else if (tier <= 80) feeBps = 100;
      else feeBps = 125;
      const fee = Math.ceil(action.price * feeBps / 10000);
      const totalPrice = action.price + fee;
      if (state.xnt < totalPrice) return state;
      const newToken: TokenEntry = {
        prestige: tier,
        serial: 0, // Bought tokens don't have a serial (not minted by you)
        seed: action.seed,
        mintAddress: null,
        lockedUntil: null,
        lockTermDays: 0,
      };
      return {
        ...state,
        xnt: state.xnt - totalPrice,
        tokens: [...state.tokens, newToken],
        marketDevFeePool: (state.marketDevFeePool || 0) + fee,
        _rev: state._rev + 1,
      };
    }

    case "PROVIDE_LP": {
      if (state.lpProvided[action.prestige]) return state;
      if (state.xnt < 1) return state;
      return {
        ...state,
        xnt: state.xnt - 1,
        lpProvided: { ...state.lpProvided, [action.prestige]: true },
        _rev: state._rev + 1,
      };
    }

    case "START_DEMO": {
      return { ...state, gameStarted: true, demoMode: true, _rev: state._rev + 1 };
    }

    case "RESET_GAME": {
      return {
        ...createInitialState(),
        gameRun: state.gameRun + 1,
        _rev: state._rev + 1,
      };
    }

    // ─── XEN Token Actions ───────────────────────────────────────

    case "LOCK_TOKEN": {
      const idx = state.tokens.findIndex(t => t.seed === action.seed);
      if (idx === -1) return state;
      if (state.tokens[idx].lockedUntil) return state; // Already locked
      if (action.termDays <= 0) return state;
      const now = action.now;
      const unlockAt = now + action.termDays * 86400_000;
      const newTokens = [...state.tokens];
      newTokens[idx] = {
        ...newTokens[idx],
        lockedUntil: unlockAt,
        lockTermDays: action.termDays,
      };
      return {
        ...state,
        tokens: newTokens,
        _rev: state._rev + 1,
      };
    }

    case "UNLOCK_TOKEN": {
      const idx = state.tokens.findIndex(t => t.seed === action.seed);
      if (idx === -1) return state;
      const token = state.tokens[idx];
      if (!token.lockedUntil) return state; // Not locked
      if (action.now < token.lockedUntil) return state; // Still locked

      // Calculate yield earned during lock
      const daysLocked = Math.floor((action.now - (token.lockedUntil - (token.lockTermDays || 0) * 86400_000)) / 86400_000);
      const globalCount = state.globalMintCounts[token.prestige] || 1;
      const yieldPerDay = getTokenXenYield(token.prestige, token.serial, globalCount, token.lockTermDays || 0);
      const totalYield = yieldPerDay * Math.max(1, daysLocked);

      const newTokens = [...state.tokens];
      newTokens[idx] = {
        ...newTokens[idx],
        lockedUntil: null,
        lockTermDays: 0,
      };
      return {
        ...state,
        tokens: newTokens,
        xnt: state.xnt + totalYield,
        totalYieldClaimed: state.totalYieldClaimed + totalYield,
        _rev: state._rev + 1,
      };
    }

    case "CLAIM_YIELD": {
      // Claim yield from all unlocked tokens that have been locked
      let totalYield = 0;
      const newTokens = state.tokens.map(t => {
        if (!t.lockedUntil || action.now < t.lockedUntil) return t;
        // This token's lock expired — auto-unlock and claim
        const daysLocked = Math.floor((action.now - (t.lockedUntil - (t.lockTermDays || 0) * 86400_000)) / 86400_000);
        const globalCount = state.globalMintCounts[t.prestige] || 1;
        const yieldPerDay = getTokenXenYield(t.prestige, t.serial, globalCount, t.lockTermDays || 0);
        totalYield += yieldPerDay * Math.max(1, daysLocked);
        return { ...t, lockedUntil: null, lockTermDays: 0 };
      });
      if (totalYield <= 0) return state;
      return {
        ...state,
        tokens: newTokens,
        xnt: state.xnt + totalYield,
        totalYieldClaimed: state.totalYieldClaimed + totalYield,
        _rev: state._rev + 1,
      };
    }

    default:
      return state;
  }
}

// ─── Persistence ──────────────────────────────────────────────────

export function saveGame(state: GameState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, _version: GAME_STATE_VERSION }));
  } catch { /* storage full or unavailable */ }
}

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed._version && parsed._version !== GAME_STATE_VERSION) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return parsed as GameState;
    }
    const old = localStorage.getItem("void-protocol-save");
    if (old) {
      localStorage.removeItem("void-protocol-save");
      return JSON.parse(old) as GameState;
    }
    return null;
  } catch {
    return null;
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("void-protocol-save");
  } catch { /* noop */ }
}
