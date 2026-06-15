import { NextRequest, NextResponse } from "next/server";
import { PRESTIGE_TICKERS } from "@/lib/void";
import { generatePrestigeNftSvg } from "@/lib/prestigeNftArt";
import path from "path";
import fs from "fs";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { level: string } }
) {
  const level = parseInt(params.level, 10);
  if (isNaN(level) || level < 0 || level > 999) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }

  // Try to serve a pre-existing JPG icon first
  const padded = level < 10 ? `0${level}` : `${level}`;
  const ticker = (PRESTIGE_TICKERS[Math.max(0, level - 1)] ?? "wraith").toLowerCase();
  const jpgPath = path.join(process.cwd(), "public", "prestige-icons", `${padded}-${ticker}.jpg`);
  
  if (fs.existsSync(jpgPath)) {
    const img = fs.readFileSync(jpgPath);
    return new NextResponse(img, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=604800, immutable",
      },
    });
  }

  // Fallback: generate SVG art on-the-fly
  const svg = generatePrestigeNftSvg({ seed: 0, prestigeNumber: level });
  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=604800, immutable",
    },
  });
}