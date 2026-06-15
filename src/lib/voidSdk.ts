/* ═══════════════════════════════════════════════════════════════
   voidSdk.ts — Lightweight on-chain SDK for Prestige Protocol
   Matches deployed IDL program 6mW4... on X1 testnet.
   Seeds: protocol_state, user_state, burn_vault, prestige_medal, prestige_nft
   ═══════════════════════════════════════════════════════════════ */
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction
} from "@solana/web3.js";
import { NETWORK } from "./network";
import { TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";

const BURN_ADDR = new PublicKey("1nc1nerator11111111111111111111111111111111");

// ─── Seeds (must match contract IDL) ──────────────────────────────
const PROTOCOL_STATE = Buffer.from("protocol_state");
const USER_STATE = Buffer.from("user_state");
const BURN_VAULT = Buffer.from("burn_vault");
const PRESTIGE_MEDAL = Buffer.from("prestige_medal");
const PRESTIGE_NFT = Buffer.from("prestige_nft");
const TOKEN_PAIR = Buffer.from("token_pair");
const CHILD_TOKEN = Buffer.from("child_token");
const TOKEN_SEEDS: string[] = [
  "crown", "oracle", "anvil", "echo", "forge",
  "tide", "vault", "rift", "prime",
];

const PROGRAM_ID = new PublicKey(NETWORK.programId);

// ─── PDA helpers ──────────────────────────────────────────────────
export function getProtocolPDA(): PublicKey {
  return PublicKey.findProgramAddressSync([PROTOCOL_STATE], PROGRAM_ID)[0];
}

export function getUserStatePDA(user: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync([USER_STATE, user.toBytes()], PROGRAM_ID)[0];
}

export function getBurnVaultPDA(): PublicKey {
  return PublicKey.findProgramAddressSync([BURN_VAULT], PROGRAM_ID)[0];
}

export function getPrestigeMedalPDA(user: PublicKey, count: number): PublicKey {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(BigInt(count));
  return PublicKey.findProgramAddressSync([PRESTIGE_MEDAL, user.toBytes(), buf], PROGRAM_ID)[0];
}

export function getPrestigeNftMintPDA(user: PublicKey, count: number): PublicKey {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(BigInt(count));
  return PublicKey.findProgramAddressSync([PRESTIGE_NFT, user.toBytes(), buf], PROGRAM_ID)[0];
}

export function getPrestigeNftAta(user: PublicKey, mint: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [user.toBytes(), TOKEN_2022_PROGRAM_ID.toBytes(), mint.toBytes()],
    ASSOCIATED_TOKEN_PROGRAM_ID
  )[0];
}

export function getVaultSharePDA(user: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vault_share"), user.toBytes()],
    PROGRAM_ID
  )[0];
}

export function getDevWallet(): PublicKey {
  return new PublicKey(NETWORK.devWallet);
}

export function getPairPDA(user: PublicKey, a: number, b: number): PublicKey {
  const bufA = Buffer.alloc(8);
  bufA.writeBigUInt64LE(BigInt(a));
  const bufB = Buffer.alloc(8);
  bufB.writeBigUInt64LE(BigInt(b));
  return PublicKey.findProgramAddressSync([TOKEN_PAIR, user.toBytes(), bufA, bufB], PROGRAM_ID)[0];
}

export function getChildTokenPDA(user: PublicKey, tokenIndex: number): PublicKey {
  return PublicKey.findProgramAddressSync(
    [CHILD_TOKEN, user.toBytes(), Buffer.from(TOKEN_SEEDS[tokenIndex])],
    PROGRAM_ID
  )[0];
}

// ─── Discriminators (from IDL) ────────────────────────────────────
// sha256("global:<ix_name>")[..8]  — note: IDL uses snake_case
const DISCRIMINATORS: Record<string, number[]> = {
  initProtocol:   [3, 188, 141, 237, 225, 226, 232, 210],
  initUser:       [14, 51, 68, 159, 237, 78, 158, 102],
  burnXnt:        [205, 179, 75, 101, 13, 149, 38, 127],
  mintNexTap:     [110, 22, 204, 178, 216, 194, 96, 44],
  mintBronze:     [98, 125, 255, 97, 194, 118, 241, 193],
  upgradeTier:    [122, 56, 170, 60, 252, 234, 190, 51],
  pairTokens:     [142, 131, 59, 141, 221, 43, 219, 199],
  prestige:       [165, 199, 34, 149, 7, 36, 38, 66],
  mintPrestigeNft: [93, 162, 167, 133, 175, 205, 15, 191],
  claimNex:       [143, 193, 142, 129, 244, 71, 248, 180],
  burnInftTokens: [155, 96, 227, 213, 157, 167, 148, 32],
  stakeAsh:       [125, 7, 18, 20, 11, 56, 85, 128],
  unstakeAsh:     [124, 103, 60, 47, 124, 82, 8, 177],
  claimVaultReward: [80, 2, 39, 115, 76, 142, 218, 62],
  cosmeticUpgrade: [168, 205, 177, 200, 5, 251, 154, 173],
  setBurnBoostSlider: [150, 69, 171, 237, 78, 155, 4, 147],
  tickProduction: [78, 135, 124, 91, 71, 232, 45, 102],
};

export class VoidSdk {
  private connection: Connection;
  private wallet: any;

  constructor(connection: Connection, wallet: any) {
    this.connection = connection;
    this.wallet = wallet;
  }

  /* ── PDA Queries ── */

  protocolPDA(): PublicKey { return getProtocolPDA(); }
  userStatePDA(user: PublicKey): PublicKey { return getUserStatePDA(user); }
  burnVaultPDA(): PublicKey { return getBurnVaultPDA(); }
  prestigeMedalPDA(user: PublicKey, count: number): PublicKey { return getPrestigeMedalPDA(user, count); }
  prestigeNftMintPDA(user: PublicKey, count: number): PublicKey { return getPrestigeNftMintPDA(user, count); }
  devWalletPDA(): PublicKey { return getDevWallet(); }

  /* ── Account State ── */

  async getUserStateRaw(user: PublicKey): Promise<any | null> {
    try {
      const pda = getUserStatePDA(user);
      const info = await this.connection.getAccountInfo(pda);
      if (!info) return null;
      const data = new Uint8Array(info.data);
      const offset = 8; // skip discriminator
      const readU64 = (off: number) => Number(
        Buffer.from(data.slice(off, off + 8)).readBigUInt64LE(0)
      );
      return {
        user: new PublicKey(data.slice(offset, offset + 32)),
        nexBalance: readU64(offset + 32),
        prestigeCount: readU64(offset + 40),
        hasMintPass: data[offset + 48] === 1, // game started
        gameRun: readU64(offset + 49),
        inftsMinted: readU64(offset + 57),
        lastTapTime: Number(Buffer.from(data.slice(offset + 65, offset + 73)).readBigInt64LE(0)),
        lastPrestigeTime: Number(Buffer.from(data.slice(offset + 73, offset + 81)).readBigInt64LE(0)),
      };
    } catch (e) {
      console.error("getUserStateRaw error:", e);
      return null;
    }
  }

  async userStateExists(user: PublicKey): Promise<boolean> {
    return !!(await this.connection.getAccountInfo(getUserStatePDA(user)));
  }

  async syncWalletData(user: PublicKey): Promise<{
    userState: any | null;
    mintedNfts: any[];
    tokens: Record<number, number>;
  }> {
    const userState = await this.getUserStateRaw(user);
    if (!userState) {
      return { userState: null, mintedNfts: [], tokens: {} };
    }

    const mintedNfts: any[] = [];
    const tokens: Record<number, number> = {};

    // Scan Token-2022 accounts owned by user
    try {
      const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(user, {
        programId: TOKEN_2022_PROGRAM_ID,
      });

      for (const { account } of tokenAccounts.value) {
        const parsedInfo = account.data.parsed?.info;
        if (!parsedInfo) continue;
        const mintStr = parsedInfo.mint;
        const balance = Number(parsedInfo.tokenAmount?.amount || 0);
        if (balance <= 0) continue;

        // Check if this is one of our prestige NFT mints
        for (let i = 0; i < (userState.inftsMinted || 0); i++) {
          const expectedMint = getPrestigeNftMintPDA(user, i).toBase58();
          if (mintStr === expectedMint) {
            const seedFromMint = expectedMint.split("").reduce((acc: number, c: string) => (acc * 31 + c.charCodeAt(0)) & 0xFFFFF, 0) % 1000000;
            mintedNfts.push({
              prestige: userState.prestigeCount,
              seed: seedFromMint,
              mintAddress: expectedMint,
            });
          }
        }
      }
    } catch (e) {
      console.warn("Token account scan skipped:", e);
    }

    return { userState, mintedNfts, tokens };
  }

  /* ── Instructions ── */

  async ensureUserInited(user: PublicKey): Promise<boolean> {
    const exists = await this.userStateExists(user);
    if (exists) return true;
    try {
      const tx = new Transaction().add({
        keys: [
          { pubkey: getUserStatePDA(user), isSigner: false, isWritable: true },
          { pubkey: user, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data: Buffer.from(DISCRIMINATORS.initUser),
      });
      await this.signAndSend(tx);
      return true;
    } catch (e) {
      console.error("ensureUserInited failed:", e);
      return false;
    }
  }

  /** Pay 0.01 XN dev fee — uses burnXnt instruction */
  async payDevFee(user: PublicKey): Promise<string> {
    const tx = new Transaction().add({
      keys: [
        { pubkey: getProtocolPDA(), isSigner: false, isWritable: true },
        { pubkey: getUserStatePDA(user), isSigner: false, isWritable: true },
        { pubkey: getBurnVaultPDA(), isSigner: false, isWritable: true },
        { pubkey: user, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_ID,
      data: (() => {
        const buf = Buffer.alloc(8);
        buf.writeBigUInt64LE(BigInt(10_000_000)); // 0.01 XN (10^7 lamports)
        return Buffer.from([...DISCRIMINATORS.burnXnt, ...buf]);
      })(),
    });

    return this.signAndSend(tx);
  }

  /** Mint tap (free) */
  async mintNexTap(user: PublicKey): Promise<string> {
    const tx = new Transaction().add({
      keys: [
        { pubkey: getProtocolPDA(), isSigner: false, isWritable: true },
        { pubkey: getUserStatePDA(user), isSigner: false, isWritable: true },
        { pubkey: user, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_ID,
      data: Buffer.from(DISCRIMINATORS.mintNexTap),
    });

    return this.signAndSend(tx);
  }

  /** Prestige — costs 0.01 XNT, burns 30K NEX, advances prestige count */
  async prestige(user: PublicKey): Promise<string> {
    const state = await this.getUserStateRaw(user);
    const prestigeCount = state?.prestigeCount ?? 0;

    const tx = new Transaction().add({
      keys: [
        { pubkey: getProtocolPDA(), isSigner: false, isWritable: true },
        { pubkey: getUserStatePDA(user), isSigner: false, isWritable: true },
        { pubkey: getPrestigeMedalPDA(user, prestigeCount), isSigner: false, isWritable: true },
        { pubkey: getDevWallet(), isSigner: false, isWritable: true },
        { pubkey: user, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_ID,
      data: Buffer.from(DISCRIMINATORS.prestige),
    });

    return this.signAndSend(tx);
  }

  /** Mint prestige NFT — costs 5,000 NEX, creates Token-2022 */
  async mintInft(user: PublicKey): Promise<{ signature: string; mintAddress: PublicKey }> {
    const state = await this.getUserStateRaw(user);
    const prestigeCount = state?.prestigeCount ?? 0;
    const inftsMinted = state?.inftsMinted ?? 0;

    // The mint PDA is keyed by the user-state's prestige_count
    // (per the IDL: prestige_nft + user + user_state.prestige_count)
    const mintPDA = getPrestigeNftMintPDA(user, prestigeCount);
    const userATA = getPrestigeNftAta(user, mintPDA);

    const tx = new Transaction().add({
      keys: [
        { pubkey: getUserStatePDA(user), isSigner: false, isWritable: true },
        { pubkey: mintPDA, isSigner: false, isWritable: true },
        { pubkey: userATA, isSigner: false, isWritable: true },
        { pubkey: user, isSigner: true, isWritable: true },
        { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_ID,
      data: Buffer.from(DISCRIMINATORS.mintPrestigeNft),
    });

    const signature = await this.signAndSend(tx);
    return { signature, mintAddress: mintPDA };
  }

  /** Claim pending NEX rewards */
  async claimNex(user: PublicKey): Promise<string> {
    const tx = new Transaction().add({
      keys: [
        { pubkey: getUserStatePDA(user), isSigner: false, isWritable: true },
        { pubkey: user, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_ID,
      data: Buffer.from(DISCRIMINATORS.claimNex),
    });

    return this.signAndSend(tx);
  }

  /** Burn an iNFT (Token-2022) */
  async burnInft(user: PublicKey, editionCount: number): Promise<string> {
    const state = await this.getUserStateRaw(user);
    const prestigeCount = state?.prestigeCount ?? 0;

    const mintPDA = getPrestigeNftMintPDA(user, editionCount);
    const userATA = getPrestigeNftAta(user, mintPDA);

    const tx = new Transaction().add({
      keys: [
        { pubkey: getUserStatePDA(user), isSigner: false, isWritable: true },
        { pubkey: mintPDA, isSigner: false, isWritable: true },
        { pubkey: userATA, isSigner: false, isWritable: true },
        { pubkey: getBurnVaultPDA(), isSigner: false, isWritable: true },
        { pubkey: user, isSigner: true, isWritable: true },
        { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_ID,
      data: Buffer.from(DISCRIMINATORS.burnInftTokens),
    });

    return this.signAndSend(tx);
  }

  /** Claim vault reward (ASH staking) */
  async claimVaultReward(user: PublicKey): Promise<string> {
    const tx = new Transaction().add({
      keys: [
        { pubkey: getProtocolPDA(), isSigner: false, isWritable: true },
        { pubkey: getUserStatePDA(user), isSigner: false, isWritable: true },
        { pubkey: getVaultSharePDA(user), isSigner: false, isWritable: true },
        { pubkey: user, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_ID,
      data: Buffer.from(DISCRIMINATORS.claimVaultReward),
    });
    return this.signAndSend(tx);
  }

  /** Stake ASH tokens for vault rewards */
  async stakeAsh(user: PublicKey, amount: number): Promise<string> {
    const buf = Buffer.alloc(8);
    buf.writeBigUInt64LE(BigInt(amount));
    const tx = new Transaction().add({
      keys: [
        { pubkey: getProtocolPDA(), isSigner: false, isWritable: true },
        { pubkey: getUserStatePDA(user), isSigner: false, isWritable: true },
        { pubkey: user, isSigner: true, isWritable: true },
      ],
      programId: PROGRAM_ID,
      data: Buffer.from([...DISCRIMINATORS.stakeAsh, ...Array.from(buf)]),
    });
    return this.signAndSend(tx);
  }

  /** Unstake ASH tokens */
  async unstakeAsh(user: PublicKey, amount: number): Promise<string> {
    const buf = Buffer.alloc(8);
    buf.writeBigUInt64LE(BigInt(amount));
    const tx = new Transaction().add({
      keys: [
        { pubkey: getProtocolPDA(), isSigner: false, isWritable: true },
        { pubkey: getUserStatePDA(user), isSigner: false, isWritable: true },
        { pubkey: user, isSigner: true, isWritable: true },
      ],
      programId: PROGRAM_ID,
      data: Buffer.from([...DISCRIMINATORS.unstakeAsh, ...Array.from(buf)]),
    });
    return this.signAndSend(tx);
  }

  /** Mint Bronze tier of a child token (CROWN=0, ORACLE=1, etc.) */
  async mintBronze(user: PublicKey, tokenIndex: number): Promise<string> {
    const tx = new Transaction().add({
      keys: [
        { pubkey: getProtocolPDA(), isSigner: false, isWritable: true },
        { pubkey: getUserStatePDA(user), isSigner: false, isWritable: true },
        { pubkey: getDevWallet(), isSigner: false, isWritable: true },
        { pubkey: user, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_ID,
      data: Buffer.from([...DISCRIMINATORS.mintBronze, tokenIndex]),
    });
    return this.signAndSend(tx);
  }

  /** Upgrade tier: 3× same tier + NEX → next tier */
  async upgradeTier(user: PublicKey, tokenIndex: number): Promise<string> {
    const tx = new Transaction().add({
      keys: [
        { pubkey: getProtocolPDA(), isSigner: false, isWritable: true },
        { pubkey: getUserStatePDA(user), isSigner: false, isWritable: true },
        { pubkey: getDevWallet(), isSigner: false, isWritable: true },
        { pubkey: user, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_ID,
      data: Buffer.from([...DISCRIMINATORS.upgradeTier, tokenIndex]),
    });
    return this.signAndSend(tx);
  }

  /** Create token pair (horizontal synergy) */
  async createTokenPair(user: PublicKey, aIdx: number, bIdx: number): Promise<string> {
    const tx = new Transaction().add({
      keys: [
        { pubkey: getProtocolPDA(), isSigner: false, isWritable: true },
        { pubkey: getUserStatePDA(user), isSigner: false, isWritable: true },
        { pubkey: getPairPDA(user, aIdx, bIdx), isSigner: false, isWritable: true },
        { pubkey: getChildTokenPDA(user, aIdx), isSigner: false, isWritable: true },
        { pubkey: getChildTokenPDA(user, bIdx), isSigner: false, isWritable: true },
        { pubkey: getDevWallet(), isSigner: false, isWritable: true },
        { pubkey: user, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_ID,
      data: Buffer.from([...DISCRIMINATORS.pairTokens, aIdx, bIdx]),
    });
    return this.signAndSend(tx);
  }

  /** Burn child token — NOTE: contract does not have a dedicated burn_child_token instruction.
   *  This is handled client-side (demo mode) or via burn_inft_tokens for iNFTs.
   *  For now this throws; callers should use demo mode. */
  async burnChildToken(_user: PublicKey, _tokenIndex: number, _tier: number): Promise<string> {
    throw new Error("burnChildToken is not supported on-chain. Use demo mode or burn iNFTs instead.");
  }

  /** Claim ASH (vault reward) — alias for claimVaultReward */
  async claimAsh(user: PublicKey): Promise<string> {
    return this.claimVaultReward(user);
  }

  /** Tick production — triggers on-chain production calculations */
  async tickProduction(user: PublicKey): Promise<string> {
    const tx = new Transaction().add({
      keys: [
        { pubkey: getProtocolPDA(), isSigner: false, isWritable: true },
        { pubkey: getUserStatePDA(user), isSigner: false, isWritable: true },
        { pubkey: user, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_ID,
      data: Buffer.from(DISCRIMINATORS.tickProduction),
    });
    return this.signAndSend(tx);
  }

  /** Cosmetic upgrade — burn XNT for visual medal layers */
  async cosmeticUpgrade(user: PublicKey, upgradeKind: number): Promise<string> {
    const tx = new Transaction().add({
      keys: [
        { pubkey: getProtocolPDA(), isSigner: false, isWritable: true },
        { pubkey: getUserStatePDA(user), isSigner: false, isWritable: true },
        { pubkey: getDevWallet(), isSigner: false, isWritable: true },
        { pubkey: user, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_ID,
      data: Buffer.from([...DISCRIMINATORS.cosmeticUpgrade, upgradeKind]),
    });
    return this.signAndSend(tx);
  }

  /** Prestige burn boost slider — adjust burn ratio */
  async setBurnBoostSlider(user: PublicKey, mult: number): Promise<string> {
    const tx = new Transaction().add({
      keys: [
        { pubkey: getProtocolPDA(), isSigner: false, isWritable: true },
        { pubkey: getUserStatePDA(user), isSigner: false, isWritable: true },
        { pubkey: getDevWallet(), isSigner: false, isWritable: true },
        { pubkey: user, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_ID,
      data: Buffer.from([...DISCRIMINATORS.setBurnBoostSlider, mult]),
    });
    return this.signAndSend(tx);
  }

  /** Add Metaplex metadata to a prestige iNFT mint */
  async addMetadataToInft(mintAddress: PublicKey, prestige: number, seed: number): Promise<string> {
    const idx = prestige - 1;
    const { PRESTIGE_NAMES, PRESTIGE_TICKERS } = await import("./void");
    const name = PRESTIGE_NAMES[idx] ?? "Wraith";
    const ticker = PRESTIGE_TICKERS[idx] ?? "WRT";
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://voidprotocol.xyz';
    const metadataUri = `${origin}/api/inft-metadata?prestige=${prestige}&seed=${seed}&mint=${mintAddress.toBase58()}`;

    const { createMetadataInstruction } = await import("./metaplex");
    const ix = createMetadataInstruction(
      mintAddress,
      this.wallet.publicKey,
      this.wallet.publicKey,
      this.wallet.publicKey,
      `${name} #${seed + 1}`,
      ticker,
      metadataUri,
    );

    const tx = new Transaction().add(ix);
    return this.signAndSend(tx);
  }

  /* ── Signing ── */

  private async signAndSend(tx: Transaction): Promise<string> {
    const { blockhash } = await this.connection.getLatestBlockhash("confirmed");
    tx.feePayer = this.wallet.publicKey;
    tx.recentBlockhash = blockhash;

    if (typeof this.wallet.signAndSendTransaction === "function") {
      const result = await this.wallet.signAndSendTransaction(tx);
      return typeof result === "string" ? result : (result as any).signature ?? (result as any).txid ?? "";
    }

    const signed = await this.wallet.signTransaction(tx);
    const sig = await this.connection.sendRawTransaction(signed.serialize());
    await this.connection.confirmTransaction(sig, "processed");
    return sig;
  }
}