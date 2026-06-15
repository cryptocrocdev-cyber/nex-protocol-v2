import { NextRequest, NextResponse } from "next/server";
import { PRESTIGE_NAMES, PRESTIGE_TICKERS } from "@/lib/void";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { level: string } }
) {
  const level = parseInt(params.level, 10);
  if (isNaN(level) || level < 0 || level > 999) {
    return NextResponse.json({ error: "Invalid prestige level" }, { status: 400 });
  }

  const idx = Math.max(0, level - 1);
  const name = PRESTIGE_NAMES[idx] ?? "Wraith";
  const ticker = PRESTIGE_TICKERS[idx] ?? "WRT";

  // Tier logic matching the program
  let tier;
  if (level < 3) tier = "Bronze";
  else if (level < 10) tier = "Silver";
  else if (level < 20) tier = "Gold";
  else tier = "Diamond";

  const origin = "https://nex-protocol-v2.vercel.app";

  return NextResponse.json({
    name: `Void Prestige #${level}`,
    symbol: "VOID",
    description: `A prestige token burned into existence on Void Protocol. Level ${level} — ${name} (${ticker}).`,
    image: `${origin}/api/prestige/image/${level}`,
    attributes: [
      { trait_type: "Prestige Level", value: level },
      { trait_type: "Token Name", value: name },
      { trait_type: "Ticker", value: ticker },
      { trait_type: "Tier", value: tier },
    ],
  });
}