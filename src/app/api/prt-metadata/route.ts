import { NextRequest, NextResponse } from "next/server";
import { PRESTIGE_NAMES, PRESTIGE_TICKERS, getPrestigeBadgePath } from "@/lib/void";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const prestige = parseInt(searchParams.get("prestige") || "1");

  const idx = prestige - 1;
  const name = PRESTIGE_NAMES[idx] ?? "Wraith";
  const ticker = PRESTIGE_TICKERS[idx] ?? "WRT";
  const origin = req.headers.get("origin") || "https://nex-protocol-v2.vercel.app";
  const imageUrl = `${origin}${getPrestigeBadgePath(prestige)}`;

  return NextResponse.json({
    name: `PRT (${name})`,
    symbol: ticker,
    description: `PRT — Prestige Reward Token for burning a P${prestige} ${name} medal on NEX Protocol. 1 PRT = 1 medal burned. Collect all 100 tiers.`,
    image: imageUrl,
    external_url: origin,
    attributes: [
      { trait_type: "Prestige Number", value: prestige },
      { trait_type: "Prestige Name", value: name },
      { trait_type: "Ticker", value: ticker },
      { trait_type: "Category", value: "Prestige Reward Token" },
    ],
    properties: {
      category: "image",
      files: [{ uri: imageUrl, type: "image/jpeg" }],
    },
  });
}
