"use client";

import { useCallback, useEffect, useState } from "react";
import {
  loadLedger,
  recordYieldDeposit,
  recordYieldWithdraw,
  saveLedger,
  type PortfolioLedger,
} from "@/lib/portfolio-tracker";

const EMPTY_LEDGER: PortfolioLedger = {
  depositedMist: "0",
  withdrawnMist: "0",
  updatedAt: 0,
};

function notifyLedger() {
  window.dispatchEvent(new Event("yield-shield-ledger"));
}

export function usePortfolioLedger(address?: string) {
  const [ledger, setLedger] = useState<PortfolioLedger>(EMPTY_LEDGER);

  useEffect(() => {
    if (!address) {
      setLedger(EMPTY_LEDGER);
      return;
    }

    setLedger(loadLedger(address));

    const onStorage = (e: StorageEvent) => {
      if (e.key?.toLowerCase().includes(address.toLowerCase())) {
        setLedger(loadLedger(address));
      }
    };
    const onCustom = () => setLedger(loadLedger(address));

    window.addEventListener("storage", onStorage);
    window.addEventListener("yield-shield-ledger", onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("yield-shield-ledger", onCustom);
    };
  }, [address]);

  const recordDeposit = useCallback(
    (mist: bigint) => {
      if (!address) return;
      recordYieldDeposit(address, mist);
      setLedger(loadLedger(address));
      notifyLedger();
    },
    [address],
  );

  const recordWithdraw = useCallback(
    (mist: bigint) => {
      if (!address) return;
      recordYieldWithdraw(address, mist);
      setLedger(loadLedger(address));
      notifyLedger();
    },
    [address],
  );

  const setBasisFromSupply = useCallback(
    (supplyMist: bigint) => {
      if (!address || supplyMist <= 0n) return;
      saveLedger(address, {
        depositedMist: supplyMist.toString(),
        withdrawnMist: "0",
        updatedAt: Date.now(),
      });
      setLedger(loadLedger(address));
      notifyLedger();
    },
    [address],
  );

  return {
    ledger: address ? ledger : null,
    recordDeposit,
    recordWithdraw,
    setBasisFromSupply,
  };
}
