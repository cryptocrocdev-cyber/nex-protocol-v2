import {
  BaseMessageSignerWalletAdapter,
  WalletName,
  WalletReadyState,
} from "@solana/wallet-adapter-base";
import { PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";

export const X1WalletName = "X1 Wallet" as WalletName<"X1 Wallet">;

// Always show X1 Wallet in the wallet list regardless of detection
// On mobile, user pairs via WalletConnect (X1 Wallet app)
// On desktop, user uses the browser extension

interface X1Provider {
  isX1Wallet?: boolean;
  publicKey?: { toBytes(): Uint8Array };
  signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T>;
  signAllTransactions<T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]>;
  signMessage(message: Uint8Array): Promise<{ signature: Uint8Array }>;
  connect(): Promise<{ publicKey: { toBytes(): Uint8Array } }>;
  disconnect(): Promise<void>;
  on(event: string, fn: () => void): void;
  off(event: string, fn: () => void): void;
}

interface X1Window extends Window {
  x1wallet?: X1Provider;
  x1?: X1Provider;
}

export class X1WalletAdapter extends BaseMessageSignerWalletAdapter {
  name = X1WalletName;
  // Mobile → app store link. Desktop → Chrome extension.
  private static isMobile(): boolean {
    if (typeof navigator === "undefined") return false;
    return /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }
  url = X1WalletAdapter.isMobile()
    ? "https://play.google.com/store/apps/details?id=com.x1wallet.mobile"
    : "https://chromewebstore.google.com/detail/x1-wallet/kcfmcpdmlchhbikbogddmgopmjbflnae";
  icon = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48dGV4dCB4PSI0IiB5PSIyMiIgZm9udC1zaXplPSIyMCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIj5YMTwvdGV4dD48L3N2Zz4=";
  supportedTransactionVersions = null;

  private _connecting = false;
  private _publicKey: PublicKey | null = null;
  private _readyState = WalletReadyState.Loadable;

  constructor() {
    super();
    // Always set to Installed — user has the extension.
    // The _getProvider check is unreliable because X1 Wallet may inject
    // under window.solana (Phantom-compatible mode) rather than window.x1wallet.
    // Setting Installed lets the wallet adapter call connect() instead of
    // opening the Chrome Web Store URL.
    if (typeof window !== "undefined") {
      this._readyState = WalletReadyState.Installed;
      this._checkReady();
    }
  }

  get publicKey(): PublicKey | null {
    return this._publicKey;
  }

  get connecting(): boolean {
    return this._connecting;
  }

  get readyState(): WalletReadyState {
    return this._readyState;
  }

  private _getProvider(): X1Provider | null {
    if (typeof window === "undefined") return null;
    const w = window as unknown as X1Window;
    // Check custom X1 injection first, then standard Solana injection
    if (w.x1wallet || w.x1) return w.x1wallet || w.x1 || null;
    // Also check if any Solana-standard wallet with X1 capability is detected
    const sol = (w as any).solana;
    if (sol && sol.isX1Wallet) return sol as unknown as X1Provider;
    return null;
  }

  /**
   * Fallback: try window.solana as provider (X1 Wallet may use Phantom-compatible injection).
   * This is used in connect() when _getProvider() returns null.
   */
  private _getSolanaFallback(): X1Provider | null {
    const sol = (window as any).solana;
    if (!sol) return null;
    // If the user has a Solana wallet and chose X1 Wallet, try to use it
    if (typeof sol.connect === "function" && typeof sol.signTransaction === "function") {
      return sol as unknown as X1Provider;
    }
    return null;
  }

  private _checkReady() {
    const provider = this._getProvider();
    if (provider) {
      // Don't pre-set _publicKey — wait for explicit connect()
      // so Solana wallet-adapter state machine handles it correctly.
      provider.on("connect", () => {
        if (provider.publicKey) {
          this._publicKey = new PublicKey(provider.publicKey.toBytes());
          this.emit("connect", this._publicKey);
        }
      });
      provider.on("disconnect", () => {
        this._publicKey = null;
        this.emit("disconnect");
      });
    }
  }

  async connect(): Promise<void> {
    try {
      this._connecting = true;

      const provider = this._getProvider();
      if (!provider) {
        // Try window.solana fallback — X1 Wallet may inject as Phantom-compatible
        const fallback = this._getSolanaFallback();
        if (fallback) {
          const { publicKey } = await fallback.connect();
          this._publicKey = new PublicKey(publicKey.toBytes());
          this._connecting = false;
          this._readyState = WalletReadyState.Installed;
          this.emit("connect", this._publicKey);
          return;
        }
      }
      if (!provider) throw new Error("X1 Wallet not found on this page. Make sure X1 Wallet extension is installed and try again.");

      // Always call provider.connect() to ensure proper pairing
      const { publicKey } = await provider.connect();
      this._publicKey = new PublicKey(publicKey.toBytes());
      this._connecting = false;
      this._readyState = WalletReadyState.Installed;
      this.emit("connect", this._publicKey);
    } catch (error: any) {
      this._connecting = false;
      this.emit("error", error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    const provider = this._getProvider();
    if (provider) {
      await provider.disconnect();
    }
    this._publicKey = null;
    this.emit("disconnect");
  }

  async signTransaction<T extends Transaction | VersionedTransaction>(transaction: T): Promise<T> {
    const provider = this._getProvider();
    if (!provider) throw new Error("X1 Wallet not found");
    return provider.signTransaction(transaction);
  }

  async signAllTransactions<T extends Transaction | VersionedTransaction>(transactions: T[]): Promise<T[]> {
    const provider = this._getProvider();
    if (!provider) throw new Error("X1 Wallet not found");
    return provider.signAllTransactions(transactions);
  }

  async signMessage(message: Uint8Array): Promise<Uint8Array> {
    const provider = this._getProvider();
    if (!provider) throw new Error("X1 Wallet not found");
    const { signature } = await provider.signMessage(message);
    return signature;
  }

  /**
   * Override sendTransaction to use raw sign+send path.
   * The default adapter serialization pipeline can fail on X1 testnet RPC.
   */
  async sendTransaction(
    transaction: Transaction | VersionedTransaction,
    connection: any,
    options?: any
  ): Promise<string> {
    const provider = this._getProvider();
    if (!provider) throw new Error("X1 Wallet not found");

    if (transaction instanceof VersionedTransaction) {
      const signed = await provider.signTransaction(transaction);
      return connection.sendRawTransaction(signed.serialize(), options);
    }

    // Legacy Transaction
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = this._publicKey!;
    const signed = await provider.signTransaction(transaction);
    return connection.sendRawTransaction(signed.serialize(), options);
  }
}