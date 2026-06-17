import { NextRequest, NextResponse } from "next/server";
import { PRESTIGE_NAMES, PRESTIGE_TICKERS, getPrestigeBadgePath } from "@/lib/void";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const prestige = parseInt(searchParams.get("prestige") || "1");
  const seed = parseInt(searchParams.get("seed") || "0");
  const mint = searchParams.get("mint"); // optional: raw mint address

  const idx = prestige - 1;
  const name = PRESTIGE_NAMES[idx] ?? "Wraith";
  const ticker = PRESTIGE_TICKERS[idx] ?? "WRT";
  const origin = req.headers.get("origin") || "https://nex-protocol-v2.vercel.app";
  const imageUrl = `${origin}${getPrestigeBadgePath(prestige)}`;

  return NextResponse.json({
    name: `${name} #${seed + 1}`,
    symbol: ticker,
    description: `${name} — Prestige Protocol iNFT at Prestige ${prestige}. Burn to mint the ${ticker} token.`,
    image: imageUrl,
    external_url: origin,
    attributes: [
      { trait_type: "Prestige", value: prestige },
      { trait_type: "Rank", value: name },
      { trait_type: "Seed", value: seed },
      { trait_type: "Ticker", value: ticker },
      ...(mint ? [{ trait_type: "Mint Address", value: mint }] : []),
    ],
    properties: {
      category: "image",
      files: [{ uri: imageUrl, type: "image/jpeg" }],
    },
  });
}