"use client";

import { useEffect, useRef } from "react";
import { autoShieldKeeperEnabled } from "@/lib/config";

const POLL_MS = 5 * 60 * 1000;

/**
 * Polls keeper API to push Pyth volatility + NAVI utilization on-chain.
 * Requires KEEPER_PRIVATE_KEY on server (Vercel env) + CRON_SECRET optional.
 */
export function useShieldKeeper() {
  const lastRun = useRef(0);

  useEffect(() => {
    if (!autoShieldKeeperEnabled()) return;

    const tick = () => {
      const now = Date.now();
      if (now - lastRun.current < POLL_MS - 5000) return;
      lastRun.current = now;

      void fetch("/api/keeper/sync", { method: "POST" }).catch(() => {
        /* keeper optional — silent fail */
      });
    };

    tick();
    const id = setInterval(tick, POLL_MS);
    return () => clearInterval(id);
  }, []);
}
