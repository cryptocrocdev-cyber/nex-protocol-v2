"use client";
import Link from "next/link";

// ── Contract Constants ──
const data = {
  contractId: "6mW4UtKdTtiLNDcDXhDiYzRSD9ewaZeCzCyoXbW5zMF",
  devWallet: "BQLB3NPHGRfibY23qTDbEYBuhZu2KsdiD3pbxuu8Fpxh",
  lampotsPerXnt: 1_000_000_000,
  entryFeeXnt: 1,             // 1 XNT to unlock the game
  prestigeFeeXnt: 0.01,       // 0.01 XNT per prestige action
  nexPerTap: 1_000,           // 1 tap = 1,000 NEX
  nexPerPrestige: 30_000,     // 30,000 NEX per prestige
  tapsPerPrestige: 30,        // 30 taps = 1 prestige
  mintCostNex: 5_000,         // 5,000 NEX to mint an iNFT
  inftsP100: 1,               // P100 max: 1 iNFT
  totalPrestigeLevels: 100,
  // Progressive mint: P1=99, P2=98, ... P99=1, P100=1  → 4,951 total possible iNFTs
};

// ── Prestige names ──
const PRESTIGE_NAMES: string[] = [
  "WRAITH", "PHANTOM", "MORTIS", "VALOR", "SOVEREIGN",
  "SHOGUN", "UMBRA", "PYREX", "TITAN", "OMEGA",
  "DRACONIS", "PHOENIX", "GRYPHON", "KRAKEN", "CHIMERA",
  "BASILISK", "CERBERUS", "HYDRA", "MINOTAUR", "PEGASUS",
  "SOLARIS", "LUNARIS", "STELLAR", "COMET", "NEBULA",
  "GALAXY", "SUPERNOVA", "AURORA", "ASTEROID", "ECLIPSE",
  "GLADIATOR", "CENTURION", "VIKING", "SAMURAI", "SPARTAN",
  "NINJA", "MONGOL", "KNIGHT", "BERSERKER", "PALADIN",
  "NECROMANCER", "SORCERER", "WARLOCK", "ALCHEMIST", "SHAMAN",
  "DRUID", "MAGE", "WITCH", "RUNEMASTER", "SUMMONER",
  "CYBORG", "MECHA", "DRONE", "SENTINEL", "HACKER",
  "ANDROID", "RAILGUN", "CYBER", "TURRET", "EXO",
  "WOLF", "RAVEN", "EAGLE", "SERPENT", "PANTHER",
  "BEAR", "FALCON", "SCORPION", "MANTIS", "DRAGONFLY",
  "VOID", "QUASAR", "PULSAR", "COSMONAUT", "WORMHOLE",
  "DIMENSION", "TIMEKEEPER", "ORBIT", "ZENITH", "NEXUS",
  "EXCALIBUR", "THUNDER", "FROST", "INFERNO", "SHADOWBLADE",
  "ARCANE", "VENOM", "DOOM", "HOLY", "CHAOS",
  "IMMORTAL", "CREATOR", "DESTROYER", "GODSLAYER", "ASCENDED",
  "PRIMORDIAL", "TRANSCEND", "ABSOLUTE", "INFINITE", "NEX_PROTOCOL",
];

const milestonePrestiges = [1, 5, 10, 25, 50, 75, 100];

export default function WhitepaperPage() {
  return (
    <main className="nex-aurora-bg min-h-screen text-[#e8e4dd]">
      <div className="sticky top-0 z-50 border-b border-white/5 bg-black/80 backdrop-blur-lg">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition">
            <img src="/nex-logo.jpg" alt="NEX" className="h-6 w-auto rounded" />
          </Link>
          <div className="flex gap-4 text-xs font-mono">
            <Link href="/" className="text-white/40 hover:text-white/80 transition">App</Link>
            <a href="#" className="text-[#0066ff] border-b border-[#0066ff]/40">Whitepaper</a>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12 md:py-20">

        {/* HERO — Full bleed image */}
        <div className="relative w-full mb-8 rounded-2xl overflow-hidden" style={{ aspectRatio: '3/4', maxHeight: '70vh' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/nex-hero.jpg"
            alt="Prestige Protocol — The 100 Prestige Levels"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(0deg, rgba(0,0,0,0.8) 0%, transparent 40%, rgba(0,0,0,0.4) 100%)',
          }} />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
            <h1 className="text-4xl md:text-7xl font-bold glow-gold mb-2" style={{ textShadow: '0 0 40px rgba(0,102,255,0.5)' }}>Prestige Protocol</h1>
            <p className="text-lg md:text-2xl text-[#4488ff]/80 mb-1 font-semibold">The NEXUS Game Whitepaper</p>
            <p className="text-xs text-white/40 font-mono mt-2">
              💎 1 XNT dev fee · 💰 0.01 XNT prestige fee · XNT = X1 native gas · 100 unique LP pools · 30 taps = 30,000 NEX = 1 prestige
            </p>
          </div>
        </div>
        <p className="text-xs text-white/20 font-mono mb-8 text-center">
          Contract: <code className="text-[#4488ff]/50">{data.contractId}</code> · Dev: <code className="text-[#4488ff]/50">{data.devWallet.slice(0, 8)}...{data.devWallet.slice(-4)}</code>
        </p>

        {/* SUMMARY */}
        <div className="glass-card p-6 md:p-8 mb-12">
          <h2 className="text-xl font-bold glow-gold mb-4">Executive Summary</h2>
          <p className="text-sm leading-relaxed text-white/70 mb-6">
            NEX is a tap-to-earn prestige game on X1 (Solana VM). Tap for NEX, accumulate to 30,000,
            prestige up with 0.01 XNT on-chain. Mint iNFTs at 5,000 NEX each using gas only.
            <strong className="text-[#0066ff]"> Tap doesn't cost gas. Prestige costs 0.01 XNT. Minting costs gas.</strong>
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              [String(data.totalPrestigeLevels), "Prestige levels"],
              [`${(data.nexPerPrestige / 1000).toLocaleString()}K NEX`, "Cost per prestige"],
              [`${data.tapsPerPrestige} taps`, "Taps per prestige"],
              [`99→1 decreasing`, "iNFTs per prestige level"],
            ].map(([val, label]) => (
              <div key={label} className="glass-card-sm p-3 text-center">
                <div className="text-lg font-bold text-[#0066ff]">{val}</div>
                <div className="text-xs text-white/40 mt-1">{label}</div>
              </div>
            ))}
          </div>
          <div className="text-xs text-white/40">
            <p>Progressive minting: P1=99, P2=98, ... P99=1, P100=1 · 4,951 iNFTs total · Tapping costs no gas · Prestige only ever upward</p>
          </div>
        </div>

        {/* 1 - THE GAME */}
        <section className="mb-16 scroll-mt-20">
          <h2 className="text-2xl md:text-3xl font-bold glow-amber mb-6">1 - The Game: Tap, Prestige, Mint, Repeat</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="glass-card-sm p-5 border-l-4 border-[#0066ff]">
              <h3 className="font-bold text-[#0066ff] mb-2">1. Tap for NEX</h3>
              <p className="text-xs text-white/60 leading-relaxed">
                1 tap = 1,000 NEX. <strong className="text-[#0066ff]">Costs nothing but your finger.</strong>
                No gas, no energy bars, no cooldowns. Tap until you have 30,000 NEX.
                Each tap is just a signal to show you put in the work.
              </p>
            </div>
            <div className="glass-card-sm p-5 border-l-4 border-[#0066ff]">
              <h3 className="font-bold text-[#0066ff] mb-2">2. Prestige</h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Once you have 30,000 NEX, the prestige button activates.
                Spend <strong className="text-[#0066ff]">0.01 XNT</strong> on-chain to burn through your
                NEX and advance 1 prestige level. <strong className="text-[#0066ff]">Upward only.</strong>
                P100 is the peak.
              </p>
            </div>
            <div className="glass-card-sm p-5 border-l-4 border-[#0066ff]">
              <h3 className="font-bold text-[#0066ff] mb-2">3. Mint iNFTs</h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Mint iNFTs with <strong className="text-[#0066ff]">5,000 NEX + gas</strong> per mint.
                No XNT fee - just NEX and the cost of the transaction.
                <strong className="text-[#0066ff]"> Progressive minting:</strong> P1=99, P2=98, ... down to P99=1, P100=1.
                4,951 possible iNFTs across all 100 levels.
                You are not forced to mint before prestiging - just tap 30 times and go.
              </p>
            </div>
          </div>

          <div className="glass-card-sm p-5 border border-[#0066ff]/20">
            <p className="text-sm text-white/80 leading-relaxed">
              <strong className="text-[#0066ff]">Simple loop:</strong> Tap 30 times → Prestige → Mint if you want → Tap 30 more.
              No lockups. No mandatory minter. Pure grind-to-earn.
            </p>
          </div>
        </section>

        {/* 2 - THE TABLE */}
        <section className="mb-16 scroll-mt-20">
          <h2 className="text-2xl md:text-3xl font-bold glow-amber mb-6">2 - The 100 Prestige iNFTs</h2>

          <p className="text-sm text-white/70 leading-relaxed mb-6">
            Every prestige costs <strong className="text-[#0066ff]">30,000 NEX + 0.01 XNT</strong>.
            Total to P100: 3,000,000 NEX + 1 XNT prestige fees. <strong className="text-[#0066ff]">No shortcuts.</strong>
          </p>

          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm border-collapse">
              <thead><tr className="border-b border-white/10">
                <th className="text-left py-2 pr-4 text-[#0066ff]">Prestige</th>
                <th className="text-left py-2 pr-4 text-[#0066ff]">iNFT Name</th>
                <th className="text-left py-2 pr-4 text-[#0066ff]">NEX Cost</th>
                <th className="text-left py-2 pr-4 text-[#0066ff]">XNT Fee</th>
                <th className="text-left py-2 pr-4 text-[#0066ff]">Taps</th>
                <th className="text-left py-2 text-[#0066ff]">Max iNFTs</th>
              </tr></thead>
              <tbody className="text-white/60">
                {milestonePrestiges.map((level) => (
                  <tr key={level} className="border-b border-white/5">
                    <td className="py-2 pr-4 font-bold text-white/80">P{level}</td>
                    <td className="py-2 pr-4 text-[#0066ff]">{PRESTIGE_NAMES[level - 1]}</td>
                    <td className="py-2 pr-4 font-mono">30,000 NEX</td>
                    <td className="py-2 pr-4 font-mono">0.01 XNT</td>
                    <td className="py-2 pr-4 font-mono">30</td>
                    <td className="py-2 font-mono text-[#0066ff]">{level === 100 ? 1 : 100 - level}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="glass-card-sm p-5 border border-[#0066ff]/20">
            <h3 className="font-bold text-[#0066ff] mb-3 text-sm">2.1 Progressive Minting by Prestige</h3>
            <p className="text-xs text-white/60 leading-relaxed">
              Each prestige level lets you mint a decreasing number of iNFTs:
              <strong className="text-[#0066ff]"> P1=99, P2=98, P3=97, ... P99=1, P100=1.</strong>
              That's 4,951 total iNFTs across the entire climb.
              At P100 you mint <strong className="text-[#0066ff]">1</strong> iNFT - "NEX_PROTOCOL".
              Game complete. To play again, pay the <strong className="text-[#0066ff]">1 XNT dev fee</strong> again
              and restart from P1.
            </p>
          </div>
        </section>

        {/* 3 - FEE STRUCTURE */}
        <section className="mb-16 scroll-mt-20">
          <h2 className="text-2xl md:text-3xl font-bold glow-amber mb-6">3 - Fee Structure</h2>
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm border-collapse">
              <thead><tr className="border-b border-white/10">
                <th className="text-left py-2 pr-4 text-[#0066ff]">Action</th>
                <th className="text-left py-2 pr-4 text-[#0066ff]">NEX Cost</th>
                <th className="text-left py-2 pr-4 text-[#0066ff]">XNT Cost</th>
                <th className="text-left py-2 text-[#0066ff]">Notes</th>
              </tr></thead>
              <tbody className="text-white/60">
                <tr className="border-b border-white/5">
                  <td className="py-2 pr-4">Game Entry</td>
                  <td className="py-2 pr-4 font-mono text-white/30">-</td>
                  <td className="py-2 pr-4 font-mono">{data.entryFeeXnt} XNT</td>
                  <td className="py-2">One-time dev fee to unlock</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-2 pr-4">Tap</td>
                  <td className="py-2 pr-4 font-mono">0</td>
                  <td className="py-2 pr-4 font-mono text-white/30">-</td>
                  <td className="py-2">Free. No gas. Gets 1,000 NEX</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-2 pr-4">Prestige</td>
                  <td className="py-2 pr-4 font-mono">30,000 NEX</td>
                  <td className="py-2 pr-4 font-mono">0.01 XNT</td>
                  <td className="py-2">Burned - removed from supply</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-2 pr-4">Mint iNFT</td>
                  <td className="py-2 pr-4 font-mono">5,000 NEX</td>
                  <td className="py-2 pr-4 font-mono text-white/30">Gas only</td>
                  <td className="py-2">9,500 NEX per level if mint 10</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-2 pr-4">P100 Mint</td>
                  <td className="py-2 pr-4 font-mono">5,000 NEX</td>
                  <td className="py-2 pr-4 font-mono text-white/30">Gas only</td>
                  <td className="py-2">Max 1 iNFT at P100</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Restart</td>
                  <td className="py-2 pr-4 font-mono text-white/30">-</td>
                  <td className="py-2 pr-4 font-mono">{data.entryFeeXnt} XNT</td>
                  <td className="py-2">Pay 1 XNT dev fee again</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 4 - iNFT PROGRESSIVE MINTING */}
        <section className="mb-16 scroll-mt-20">
          <h2 className="text-2xl md:text-3xl font-bold glow-amber mb-6">4 - Progressive Minting</h2>
          <p className="text-sm text-white/70 leading-relaxed mb-6">
            Each prestige level grants a decreasing number of mint slots:
            <strong className="text-[#0066ff]"> 99 → 1</strong>. You cannot mint more than the slot
            count for your current level. Forge (3→1) lets you climb without tapping.
          </p>
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm border-collapse">
              <thead><tr className="border-b border-white/10">
                <th className="text-left py-2 pr-4 text-[#0066ff]">Prestige</th>
                <th className="text-left py-2 pr-4 text-[#0066ff]">Max Mints</th>
                <th className="text-left py-2 pr-4 text-[#0066ff]">Total NEX to Mint All</th>
                <th className="text-left py-2 text-[#0066ff]">Notes</th>
              </tr></thead>
              <tbody className="text-white/60">
                <tr className="border-b border-white/5">
                  <td className="py-2 pr-4 font-bold text-white/80">P1</td>
                  <td className="py-2 pr-4 font-mono text-[#0066ff]">99</td>
                  <td className="py-2 pr-4 font-mono">495,000 NEX</td>
                  <td className="py-2">Start of the climb</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-2 pr-4 font-bold text-white/80">P10</td>
                  <td className="py-2 pr-4 font-mono text-[#0066ff]">90</td>
                  <td className="py-2 pr-4 font-mono">450,000 NEX</td>
                  <td className="py-2">Getting warmer</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-2 pr-4 font-bold text-white/80">P50</td>
                  <td className="py-2 pr-4 font-mono text-[#0066ff]">50</td>
                  <td className="py-2 pr-4 font-mono">250,000 NEX</td>
                  <td className="py-2">Halfway - 2× taps unlocked</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-2 pr-4 font-bold text-white/80">P99</td>
                  <td className="py-2 pr-4 font-mono text-[#0066ff]">1</td>
                  <td className="py-2 pr-4 font-mono">5,000 NEX</td>
                  <td className="py-2">Last normal level</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-bold text-[#0066ff]">P100</td>
                  <td className="py-2 pr-4 font-mono text-[#0066ff]">1</td>
                  <td className="py-2 pr-4 font-mono">5,000 NEX</td>
                  <td className="py-2">🏆 NEX_PROTOCOL - max prestige</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="glass-card-sm p-5 border border-[#0066ff]/20">
            <h3 className="font-bold text-[#0066ff] mb-2">Total: 4,951 iNFTs</h3>
            <p className="text-xs text-white/60 leading-relaxed">
              <code>99 + 98 + 97 + ... + 1 + 1 = 4,951</code>. Each costs 5,000 NEX + gas.
              That's <strong className="text-[#0066ff]">24,755,000 NEX</strong> to mint them all -
              achievable through tapping, forges, and marketplace mechanics.
            </p>
          </div>
        </section>

        {/* 5 - TOKENOMICS: XNT NATIVE GAS + FEE FLYWHEEL */}
        <section className="mb-16 scroll-mt-20">
          <h2 className="text-2xl md:text-3xl font-bold glow-amber mb-6">5 — Tokenomics: Native Gas + Fee Flywheel</h2>

          <p className="text-sm text-white/70 leading-relaxed mb-6">
            The obvious concern: <em>"99 iNFTs at P1? That's infinite supply."</em> Wrong.
            Every mechanic in Prestige Protocol is structurally deflationary for iNFTs. And XNT isn't
            some custom farm token — it's the <strong className="text-yellow-500">native gas token of the X1 blockchain</strong>,
            the same way SOL is for Solana. Every transaction on X1 burns XNT as gas. That
            gives XNT real baseline demand <strong className="text-white">before a single player prestige happens</strong>.
            Here's how the economics work.
          </p>

          {/* 5.1 - XNT = Native Gas */}
          <div className="glass-card-sm p-5 border-l-4 border-yellow-500 mb-4">
            <h3 className="font-bold text-yellow-500 mb-2">5.1 XNT = X1 Native Gas Token</h3>
            <p className="text-xs text-white/60 leading-relaxed mb-2">
              XNT is the <strong className="text-white">native currency of the X1 blockchain</strong> (Solana VM, chain 204005).
              Every X1 transaction — sending tokens, deploying programs, swapping on a DEX —
              pays gas in XNT. Supply is governed by <strong className="text-yellow-500">X1's protocol-level emissions</strong>,
              not by any developer. XNT has:
            </p>
            <ul className="text-xs text-white/60 leading-relaxed list-disc ml-4 space-y-1 mb-2">
              <li><strong className="text-white">Gas utility</strong> — every on-chain action consumes XNT. More usage = more XNT demand.</li>
              <li><strong className="text-white">Staking</strong> — validators stake XNT to secure the network. Staked supply is locked out of circulation.</li>
              <li><strong className="text-white">Protocol emissions</strong> — new XNT inflation is set by X1's validator economics, designed to decrease over time.</li>
              <li><strong className="text-white">Native index</strong> — XNT is listed on major CEXs/DEXs as the X1 ecosystem token, not a game token.</li>
            </ul>
            <p className="text-xs text-white/40 italic">
              This means every NEX prestige (0.01 XNT), game entry (1 XNT), and marketplace trade is
              spending <strong className="text-white">real blockchain gas</strong> — not a farmable in-game currency.
            </p>
          </div>

          {/* 5.2 - The Fee Flywheel */}
          <div className="glass-card-sm p-5 border-l-4 border-yellow-500 mb-4">
            <h3 className="font-bold text-yellow-500 mb-2">5.2 The NEX Fee Flywheel</h3>
            <p className="text-xs text-white/60 leading-relaxed mb-2">
              Every prestige costs <strong className="text-white">0.01 XNT</strong>. Every game entry costs
              <strong className="text-white">1 XNT</strong>. These fees go to the dev wallet,
              not burned. But the LP strategy isn't a single XNT/USDC pool — it's a
              <strong className="text-yellow-500"> multi-pool ecosystem</strong> where each prestige tier
              has its own unique SPL token paired with XNT and USDC.x.
            </p>
            <p className="text-xs text-white/60 leading-relaxed mb-2">
              <strong className="text-white">The flywheel:</strong> Dev collects prestige fees in XNT →
              pairs them into <strong className="text-yellow-500">100 unique LP pools</strong> — one for each
              prestige tier token (WRAITH, PHANTOM, MORTIS, ... NEX_PROTOCOL) paired with XNT and USDC.x.
              Each pool deepens independently as its tier's iNFTs trade on the marketplace.
              More trades → deeper LP → better prices → more volume → more fees.
            </p>
            <p className="text-xs text-white/60 leading-relaxed">
              <strong className="text-white">Why 100 pools:</strong> Every prestige tier has its own SPL token
              with unique supply dynamics. P1 (WRAITH) has 99 max mints. P100 (NEX_PROTOCOL) has 1.
              Each token's LP depth reflects its <strong className="text-yellow-500">actual trading activity</strong> —
              rare tiers naturally have thinner pools but higher fee rates (1.25% vs 0.5%).
              This creates a <strong className="text-white">natural price discovery</strong> mechanism:
              the market decides what each prestige tier is worth.
            </p>
          </div>

          {/* 5.3 - Flywheel Visual */}
          <div className="glass-card-sm p-5 border border-yellow-500/30 mb-4">
            <h3 className="font-bold text-yellow-500 mb-3 text-sm">5.3 The Flywheel Visualized</h3>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="text-yellow-500 w-6 text-center">①</span>
                <span className="text-white/80">Player prestiges → pays <strong className="text-yellow-500">0.01 XNT</strong> → dev wallet</span>
              </div>
              <div className="flex items-center gap-2 ml-6">
                <span className="text-white/30">↳</span>
                <span className="text-white/50">XNT goes to dev wallet. Not burned.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-yellow-500 w-6 text-center">②</span>
                <span className="text-white/80">Dev pairs collected XNT into <strong className="text-yellow-500">100 unique LP pools</strong></span>
              </div>
              <div className="flex items-center gap-2 ml-6">
                <span className="text-white/30">↳</span>
                <span className="text-white/50">Each prestige tier has its own SPL token paired with XNT + USDC.x</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-yellow-500 w-6 text-center">③</span>
                <span className="text-white/80">Each pool deepens → <strong className="text-yellow-500">slippage drops per tier</strong></span>
              </div>
              <div className="flex items-center gap-2 ml-6">
                <span className="text-white/30">↳</span>
                <span className="text-white/50">Rare tiers (P81-P100) have thinner pools but higher fee rates</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-yellow-500 w-6 text-center">④</span>
                <span className="text-white/80">Marketplace trades on each tier → <strong className="text-yellow-500">volume per pool</strong></span>
              </div>
              <div className="flex items-center gap-2 ml-6">
                <span className="text-white/30">↳</span>
                <span className="text-white/50">External traders buy prestige tokens. Players trade iNFTs. Each tier's LP grows independently.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-yellow-500 w-6 text-center">⑤</span>
                <span className="text-white/80">LP earns <strong className="text-yellow-500">swap fees</strong> → compounds each pool</span>
              </div>
              <div className="flex items-center gap-2 ml-6">
                <span className="text-white/30">↳</span>
                <span className="text-white/50">Every swap pays LP fees. Those fees stay in the pool, growing it further.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-yellow-500 w-6 text-center">⑥</span>
                <span className="text-white/80">Marketplace trades add <strong className="text-yellow-500">tiered dev fees</strong> (0.5-1.25%) → more LP deposits</span>
              </div>
              <div className="flex items-center gap-2 ml-6">
                <span className="text-white/30">↳</span>
                <span className="text-white/50">P1-P20: 0.5% · P21-P50: 0.75% · P51-P80: 1% · P81-P100: 1.25%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-yellow-500 w-6 text-center">⑦</span>
                <span className="text-white/80">More fees → <strong className="text-yellow-500">more LP deposits across all 100 pools</strong> → loop back to step ③</span>
              </div>
              <div className="flex items-center gap-2 ml-6">
                <span className="text-white/30">↳</span>
                <span className="text-white/50">100 independent flywheels spinning at once. Each prestige tier's token has its own liquidity depth.</span>
              </div>
            </div>

            {/* ── Statistical Projection Chart ── */}
            <div className="mt-6 pt-4 border-t border-yellow-500/20">
              <h4 className="text-xs font-bold text-yellow-500 mb-3">📈 6-Month Projection: 100 LP Pools + Fee Flywheel</h4>
              <p className="text-[9px] text-white/40 mb-1">
                Model: 100 players M1 → 10,000 M6 · 5-18 prestiges/player/month ·
                0.3% LP swap fees per pool · 2x monthly LP turnover · marketplace trades scale with player count
              </p>
              <p className="text-[9px] text-yellow-500/60 mb-3">
                ⚡ Each prestige tier has its own SPL token + LP pool (WRAITH/XNT/USDC.x through NEX_PROTOCOL/XNT/USDC.x).
                Chart shows <strong className="text-white">aggregate LP depth</strong> across all 100 pools.
              </p>
              <svg viewBox="0 0 700 320" className="w-full h-auto" style={{ maxWidth: 700 }}>
                {/* ── Grid ── */}
                {[0, 1, 2, 3, 4, 5].map(i => (
                  <line key={`gl-${i}`} x1={80} y1={40 + i * 50} x2={660} y2={40 + i * 50}
                    stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
                ))}
                {/* Y-axis labels */}
                <text x={75} y={44} textAnchor="end" fill="rgba(255,255,255,0.3)" fontSize={9}>$120K</text>
                <text x={75} y={94} textAnchor="end" fill="rgba(255,255,255,0.3)" fontSize={9}>$96K</text>
                <text x={75} y={144} textAnchor="end" fill="rgba(255,255,255,0.3)" fontSize={9}>$72K</text>
                <text x={75} y={194} textAnchor="end" fill="rgba(255,255,255,0.3)" fontSize={9}>$48K</text>
                <text x={75} y={244} textAnchor="end" fill="rgba(255,255,255,0.3)" fontSize={9}>$24K</text>
                <text x={75} y={294} textAnchor="end" fill="rgba(255,255,255,0.3)" fontSize={9}>$0</text>
                {/* X-axis labels */}
                {["Month 1", "Month 2", "Month 3", "Month 4", "Month 5", "Month 6"].map((m, i) => (
                  <text key={`xl-${i}`} x={80 + i * 116} y={310} textAnchor="middle"
                    fill="rgba(255,255,255,0.3)" fontSize={9}>{m}</text>
                ))}
                {/* ── Bars: Monthly Fee Collection ── */}
                {[
                  { x: 80, h: 5 },   // M1: $200 → 5px
                  { x: 196, h: 24 },  // M2: $1,160 → 24px
                  { x: 312, h: 87 },  // M3: $4,360 → 87px
                  { x: 428, h: 145 }, // M4: $13,960 → 145px
                  { x: 544, h: 220 }, // M5: $43,960 → 220px
                  { x: 660, h: 250 }, // M6: $115,960 → 250px (capped at 250)
                ].map((b, i) => (
                  <g key={`bar-${i}`}>
                    {/* Fee bar */}
                    <rect x={b.x - 20} y={290 - b.h} width={40} height={b.h} rx={3}
                      fill="rgba(255,200,0,0.25)" stroke="rgba(255,200,0,0.5)" strokeWidth={1} />
                    {/* Value label */}
                    <text x={b.x} y={290 - b.h - 6} textAnchor="middle"
                      fill="rgba(255,200,0,0.7)" fontSize={8} fontWeight="bold">
                      {["$200", "$1.1K", "$4.3K", "$13.9K", "$43.9K", "$115.9K"][i]}
                    </text>
                    {/* Player count below */}
                    <text x={b.x} y={324} textAnchor="middle"
                      fill="rgba(255,255,255,0.2)" fontSize={7}>
                      {["100", "300", "800", "2K", "5K", "10K"][i]} players
                    </text>
                  </g>
                ))}
                {/* ── Line: Cumulative LP Depth ── */}
                <polyline
                  points="80,288 196,270 312,230 428,160 544,80 660,30"
                  fill="none" stroke="rgba(0,200,255,0.6)" strokeWidth={2}
                  strokeDasharray="4,3" />
                {/* Line dots */}
                {[[80,288],[196,270],[312,230],[428,160],[544,80],[660,30]].map(([x,y], i) => (
                  <circle key={`dot-${i}`} cx={x} cy={y} r={3}
                    fill="rgba(0,200,255,0.8)" />
                ))}
                {/* Legend */}
                <rect x={80} y={338} width={10} height={10} rx={2}
                  fill="rgba(255,200,0,0.3)" stroke="rgba(255,200,0,0.5)" strokeWidth={1} />
                <text x={94} y={347} fill="rgba(255,255,255,0.4)" fontSize={8}>Monthly LP deposits across all 100 pools (XNT + USDC.x)</text>
                <line x1={200} y1={343} x2={220} y2={343} stroke="rgba(0,200,255,0.6)" strokeWidth={2} strokeDasharray="4,3" />
                <text x={224} y={347} fill="rgba(255,255,255,0.4)" fontSize={8}>Cumulative LP depth</text>
              </svg>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div className="bg-black/30 rounded p-2 text-center">
                  <div className="text-yellow-500 font-bold text-xs">$115,960</div>
                  <div className="text-[8px] text-white/30">Projected aggregate LP depth (month 6)</div>
                </div>
                <div className="bg-black/30 rounded p-2 text-center">
                  <div className="text-blue-400 font-bold text-xs">580x</div>
                  <div className="text-[8px] text-white/30">LP growth from month 1</div>
                </div>
                <div className="bg-black/30 rounded p-2 text-center">
                  <div className="text-green-400 font-bold text-xs">10,000</div>
                  <div className="text-[8px] text-white/30">Players by month 6</div>
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 rounded-lg" style={{ background: "rgba(255,200,0,0.06)", border: "1px solid rgba(255,200,0,0.15)" }}>
              <p className="text-xs text-yellow-500/80 leading-relaxed">
                <strong className="text-yellow-500">Net result:</strong> Every player action (prestige, trade, game entry)
                feeds one of <strong className="text-white">100 independent LP pools</strong> — one for each prestige tier token.
                XNT is the <strong className="text-white">native gas token of X1</strong>. Every swap on any pool,
                every on-chain transaction, every validator stake — all drive XNT demand.
                Prestige Protocol adds a <strong className="text-white">multi-pool demand engine</strong> on top.
                More players = deeper pools = better prices = more external volume = even deeper pools.
              </p>
            </div>
          </div>

          {/* 5.4 - Fixed Supply, Sinking Demand */}
          <div className="glass-card-sm p-5 border-l-4 border-blue-500 mb-4">
            <h3 className="font-bold text-blue-500 mb-2">5.4 Forging = iNFT Deflation</h3>
            <p className="text-xs text-white/60 leading-relaxed mb-2">
              Forging <strong className="text-white">burns 3 iNFTs to create 1</strong>. That's a
              <strong className="text-blue-500">66% supply reduction</strong> every time you forge.
              To get a P100 iNFT through forging alone, you mathematically need at least
              <strong className="text-white"> 399 of the lowest-tier iNFTs</strong> - but the game
              only allows <strong className="text-white">99 mints at P1</strong>. Pure forging from bottom
              to top is <strong className="text-blue-500">mathematically impossible</strong>.
            </p>
            <p className="text-xs text-white/60 leading-relaxed">
              Players must <strong className="text-white">mix tapping, prestiging, and forges</strong>.
              Each forge permanently removes 3 NFTs from circulation - a net supply
              reduction that compounds as the player base matures and latecomers buy
              iNFTs from the marketplace instead of minting fresh.
            </p>
          </div>

        {/* 5.5 - Marketplace Dev Fees → LP */}
          <div className="glass-card-sm p-5 border-l-4 border-green-500 mb-4">
            <h3 className="font-bold text-green-500 mb-2">5.5 Marketplace Fees → 100 LP Pools</h3>
            <p className="text-xs text-white/60 leading-relaxed mb-2">
              The marketplace lets players <strong className="text-white">sell and buy iNFTs peer-to-peer</strong>
              for XNT. Every trade charges a <strong className="text-white">tiered dev fee</strong> that funds the
              <strong className="text-green-500">corresponding prestige tier's LP pool</strong> — not a single pool:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
              <div className="bg-green-500/10 rounded-lg p-2 text-center border border-green-500/20">
                <div className="text-green-500 font-bold">P1-P20</div>
                <div className="text-xs text-white/60 font-mono">0.5%</div>
                <div className="text-[8px] text-white/30">1,790 iNFTs</div>
              </div>
              <div className="bg-teal-500/10 rounded-lg p-2 text-center border border-teal-500/20">
                <div className="text-teal-400 font-bold">P21-P50</div>
                <div className="text-xs text-white/60 font-mono">0.75%</div>
                <div className="text-[8px] text-white/30">1,935 iNFTs</div>
              </div>
              <div className="bg-amber-500/10 rounded-lg p-2 text-center border border-amber-500/20">
                <div className="text-amber-400 font-bold">P51-P80</div>
                <div className="text-xs text-white/60 font-mono">1.0%</div>
                <div className="text-[8px] text-white/30">1,035 iNFTs</div>
              </div>
              <div className="bg-red-500/10 rounded-lg p-2 text-center border border-red-500/20">
                <div className="text-red-400 font-bold">P81-P100</div>
                <div className="text-xs text-white/60 font-mono">1.25%</div>
                <div className="text-[8px] text-white/30">191 iNFTs</div>
              </div>
            </div>

            {/* ── Per-Tier LP Contribution Visual ── */}
            <div className="mb-3">
              <h4 className="text-[10px] font-bold text-white/70 mb-2">LP Contribution by Prestige Tier (per 1,000 XNT trade, feeds that tier's unique pool)</h4>
              <div className="flex h-6 rounded-full overflow-hidden">
                <div className="flex-1 flex items-center justify-center text-[7px] font-bold"
                  style={{ background: "rgba(34,197,94,0.3)", borderRight: "1px solid rgba(0,0,0,0.3)" }}>
                  P1-P20: 5 XNT
                </div>
                <div className="flex-1 flex items-center justify-center text-[7px] font-bold"
                  style={{ background: "rgba(45,212,191,0.3)", borderRight: "1px solid rgba(0,0,0,0.3)" }}>
                  P21-P50: 7.5 XNT
                </div>
                <div className="flex-1 flex items-center justify-center text-[7px] font-bold"
                  style={{ background: "rgba(251,191,36,0.3)", borderRight: "1px solid rgba(0,0,0,0.3)" }}>
                  P51-P80: 10 XNT
                </div>
                <div className="flex-1 flex items-center justify-center text-[7px] font-bold"
                  style={{ background: "rgba(239,68,68,0.3)" }}>
                  P81-P100: 12.5 XNT
                </div>
              </div>
            </div>

            {/* ── All 100 Tiers Visual Bar ── */}
            <div className="mb-3">
              <h4 className="text-[10px] font-bold text-white/70 mb-2">All 100 Prestige Tiers — Color-Coded by Fee Rate</h4>
              <div className="flex h-4 rounded-full overflow-hidden">
                {/* P1-P20: green (0.5%) — 20 tiers */}
                <div className="flex-1" style={{ background: "rgba(34,197,94,0.4)" }} title="P1-P20: 0.5%" />
                {/* P21-P50: teal (0.75%) — 30 tiers */}
                <div className="flex-[1.5]" style={{ background: "rgba(45,212,191,0.4)" }} title="P21-P50: 0.75%" />
                {/* P51-P80: amber (1.0%) — 30 tiers */}
                <div className="flex-[1.5]" style={{ background: "rgba(251,191,36,0.4)" }} title="P51-P80: 1.0%" />
                {/* P81-P100: red (1.25%) — 20 tiers */}
                <div className="flex-1" style={{ background: "rgba(239,68,68,0.4)" }} title="P81-P100: 1.25%" />
              </div>
              <div className="flex text-[7px] text-white/20 mt-0.5">
                <span className="flex-1">P1</span>
                <span className="flex-[1.5] text-center">P21</span>
                <span className="flex-[1.5] text-center">P51</span>
                <span className="flex-1 text-right">P100</span>
              </div>
            </div>

            {/* ── Per-Tier LP Projection Table ── */}
            <div className="overflow-x-auto mb-3">
              <table className="w-full text-[9px] border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-1 pr-2 text-white/50">Tier</th>
                    <th className="text-left py-1 pr-2 text-white/50">Fee</th>
                    <th className="text-left py-1 pr-2 text-white/50">iNFTs</th>
                    <th className="text-left py-1 pr-2 text-white/50">% of Supply</th>
                    <th className="text-left py-1 pr-2 text-white/50">LP/Trade (1K XNT)</th>
                    <th className="text-left py-1 text-white/50">Est. Monthly LP</th>
                  </tr>
                </thead>
                <tbody className="text-white/60">
                  <tr className="border-b border-white/5">
                    <td className="py-1 pr-2 text-green-400 font-bold">P1-P20</td>
                    <td className="py-1 pr-2 font-mono">0.5%</td>
                    <td className="py-1 pr-2 font-mono">1,790</td>
                    <td className="py-1 pr-2 font-mono">36.2%</td>
                    <td className="py-1 pr-2 font-mono text-green-400">5 XNT</td>
                    <td className="py-1 font-mono text-green-400">$1,200</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-1 pr-2 text-teal-400 font-bold">P21-P50</td>
                    <td className="py-1 pr-2 font-mono">0.75%</td>
                    <td className="py-1 pr-2 font-mono">1,935</td>
                    <td className="py-1 pr-2 font-mono">39.1%</td>
                    <td className="py-1 pr-2 font-mono text-teal-400">7.5 XNT</td>
                    <td className="py-1 font-mono text-teal-400">$2,400</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-1 pr-2 text-amber-400 font-bold">P51-P80</td>
                    <td className="py-1 pr-2 font-mono">1.0%</td>
                    <td className="py-1 pr-2 font-mono">1,035</td>
                    <td className="py-1 pr-2 font-mono">20.9%</td>
                    <td className="py-1 pr-2 font-mono text-amber-400">10 XNT</td>
                    <td className="py-1 font-mono text-amber-400">$3,600</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-1 pr-2 text-red-400 font-bold">P81-P100</td>
                    <td className="py-1 pr-2 font-mono">1.25%</td>
                    <td className="py-1 pr-2 font-mono">191</td>
                    <td className="py-1 pr-2 font-mono">3.9%</td>
                    <td className="py-1 pr-2 font-mono text-red-400">12.5 XNT</td>
                    <td className="py-1 font-mono text-red-400">$2,800</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="border-t border-white/20">
                    <td className="py-1 pr-2 text-white font-bold" colSpan={3}>Total</td>
                    <td className="py-1 pr-2 font-mono text-white">4,951</td>
                    <td className="py-1 pr-2 font-mono text-white">100%</td>
                    <td className="py-1 font-mono text-white">—</td>
                    <td className="py-1 font-mono text-yellow-400 font-bold">$10,000/mo</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <p className="text-xs text-white/60 leading-relaxed">
              <strong className="text-white">Why 100 pools over one:</strong> Each prestige tier has its own SPL token
              (WRAITH, PHANTOM, MORTIS, ... NEX_PROTOCOL) with unique supply caps (99→1).
              A P1 WRAITH trade feeds the <strong className="text-green-500">WRAITH/XNT/USDC.x pool</strong>.
              A P100 NEX_PROTOCOL trade feeds the <strong className="text-green-500">NEX_PROTOCOL/XNT/USDC.x pool</strong>.
              This means <strong className="text-white">each tier's liquidity reflects its actual market activity</strong> —
              rare tiers have thinner pools but higher fee rates, creating natural price discovery.
              Higher-prestige iNFTs pay higher fees, meaning the most valuable trades contribute the most to LP depth.
              This is a <strong className="text-white">100-pool flywheel</strong>: more trades → deeper pools → more volume → more fees.
            </p>
            <p className="text-xs text-white/40 mt-2 italic">
              The 1 XNT game entry fee and 0.01 XNT prestige fee go to the dev wallet - not burned.
              Marketplace fees are the sustainable LP engine.
            </p>
          </div>

          {/* 5.6 - Market Cap Effect */}
          <div className="glass-card-sm p-5 border-l-4 border-blue-500 mb-4">
            <h3 className="font-bold text-blue-500 mb-2">5.6 Marketplace Burns + Rising Floor</h3>
            <p className="text-xs text-white/60 leading-relaxed mb-2">
              The marketplace lets players <strong className="text-white">sell and buy iNFTs peer-to-peer</strong>
              for XNT. As the total iNFT supply approaches its 4,951 cap and the game matures:
            </p>
            <ul className="text-xs text-white/60 leading-relaxed list-disc ml-4 space-y-1">
              <li>Fewer new iNFTs are minted (players who already minted don't re-mint)</li>
              <li>Burned iNFTs (forge, quit, marketplace removal) reduce total supply</li>
              <li>Rare high-prestige iNFTs (P50+) command premium XNT prices</li>
              <li>The floor price for even P1 iNFTs rises as supply contracts</li>
              <li>Speculators buy and hold - taking supply out of circulation</li>
            </ul>
          </div>

          {/* 5.7 - Summary */}
          <div className="glass-card-sm p-5 border border-[#0066ff]/20">
            <h3 className="font-bold text-[#0066ff] mb-2">5.7 Why This Works</h3>
            <p className="text-xs text-white/60 leading-relaxed">
              The "infinite iNFTs" concern is a surface-level observation. The reality:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              <div className="bg-yellow-500/10 rounded-lg p-3">
                <div className="text-yellow-500 font-bold text-sm">⛽ XNT = Native Gas</div>
                <div className="text-xs text-white/50 mt-1">XNT is the native gas token of X1 blockchain — every on-chain action burns it. Dev collects prestige + entry fees → pairs into 100 unique LP pools (one per prestige tier token).</div>
              </div>
              <div className="bg-black/30 rounded-lg p-3">
                <div className="text-blue-500 font-bold text-sm">🔨 Forge (3→1)</div>
                <div className="text-xs text-white/50 mt-1">66% supply reduction per forge. Compounding deflation at every level.</div>
              </div>
              <div className="bg-green-500/10 rounded-lg p-3">
                <div className="text-green-500 font-bold text-sm">🏪 100 LP Pools</div>
                <div className="text-xs text-white/50 mt-1">Tiered dev fees (0.5-1.25%) fund each prestige tier's unique LP pool (WRAITH/XNT/USDC.x, PHANTOM/XNT/USDC.x, ... NEX_PROTOCOL/XNT/USDC.x). Each pool's depth reflects its tier's actual trading activity.</div>
              </div>
              <div className="bg-black/30 rounded-lg p-3">
                <div className="text-red-500 font-bold text-sm">🔥 Permanent Burns</div>
                <div className="text-xs text-white/50 mt-1">Quit, forge, burn - every mechanic reduces the circulating iNFT count permanently.</div>
              </div>
            </div>
            <p className="text-xs text-white/40 mt-4 italic">
              iNFTs are not a token. They are a <strong className="text-white">finite collectible</strong> with a hard cap.
              XNT is the <strong className="text-yellow-500">native gas token of X1</strong> — it has inherent demand from
              blockchain usage (gas, staking, trading) <strong className="text-white">before Prestige Protocol adds anything</strong>.
              NEX creates <strong className="text-white">100 independent LP pools</strong> — one for each prestige tier's
              unique SPL token — all feeding into XNT liquidity. The result: a multi-pool ecosystem where
              each tier's market finds its own price through actual trading activity.
            </p>
          </div>
        </section>

        {/* 6 - GAME RULES */}
        <section className="mb-16 scroll-mt-20">
          <h2 className="text-2xl md:text-3xl font-bold glow-amber mb-6">6 - Game Rules</h2>
          <div className="glass-card p-5 border border-[#0066ff]/20 space-y-4">
            <div className="flex gap-3">
              <span className="text-[#0066ff] font-bold w-6">1.</span>
              <p className="text-xs text-white/70"><strong className="text-white">Prestige sends 0.01 XNT to the dev wallet.</strong> These fees fund development, marketing, and XNT/USDC LP seeding — not burned. The dev wallet address is public and all transactions are traceable on-chain.</p>
            </div>
            <div className="flex gap-3">
              <span className="text-[#0066ff] font-bold w-6">2.</span>
              <p className="text-xs text-white/70"><strong className="text-white">Tapping is free.</strong> No gas for taps. No energy bars. No cooldowns. Just tap - a pure signal to show you put in work before prestiging.</p>
            </div>
            <div className="flex gap-3">
              <span className="text-[#0066ff] font-bold w-6">3.</span>
              <p className="text-xs text-white/70"><strong className="text-white">iNFTs cost 5,000 NEX + gas.</strong> Just the NEX and the transaction cost. Progressive mints per level: P1=99, P2=98, ... P99=1, P100=1. Burning costs no gas.</p>
            </div>
            <div className="flex gap-3">
              <span className="text-[#0066ff] font-bold w-6">4.</span>
              <p className="text-xs text-white/70"><strong className="text-white">Prestige is upward only.</strong> You cannot prestige downwards. Once you climb, you climb.</p>
            </div>
            <div className="flex gap-3">
              <span className="text-[#0066ff] font-bold w-6">5.</span>
              <p className="text-xs text-white/70"><strong className="text-white">Minting is optional.</strong> You can mint anytime at your current level, but slots are limited (99→1). Forged iNFTs don't consume your prestige-level mint slots.</p>
            </div>
            <div className="flex gap-3">
              <span className="text-[#0066ff] font-bold w-6">6.</span>
              <p className="text-xs text-white/70"><strong className="text-white">Complete & restart.</strong> At P100 you must pay 1 XNT dev fee again to restart from scratch. The ledger is cleared and a new game run begins.</p>
            </div>
          </div>
        </section>

        {/* 7 - CONTRACT INSTRUCTIONS */}
        <section className="mb-16 scroll-mt-20">
          <h2 className="text-2xl md:text-3xl font-bold glow-amber mb-6">7 - On-Chain Instructions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            {[
              ["init_protocol", "One-time deploy. Sets dev wallet, default prices, fees."],
              ["init_user", "Creates per-user PDA. Initializes NEX=0, pending=0."],
              ["pay_dev_fee", "1 XNT entry fee. Unlocks game access."],
              ["mint_nex_tap", "Generates 1,000 NEX per tap. No gas cost."],
              ["prestige", "Deducts 30,000 NEX + 0.01 XNT. Increments prestige count."],
              ["mint_inft", "Deducts 5,000 NEX + gas. Creates Token-2022 iNFT."],
              ["burn_inft", "Destroys an iNFT. Returns prestige token."],
              ["forge", "Combines 3 iNFTs of same tier into 1 at next tier."],
              ["consume_prestige_medals", "Absorb medals into target. Pure display."],
              ["restart_game", "Pay 1 XNT dev fee. Resets all state for new run."],
            ].map(([name, desc]) => (
              <div key={name} className="glass-card-sm p-3">
                <div className="font-mono text-xs text-[#0066ff]">{name}</div>
                <div className="text-xs text-white/50 mt-0.5">{desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* CLOSING — with image */}
        <div className="glass-card p-8 md:p-12 text-center mt-12">
          {/* Full-width reach image */}
          <div className="relative w-full mb-8 rounded-xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/nex-reach.jpg"
              alt="Reach for the top — The NEXUS climb"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(0deg, rgba(0,0,0,0.6) 0%, transparent 50%)',
            }} />
            <div className="absolute bottom-0 left-0 right-0 p-4 text-left">
              <p className="text-xs text-white/30 italic">"Tap for free. Prestige for 0.01 XNT. Mint for NEX. The only variable is you."</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-white/20 font-mono mb-6">
            <div>Contract: {data.contractId}</div>
            <div>Dev: {data.devWallet.slice(0, 8)}...{data.devWallet.slice(-4)}</div>
            <div>Built on X1 (Solana VM) · Immutable</div>
          </div>
          <p className="text-xs text-white/10 font-mono">Prestige Protocol · 2026</p>
        </div>

        <div className="flex justify-center gap-8 mt-12 text-sm">
          <Link href="/" className="text-[#0066ff]/60 hover:text-[#0066ff] transition">← Back to App</Link>
          <a href="#" className="text-[#0066ff]/60 hover:text-[#0066ff] transition">Top ↑</a>
        </div>
      </div>
    </main>
  );
}