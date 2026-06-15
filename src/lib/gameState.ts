// ─── Game State — Reducer + Persistence ──────────────────────────
import { computeTapReward, getNexMultAt, getPrestigeCostAt, tryForge } from "./gameEngine";
import type { NftEntry } from "./gameEngine";

// ─── Types ────────────────────────────────────────────────────────

/** Schema version — bump when GameState shape changes */
export const GAME_STATE_VERSION = 2;
export const STORAGE_KEY = "void-protocol-save-v2";

export interface GameState {
  nex: number;
  xnt: number;
  prestige: number;
  streak: number;
  lastTap: number;
  crownBurst: boolean;
  crownBurstTaps: number;
  mintedNfts: NftEntry[];
  mintCounts: Record<number, number>;
  totalBurned: number;
  dailyTaps: number;
  dailyReset: number;
  tokens: Record<number, number>;
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
}

export type GameAction =
  | { type: "TAP"; now: number }
  | { type: "PRESTIGE" }
  | { type: "MINT"; seed: number; mintAddress?: string | null }
  | { type: "BURN_NFT"; prestigeLvl: number; seed: number; mintAddress?: string | null }
  | { type: "FORGE" }
  | { type: "ACTIVATE_CROWN_BURST" }
  | { type: "PAY_DEV_FEE" }
  | { type: "RESET_DAILY"; now: number }
  | { type: "HYDRATE"; saved: GameState }
  | { type: "BUY_NFT"; prestige: number; seed: number; price: number }
  | { type: "RESET_GAME" }
  | { type: "START_DEMO" }
  | { type: "PROVIDE_LP"; prestige: number };

export const PRESTIGE_XNT_COST = 0.1;

const STREAK_TIMEOUT_MS = 8_000;
const DAILY_MS = 86_400_000;

export function createInitialState(): GameState {
  return {
    nex: 0,
    xnt: 0,
    prestige: 0,
    streak: 0,
    lastTap: 0,
    crownBurst: false,
    crownBurstTaps: 0,
    mintedNfts: [],
    mintCounts: {},
    totalBurned: 0,
    dailyTaps: 0,
    dailyReset: Date.now(),
    tokens: {},
    lpProvided: {},
    lpPoolByTier: {},
    xntDevFeePaid: false,
    gameStarted: false,
    gameCompleted: false,
    demoMode: false,
    _rev: 0,
    marketDevFeePool: 0,
    gameRun: 0,
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "TAP": {
      const nexMult = getNexMultAt(state.prestige);

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
        nexMult,
      });

      return {
        ...state,
        nex: state.nex + reward,
        streak: newStreak,
        lastTap: action.now,
        crownBurst: newCrownBurst,
        crownBurstTaps: newCrownBurstTaps,
        totalBurned: state.totalBurned + reward,
        dailyTaps: state.dailyTaps + 1,
        _rev: state._rev + 1,
      };
    }

    case "PRESTIGE": {
      if (state.prestige >= 100) return state;
      const cost = getPrestigeCostAt(state.prestige);
      if (state.nex < cost) return state;
      return {
        ...state,
        nex: state.nex - cost,
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
      const maxMints = state.prestige >= 100 ? 1 : 10;
      const currentCount = state.mintCounts[state.prestige] || 0;
      if (currentCount >= maxMints) return state;
      const cost = 5000; // NEX cost to mint
      if (state.nex < cost) return state;
      const newNft: NftEntry = {
        prestige: state.prestige,
        seed: action.seed ?? Math.floor(Math.random() * 1_000_000),
        mintAddress: action.mintAddress ?? null,
      };
      const newMintCounts = { ...state.mintCounts, [state.prestige]: currentCount + 1 };
      return {
        ...state,
        nex: state.nex - cost,
        mintedNfts: [...state.mintedNfts, newNft],
        mintCounts: newMintCounts,
        _rev: state._rev + 1,
      };
    }

    case "BURN_NFT": {
      const nftIndex = state.mintedNfts.findIndex(
        n => n.prestige === action.prestigeLvl && n.seed === action.seed
      );
      if (nftIndex === -1) return state;
      const newNfts = [...state.mintedNfts];
      newNfts.splice(nftIndex, 1);
      const lvl = action.prestigeLvl;
      const newCounts = { ...state.mintCounts };
      newCounts[lvl] = (newCounts[lvl] || 0) - 1;
      if (newCounts[lvl] <= 0) delete newCounts[lvl];
      return {
        ...state,
        mintedNfts: newNfts,
        mintCounts: newCounts,
        tokens: { ...state.tokens, [lvl]: (state.tokens[lvl] || 0) + 1 },
        _rev: state._rev + 1,
      };
    }

    case "FORGE": {
      const result = tryForge(state.mintedNfts);
      if (!result.forged) return state;
      // Decrement mintCounts for consumed prestige levels
      const newCounts = { ...state.mintCounts };
      for (const consumed of result.consumed) {
        const lvl = consumed.prestige;
        newCounts[lvl] = (newCounts[lvl] || 0) - 1;
        if (newCounts[lvl] <= 0) delete newCounts[lvl];
      }
      return {
        ...state,
        mintedNfts: [...result.remaining, result.produced],
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

    case "RESET_DAILY": {
      return { ...state, dailyTaps: 0, dailyReset: action.now, _rev: state._rev + 1 };
    }

    case "HYDRATE": {
      return { ...action.saved, _rev: state._rev + 1 };
    }

    case "BUY_NFT": {
      const tier = action.prestige;
      // Tiered dev fee per whitepaper: 0.5% P1-P20, 0.75% P21-P50, 1.0% P51-P80, 1.25% P81-P100
      let feeBps: number;
      if (tier <= 20) feeBps = 50;
      else if (tier <= 50) feeBps = 75;
      else if (tier <= 80) feeBps = 100;
      else feeBps = 125;
      const fee = Math.ceil(action.price * feeBps / 10000);
      const totalPrice = action.price + fee;
      if (state.xnt < totalPrice) return state;
      const newNft: NftEntry = {
        prestige: tier,
        seed: action.seed,
        mintAddress: null,
      };
      return {
        ...state,
        xnt: state.xnt - totalPrice,
        mintedNfts: [...state.mintedNfts, newNft],
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
    // Try new versioned key first
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed._version && parsed._version !== GAME_STATE_VERSION) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return parsed as GameState;
    }
    // Fallback: migrate from old key
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
