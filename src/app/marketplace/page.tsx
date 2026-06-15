"use client";
import { useRouter } from "next/navigation";

export default function MarketplacePage() {
  const router = useRouter();
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#08080c' }}>
      <div className="text-center space-y-4">
        <img src="/nex-logo.jpg" alt="NEX" className="h-8 w-auto rounded mx-auto mb-2" />
        <p className="text-sm" style={{ color: '#0066ff' }}>Marketplace is accessed from within the app</p>
        <button
          onClick={() => router.push('/')}
          className="text-xs px-4 py-2 rounded-full border transition-all"
          style={{ background: '#0066ff1A', borderColor: '#0066ff44', color: '#0066ff' }}
        >
          ← Back to App
        </button>
      </div>
    </div>
  );
}