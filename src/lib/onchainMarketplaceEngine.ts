/* ═══════════════════════════════════════════════════════════════
   onchainMarketplaceEngine.ts — On-chain Marketplace Engine
   Calls the Anchor marketplace program on X1 testnet.
   Uses SPL Token XNT transfers (not native SOL/XNT).
   ═══════════════════════════════════════════════════════════════ */
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { VoidSdk } from "./voidSdk";
import { NETWORK } from "./network";
import type {
  MarketplaceEngine,
  MarketplaceListing,
  TradeRecord,
  Offer,
  ListNftParams,
  BuyNftParams,
  BalanceSnapshot,
  TxUpdate,
} from "./marketplaceEngine";

// ─── Program config ────────────────────────────────────────────
const MARKETPLACE_PROGRAM_ID = new PublicKey(
  "3Cnt3WhjfYVCv69YsbXA6LURQ6gbVgsrdrFhJ4Ek3njy"
);

const XNT_MINT = new PublicKey(
  "4iw17WYbDsUjd4P64hkYprcvFd7XpDpT4yJbVmP9mozt"
);

const TREASURY_WALLET = new PublicKey(
  "BQLB3NPHGRfibY23qTDbEYBuhZu2KsdiD3pbxuu8Fpxh"
);

const TREASURY_XNT_ATA = new PublicKey(
  "FPu6vp298Jc1NcLnkSLQ93nJGP9pXMctJqHc9s5PzjhC"
);

// ─── Seeds ─────────────────────────────────────────────────────
const MARKET_STATE = Buffer.from("market_state");
const LISTING = Buffer.from("listing");
const OFFER = Buffer.from("offer");
const FEE_POOL = Buffer.from("fee_pool");

// ─── Discriminators (sha256("global:<ix_name>")[..8]) ─────────
const DISCRIMINATORS = {
  initMarket:      [33, 253, 15, 116, 89, 25, 127, 236],
  listNft:         [88, 221, 93, 166, 63, 220, 106, 232],
  buyNft:          [96, 0, 28, 190, 49, 107, 83, 222],
  cancelListing:   [41, 183, 50, 232, 230, 233, 157, 70],
  placeOffer:      [55, 98, 219, 43, 72, 108, 121, 97],
  acceptOffer:     [227, 82, 234, 131, 1, 18, 48, 2],
  rejectOffer:     [154, 107, 238, 8, 171, 64, 222, 56],
  cancelOffer:     [92, 203, 223, 40, 92, 89, 53, 119],
  setPlatformFee:  [19, 70, 111, 182, 156, 58, 208, 203],
  setPaused:       [91, 60, 125, 192, 176, 225, 166, 218],
  withdrawFees:    [198, 212, 171, 109, 144, 215, 174, 89],
};

// ─── Associated Token Program ID ──────────────────────────────
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey(
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
);

// ─── PDA helpers ───────────────────────────────────────────────

function getMarketStatePDA(): PublicKey {
  return PublicKey.findProgramAddressSync([MARKET_STATE], MARKETPLACE_PROGRAM_ID)[0];
}

function getListingPDA(seller: PublicKey, idx: number): PublicKey {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(BigInt(idx));
  return PublicKey.findProgramAddressSync(
    [LISTING, seller.toBytes(), buf],
    MARKETPLACE_PROGRAM_ID
  )[0];
}

function getOfferPDA(listing: PublicKey, buyer: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [OFFER, listing.toBytes(), buyer.toBytes()],
    MARKETPLACE_PROGRAM_ID
  )[0];
}

function getFeePoolPDA(prestige: number): PublicKey {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(BigInt(prestige));
  return PublicKey.findProgramAddressSync(
    [FEE_POOL, buf],
    MARKETPLACE_PROGRAM_ID
  )[0];
}

function getEscrowAta(listing: PublicKey, mint: PublicKey): PublicKey {
  return getAssociatedTokenAddressSync(mint, listing, true, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);
}

// ─── Helpers: decode on-chain accounts ─────────────────────────

function decodeListing(data: Uint8Array, id: string): MarketplaceListing {
  const offset = 8; // skip discriminator
  const seller = new PublicKey(data.slice(offset, offset + 32)).toBase58();
  const prestige = data[offset + 32];
  const seed = Number(Buffer.from(data.slice(offset + 33, offset + 41)).readBigUInt64LE(0));
  const mint = new PublicKey(data.slice(offset + 41, offset + 73)).toBase58();
  const price = Number(Buffer.from(data.slice(offset + 73, offset + 81)).readBigUInt64LE(0));
  const listedAt = Number(Buffer.from(data.slice(offset + 81, offset + 89)).readBigInt64LE(0));
  const statusByte = data[offset + 89];
  const status: "active" | "sold" | "cancelled" =
    statusByte === 0 ? "active" : statusByte === 1 ? "sold" : "cancelled";

  return { id, prestige, seed, seller, price, listedAt, status };
}

function decodeOffer(data: Uint8Array, id: string): Offer {
  const offset = 8;
  const listing = new PublicKey(data.slice(offset, offset + 32)).toBase58();
  const buyer = new PublicKey(data.slice(offset + 32, offset + 64)).toBase58();
  const amount = Number(Buffer.from(data.slice(offset + 64, offset + 72)).readBigUInt64LE(0));
  const createdAt = Number(Buffer.from(data.slice(offset + 72, offset + 80)).readBigInt64LE(0));
  const statusByte = data[offset + 80];
  const status: "pending" | "accepted" | "rejected" | "cancelled" =
    statusByte === 0 ? "pending" : statusByte === 1 ? "accepted" : statusByte === 2 ? "rejected" : "cancelled";

  return { id, listingId: listing, buyer, amount, createdAt, status };
}

// ─── Fee tier logic (matches program) ──────────────────────────

function feeBpsForPrestige(prestige: number): number {
  if (prestige >= 1 && prestige <= 20) return 50;
  if (prestige >= 21 && prestige <= 50) return 75;
  if (prestige >= 51 && prestige <= 80) return 100;
  if (prestige >= 81 && prestige <= 100) return 125;
  return 100;
}

// ─── SPL Token transfer IX builder ─────────────────────────────

function makeTokenTransferIx(
  source: PublicKey,
  destination: PublicKey,
  authority: PublicKey,
  amount: bigint,
): TransactionInstruction {
  const amountBuf = Buffer.alloc(8);
  amountBuf.writeBigUInt64LE(amount);
  return new TransactionInstruction({
    programId: TOKEN_PROGRAM_ID,
    keys: [
      { pubkey: source, isSigner: false, isWritable: true },
      { pubkey: destination, isSigner: false, isWritable: true },
      { pubkey: authority, isSigner: true, isWritable: false },
    ],
    data: Buffer.from([3, ...Array.from(amountBuf)]), // transfer tag=3, u64 LE amount
  });
}

// ─── Engine ────────────────────────────────────────────────────

export class OnchainMarketplaceEngine implements MarketplaceEngine {
  readonly name = "On-chain (X1)";
  readonly feePercent = 1;

  private connection: Connection;
  private sdk: VoidSdk;
  private wallet: any;
  private walletPubkey: PublicKey | null = null;

  private txListeners = new Set<(u: TxUpdate) => void>();
  private dataListeners = new Set<() => void>();

  constructor(connection: Connection, sdk: VoidSdk) {
    this.connection = connection;
    this.sdk = sdk;
  }

  getFeeForPrestige(prestige: number): number {
    return feeBpsForPrestige(prestige) / 100;
  }

  /* ── Lifecycle ── */

  async connect(): Promise<void> {
    this.walletPubkey = (this.sdk as any).wallet?.publicKey ?? null;
  }

  disconnect(): void {
    this.walletPubkey = null;
  }

  isAvailable(): boolean {
    return !!this.walletPubkey;
  }

  /* ── Sign helper ── */

  private async signAndSend(tx: Transaction): Promise<string> {
    const { blockhash } = await this.connection.getLatestBlockhash("confirmed");
    tx.feePayer = this.walletPubkey!;
    tx.recentBlockhash = blockhash;
    const signed = await (this.sdk as any).wallet.signTransaction(tx);
    const sig = await this.connection.sendRawTransaction(signed.serialize());
    await this.connection.confirmTransaction(sig, "confirmed");
    return sig;
  }

  /* ── List ── */

  async list(params: ListNftParams): Promise<MarketplaceListing> {
    const seller = new PublicKey(params.seller);
    const statePDA = getMarketStatePDA();
    const stateInfo = await this.connection.getAccountInfo(statePDA);
    const totalListings = stateInfo
      ? Number(Buffer.from(stateInfo.data.slice(40, 48)).readBigUInt64LE(0))
      : 0;

    const listingPDA = getListingPDA(seller, totalListings);
    const nftMint = new PublicKey(params.mint);
    const sellerNftAta = getAssociatedTokenAddressSync(nftMint, seller, false, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);
    const escrowAta = getEscrowAta(listingPDA, nftMint);

    const tx = new Transaction().add({
      keys: [
        { pubkey: statePDA, isSigner: false, isWritable: true },
        { pubkey: listingPDA, isSigner: false, isWritable: true },
        { pubkey: nftMint, isSigner: false, isWritable: false },
        { pubkey: sellerNftAta, isSigner: false, isWritable: true },
        { pubkey: escrowAta, isSigner: false, isWritable: true },
        { pubkey: seller, isSigner: true, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: new PublicKey("SysvarRent111111111111111111111111111111111"), isSigner: false, isWritable: false },
      ],
      programId: MARKETPLACE_PROGRAM_ID,
      data: Buffer.from([
        ...DISCRIMINATORS.listNft,
        params.prestige,
        ...numberToBytes(params.seed, 8), // seed (u64)
        ...numberToBytes(params.price, 8), // price (u64)
      ]),
    });

    this.emitTx({ type: "list", id: listingPDA.toBase58(), status: "pending" });
    try {
      const sig = await this.signAndSend(tx);
      this.emitTx({ type: "list", id: listingPDA.toBase58(), status: "confirmed", txId: sig, message: "iNFT listed!" });
      this.emitData();
    } catch (e: any) {
      this.emitTx({ type: "list", id: listingPDA.toBase58(), status: "failed", error: e.message });
      throw e;
    }

    return {
      id: listingPDA.toBase58(),
      prestige: params.prestige,
      seed: params.seed,
      seller: params.seller,
      price: params.price,
      listedAt: Date.now(),
      status: "active",
    };
  }

  /* ── Cancel ── */

  async cancel(listingId: string): Promise<void> {
    const seller = this.walletPubkey!;
    const listing = new PublicKey(listingId);
    const statePDA = getMarketStatePDA();

    // Read listing to decode NFT mint and find listing_idx
    const listingInfo = await this.connection.getAccountInfo(listing);
    if (!listingInfo) throw new Error("Listing not found");
    const rawData = listingInfo.data;
    // offset: 8(disc) + 32(seller) + 1(prestige) + 8(seed) = 49
    const nftMint = new PublicKey(new Uint8Array(rawData.slice(49, 81)));
    const escrowAta = getEscrowAta(listing, nftMint);
    const sellerNftAta = getAssociatedTokenAddressSync(nftMint, seller, false, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);
    const listingIdx = await this.findListingIndex(listing, seller);

    const tx = new Transaction().add({
      keys: [
        { pubkey: statePDA, isSigner: false, isWritable: true },
        { pubkey: listing, isSigner: false, isWritable: true },
        { pubkey: nftMint, isSigner: false, isWritable: false },
        { pubkey: escrowAta, isSigner: false, isWritable: true },
        { pubkey: sellerNftAta, isSigner: false, isWritable: true },
        { pubkey: seller, isSigner: true, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: MARKETPLACE_PROGRAM_ID,
      data: Buffer.from([...DISCRIMINATORS.cancelListing, ...numberToBytes(listingIdx, 8)]),
    });

    this.emitTx({ type: "cancel", id: listingId, status: "pending" });
    try {
      const sig = await this.signAndSend(tx);
      this.emitTx({ type: "cancel", id: listingId, status: "confirmed", txId: sig, message: "Listing cancelled" });
      this.emitData();
    } catch (e: any) {
      this.emitTx({ type: "cancel", id: listingId, status: "failed", error: e.message });
      throw e;
    }
  }

  /* ── Buy (SPL Token XNT transfers via CPI) ── */

  async buy(params: BuyNftParams): Promise<TradeRecord> {
    const buyer = this.walletPubkey!;
    const listing = new PublicKey(params.listingId);
    const listingInfo = await this.connection.getAccountInfo(listing);
    if (!listingInfo) throw new Error("Listing not found");

    const decoded = decodeListing(new Uint8Array(listingInfo.data), params.listingId);
    const sellerPubkey = new PublicKey(decoded.seller);
    const listingIdx = await this.findListingIndex(listing, sellerPubkey);
    // Decode mint from raw listing account data
    const rawData = listingInfo.data;
    const mintOffset = 49; // offset 8(disc) + 32(seller) + 1(prestige) + 8(seed) = 49
    const nftMint = new PublicKey(new Uint8Array(rawData.slice(mintOffset, mintOffset + 32)));

    const escrowAta = getEscrowAta(listing, nftMint);
    const buyerNftAta = getAssociatedTokenAddressSync(nftMint, buyer, false, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);
    const feePoolPDA = getFeePoolPDA(decoded.prestige);
    const buyerXntAta = getAssociatedTokenAddressSync(XNT_MINT, buyer, false, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);
    const sellerXntAta = getAssociatedTokenAddressSync(XNT_MINT, new PublicKey(decoded.seller), false, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);
    const statePDA = getMarketStatePDA();

    const tx = new Transaction().add({
      keys: [
        { pubkey: statePDA, isSigner: false, isWritable: true },
        { pubkey: listing, isSigner: false, isWritable: true },
        { pubkey: nftMint, isSigner: false, isWritable: false },
        { pubkey: escrowAta, isSigner: false, isWritable: true },
        { pubkey: buyerNftAta, isSigner: false, isWritable: true },
        { pubkey: feePoolPDA, isSigner: false, isWritable: true },
        { pubkey: buyerXntAta, isSigner: false, isWritable: true },
        { pubkey: sellerXntAta, isSigner: false, isWritable: true },
        { pubkey: TREASURY_XNT_ATA, isSigner: false, isWritable: true },
        { pubkey: buyer, isSigner: true, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: new PublicKey("SysvarRent111111111111111111111111111111111"), isSigner: false, isWritable: false },
      ],
      programId: MARKETPLACE_PROGRAM_ID,
      data: Buffer.from([...DISCRIMINATORS.buyNft, ...numberToBytes(listingIdx, 8)]),
    });

    const fee = Math.ceil(params.price * (feeBpsForPrestige(decoded.prestige) / 10000));

    this.emitTx({ type: "buy", id: params.listingId, status: "pending", message: `Sending ${params.price.toLocaleString()} XNT...` });
    let txId = "pending";
    try {
      txId = await this.signAndSend(tx);
      this.emitTx({ type: "buy", id: params.listingId, status: "confirmed", txId, message: `Purchased for ${params.price.toLocaleString()} XNT!` });
      this.emitData();
    } catch (e: any) {
      this.emitTx({ type: "buy", id: params.listingId, status: "failed", error: e.message });
      throw e;
    }

    return {
      id: `tx-${txId}`,
      listingId: params.listingId,
      prestige: decoded.prestige,
      seed: decoded.seed,
      price: params.price,
      seller: decoded.seller,
      buyer: buyer.toBase58(),
      tradedAt: Date.now(),
      fee,
    };
  }

  /* ── Offers ── */

  async placeOffer(listingId: string, buyer: string, amount: number): Promise<Offer> {
    const buyerKey = new PublicKey(buyer);
    const listingPub = new PublicKey(listingId);
    const statePDA = getMarketStatePDA();

    // Get the listing account data to find the seller for the PDA derivation
    const listingInfo = await this.connection.getAccountInfo(listingPub);
    if (!listingInfo) throw new Error("Listing not found");
    const listingData = new Uint8Array(listingInfo.data);
    const seller = new PublicKey(listingData.slice(8, 40));

    const listingIdx = await this.findListingIndex(listingPub, seller);
    const offerPDA = getOfferPDA(listingPub, buyerKey);

    // placeOffer uses SystemProgram for XNT (native) transfers in the offer itself
    const tx = new Transaction().add({
      keys: [
        { pubkey: statePDA, isSigner: false, isWritable: true },
        { pubkey: listingPub, isSigner: false, isWritable: true },
        { pubkey: offerPDA, isSigner: false, isWritable: true },
        { pubkey: buyerKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: MARKETPLACE_PROGRAM_ID,
      data: Buffer.from([
        ...DISCRIMINATORS.placeOffer,
        ...numberToBytes(listingIdx, 8),
        ...numberToBytes(amount, 8),
      ]),
    });

    this.emitTx({ type: "place-offer", id: offerPDA.toBase58(), status: "pending" });
    try {
      const sig = await this.signAndSend(tx);
      this.emitTx({ type: "place-offer", id: offerPDA.toBase58(), status: "confirmed", txId: sig, message: "Offer placed!" });
      this.emitData();
    } catch (e: any) {
      this.emitTx({ type: "place-offer", id: offerPDA.toBase58(), status: "failed", error: e.message });
      throw e;
    }

    return {
      id: offerPDA.toBase58(),
      listingId,
      buyer,
      amount,
      createdAt: Date.now(),
      status: "pending",
    };
  }

  async acceptOffer(offerId: string, acceptBy: string): Promise<TradeRecord | null> {
    const offerPub = new PublicKey(offerId);
    const seller = new PublicKey(acceptBy);
    const statePDA = getMarketStatePDA();

    // Read offer to find listing and buyer
    const offerInfo = await this.connection.getAccountInfo(offerPub);
    if (!offerInfo) return null;
    const offerData = new Uint8Array(offerInfo.data);
    const listingPub = new PublicKey(offerData.slice(8, 40));
    const buyerKey = new PublicKey(offerData.slice(40, 72));
    const amount = Number(Buffer.from(offerData.slice(72, 80)).readBigUInt64LE(0));

    // Read listing
    const listingInfo = await this.connection.getAccountInfo(listingPub);
    if (!listingInfo) return null;
    const decoded = decodeListing(new Uint8Array(listingInfo.data), listingPub.toBase58());
    const listingIdx = await this.findListingIndex(listingPub, new PublicKey(decoded.seller));

    // Decode mint from raw listing account data
    const rawData = listingInfo.data;
    const mintOffset = 49;
    const nftMint = new PublicKey(new Uint8Array(rawData.slice(mintOffset, mintOffset + 32)));

    const escrowAta = getEscrowAta(listingPub, nftMint);
    const buyerNftAta = getAssociatedTokenAddressSync(nftMint, buyerKey, false, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);
    const feePoolPDA = getFeePoolPDA(decoded.prestige);
    const buyerXntAta = getAssociatedTokenAddressSync(XNT_MINT, buyerKey, false, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);
    const sellerXntAta = getAssociatedTokenAddressSync(XNT_MINT, seller, false, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);

    const tx = new Transaction().add({
      keys: [
        { pubkey: statePDA, isSigner: false, isWritable: true },
        { pubkey: listingPub, isSigner: false, isWritable: true },
        { pubkey: offerPub, isSigner: false, isWritable: true },
        { pubkey: nftMint, isSigner: false, isWritable: false },
        { pubkey: escrowAta, isSigner: false, isWritable: true },
        { pubkey: buyerNftAta, isSigner: false, isWritable: true },
        { pubkey: feePoolPDA, isSigner: false, isWritable: true },
        { pubkey: buyerXntAta, isSigner: false, isWritable: true },
        { pubkey: sellerXntAta, isSigner: false, isWritable: true },
        { pubkey: TREASURY_XNT_ATA, isSigner: false, isWritable: true },
        { pubkey: seller, isSigner: true, isWritable: true },
        { pubkey: buyerKey, isSigner: true, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: new PublicKey("SysvarRent111111111111111111111111111111111"), isSigner: false, isWritable: false },
      ],
      programId: MARKETPLACE_PROGRAM_ID,
      data: Buffer.from([...DISCRIMINATORS.acceptOffer, ...numberToBytes(listingIdx, 8)]),
    });

    const fee = Math.ceil(amount * (feeBpsForPrestige(decoded.prestige) / 10000));

    this.emitTx({ type: "accept-offer", id: offerId, status: "pending" });
    try {
      const sig = await this.signAndSend(tx);
      this.emitTx({ type: "accept-offer", id: offerId, status: "confirmed", txId: sig, message: "Offer accepted!" });
      this.emitData();
    } catch (e: any) {
      this.emitTx({ type: "accept-offer", id: offerId, status: "failed", error: e.message });
      throw e;
    }

    return {
      id: `tx-${offerPub.toBase58()}`,
      listingId: listingPub.toBase58(),
      prestige: decoded.prestige,
      seed: decoded.seed,
      price: amount,
      seller: decoded.seller,
      buyer: buyerKey.toBase58(),
      tradedAt: Date.now(),
      fee,
    };
  }

  async rejectOffer(offerId: string): Promise<void> {
    const offerPub = new PublicKey(offerId);
    const offerInfo = await this.connection.getAccountInfo(offerPub);
    if (!offerInfo) throw new Error("Offer not found");
    const offerData = new Uint8Array(offerInfo.data);
    const listingPub = new PublicKey(offerData.slice(8, 40));

    const listingInfo = await this.connection.getAccountInfo(listingPub);
    if (!listingInfo) throw new Error("Listing not found");
    const listingData = new Uint8Array(listingInfo.data);
    const seller = new PublicKey(listingData.slice(8, 40));
    const listingIdx = await this.findListingIndex(listingPub, seller);

    const tx = new Transaction().add({
      keys: [
        { pubkey: offerPub, isSigner: false, isWritable: true },
        { pubkey: listingPub, isSigner: false, isWritable: false },
        { pubkey: new PublicKey(this.walletPubkey!), isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: MARKETPLACE_PROGRAM_ID,
      data: Buffer.from([...DISCRIMINATORS.rejectOffer, ...numberToBytes(listingIdx, 8)]),
    });

    await this.signAndSend(tx);
    this.emitData();
  }

  async cancelOffer(offerId: string): Promise<void> {
    const offerPub = new PublicKey(offerId);
    const offerInfo = await this.connection.getAccountInfo(offerPub);
    if (!offerInfo) throw new Error("Offer not found");
    const offerData = new Uint8Array(offerInfo.data);
    const listingPub = new PublicKey(offerData.slice(8, 40));

    // Read listing to find seller and listing index
    const listingInfo = await this.connection.getAccountInfo(listingPub);
    if (!listingInfo) throw new Error("Listing not found");
    const listingData = new Uint8Array(listingInfo.data);
    const seller = new PublicKey(listingData.slice(8, 40));
    const listingIdx = await this.findListingIndex(listingPub, seller);

    const tx = new Transaction().add({
      keys: [
        { pubkey: offerPub, isSigner: false, isWritable: true },
        { pubkey: listingPub, isSigner: false, isWritable: false },
        { pubkey: new PublicKey(this.walletPubkey!), isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: MARKETPLACE_PROGRAM_ID,
      data: Buffer.from([...DISCRIMINATORS.cancelOffer, ...numberToBytes(listingIdx, 8)]),
    });

    await this.signAndSend(tx);
    this.emitData();
  }

  /* ── Queries ── */

  async getActiveListings(): Promise<MarketplaceListing[]> {
    const statePDA = getMarketStatePDA();
    const stateInfo = await this.connection.getAccountInfo(statePDA);
    const totalListings = stateInfo
      ? Number(Buffer.from(stateInfo.data.slice(40, 48)).readBigUInt64LE(0))
      : 0;

    const listings: MarketplaceListing[] = [];
    try {
      // Use listing discriminator bytes as filter
      const discrimBuf = Buffer.from(DISCRIMINATORS.listNft);
      const programAccounts = await this.connection.getProgramAccounts(MARKETPLACE_PROGRAM_ID, {
        filters: [
          { memcmp: { offset: 0, bytes: discrimBuf.toString("base64") } },
        ],
      });
      for (const { pubkey, account } of programAccounts) {
        const decoded = decodeListing(new Uint8Array(account.data), pubkey.toBase58());
        if (decoded.status === "active") listings.push(decoded);
      }
    } catch (e) {
      console.warn("getProgramAccounts fallback: using empty list", e);
    }

    return listings;
  }

  async getMyListings(walletAddress: string): Promise<MarketplaceListing[]> {
    const all = await this.getActiveListings();
    return all.filter(l => l.seller === walletAddress);
  }

  async getTradeHistory(address?: string): Promise<TradeRecord[]> {
    return [];
  }

  async getOffers(listingId?: string): Promise<Offer[]> {
    try {
      const discrimBuf = Buffer.from(DISCRIMINATORS.placeOffer);
      const filters: any[] = [
        { memcmp: { offset: 0, bytes: discrimBuf.toString("base64") } },
      ];
      if (listingId) {
        filters.push({ memcmp: { offset: 8, bytes: new PublicKey(listingId).toBase58() } });
      }
      const accounts = await this.connection.getProgramAccounts(MARKETPLACE_PROGRAM_ID, { filters });
      return accounts
        .map(({ pubkey, account }) => decodeOffer(new Uint8Array(account.data), pubkey.toBase58()))
        .filter(o => o.status === "pending");
    } catch {
      return [];
    }
  }

  async getBalance(address: string): Promise<BalanceSnapshot> {
    const pubkey = new PublicKey(address);
    // Get SPL Token XNT balance
    const xntAta = getAssociatedTokenAddressSync(XNT_MINT, pubkey, false, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);
    let xntBalance = 0;
    try {
      const tokenAccountInfo = await this.connection.getTokenAccountBalance(xntAta);
      xntBalance = Number(tokenAccountInfo.value.amount) / (10 ** tokenAccountInfo.value.decimals);
    } catch {
      xntBalance = 0;
    }

    const myListings = await this.getMyListings(address);
    return {
      walletAddress: address,
      xntBalance,
      totalListings: myListings.length,
      totalTrades: 0,
    };
  }

  /* ── Subscriptions ── */

  onTxUpdate(cb: (u: TxUpdate) => void): () => void {
    this.txListeners.add(cb);
    return () => this.txListeners.delete(cb);
  }

  onDataChange(cb: () => void): () => void {
    this.dataListeners.add(cb);
    return () => this.dataListeners.delete(cb);
  }

  /* ── Private helpers ── */

  private emitTx(u: TxUpdate) { this.txListeners.forEach(cb => cb(u)); }
  private emitData() { this.dataListeners.forEach(cb => cb()); }

  /** Find the listing index by checking PDA derivations for a range */
  private async findListingIndex(listingPub: PublicKey, seller: PublicKey): Promise<number> {
    const statePDA = getMarketStatePDA();
    const stateInfo = await this.connection.getAccountInfo(statePDA);
    const total = stateInfo
      ? Number(Buffer.from(stateInfo.data.slice(40, 48)).readBigUInt64LE(0))
      : 100;

    // Linear scan (acceptable for small listing counts)
    for (let i = 0; i < Math.min(total, 1000); i++) {
      const candidate = getListingPDA(seller, i);
      if (candidate.equals(listingPub)) return i;
    }
    return 0; // fallback
  }
}

/* ─── Helpers ────────────────────────────────────────────────── */

function numberToBytes(n: number, len: number): number[] {
  const buf = Buffer.alloc(len);
  if (len === 8) buf.writeBigUInt64LE(BigInt(n));
  else if (len === 4) buf.writeUInt32LE(n);
  else if (len === 2) buf.writeUInt16LE(n);
  return Array.from(buf);
}

/**
 * Load the marketplace IDL from the static JSON file.
 * Returns the parsed IDL object.
 */
export async function fetchMarketplaceIdl(): Promise<any> {
  const resp = await fetch('/idl_marketplace.json');
  return resp.json();
}

/**
 * Check if the marketplace program is deployed and initialized.
 */
export async function isMarketplaceLive(connection: Connection): Promise<boolean> {
  const pda = getMarketStatePDA();
  const info = await connection.getAccountInfo(pda);
  return info !== null && info.data.length > 0;
}