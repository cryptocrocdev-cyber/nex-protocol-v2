"use client";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram, Transaction, Connection } from "@solana/web3.js";
import { Program, AnchorProvider, Idl, BN } from "@coral-xyz/anchor";
import idl from "./nex_protocol_idl.json";
import { NETWORK } from "./network";
import { useCallback, useEffect, useRef, useState } from "react";

const PROGRAM_ID = new PublicKey(NETWORK.programId);
const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");
const RENT_SYSVAR = new PublicKey("SysvarRent111111111111111111111111111111111");

// PDA helpers
export function getProtocolStatePDA(): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("protocol_state")],
    PROGRAM_ID
  );
  return pda;
}

export function getUserStatePDA(user: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("user_state"), user.toBuffer()],
    PROGRAM_ID
  );
  return pda;
}

export function getPrestigeMintPDA(prestige: number): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("prestige_mint"), Buffer.from([prestige])],
    PROGRAM_ID
  );
  return pda;
}

export function getAssociatedTokenAddress(mint: PublicKey, owner: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  return pda;
}

// Direct RPC connection that bypasses any wallet proxy
let _directConn: Connection | null = null;
function getDirectConnection(): Connection {
  if (!_directConn && typeof window !== "undefined") {
    _directConn = new Connection(NETWORK.rpc, "confirmed");
  }
  return _directConn!;
}

// Hook for on-chain interactions
export function useNexProgram() {
  const { connection: walletConnection } = useConnection();
  const wallet = useWallet();
  const [program, setProgram] = useState<Program | null>(null);
  const [initializing, setInitializing] = useState(false);

  // Use direct connection for ALL RPC — wallet only signs
  const conn = getDirectConnection();

  useEffect(() => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      setProgram(null);
      return;
    }
    const provider = new AnchorProvider(
      conn,
      wallet as any,
      { commitment: "confirmed" }
    );
    const prog = new Program(idl as Idl, provider);
    setProgram(prog);
  }, [walletConnection, wallet.publicKey, wallet.signTransaction, conn]);

  const initProtocol = useCallback(async () => {
    if (!program || !wallet.publicKey) return;
    setInitializing(true);
    try {
      const tx = await program.methods
        .initProtocol()
        .accounts({
          protocolState: getProtocolStatePDA(),
          authority: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .transaction();
      // Use wallet.sendTransaction with DIRECT connection (not proxied one)
      const sig = await wallet.sendTransaction!(tx, conn);
      await conn.confirmTransaction(sig, "confirmed");
      return sig;
    } catch (e: any) {
      console.error("initProtocol error:", e);
      throw e;
    } finally {
      setInitializing(false);
    }
  }, [program, wallet.publicKey, wallet.sendTransaction, conn]);

  const initUser = useCallback(async () => {
    if (!program || !wallet.publicKey) return;
    setInitializing(true);
    try {
      const userStatePda = getUserStatePDA(wallet.publicKey);
      const tx = await program.methods
        .initUser()
        .accounts({
          userState: userStatePda,
          user: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .transaction();
      const sig = await wallet.sendTransaction!(tx, conn);
      await conn.confirmTransaction(sig, "confirmed");
      return sig;
    } catch (e: any) {
      console.error("initUser error:", e);
      throw e;
    } finally {
      setInitializing(false);
    }
  }, [program, wallet.publicKey, wallet.sendTransaction, conn]);

  const tap = useCallback(async () => {
    if (!program || !wallet.publicKey) return;
    try {
      const tx = await program.methods
        .tap()
        .accounts({
          userState: getUserStatePDA(wallet.publicKey),
          user: wallet.publicKey,
        })
        .transaction();
      const sig = await wallet.sendTransaction!(tx, conn);
      await conn.confirmTransaction(sig, "confirmed");
      return sig;
    } catch (e: any) {
      console.error("tap error:", e);
      throw e;
    }
  }, [program, wallet.publicKey, wallet.sendTransaction, conn]);

  const prestige = useCallback(async (currentPrestige: number) => {
    if (!program || !wallet.publicKey) return;
    const nextPrestige = currentPrestige + 1;
    try {
      const userState = getUserStatePDA(wallet.publicKey);
      const mint = getPrestigeMintPDA(nextPrestige);
      const ata = getAssociatedTokenAddress(mint, wallet.publicKey);

      const tx = await program.methods
        .prestige()
        .accounts({
          userState,
          mint,
          userTokenAccount: ata,
          user: wallet.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: RENT_SYSVAR,
        })
        .transaction();
      const sig = await wallet.sendTransaction!(tx, conn);
      await conn.confirmTransaction(sig, "confirmed");
      return sig;
    } catch (e: any) {
      console.error("prestige error:", e);
      throw e;
    }
  }, [program, wallet.publicKey, wallet.sendTransaction, conn]);

  return {
    program,
    initializing,
    initProtocol,
    initUser,
    tap,
    prestige,
  };
}
