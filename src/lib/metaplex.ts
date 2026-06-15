/* ═══════════════════════════════════════════════════════════════
   metaplex.ts — Lean Metaplex metadata creation for Void iNFTs
   Builds CreateMetadataAccountV3 instruction manually (no heavy SDK).
   Uses 4-byte LE string lengths (UMI string() format).
   Account order must match mpl-token-metadata v3 expectations.
   ═══════════════════════════════════════════════════════════════ */
import {
  PublicKey,
  TransactionInstruction,
} from "@solana/web3.js";

// ─── Metaplex Token Metadata program ID (same on all Solana chains) ──
export const METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

// ─── PDA helpers ───────────────────────────────────────────────────

/** Derive the Metadata PDA for a given mint */
export function findMetadataPDA(mint: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      METADATA_PROGRAM_ID.toBytes(),
      mint.toBytes(),
    ],
    METADATA_PROGRAM_ID
  )[0];
}

/** Derive the Master Edition PDA for a given mint */
export function findMasterEditionPDA(mint: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      METADATA_PROGRAM_ID.toBytes(),
      mint.toBytes(),
      Buffer.from("edition"),
    ],
    METADATA_PROGRAM_ID
  )[0];
}

// ─── Instruction builder ───────────────────────────────────────────

/**
 * Builds a CreateMetadataAccountV3 instruction.
 *
 * Account order (MUST match mpl-token-metadata by index):
 *   0: metadata (writable)
 *   1: mint (readonly)
 *   2: mintAuthority (readonly, signer)
 *   3: payer (writable, signer) ← must be writable!
 *   4: updateAuthority (readonly)
 *   5: systemProgram
 *   6: rent
 */
export function createMetadataInstruction(
  mint: PublicKey,
  mintAuthority: PublicKey,
  payer: PublicKey,
  updateAuthority: PublicKey,
  name: string,
  symbol: string,
  uri: string,
  sellerFeeBasisPoints: number = 0,
): TransactionInstruction {
  const metadataPDA = findMetadataPDA(mint);

  // ─── Build data payload ───────────────────────────────────────────
  // Discriminator: 33 (CreateMetadataAccountV3)
  // All strings use 4-byte LE length prefix (UMI string() format)
  // Then: seller_fee_basis_points (u16 LE)
  // Then: creators (option<vec>) → 0 for None
  // Then: collection (option) → 0 for None
  // Then: uses (option) → 0 for None
  // Then: is_mutable (bool) → 1
  // Then: collection_details (option) → 0 for None

  const nameBytes = Buffer.from(name, "utf8");
  const symbolBytes = Buffer.from(symbol, "utf8");
  const uriBytes = Buffer.from(uri, "utf8");

  const totalLen = 1 // discriminator
    + 4 + nameBytes.length
    + 4 + symbolBytes.length
    + 4 + uriBytes.length
    + 2 // sellerFeeBasisPoints
    + 1 // creators (None)
    + 1 // collection (None)
    + 1 // uses (None)
    + 1 // isMutable
    + 1; // collectionDetails (None)

  const data = Buffer.alloc(totalLen);
  let offset = 0;

  // Discriminator byte for CreateMetadataAccountV3
  data.writeUInt8(33, offset); offset += 1;

  // name (u32 LE length prefix + bytes)
  data.writeUInt32LE(nameBytes.length, offset); offset += 4;
  nameBytes.copy(data, offset); offset += nameBytes.length;

  // symbol (u32 LE length prefix + bytes)
  data.writeUInt32LE(symbolBytes.length, offset); offset += 4;
  symbolBytes.copy(data, offset); offset += symbolBytes.length;

  // uri (u32 LE length prefix + bytes)
  data.writeUInt32LE(uriBytes.length, offset); offset += 4;
  uriBytes.copy(data, offset); offset += uriBytes.length;

  // seller_fee_basis_points (u16 LE)
  data.writeUInt16LE(sellerFeeBasisPoints, offset); offset += 2;

  // creators (option<vec>): None = 0
  data.writeUInt8(0, offset); offset += 1;

  // collection (option<Collection>): None = 0
  data.writeUInt8(0, offset); offset += 1;

  // uses (option<Uses>): None = 0
  data.writeUInt8(0, offset); offset += 1;

  // is_mutable (bool)
  data.writeUInt8(1, offset); offset += 1;

  // collection_details (option<CollectionDetails>): None = 0
  data.writeUInt8(0, offset); offset += 1;

  const keys = [
    { pubkey: metadataPDA, isSigner: false, isWritable: true },
    { pubkey: mint, isSigner: false, isWritable: false },
    { pubkey: mintAuthority, isSigner: true, isWritable: false },
    { pubkey: payer, isSigner: true, isWritable: true },  // CRITICAL: writable!
    { pubkey: updateAuthority, isSigner: false, isWritable: false },
    { pubkey: PublicKey.default, isSigner: false, isWritable: false },
    {
      pubkey: new PublicKey("SysvarRent111111111111111111111111111111111"),
      isSigner: false, isWritable: false,
    },
  ];

  return new TransactionInstruction({
    programId: METADATA_PROGRAM_ID,
    keys,
    data,
  });
}