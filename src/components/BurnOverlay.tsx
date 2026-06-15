"use client";
import React, { useEffect, useState, useRef, useMemo } from "react";
import { getPrestigeBadgePath } from "@/lib/void";

interface BurnOverlayProps {
  prestige: number;
  seed: number;
  ticker: string;
  visible: boolean;
  originX?: number;
  originY?: number;
  onComplete: () => void;
  onClose: () => void;
}

function generateRunes(count: number) {
  const syms = ["ᚠ", "ᚢ", "ᚦ", "ᚨ", "ᚱ", "ᚲ", "ᚷ", "ᚹ", "ᚺ", "ᚾ", "ᛁ", "ᛃ"];
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * 360 - 90;
    const rad = angle * (Math.PI / 180);
    const r = 130;
    return {
      id: i,
      sym: syms[i % syms.length],
      angleDeg: (i / count) * 360,
      px: Math.cos(rad) * r,
      py: Math.sin(rad) * r,
    };
  });
}

const SVG_SIZE = 140;
const SVG_CX = SVG_SIZE / 2;
const SVG_R = 54;
const CIRCUMFERENCE = 2 * Math.PI * SVG_R;

export default function BurnOverlay({
  prestige,
  seed,
  ticker,
  visible,
  onComplete,
  onClose,
}: BurnOverlayProps) {
  const [phase, setPhase] = useState<"idle" | "burning" | "completed">("idle");
  const [progress, setProgress] = useState(0);
  const [showFlash, setShowFlash] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const runes = useMemo(() => generateRunes(10), []);

  useEffect(() => {
    if (visible) {
      setPhase("idle");
      setProgress(0);
      setShowFlash(false);
      setFadeOut(false);

      const startTimer = setTimeout(() => {
        setPhase("burning");
        let p = 0;
        progressRef.current = setInterval(() => {
          p += 1;
          setProgress(Math.min(p / 100, 1));
        }, 25);

        timerRef.current = setTimeout(() => {
          if (progressRef.current) clearInterval(progressRef.current);
          setProgress(1);
          setPhase("completed");
          setShowFlash(true);
          setTimeout(() => setShowFlash(false), 500);
          onComplete();

          setTimeout(() => {
            setFadeOut(true);
            setTimeout(() => onClose(), 300);
          }, 1000);
        }, 2500);
      }, 100);

      return () => {
        clearTimeout(startTimer);
        if (timerRef.current) clearTimeout(timerRef.current);
        if (progressRef.current) clearInterval(progressRef.current);
      };
    } else {
      setPhase("idle");
      setProgress(0);
      setShowFlash(false);
      setFadeOut(false);
    }
  }, [visible, onComplete, onClose]);

  const handleClick = () => {
    if (phase === "completed") {
      setFadeOut(true);
      setTimeout(() => onClose(), 300);
    }
  };

  if (!visible) return null;

  const badgePath = getPrestigeBadgePath(prestige);
  const bgRedShift = 8 + progress * 18;
  const offset = CIRCUMFERENCE * (1 - progress);
  const litCount = Math.floor(progress * runes.length);

  return (
    <div
      onClick={handleClick}
      style={{
        position: "fixed" as const,
        inset: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column" as const,
        alignItems: "center",
        justifyContent: "center",
        background: fadeOut
          ? "transparent"
          : `rgba(${bgRedShift}, ${bgRedShift}, ${bgRedShift + 4}, 0.95)`,
        transition: fadeOut ? "background 0.4s ease-out" : "background 0.15s linear",
        cursor: phase === "completed" ? "pointer" : "default",
        overflow: "hidden" as const,
      }}
    >
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-1px, 1px); }
          20% { transform: translate(1px, -1px); }
          30% { transform: translate(-1px, -1px); }
          40% { transform: translate(1px, 1px); }
          50% { transform: translate(-1px, 0); }
          60% { transform: translate(1px, 1px); }
          70% { transform: translate(0, -1px); }
          80% { transform: translate(-1px, 1px); }
          90% { transform: translate(0, 0); }
        }
        @keyframes flash-overlay {
          0% { opacity: 0; }
          15% { opacity: 0.9; background: rgba(255, 240, 200, 0.8); }
          35% { opacity: 0.6; background: rgba(255, 160, 50, 0.5); }
          100% { opacity: 0; background: rgba(255, 80, 0, 0.1); }
        }
        @keyframes burn-glow-completed {
          0%, 100% { text-shadow: 0 0 20px rgba(255, 102, 0, 0.8), 0 0 60px rgba(255, 68, 0, 0.5); }
          50% { text-shadow: 0 0 40px rgba(255, 204, 0, 1), 0 0 80px rgba(255, 102, 0, 0.7), 0 0 120px rgba(255, 51, 0, 0.4); }
        }
        @keyframes badge-fire-pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.9); }
          50% { opacity: 0.7; transform: scale(1.15); }
        }
        @keyframes badge-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes rune-glow {
          0%, 100% { opacity: 0.25; text-shadow: 0 0 0 transparent; }
          50% { opacity: 1; text-shadow: 0 0 12px currentColor, 0 0 24px currentColor; }
        }
      `}</style>

      {/* Flash -- full screen */}
      {showFlash && (
        <div
          style={{
            position: "absolute" as const,
            inset: 0,
            animation: "flash-overlay 0.5s ease-out forwards",
            pointerEvents: "none" as const,
            zIndex: 999,
          }}
        />
      )}

      {/* Screen shake -- full screen */}
      <div
        style={{
          position: "absolute" as const,
          inset: 0,
          animation: phase === "burning" ? "shake 0.1s infinite" : "none",
        }}
      >
        {/* Rune sigil ring -- screen center */}
        <div
          style={{
            position: "absolute" as const,
            left: "50%",
            top: "50%",
            width: 0,
            height: 0,
            pointerEvents: "none" as const,
            zIndex: 5,
          }}
        >
          {runes.map((r) => {
            const isLit = litCount > r.id;
            return (
              <div
                key={`rune-${r.id}`}
                style={{
                  position: "absolute" as const,
                  left: r.px,
                  top: r.py,
                  transform: "translate(-50%, -50%)",
                  color: isLit ? "#ffaa33" : "rgba(150, 80, 30, 0.25)",
                  fontSize: "16px",
                  fontFamily: '"Noto Sans", "Segoe UI Symbol", "Arial Unicode MS", sans-serif',
                  fontWeight: 700,
                  textShadow: isLit ? "0 0 12px #ff8800, 0 0 24px #ff5500" : "none",
                  transition: "color 0.15s linear, text-shadow 0.15s linear",
                  animation: isLit && phase === "burning"
                    ? "rune-glow 1.2s ease-in-out infinite"
                    : "none",
                  animationDelay: `${r.id * 0.08}s`,
                  pointerEvents: "none" as const,
                }}
              >
                {r.sym}
              </div>
            );
          })}
        </div>

        {/* Center content -- badge + SVG ring + text @ screen center */}
        <div
          style={{
            position: "absolute" as const,
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            display: "flex",
            flexDirection: "column" as const,
            alignItems: "center",
            gap: 12,
            zIndex: 10,
          }}
        >
          {/* Badge with SVG progress ring */}
          <div
            style={{
              position: "relative" as const,
              width: SVG_SIZE,
              height: SVG_SIZE,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation: "badge-float 3s ease-in-out infinite",
            }}
          >
            {/* SVG ring progress -- rotates around badge */}
            {phase !== "idle" && (
              <svg
                width={SVG_SIZE}
                height={SVG_SIZE}
                viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
                style={{
                  position: "absolute" as const,
                  inset: 0,
                  transform: "rotate(-90deg)",
                }}
              >
                <defs>
                  <linearGradient id="fire-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ff2200" />
                    <stop offset="50%" stopColor="#ff8800" />
                    <stop offset="100%" stopColor="#ffdd00" />
                  </linearGradient>
                </defs>
                <circle
                  cx={SVG_CX}
                  cy={SVG_CX}
                  r={SVG_R}
                  fill="none"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth={5}
                />
                <circle
                  cx={SVG_CX}
                  cy={SVG_CX}
                  r={SVG_R}
                  fill="none"
                  stroke="url(#fire-grad)"
                  strokeWidth={5}
                  strokeLinecap="round"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={offset}
                  style={{
                    transition: "stroke-dashoffset 0.025s linear",
                    filter: phase === "completed"
                      ? "brightness(1.4) drop-shadow(0 0 6px #ff8800)"
                      : `brightness(${0.7 + progress * 0.6}) drop-shadow(0 0 ${4 + progress * 8}px #ff6600)`,
                  }}
                />
              </svg>
            )}

            {/* Badge + fire engulf */}
            <div style={{ position: "relative" as const, zIndex: 2 }}>
              <div
                style={{
                  position: "absolute" as const,
                  inset: phase === "completed" ? -8 : -(4 + progress * 8),
                  borderRadius: "20px",
                  background: phase === "completed"
                    ? "radial-gradient(circle, rgba(255, 200, 50, 0.7) 0%, rgba(255, 100, 0, 0.4) 40%, rgba(255, 50, 0, 0.2) 70%, transparent 90%)"
                    : `radial-gradient(circle, rgba(255, ${Math.round(200 - progress * 100)}, 0, ${0.3 + progress * 0.6}) 0%, rgba(255, ${Math.round(100 - progress * 50)}, 0, ${0.1 + progress * 0.3}) 50%, transparent 80%)`,
                  opacity: phase === "completed" ? 1 : 0.4 + progress * 0.6,
                  transform: phase === "completed" ? "scale(1.2)" : `scale(${0.85 + progress * 0.25})`,
                  transition: "all 0.1s linear",
                  pointerEvents: "none" as const,
                  zIndex: 3,
                  animation: phase === "burning" ? "badge-fire-pulse 0.6s ease-in-out infinite" : "none",
                  boxShadow: phase === "completed"
                    ? "0 0 60px rgba(255, 150, 0, 0.8), 0 0 120px rgba(255, 50, 0, 0.4)"
                    : `0 0 ${10 + progress * 40}px rgba(255, 69, 0, ${0.2 + progress * 0.6})`,
                }}
              />
              <img
                src={badgePath}
                alt={`Prestige ${prestige}`}
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 16,
                  objectFit: "cover" as const,
                  position: "relative" as const,
                  zIndex: 1,
                  boxShadow: phase === "completed"
                    ? "0 0 50px rgba(255, 102, 0, 0.9), 0 0 100px rgba(255, 51, 0, 0.5), inset 0 0 30px rgba(255, 200, 50, 0.3)"
                    : `0 0 ${10 + progress * 30}px rgba(255, 69, 0, ${0.3 + progress * 0.5})`,
                  transition: "box-shadow 0.15s linear",
                }}
              />
            </div>
          </div>

          {/* Status text */}
          <div
            style={{
              textAlign: "center" as const,
              color: phase === "completed" ? "#ffcc00" : "#ff8811",
              fontFamily: "monospace",
              letterSpacing: "0.1em",
              transition: "color 0.3s ease",
            }}
          >
            <div
              style={{
                fontSize: 18,
                fontWeight: 900,
                animation: phase === "completed" ? "burn-glow-completed 1s ease-in-out infinite" : "none",
                marginBottom: 4,
                textShadow: phase === "completed"
                  ? "0 0 20px rgba(255, 102, 0, 0.8), 0 0 60px rgba(255, 68, 0, 0.5)"
                  : `0 0 ${5 + progress * 15}px rgba(255, 136, 0, ${0.3 + progress * 0.5})`,
                transition: "text-shadow 0.15s linear",
              }}
            >
              {phase === "completed" ? "🔥 BURNED!" : "🔥 BURNING..."}
            </div>
            <div style={{ fontSize: 14, opacity: 0.8 }}>
              P{prestige} {ticker}
            </div>
            <div style={{ fontSize: 11, opacity: 0.5, fontFamily: "monospace" }}>
              #{seed.toString(16).toUpperCase().padStart(8, "0")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}