"use client";
import React from "react";
import TokenCard from "./TokenCard";
import { TOKEN_NAMES } from "@/lib/voidTypes";

interface TokenTreeProps {
  activeMask: number;
  tokenStates: { isActive: boolean; isMinted: boolean; isLocked: boolean }[];
  costs: string[];
  onMintToken: (index: number) => void;
  loadingIndex: number | null;
}

export default function TokenTree({
  activeMask, tokenStates, costs, onMintToken, loadingIndex,
}: TokenTreeProps) {
  const grid = [
    [TOKEN_NAMES[0], TOKEN_NAMES[1], TOKEN_NAMES[2]],
    [TOKEN_NAMES[3], TOKEN_NAMES[4], TOKEN_NAMES[5]],
    [TOKEN_NAMES[6], TOKEN_NAMES[7], TOKEN_NAMES[8]],
  ];

  return (
    <div>
      <h3 className="font-bold text-[#0066ff] mb-4 text-center">⚙️ Tech Tree — 9 Child Tokens</h3>
      <p className="text-xs text-gray-400 text-center mb-4">
        Mint in order: CROWN → ORACLE → ANVIL → ECHO → FORGE → TIDE → VAULT → RIFT → PRIME
      </p>
      <div className="grid grid-cols-3 gap-3 max-w-2xl mx-auto">
        {tokenStates.map((state, idx) => (
          <TokenCard
            key={idx}
            index={idx}
            isActive={state.isActive}
            isMinted={state.isMinted}
            isLocked={state.isLocked}
            cost={costs[idx]}
            onMint={() => onMintToken(idx)}
            loading={loadingIndex === idx}
          />
        ))}
      </div>
      {/* Dependency arrows visualization */}
      <div className="mt-4 flex justify-center gap-1 text-[10px] text-gray-500 flex-wrap">
        {TOKEN_NAMES.map((name, i) => (
          <React.Fragment key={i}>
            <span className={activeMask & (1 << i) ? "text-green-400" : "text-gray-600"}>
              {name}
            </span>
            {i < 8 && <span className="text-gray-700"> → </span>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}