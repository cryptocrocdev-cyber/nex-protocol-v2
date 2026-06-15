import {
  PRESTIGE_NAMES,
  PRESTIGE_TICKERS,
  PRESTIGE_COLORS,
  PRESTIGE_SYMBOLS,
} from "./void";

// ─── Prestige iNFT Art Engine V8 — Minimal Neon Vector Icons ────
// Clean, flat vector shapes with glow effects — inspired by crypto-native prestige dashboards.

export interface PrestigeNftParams {
  seed: number;
  prestigeNumber: number;
}

class SeededRng {
  private s: number;
  constructor(seed: number) { this.s = seed | 0; this.next(); this.next(); this.next(); }
  next(): number {
    this.s = (this.s + 0x6d2b79f5) | 0;
    let t = Math.imul(this.s ^ (this.s >>> 15), 1 | this.s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  int(min: number, max: number): number { return Math.floor(min + this.next() * (max - min + 1)); }
  range(min: number, max: number): number { return min + this.next() * (max - min); }
}

interface PrestigeLevelDef {
  level: number;
  tokenName: string;
  ticker: string;
  symbolName: string;
  color: string;
  glow: string;
  bg: string;
}

const PRESTIGE_LEVELS: PrestigeLevelDef[] = Array.from({ length: 10 }, (_, i) => {
  const idx = i;
  return {
    level: idx + 1,
    tokenName: PRESTIGE_NAMES[idx],
    ticker: PRESTIGE_TICKERS[idx],
    symbolName: PRESTIGE_SYMBOLS[idx],
    color: PRESTIGE_COLORS[idx],
    glow: PRESTIGE_COLORS[idx] + "66",
    bg: "#0a0e1a",
  };
});

function getLevelDef(prestigeNumber: number): PrestigeLevelDef {
  const idx = Math.max(0, prestigeNumber - 1) % PRESTIGE_LEVELS.length;
  return PRESTIGE_LEVELS[idx];
}

function getTierFromLevel(prestigeNumber: number): { name: string; color: string } {
  if (prestigeNumber <= 10) return { name: "Initiate", color: "#00ddff" };
  if (prestigeNumber <= 25) return { name: "Adept", color: "#bb44ff" };
  if (prestigeNumber <= 50) return { name: "Master", color: "#ffbb00" };
  if (prestigeNumber <= 75) return { name: "Grandmaster", color: "#ff3344" };
  return { name: "NEXUS", color: "#ffffff" };
}

function colorToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

// ─── MINIMAL NEON VECTOR ICONS ────
// Clean flat shapes with glow, matching the reference dashboard style.
// Each function returns SVG element strings centered at (0,0) in a ~120px badge area.

function buildWraith(c: string): string[] {
  // Minimal chevron: two L-shaped bars forming a V pointing down
  const rgb = colorToRgb(c);
  return [
    // Background hex
    `<polygon points="0,-110 95,-55 95,55 0,110 -95,55 -95,-55" fill="none" stroke="rgba(${rgb},0.15)" stroke-width="1.5"/>`,
    `<polygon points="0,-103 89,-51 89,51 0,103 -89,51 -89,-51" fill="none" stroke="rgba(${rgb},0.08)" stroke-width="0.8"/>`,
    // Concentric circle grid
    `<circle cx="0" cy="0" r="85" fill="none" stroke="rgba(${rgb},0.04)" stroke-width="0.5"/>`,
    `<circle cx="0" cy="0" r="70" fill="none" stroke="rgba(${rgb},0.04)" stroke-width="0.5" stroke-dasharray="3 4"/>`,
    // Left L-bar
    `<path d="M-50,-55 L-50,40 L10,40" fill="none" stroke="${c}" stroke-width="12" stroke-linecap="square" stroke-linejoin="miter" opacity="0.9"/>`,
    // Right L-bar
    `<path d="M50,-55 L50,40 L-10,40" fill="none" stroke="${c}" stroke-width="12" stroke-linecap="square" stroke-linejoin="miter" opacity="0.9"/>`,
    // Inner inline grooves
    `<path d="M-42,-55 L-42,32 L2,32" fill="none" stroke="#0a0e1a" stroke-width="3" opacity="0.5"/>`,
    `<path d="M42,-55 L42,32 L-2,32" fill="none" stroke="#0a0e1a" stroke-width="3" opacity="0.5"/>`,
    // HUD crosshair accents
    `<line x1="-95" y1="-55" x2="-75" y2="-55" stroke="${c}" stroke-width="1.5" opacity="0.3"/>`,
    `<line x1="75" y1="-55" x2="95" y2="-55" stroke="${c}" stroke-width="1.5" opacity="0.3"/>`,
    `<line x1="-95" y1="55" x2="-75" y2="55" stroke="${c}" stroke-width="1.5" opacity="0.3"/>`,
    `<line x1="75" y1="55" x2="95" y2="55" stroke="${c}" stroke-width="1.5" opacity="0.3"/>`,
  ];
}

function buildPhantom(c: string): string[] {
  // Crossed blades with circular pommels
  const rgb = colorToRgb(c);
  return [
    // Hex frame
    `<polygon points="0,-110 95,-55 95,55 0,110 -95,55 -95,-55" fill="none" stroke="rgba(${rgb},0.15)" stroke-width="1.5"/>`,
    `<polygon points="0,-103 89,-51 89,51 0,103 -89,51 -89,-51" fill="none" stroke="rgba(${rgb},0.08)" stroke-width="0.8"/>`,
    `<circle cx="0" cy="0" r="85" fill="none" stroke="rgba(${rgb},0.04)" stroke-width="0.5"/>`,
    // Starburst radial lines
    `<line x1="0" y1="-95" x2="0" y2="95" stroke="rgba(${rgb},0.06)" stroke-width="0.5"/>`,
    `<line x1="-95" y1="0" x2="95" y2="0" stroke="rgba(${rgb},0.06)" stroke-width="0.5"/>`,
    // Vertical blade (center)
    `<line x1="0" y1="-80" x2="0" y2="80" stroke="${c}" stroke-width="4" stroke-linecap="round" opacity="0.9"/>`,
    // Cross guard on vertical blade
    `<line x1="-15" y1="-35" x2="15" y2="-35" stroke="${c}" stroke-width="3" stroke-linecap="round" opacity="0.6"/>`,
    // Diagonal left blade
    `<path d="M-60,-60 L60,60" stroke="${c}" stroke-width="4" stroke-linecap="round" opacity="0.75"/>`,
    // Cross guard
    `<line x1="-30" y1="-5" x2="5" y2="-30" stroke="${c}" stroke-width="2.5" stroke-linecap="round" opacity="0.5"/>`,
    // Diagonal right blade
    `<path d="M60,-60 L-60,60" stroke="${c}" stroke-width="4" stroke-linecap="round" opacity="0.6"/>`,
    // Cross guard
    `<line x1="30" y1="-5" x2="-5" y2="-30" stroke="${c}" stroke-width="2.5" stroke-linecap="round" opacity="0.5"/>`,
    // Circular pommels at blade ends
    `<circle cx="0" cy="-80" r="5" fill="${c}" opacity="0.9"/>`,
    `<circle cx="0" cy="80" r="5" fill="${c}" opacity="0.9"/>`,
    `<circle cx="-60" cy="-60" r="4" fill="${c}" opacity="0.75"/>`,
    `<circle cx="60" cy="60" r="4" fill="${c}" opacity="0.75"/>`,
    `<circle cx="60" cy="-60" r="4" fill="${c}" opacity="0.6"/>`,
    `<circle cx="-60" cy="60" r="4" fill="${c}" opacity="0.6"/>`,
    // Center core
    `<circle cx="0" cy="0" r="4" fill="${c}" opacity="0.6"/>`,
  ];
}

function buildMortis(c: string): string[] {
  // Minimal skull with crossbones X
  const rgb = colorToRgb(c);
  return [
    // Hex frame
    `<polygon points="0,-110 95,-55 95,55 0,110 -95,55 -95,-55" fill="none" stroke="rgba(${rgb},0.15)" stroke-width="1.5"/>`,
    `<polygon points="0,-103 89,-51 89,51 0,103 -89,51 -89,-51" fill="none" stroke="rgba(${rgb},0.08)" stroke-width="0.8"/>`,
    `<circle cx="0" cy="0" r="85" fill="none" stroke="rgba(${rgb},0.04)" stroke-width="0.5"/>`,
    // Crossbones X behind skull
    `<line x1="-60" y1="45" x2="60" y2="-25" stroke="${c}" stroke-width="6" stroke-linecap="round" opacity="0.5"/>`,
    `<line x1="60" y1="45" x2="-60" y2="-25" stroke="${c}" stroke-width="6" stroke-linecap="round" opacity="0.5"/>`,
    // Bone ends (flat)
    `<rect x="-68" y="38" width="12" height="8" rx="2" fill="${c}" opacity="0.4" transform="rotate(-30,-62,42)"/>`,
    `<rect x="50" y="-30" width="12" height="8" rx="2" fill="${c}" opacity="0.4" transform="rotate(-30,56,-26)"/>`,
    `<rect x="52" y="38" width="12" height="8" rx="2" fill="${c}" opacity="0.4" transform="rotate(30,58,42)"/>`,
    `<rect x="-68" y="-30" width="12" height="8" rx="2" fill="${c}" opacity="0.4" transform="rotate(30,-62,-26)"/>`,
    // Skull cranium (circle)
    `<circle cx="0" cy="-15" r="35" fill="none" stroke="${c}" stroke-width="4" opacity="0.9"/>`,
    // Eye sockets
    `<circle cx="-13" cy="-22" r="9" fill="rgba(${rgb},0.6)"/>`,
    `<circle cx="13" cy="-22" r="9" fill="rgba(${rgb},0.6)"/>`,
    `<circle cx="-13" cy="-22" r="5" fill="#0a0e1a"/>`,
    `<circle cx="13" cy="-22" r="5" fill="#0a0e1a"/>`,
    // Nose hole
    `<path d="M-3,0 L0,5 L3,0" fill="none" stroke="${c}" stroke-width="2" opacity="0.6"/>`,
    // Teeth line
    `<line x1="-14" y1="8" x2="14" y2="8" stroke="${c}" stroke-width="2.5" opacity="0.7"/>`,
    `<line x1="-7" y1="8" x2="-7" y2="18" stroke="${c}" stroke-width="1.5" opacity="0.5"/>`,
    `<line x1="0" y1="8" x2="0" y2="18" stroke="${c}" stroke-width="1.5" opacity="0.5"/>`,
    `<line x1="7" y1="8" x2="7" y2="18" stroke="${c}" stroke-width="1.5" opacity="0.5"/>`,
  ];
}

function buildHexStar(c: string): string[] {
  // 6-blade pinwheel / hex star
  const rgb = colorToRgb(c);
  const parts: string[] = [
    // Hex frame
    `<polygon points="0,-110 95,-55 95,55 0,110 -95,55 -95,-55" fill="none" stroke="rgba(${rgb},0.15)" stroke-width="1.5"/>`,
    `<polygon points="0,-103 89,-51 89,51 0,103 -89,51 -89,-51" fill="none" stroke="rgba(${rgb},0.08)" stroke-width="0.8"/>`,
    `<circle cx="0" cy="0" r="85" fill="none" stroke="rgba(${rgb},0.04)" stroke-width="0.5"/>`,
  ];
  // 6 trapezoidal blades radiating from center, rotated clockwise
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 - Math.PI / 2 + 0.15; // slight rotation bias
    const nextAngle = ((i + 1) / 6) * Math.PI * 2 - Math.PI / 2 + 0.15;
    const innerR = 12;
    const outerR = 60;
    const p1x = innerR * Math.cos(angle);
    const p1y = innerR * Math.sin(angle);
    const p2x = outerR * Math.cos(angle);
    const p2y = outerR * Math.sin(angle);
    const p3x = outerR * Math.cos(nextAngle);
    const p3y = outerR * Math.sin(nextAngle);
    const p4x = innerR * Math.cos(nextAngle);
    const p4y = innerR * Math.sin(nextAngle);
    parts.push(`<polygon points="${p1x.toFixed(1)},${p1y.toFixed(1)} ${p2x.toFixed(1)},${p2y.toFixed(1)} ${p3x.toFixed(1)},${p3y.toFixed(1)} ${p4x.toFixed(1)},${p4y.toFixed(1)}" fill="${c}" opacity="${0.15 + i * 0.02}"/>`);
    // Blade outline
    parts.push(`<path d="M${p1x.toFixed(1)},${p1y.toFixed(1)} L${p2x.toFixed(1)},${p2y.toFixed(1)}" stroke="${c}" stroke-width="2" opacity="0.7"/>`);
    parts.push(`<path d="M${p2x.toFixed(1)},${p2y.toFixed(1)} A60,60 0 0,1 ${p3x.toFixed(1)},${p3y.toFixed(1)}" fill="none" stroke="${c}" stroke-width="2" opacity="0.5"/>`);
    parts.push(`<path d="M${p3x.toFixed(1)},${p3y.toFixed(1)} L${p4x.toFixed(1)},${p4y.toFixed(1)}" stroke="${c}" stroke-width="2" opacity="0.3"/>`);
  }
  // Center core
  parts.push(`<circle cx="0" cy="0" r="8" fill="${c}" opacity="0.8"/>`);
  parts.push(`<circle cx="0" cy="0" r="3" fill="#0a0e1a"/>`);
  return parts;
}

function buildCrown(c: string): string[] {
  // Minimal crown with 5 peaks
  const rgb = colorToRgb(c);
  return [
    // Hex frame
    `<polygon points="0,-110 95,-55 95,55 0,110 -95,55 -95,-55" fill="none" stroke="rgba(${rgb},0.15)" stroke-width="1.5"/>`,
    `<polygon points="0,-103 89,-51 89,51 0,103 -89,51 -89,-51" fill="none" stroke="rgba(${rgb},0.08)" stroke-width="0.8"/>`,
    `<circle cx="0" cy="0" r="85" fill="none" stroke="rgba(${rgb},0.04)" stroke-width="0.5"/>`,
    // Crown silhouette
    // Base lines
    `<line x1="-65" y1="45" x2="65" y2="45" stroke="${c}" stroke-width="4" stroke-linecap="round" opacity="0.9"/>`,
    `<line x1="-65" y1="35" x2="65" y2="35" stroke="${c}" stroke-width="2" stroke-linecap="round" opacity="0.5"/>`,
    // Center peak (tallest)
    `<path d="M-15,35 L0,-65 L15,35" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>`,
    `<circle cx="0" cy="-65" r="6" fill="${c}" opacity="0.9"/>`,
    // Outer peaks (medium)
    `<path d="M-45,35 L-55,-30 L-25,35" fill="none" stroke="${c}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.7"/>`,
    `<path d="M45,35 L55,-30 L25,35" fill="none" stroke="${c}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.7"/>`,
    // Small spikes between
    `<line x1="-30" y1="35" x2="-30" y2="-5" stroke="${c}" stroke-width="2.5" stroke-linecap="round" opacity="0.5"/>`,
    `<line x1="30" y1="35" x2="30" y2="-5" stroke="${c}" stroke-width="2.5" stroke-linecap="round" opacity="0.5"/>`,
    // Inner decoration
    `<path d="M-12,30 L0,-45 L12,30" fill="none" stroke="rgba(${rgb},0.3)" stroke-width="1.5" opacity="0.4"/>`,
  ];
}

function buildShogun(c: string): string[] {
  // Sunburst/multi-axis cross
  const rgb = colorToRgb(c);
  return [
    // Hex frame
    `<polygon points="0,-110 95,-55 95,55 0,110 -95,55 -95,-55" fill="none" stroke="rgba(${rgb},0.15)" stroke-width="1.5"/>`,
    `<polygon points="0,-103 89,-51 89,51 0,103 -89,51 -89,-51" fill="none" stroke="rgba(${rgb},0.08)" stroke-width="0.8"/>`,
    `<circle cx="0" cy="0" r="85" fill="none" stroke="rgba(${rgb},0.04)" stroke-width="0.5"/>`,
    // Vertical line (long)
    `<line x1="0" y1="-80" x2="0" y2="80" stroke="${c}" stroke-width="5" stroke-linecap="round" opacity="0.9"/>`,
    // Vertical cross-guard (top)
    `<line x1="-18" y1="-55" x2="18" y2="-55" stroke="${c}" stroke-width="3.5" stroke-linecap="round" opacity="0.6"/>`,
    // Vertical cross-guard (bottom)
    `<line x1="-18" y1="55" x2="18" y2="55" stroke="${c}" stroke-width="3.5" stroke-linecap="round" opacity="0.6"/>`,
    // Horizontal line (shorter)
    `<line x1="-60" y1="0" x2="60" y2="0" stroke="${c}" stroke-width="4" stroke-linecap="round" opacity="0.75"/>`,
    // Horizontal cross-guards
    `<line x1="-45" y1="-14" x2="-45" y2="14" stroke="${c}" stroke-width="3" stroke-linecap="round" opacity="0.5"/>`,
    `<line x1="45" y1="-14" x2="45" y2="14" stroke="${c}" stroke-width="3" stroke-linecap="round" opacity="0.5"/>`,
    // Diagonal lines
    `<line x1="-50" y1="-50" x2="50" y2="50" stroke="${c}" stroke-width="3" stroke-linecap="round" opacity="0.4"/>`,
    `<line x1="50" y1="-50" x2="-50" y2="50" stroke="${c}" stroke-width="3" stroke-linecap="round" opacity="0.4"/>`,
    // Center core
    `<circle cx="0" cy="0" r="6" fill="${c}" opacity="0.7"/>`,
    `<circle cx="0" cy="0" r="2.5" fill="#0a0e1a"/>`,
  ];
}

function buildUmbra(c: string): string[] {
  // Nested diamond shapes
  const rgb = colorToRgb(c);
  return [
    // Hex frame
    `<polygon points="0,-110 95,-55 95,55 0,110 -95,55 -95,-55" fill="none" stroke="rgba(${rgb},0.15)" stroke-width="1.5"/>`,
    `<polygon points="0,-103 89,-51 89,51 0,103 -89,51 -89,-51" fill="none" stroke="rgba(${rgb},0.08)" stroke-width="0.8"/>`,
    `<circle cx="0" cy="0" r="85" fill="none" stroke="rgba(${rgb},0.04)" stroke-width="0.5"/>`,
    // Outer diamond
    `<polygon points="0,-75 55,0 0,75 -55,0" fill="none" stroke="${c}" stroke-width="2" opacity="0.25"/>`,
    // Middle diamond (thicker)
    `<polygon points="0,-55 38,0 0,55 -38,0" fill="none" stroke="${c}" stroke-width="4" opacity="0.6"/>`,
    // Inner diamond
    `<polygon points="0,-35 22,0 0,35 -22,0" fill="rgba(${rgb},0.2)" stroke="${c}" stroke-width="2.5" opacity="0.8"/>`,
    // Center dot
    `<circle cx="0" cy="0" r="4" fill="${c}" opacity="0.9"/>`,
    // Vertical accent lines
    `<line x1="0" y1="-85" x2="0" y2="-75" stroke="${c}" stroke-width="1.5" opacity="0.3"/>`,
    `<line x1="0" y1="75" x2="0" y2="85" stroke="${c}" stroke-width="1.5" opacity="0.3"/>`,
    `<line x1="-85" y1="0" x2="-55" y2="0" stroke="${c}" stroke-width="1.5" opacity="0.3"/>`,
    `<line x1="55" y1="0" x2="85" y2="0" stroke="${c}" stroke-width="1.5" opacity="0.3"/>`,
  ];
}

function buildPyrex(c: string): string[] {
  // Teardrop / flame shape
  const rgb = colorToRgb(c);
  return [
    // Hex frame
    `<polygon points="0,-110 95,-55 95,55 0,110 -95,55 -95,-55" fill="none" stroke="rgba(${rgb},0.15)" stroke-width="1.5"/>`,
    `<polygon points="0,-103 89,-51 89,51 0,103 -89,51 -89,-51" fill="none" stroke="rgba(${rgb},0.08)" stroke-width="0.8"/>`,
    `<circle cx="0" cy="0" r="85" fill="none" stroke="rgba(${rgb},0.04)" stroke-width="0.5"/>`,
    // Flame teardrop (symmetric, point up)
    `<path d="M0,-65 C-30,-35 -40,-5 -40,15 C-40,37 -22,50 0,50 C22,50 40,37 40,15 C40,-5 30,-35 0,-65 Z" fill="rgba(${rgb},0.15)" stroke="${c}" stroke-width="3" opacity="0.9"/>`,
    // Inner flame glow
    `<path d="M0,-45 C-18,-25 -25,-5 -25,12 C-25,28 -14,38 0,38 C14,38 25,28 25,12 C25,-5 18,-25 0,-45 Z" fill="none" stroke="${c}" stroke-width="1.5" opacity="0.4"/>`,
    // Stem below
    `<rect x="-4" y="50" width="8" height="12" rx="1" fill="${c}" opacity="0.6"/>`,
    // Base square
    `<rect x="-10" y="62" width="20" height="8" rx="2" fill="${c}" opacity="0.8"/>`,
  ];
}

function buildAnchor(c: string): string[] {
  // Minimal anchor
  const rgb = colorToRgb(c);
  return [
    // Hex frame
    `<polygon points="0,-110 95,-55 95,55 0,110 -95,55 -95,-55" fill="none" stroke="rgba(${rgb},0.15)" stroke-width="1.5"/>`,
    `<polygon points="0,-103 89,-51 89,51 0,103 -89,51 -89,-51" fill="none" stroke="rgba(${rgb},0.08)" stroke-width="0.8"/>`,
    `<circle cx="0" cy="0" r="85" fill="none" stroke="rgba(${rgb},0.04)" stroke-width="0.5"/>`,
    // Ring at top
    `<circle cx="0" cy="-65" r="8" fill="none" stroke="${c}" stroke-width="3" opacity="0.8"/>`,
    // Shaft (vertical line)
    `<line x1="0" y1="-55" x2="0" y2="55" stroke="${c}" stroke-width="5" stroke-linecap="round" opacity="0.9"/>`,
    // Stock (crossbar near top)
    `<line x1="-35" y1="-40" x2="35" y2="-40" stroke="${c}" stroke-width="4" stroke-linecap="round" opacity="0.7"/>`,
    // Fluke (bottom arc)
    `<path d="M-50,45 Q0,75 50,45" fill="none" stroke="${c}" stroke-width="5" stroke-linecap="round" opacity="0.85"/>`,
    // Fluke tips (flat ends)
    `<line x1="-58" y1="42" x2="-42" y2="48" stroke="${c}" stroke-width="5" stroke-linecap="round" opacity="0.8"/>`,
    `<line x1="42" y1="48" x2="58" y2="42" stroke="${c}" stroke-width="5" stroke-linecap="round" opacity="0.8"/>`,
    // Center dot on shaft
    `<circle cx="0" cy="0" r="3" fill="${c}" opacity="0.5"/>`,
  ];
}

function buildShield(c: string): string[] {
  // Heater-style shield with cross
  const rgb = colorToRgb(c);
  return [
    // Hex frame
    `<polygon points="0,-110 95,-55 95,55 0,110 -95,55 -95,-55" fill="none" stroke="rgba(${rgb},0.15)" stroke-width="1.5"/>`,
    `<polygon points="0,-103 89,-51 89,51 0,103 -89,51 -89,-51" fill="none" stroke="rgba(${rgb},0.08)" stroke-width="0.8"/>`,
    `<circle cx="0" cy="0" r="85" fill="none" stroke="rgba(${rgb},0.04)" stroke-width="0.5"/>`,
    // Shield outline (heater style)
    `<path d="M-55,-65 L55,-65 L55,15 Q55,55 0,80 Q-55,55 -55,15 Z" fill="rgba(${rgb},0.08)" stroke="${c}" stroke-width="3" opacity="0.9"/>`,
    // Inner shield border
    `<path d="M-46,-56 L46,-56 L46,12 Q46,46 0,68 Q-46,46 -46,12 Z" fill="none" stroke="${c}" stroke-width="1.5" opacity="0.35"/>`,
    // Cross (equilateral plus)
    `<rect x="-4" y="-45" width="8" height="90" rx="1" fill="${c}" opacity="0.85"/>`,
    `<rect x="-35" y="-4" width="70" height="8" rx="1" fill="${c}" opacity="0.85"/>`,
    // Cross center highlight
    `<circle cx="0" cy="0" r="6" fill="rgba(${rgb},0.3)"/>`,
    // Boss/nail at center
    `<circle cx="0" cy="0" r="2.5" fill="#0a0e1a"/>`,
  ];
}

// ─── SYMBOL MAP ────

const SYMBOL_BUILDERS: Record<string, (c: string) => string[]> = {
  "Chevron": buildWraith,
  "Cross Bullets": buildPhantom,
  "Skull": buildMortis,
  "Hex Star": buildHexStar,
  "Crown": buildCrown,
  "Cross Swords": buildShogun,
  "Diamond": buildUmbra,
  "Torch": buildPyrex,
  "Anchor": buildAnchor,
  "Shield": buildShield,
};

// ─── SVG GENERATION ────

export function generatePrestigeNftSvg(params: PrestigeNftParams): string {
  const { seed, prestigeNumber } = params;
  const def = getLevelDef(prestigeNumber);
  const tier = getTierFromLevel(prestigeNumber);
  const rng = new SeededRng(seed + prestigeNumber * 9999);
  const rgb = colorToRgb(def.color);

  const w = 400;
  const h = 500;

  // Center coordinates for the icon area
  const cx = w / 2;
  const cy = 155;

  // Build symbol parts
  const builder = SYMBOL_BUILDERS[def.symbolName] || buildWraith;
  const symbolParts = builder(def.color);

  // Star field
  let stars = "";
  for (let i = 0; i < 40; i++) {
    const sx = rng.range(5, w - 5).toFixed(1);
    const sy = rng.range(3, h - 3).toFixed(1);
    const sr = rng.range(0.3, 1.2).toFixed(1);
    stars += `<circle cx="${sx}" cy="${sy}" r="${sr}" fill="#ffffff" opacity="${rng.range(0.03, 0.2).toFixed(2)}"/>`;
  }

  // Format prestige number with leading zeros
  const numStr = prestigeNumber < 10 ? `0${prestigeNumber}` : `${prestigeNumber}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
  <defs>
    <radialGradient id="glow_${prestigeNumber}" cx="50%" cy="40%" r="50%">
      <stop offset="0%" stop-color="${def.color}" stop-opacity="0.2"/>
      <stop offset="50%" stop-color="${def.color}" stop-opacity="0.06"/>
      <stop offset="100%" stop-color="${def.color}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="metallic_${prestigeNumber}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${def.color}" stop-opacity="0.6"/>
      <stop offset="50%" stop-color="#ffffff" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="${def.color}" stop-opacity="0.6"/>
    </linearGradient>
  </defs>

  <rect width="${w}" height="${h}" fill="transparent"/>

  <rect width="${w}" height="${h}" fill="url(#glow_${prestigeNumber})"/>

  ${stars}

  <!-- Outer circle accents -->
  <circle cx="${cx}" cy="${cy}" r="170" fill="none" stroke="${def.color}" stroke-width="1" opacity="0.05"/>
  <circle cx="${cx}" cy="${cy}" r="165" fill="none" stroke="${def.color}" stroke-width="0.5" opacity="0.03"/>

  <!-- Icon area background -->
  <circle cx="${cx}" cy="${cy}" r="130" fill="#080b15" stroke="${def.color}" stroke-width="1.5" opacity="0.15"/>
  <circle cx="${cx}" cy="${cy}" r="125" fill="none" stroke="${def.color}" stroke-width="0.5" opacity="0.08"/>

  <!-- Icon group -->
  <g transform="translate(${cx}, ${cy})">
    ${symbolParts.join('\n    ')}
  </g>

  <!-- Ticker label -->
  <g transform="translate(${cx}, ${cy + 110})">
    <text x="0" y="0" text-anchor="middle" font-size="18" font-weight="900"
      fill="url(#metallic_${prestigeNumber})" font-family="monospace" letter-spacing="6">$${def.ticker}</text>
  </g>

  <!-- Prestige number -->
  <g transform="translate(${cx}, ${cy + 148})">
    <text x="0" y="0" text-anchor="middle" font-size="36" font-weight="900"
      fill="${def.color}" opacity="0.9" font-family="monospace" letter-spacing="5">${numStr}</text>
    <rect x="-40" y="8" width="80" height="2" rx="1" fill="${def.color}" opacity="0.4"/>
  </g>

  <!-- Token name -->
  <g transform="translate(${cx}, ${cy + 164})">
    <text x="0" y="0" text-anchor="middle" font-size="8"
      fill="${def.color}" opacity="0.3" font-family="monospace" letter-spacing="3">${def.tokenName}</text>
  </g>

  <!-- Tier badge top-right -->
  <g transform="translate(${cx + 155}, ${cy - 150})">
    <rect x="-45" y="-10" width="90" height="14" rx="7" fill="${def.color}" opacity="0.12"/>
    <text x="0" y="3" text-anchor="middle" font-size="8" font-weight="700"
      fill="${def.color}" opacity="0.6" font-family="monospace" letter-spacing="2">${tier.name.toUpperCase()}</text>
  </g>

  <!-- Seed watermark -->
  <text x="${w - 10}" y="${h - 8}" text-anchor="end" font-size="5"
    fill="${def.color}" opacity="0.06" font-family="monospace">#${seed}</text>
</svg>`;
}

export function generatePrestigeNftMetadata(params: PrestigeNftParams): any {
  const { seed, prestigeNumber } = params;
  const def = getLevelDef(prestigeNumber);
  const tier = getTierFromLevel(prestigeNumber);

  return {
    name: `${def.ticker} — ${def.tokenName} [#${prestigeNumber}]`,
    symbol: def.ticker,
    description: `Prestige Protocol Prestige iNFT — Level ${prestigeNumber}. Token: ${def.ticker} (${def.tokenName}). ${tier.name} rank. Symbol: ${def.symbolName}. Minting difficulty scales exponentially with prestige level.`,
    image: null,
    attributes: [
      { trait_type: "Prestige Level", value: prestigeNumber },
      { trait_type: "Token", value: def.ticker },
      { trait_type: "Token Name", value: def.tokenName },
      { trait_type: "Tier", value: tier.name },
      { trait_type: "Symbol", value: def.symbolName },
      { trait_type: "Seed", value: seed },
    ],
  };
}

export function getAllPrestigeSvgBase64(paramsArray: PrestigeNftParams[]): string[] {
  return paramsArray.map(p => {
    const svg = generatePrestigeNftSvg(p);
    return Buffer.from(svg).toString('base64');
  });
}