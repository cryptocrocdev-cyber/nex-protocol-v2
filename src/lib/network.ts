// ─── Network Config — single source of truth ─────────────────────────
// Mainnet only. Program: 9xdgUtSwbkztgcG8FeKLJ9kJkP8tc3C7rY2LebMfahut

const config = {
  label: "MAINNET",
  rpc: "https://rpc.mainnet.x1.xyz",
  programId: "9xdgUtSwbkztgcG8FeKLJ9kJkP8tc3C7rY2LebMfahut",
  devWallet: "BQLB3NPHGRfibY23qTDbEYBuhZu2KsdiD3pbxuu8Fpxh",
  faucet: "", // no faucet on mainnet
};

export const NETWORK_MODE = "mainnet";
export const NETWORK = config;