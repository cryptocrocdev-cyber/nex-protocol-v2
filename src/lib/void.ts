// 🔥 NEX Protocol V5 — EVM Cancer Removed
// No global counters, no shared vault pool, no O(n) RPC loops, no tick-on-mount

import { Connection, PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import idl from "./void_idl.json";

// ─── Constants ─────────────────────────────────────────────────────────────
import { NETWORK } from "./network";
export { NETWORK, NETWORK_MODE } from "./network";
export const PROGRAM_ID_STR = NETWORK.programId;
export const LAMPORTS_PER_XNT = LAMPORTS_PER_SOL;
export const DEV_WALLET_STR = NETWORK.devWallet;

export const TOKEN_SEEDS: string[] = [
  "crown", "oracle", "anvil", "echo", "forge",
  "tide", "vault", "rift", "prime",
];

export const TOKEN_NAMES: string[] = [
  "CROWN", "ORACLE", "ANVIL", "ECHO", "FORGE",
  "TIDE", "VAULT", "RIFT", "PRIME",
];

export const TOKEN_COLORS: string[] = [
  "#ffaa00", "#aa44ff", "#888888", "#44aaff", "#ff4444",
  "#00ccaa", "#ffd700", "#ff66aa", "#ff00ff",
];

export const TIER_NAMES = ["Bronze", "Silver", "Gold", "Diamond"];
export const TIER_COLORS = ["#cd7f32", "#c0c0c0", "#ffd700", "#b9f2ff"];

// ─── Prestige Token Names & Tickers ─────────────────────────────
// Each prestige level mints a unique Token-2022 with its own ticker.
// Higher prestige = exponentially harder to mint = scarcer supply.
export const PRESTIGE_NAMES: string[] = [
  "WRAITH",
  "PHANTOM",
  "MORTIS",
  "VALOR",
  "SOVEREIGN",
  "SHOGUN",
  "UMBRA",
  "PYREX",
  "TITAN",
  "OMEGA",
  "DRACONIS",
  "PHOENIX",
  "GRYPHON",
  "KRAKEN",
  "CHIMERA",
  "BASILISK",
  "CERBERUS",
  "HYDRA",
  "MINOTAUR",
  "PEGASUS",
  "SOLARIS",
  "LUNARIS",
  "STELLAR",
  "COMET",
  "NEBULA",
  "GALAXY",
  "SUPERNOVA",
  "AURORA",
  "ASTEROID",
  "ECLIPSE",
  "GLADIATOR",
  "CENTURION",
  "VIKING",
  "SAMURAI",
  "SPARTAN",
  "NINJA",
  "MONGOL",
  "KNIGHT",
  "BERSERKER",
  "PALADIN",
  "NECROMANCER",
  "SORCERER",
  "WARLOCK",
  "ALCHEMIST",
  "SHAMAN",
  "DRUID",
  "MAGE",
  "WITCH",
  "RUNEMASTER",
  "SUMMONER",
  "CYBORG",
  "MECHA",
  "DRONE",
  "SENTINEL",
  "HACKER",
  "ANDROID",
  "RAILGUN",
  "CYBER",
  "TURRET",
  "EXO",
  "WOLF",
  "RAVEN",
  "EAGLE",
  "SERPENT",
  "PANTHER",
  "BEAR",
  "FALCON",
  "SCORPION",
  "MANTIS",
  "DRAGONFLY",
  "VOID",
  "QUASAR",
  "PULSAR",
  "COSMONAUT",
  "WORMHOLE",
  "DIMENSION",
  "TIMEKEEPER",
  "ORBIT",
  "ZENITH",
  "NEXUS",
  "EXCALIBUR",
  "THUNDER",
  "FROST",
  "INFERNO",
  "SHADOWBLADE",
  "ARCANE",
  "VENOM",
  "DOOM",
  "HOLY",
  "CHAOS",
  "IMMORTAL",
  "CREATOR",
  "DESTROYER",
  "GODSLAYER",
  "ASCENDED",
  "PRIMORDIAL",
  "TRANSCEND",
  "ABSOLUTE",
  "INFINITE",
  "NEX_PROTOCOL",
];

export const PRESTIGE_TICKERS: string[] = [
  "WRAITH",
  "PHANTM",
  "MORTIS",
  "VALOR",
  "SOVRIN",
  "SHOGUN",
  "UMBRA",
  "PYREX",
  "TITAN",
  "OMEGA",
  "DRACO",
  "PHOENX",
  "GRYPH",
  "KRAKEN",
  "CHIMR",
  "BASIL",
  "CERBR",
  "HYDRA",
  "MINOT",
  "PEGAS",
  "SOLAR",
  "LUNAR",
  "STELL",
  "COMET",
  "NEBLA",
  "GALAX",
  "NOVA",
  "AUROR",
  "ASTRO",
  "ECLPS",
  "GLAD",
  "CENTR",
  "VIKNG",
  "SAMUR",
  "SPART",
  "NINJA",
  "MONGOL",
  "KNIGHT",
  "BERSE",
  "PALAD",
  "NECRO",
  "SORCE",
  "WARLK",
  "ALCHE",
  "SHAMN",
  "DRUID",
  "MAGE",
  "WITCH",
  "RUNE",
  "SUMMN",
  "CYBRG",
  "MECHA",
  "DRONE",
  "SENTL",
  "HACKR",
  "ANDRD",
  "RAILG",
  "CYBER",
  "TURRT",
  "EXOSUIT",
  "WOLF",
  "RAVEN",
  "EAGLE",
  "SERP",
  "PANTH",
  "BEAR",
  "FALCN",
  "SCORP",
  "MANTI",
  "DRFLY",
  "VOID",
  "QUASAR",
  "PULSR",
  "COSMO",
  "WORM",
  "DIMEN",
  "TIME",
  "ORBIT",
  "ZENITH",
  "NEXUS",
  "EXCAL",
  "THNDR",
  "FROST",
  "INFRN",
  "SHDBL",
  "ARCANE",
  "VENOM",
  "DOOM",
  "HOLY",
  "CHAOS",
  "IMMORT",
  "CREAT",
  "DSTRY",
  "GODSL",
  "ASCEND",
  "PRIMO",
  "TRSCND",
  "ABS",
  "INF",
  "NEXPRO",
];

export const PRESTIGE_COLORS: string[] = [
  "#00ddff",
  "#bb44ff",
  "#ffbb00",
  "#ff3344",
  "#ffffff",
  "#00ff88",
  "#ff6699",
  "#ff8800",
  "#44ccff",
  "#00ff66",
  "#ff4400",
  "#ff6600",
  "#ccaa00",
  "#0066aa",
  "#88ff00",
  "#44dd00",
  "#ff5500",
  "#00aa44",
  "#884400",
  "#aaccff",
  "#ffdd00",
  "#cceeff",
  "#88bbff",
  "#44ffff",
  "#ff66cc",
  "#aa44ff",
  "#ff44ff",
  "#44ffaa",
  "#886644",
  "#440066",
  "#cc4444",
  "#aa2222",
  "#4488aa",
  "#cc2222",
  "#ff4444",
  "#222244",
  "#886622",
  "#888899",
  "#cc6600",
  "#ffddaa",
  "#440044",
  "#6600aa",
  "#8800cc",
  "#44aa44",
  "#448844",
  "#226622",
  "#4444cc",
  "#664488",
  "#888800",
  "#aa44aa",
  "#44dddd",
  "#ffaa00",
  "#44cc88",
  "#88aacc",
  "#00ff44",
  "#aaddff",
  "#44aaff",
  "#ee44ff",
  "#88aa00",
  "#4466aa",
  "#8899aa",
  "#222244",
  "#ccaa44",
  "#446622",
  "#332233",
  "#664422",
  "#885533",
  "#88aa44",
  "#44aa44",
  "#44ddff",
  "#220044",
  "#8844ff",
  "#44ddff",
  "#4488ff",
  "#ff44aa",
  "#cc88ff",
  "#44ccaa",
  "#6688cc",
  "#ffdd88",
  "#ffffff",
  "#88ccff",
  "#aaccff",
  "#88eeff",
  "#ff2200",
  "#444466",
  "#8844aa",
  "#44dd44",
  "#ff0044",
  "#ffddaa",
  "#ff44ff",
  "#ffd700",
  "#ffffff",
  "#ff0044",
  "#ff6600",
  "#44ccff",
  "#ff88aa",
  "#aa88ff",
  "#ffffff",
  "#44ffff",
  "#ff00ff",
];

export const PRESTIGE_SYMBOLS: string[] = [
  "Chevron",
  "Cross Bullets",
  "Skull",
  "Hex Star",
  "Crown",
  "Cross Swords",
  "Diamond",
  "Torch",
  "Anchor",
  "Shield",
  "Dragon",
  "Phoenix",
  "Griffin",
  "Kraken",
  "Chimera",
  "Serpent",
  "Three Heads",
  "Multi Heads",
  "Bull Head",
  "Winged Horse",
  "Sun",
  "Moon",
  "Star Cluster",
  "Comet Trail",
  "Nebula Cloud",
  "Galaxy Spiral",
  "Explosion",
  "Aurora Wave",
  "Asteroid Ring",
  "Eclipse Ring",
  "Trident",
  "Roman Shield",
  "Battle Axe",
  "Katana",
  "Lambda Shield",
  "Shuriken",
  "Bow & Arrow",
  "Longsword",
  "Double Axe",
  "Holy Crest",
  "Skull Staff",
  "Crystal Ball",
  "Eldritch Eye",
  "Philosopher",
  "Totem Pole",
  "Oak Staff",
  "Spellbook",
  "Cauldron",
  "Rune Stone",
  "Portal Ring",
  "Circuit",
  "Gear",
  "Quad Rotor",
  "Watchtower",
  "Binary Grid",
  "Humanoid Face",
  "Rail Cannon",
  "Neon Skull",
  "Auto Cannon",
  "Power Armor",
  "Wolf Head",
  "Raven Wing",
  "Eagle Talon",
  "Coiled Snake",
  "Panther Head",
  "Bear Claw",
  "Falcon Dive",
  "Scorpion Tail",
  "Praying Mantis",
  "Dragonfly Wing",
  "Black Hole",
  "Quasar Jet",
  "Pulse Ring",
  "Space Helmet",
  "Portal Spiral",
  "Cube Portal",
  "Hourglass",
  "Elliptical",
  "Zenith Point",
  "Nexus Core",
  "Sword Stone",
  "Lightning Bolt",
  "Ice Crystal",
  "Fire Cross",
  "Dark Blade",
  "Magic Orb",
  "Venom Drop",
  "Doom Skull",
  "Holy Cross",
  "Chaos Spiral",
  "Infinity",
  "Creation Hand",
  "Destruction",
  "God Blade",
  "Ascension Wing",
  "Primordial Eye",
  "Transcendent",
  "Absolute Zero",
  "Infinity Loop",
  "NEXUS Crown",
];

export const MAX_TIERS = 4;
export const MAX_TOKENS = 99;

// ─── Public keys ───────────────────────────────────────────────────────────
export function getProgramId(): PublicKey {
  return new PublicKey(PROGRAM_ID_STR);
}

export function getDevWallet(): PublicKey {
  return new PublicKey(DEV_WALLET_STR);
}

// ─── PDAs ──────────────────────────────────────────────────────────────────
export function getProtocolStatePDA(): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("protocol_state")],
    getProgramId()
  );
  return pda;
}

export function getUserStatePDA(user: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("user_state"), user.toBuffer()],
    getProgramId()
  );
  return pda;
}

export function getPrestigePDA(user: PublicKey, count: BN | number): PublicKey {
  const c = typeof count === "number" ? count : count.toNumber();
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(BigInt(c));
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("prestige_medal"), user.toBuffer(), buf],
    getProgramId()
  );
  return pda;
}

export function getPrestigeNftPDA(user: PublicKey, count: BN | number): PublicKey {
  const c = typeof count === "number" ? count : count.toNumber();
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(BigInt(c));
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("prestige_nft"), user.toBuffer(), buf],
    getProgramId()
  );
  return pda;
}

export function getPrestigeNftAta(user: PublicKey, count: BN | number): PublicKey {
  const mint = getPrestigeNftPDA(user, count);
  return PublicKey.findProgramAddressSync(
    [
      user.toBuffer(),
      ASSOCIATED_TOKEN_PROGRAM_ID.toBuffer(),
      TOKEN_2022_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    ASSOCIATED_TOKEN_PROGRAM_ID
  )[0];
}

export function getPairPDA(user: PublicKey, a: number, b: number): PublicKey {
  const bufA = Buffer.alloc(8);
  bufA.writeBigUInt64LE(BigInt(a));
  const bufB = Buffer.alloc(8);
  bufB.writeBigUInt64LE(BigInt(b));
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("token_pair"), user.toBuffer(), bufA, bufB],
    getProgramId()
  );
  return pda;
}

// VAULT_SHARE PDA REMOVED — vault rewards are per-user UserState fields

export function getBurnVaultPDA(): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("burn_vault")],
    getProgramId()
  );
  return pda;
}

export function getPrestigeSupplyPDA(prestigeNumber: number): PublicKey {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(BigInt(prestigeNumber));
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("prestige_supply"), buf],
    getProgramId()
  );
  return pda;
}

// ─── Program Factory ───────────────────────────────────────────────────────
export function getVoidProgram(provider: AnchorProvider): Program {
  return new Program(idl as any, provider);
}

// ─── Account Fetchers ──────────────────────────────────────────────────────
export async function fetchProtocolState(connection: Connection, program?: Program): Promise<any | null> {
  try {
    const pda = getProtocolStatePDA();
    if (program) return await (program.account as any).protocolState.fetch(pda);
    return null;
  } catch { return null; }
}

export async function fetchUserState(connection: Connection, user: PublicKey, program?: Program): Promise<any | null> {
  try {
    const pda = getUserStatePDA(user);
    if (program) return await (program.account as any).userState.fetch(pda);
    return null;
  } catch { return null; }
}

/** Batched prestige medal fetcher — O(1) RPC instead of O(n) */
export async function fetchPrestigeMedals(connection: Connection, user: PublicKey, count: number, program?: Program): Promise<any[]> {
  if (count <= 0 || !program) return [];
  
  // Build all PDAs at once
  const pdas: PublicKey[] = [];
  for (let i = 0; i < count; i++) {
    pdas.push(getPrestigePDA(user, i));
  }
  
  // Single batched RPC call
  const accounts = await connection.getMultipleAccountsInfo(pdas);
  
  const results: any[] = [];
  for (let i = 0; i < accounts.length; i++) {
    if (accounts[i]) {
      try {
        const m = (program.account as any).prestigeMedal.coder.accounts.decode(
          "PrestigeMedal",
          accounts[i]!.data
        );
        results.push(m);
      } catch { /* skip corrupt */ }
    }
  }
  return results;
}

/** Fetch a single PrestigeSupply PDA for a given prestige number */
export async function fetchPrestigeSupply(connection: Connection, prestigeNumber: number, program?: Program): Promise<{ totalMinted: number; totalBurned: number } | null> {
  if (!program) return null;
  try {
    const pda = getPrestigeSupplyPDA(prestigeNumber);
    const acc = await (program.account as any).prestigeSupply.fetch(pda);
    return {
      totalMinted: acc.totalMinted?.toNumber() ?? 0,
      totalBurned: acc.totalBurned?.toNumber() ?? 0,
    };
  } catch { return null; }
}

/**
 * PrestigeSupply discriminator (first 8 bytes of Borsh-serialized account)
 * From IDL: [27, 123, 6, 111, 155, 88, 241, 70]
 */
const PRESTIGE_SUPPLY_DISCRIMINATOR = new Uint8Array([27, 123, 6, 111, 155, 88, 241, 70]);

/**
 * Decode a PrestigeSupply account from raw bytes (no Anchor dependency)
 * Layout: discriminator(8) + prestige_number(u64=8) + total_minted(u64=8) + total_burned(u64=8) + bump(u8=1)
 */
function decodePrestigeSupply(data: Buffer): { totalMinted: number; totalBurned: number } | null {
  if (data.length < 33) return null;
  // Verify discriminator
  for (let i = 0; i < 8; i++) {
    if (data[i] !== PRESTIGE_SUPPLY_DISCRIMINATOR[i]) return null;
  }
  // Read u64 LE at offset 8, 16, 24
  const readU64LE = (offset: number): number =>
    Number(data.readBigUInt64LE(offset));
  return {
    totalMinted: readU64LE(16),
    totalBurned: readU64LE(24),
  };
}

/** Batch fetch all PrestigeSupply PDAs for prestige numbers 1..count */
export async function fetchAllPrestigeSupplies(connection: Connection, count: number, program?: Program): Promise<Map<number, { totalMinted: number; totalBurned: number }>> {
  const map = new Map<number, { totalMinted: number; totalBurned: number }>();
  if (count <= 0) return map;

  const pdas: PublicKey[] = [];
  for (let i = 1; i <= count; i++) {
    pdas.push(getPrestigeSupplyPDA(i));
  }

  const accounts = await connection.getMultipleAccountsInfo(pdas);
  for (let i = 0; i < accounts.length; i++) {
    if (accounts[i]) {
      const decoded = decodePrestigeSupply(accounts[i]!.data);
      if (decoded) {
        map.set(i + 1, decoded);
      }
    }
  }
  return map;
}

export async function fetchTokenPair(connection: Connection, user: PublicKey, a: number, b: number, program?: Program): Promise<any | null> {
  try {
    const pda = getPairPDA(user, a, b);
    if (program) return await (program.account as any).tokenPair.fetch(pda);
    return null;
  } catch { return null; }
}

// ─── Instruction Builders (V5 — no global state serialization) ─────────────

export async function buildInitProtocolTx(program: Program, authority: PublicKey, devWallet: PublicKey) {
  return program.methods.initProtocol(devWallet).accounts({
    protocolState: getProtocolStatePDA(),
    authority,
    systemProgram: SystemProgram.programId,
  });
}

export async function buildInitUserTx(program: Program, user: PublicKey) {
  return program.methods.initUser().accounts({
    userState: getUserStatePDA(user),
    user,
    systemProgram: SystemProgram.programId,
  });
}

export async function buildBurnXntTx(program: Program, user: PublicKey, amountLamports: number) {
  return program.methods.burnXnt(new BN(amountLamports)).accounts({
    protocolState: getProtocolStatePDA(),  // READ-ONLY
    userState: getUserStatePDA(user),
    burnVault: getBurnVaultPDA(),
    user,
    systemProgram: SystemProgram.programId,
  });
}

export async function buildClaimNexTx(program: Program, user: PublicKey) {
  return program.methods.claimNex().accounts({
    userState: getUserStatePDA(user),
    user,
    systemProgram: SystemProgram.programId,
  });
}

/** Tap to mint NEX */
export async function buildMintNexTapTx(program: Program, user: PublicKey) {
  return program.methods.mintNexTap().accounts({
    protocolState: getProtocolStatePDA(),  // READ-ONLY
    userState: getUserStatePDA(user),
    user,
    systemProgram: SystemProgram.programId,
  });
}

/** Mint Bronze tier of a child token (priced from config, not total_nex_supply) */
export async function buildMintBronzeTx(program: Program, user: PublicKey, tokenIndex: number) {
  return program.methods.mintBronze(tokenIndex).accounts({
    protocolState: getProtocolStatePDA(),  // READ-ONLY
    userState: getUserStatePDA(user),
    devWallet: getDevWallet(),
    user,
    systemProgram: SystemProgram.programId,
  });
}

/** Upgrade tier: 3× same tier + NEX → next tier */
export async function buildUpgradeTierTx(program: Program, user: PublicKey, tokenIndex: number) {
  return program.methods.upgradeTier(tokenIndex).accounts({
    protocolState: getProtocolStatePDA(),  // READ-ONLY
    userState: getUserStatePDA(user),
    devWallet: getDevWallet(),
    user,
    systemProgram: SystemProgram.programId,
  });
}

/** Set burn boost slider (1-5×) */
export async function buildSetBurnBoostSliderTx(program: Program, user: PublicKey, mult: number) {
  return program.methods.setBurnBoostSlider(mult).accounts({
    protocolState: getProtocolStatePDA(),  // READ-ONLY
    userState: getUserStatePDA(user),
    devWallet: getDevWallet(),
    user,
    systemProgram: SystemProgram.programId,
  });
}

/** Stake VOLT — no protocol state needed */
export async function buildStakeAshTx(program: Program, user: PublicKey, amount: BN) {
  return program.methods.stakeAsh(amount).accounts({
    userState: getUserStatePDA(user),
    user,
    systemProgram: SystemProgram.programId,
  });
}

/** Unstake VOLT — no protocol state needed */
export async function buildUnstakeAshTx(program: Program, user: PublicKey, amount: BN) {
  return program.methods.unstakeAsh(amount).accounts({
    userState: getUserStatePDA(user),
    user,
    systemProgram: SystemProgram.programId,
  });
}

export async function buildPrestigeTx(program: Program, user: PublicKey) {
  const userStatePDA = getUserStatePDA(user);
  let prestigeCount = 0;
  try {
    const state = await (program.account as any).userState.fetch(userStatePDA);
    prestigeCount = state.prestigeCount.toNumber();
  } catch { /* new user */ }
  const prestigePDA = getPrestigePDA(user, prestigeCount);

  return program.methods.prestige().accounts({
    protocolState: getProtocolStatePDA(),  // READ-ONLY
    userState: userStatePDA,
    prestigeMedal: prestigePDA,
    devWallet: getDevWallet(),
    user,
    systemProgram: SystemProgram.programId,
  });
}

export async function buildMintPrestigeNftTx(program: Program, user: PublicKey) {
  const userStatePDA = getUserStatePDA(user);
  let prestigeCount = 0;
  try {
    const state = await (program.account as any).userState.fetch(userStatePDA);
    prestigeCount = state.prestigeCount.toNumber();
  } catch { /* new user */ }

  const nftMintPDA = getPrestigeNftPDA(user, prestigeCount);
  const nftAta = getPrestigeNftAta(user, prestigeCount);

  return program.methods.mintPrestigeNft().accounts({
    userState: userStatePDA,
    prestigeNftMint: nftMintPDA,
    userPrestigeNftAta: nftAta,
    user,
    tokenProgram: TOKEN_2022_PROGRAM_ID,
    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
  });
}

export async function buildPairTokensTx(program: Program, user: PublicKey, aIdx: number, bIdx: number) {
  return program.methods.pairTokens(aIdx, bIdx).accounts({
    protocolState: getProtocolStatePDA(),  // READ-ONLY
    userState: getUserStatePDA(user),
    tokenPair: getPairPDA(user, aIdx, bIdx),
    childTokenA: getChildTokenPDA(user, aIdx),
    childTokenB: getChildTokenPDA(user, bIdx),
    devWallet: getDevWallet(),
    user,
    systemProgram: SystemProgram.programId,
  });
}

/** Tick production — NO protocol state needed */
export async function buildTickProductionTx(program: Program, user: PublicKey) {
  return program.methods.tickProduction().accounts({
    userState: getUserStatePDA(user),
    user,
    systemProgram: SystemProgram.programId,
  });
}

/** Claim vault reward — per-user credit, no protocol state, no vault PDA */
export async function buildClaimVaultRewardTx(program: Program, user: PublicKey) {
  return program.methods.claimVaultReward().accounts({
    userState: getUserStatePDA(user),
    user,
    systemProgram: SystemProgram.programId,
  });
}

export async function buildCosmeticUpgradeTx(program: Program, user: PublicKey, upgradeKind: number) {
  return program.methods.cosmeticUpgrade(upgradeKind).accounts({
    protocolState: getProtocolStatePDA(),  // READ-ONLY
    userState: getUserStatePDA(user),
    devWallet: getDevWallet(),
    user,
    systemProgram: SystemProgram.programId,
  });
}

/** Consume prestige medals — sourceCount parameter removed */
export async function buildConsumeMedalsTx(program: Program, user: PublicKey, count: number) {
  // Fetch latest prestige count from user state
  let prestigeCount = 0;
  try {
    const state = await (program.account as any).userState.fetch(getUserStatePDA(user));
    prestigeCount = state.prestigeCount?.toNumber() ?? 0;
  } catch {}
  // If no medals, target will fail gracefully on-chain
  const latestMedal = Math.max(0, prestigeCount - 1);
  return program.methods.consumePrestigeMedals(new BN(count)).accounts({
    userState: getUserStatePDA(user),
    targetMedal: getPrestigePDA(user, latestMedal),
    user,
    systemProgram: SystemProgram.programId,
  });
}

export async function buildSetTokenPriceTx(program: Program, authority: PublicKey, index: number, newPrice: BN) {
  return program.methods.setTokenPrice(index, newPrice).accounts({
    protocolState: getProtocolStatePDA(),
    authority,
  });
}

export async function buildSetDevFeeTx(program: Program, authority: PublicKey, feeIndex: number, newBps: number) {
  return program.methods.setDevFee(feeIndex, newBps).accounts({
    protocolState: getProtocolStatePDA(),
    authority,
  });
}

// ─── Child Token PDA helper ────────────────────────────────────────────────
export function getChildTokenPDA(user: PublicKey, tokenIndex: number): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("child_token"), user.toBuffer(), Buffer.from(TOKEN_SEEDS[tokenIndex])],
    getProgramId()
  );
  return pda;
}

// ─── Math Helpers ──────────────────────────────────────────────────────────

export function lamportsFromXnt(xnt: number): number {
  return Math.floor(xnt * LAMPORTS_PER_XNT);
}

export function xntFromLamports(lamports: BN | number): number {
  const n = typeof lamports === "number" ? lamports : lamports.toNumber();
  return n / LAMPORTS_PER_XNT;
}

export function formatNex(bn: BN | null | undefined): string {
  if (!bn) return "0";
  return (bn.toNumber() / LAMPORTS_PER_XNT).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function formatXnt(lamports: BN | number | null | undefined): string {
  if (lamports == null) return "0";
  const n = typeof lamports === "number" ? lamports : lamports.toNumber();
  return (n / LAMPORTS_PER_XNT).toLocaleString(undefined, { maximumFractionDigits: 4 });
}

/** Get the badge image path for a prestige level (1-indexed) */
export function getPrestigeBadgePath(prestigeLevel: number): string {
  const padded = prestigeLevel < 10 ? `0${prestigeLevel}` : `${prestigeLevel}`;
  const ticker = PRESTIGE_TICKERS[prestigeLevel - 1]?.toLowerCase() ?? "wraith";
  return `/prestige-icons/${padded}-${ticker}.jpg`;
}

/** Prestige NEX threshold — whitepaper says flat 30K. Kept for compatibility with legacy UIs. */
export function getPrestigeThreshold(prestigeCount: number): number {
  return 30_000;
}

/** Get total count of all tiers for a specific token */
export function getTokenTotal(tierCounts: number[][], tokenIndex: number): number {
  if (!tierCounts || !tierCounts[tokenIndex]) return 0;
  return tierCounts[tokenIndex].reduce((a, b) => a + b, 0);
}

/** Get the highest tier held for a specific token */
export function getHighestTier(tierCounts: number[][], tokenIndex: number): number {
  if (!tierCounts || !tierCounts[tokenIndex]) return -1;
  for (let t = MAX_TIERS - 1; t >= 0; t--) {
    if (tierCounts[tokenIndex][t] > 0) return t;
  }
  return -1;
}

/** Check if any tier of a token exists */
export function hasAnyTier(tierCounts: number[][], tokenIndex: number): boolean {
  return getTokenTotal(tierCounts, tokenIndex) > 0;
}

/** Check all 9 tokens held (for PRIME mint) */
export function hasAllTokens(tierCounts: number[][]): boolean {
  for (let i = 0; i < 9; i++) {
    if (!hasAnyTier(tierCounts, i)) return false;
  }
  return true;
}

/** Check if mask has all 9 tokens active */
export function allTokensActive(mask: number): boolean {
  return mask === 0x1FF;
}

/** Get active token count from mask */
export function activeTokenCount(mask: number): number {
  let count = 0;
  for (let i = 0; i < 9; i++) {
    if (mask & (1 << i)) count++;
  }
  return count;
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

export function shortPubkey(pk: PublicKey | string): string {
  const s = typeof pk === "string" ? pk : pk.toBase58();
  return `${s.slice(0, 6)}...${s.slice(-4)}`;
}// deploy-trigger: 1781717064
