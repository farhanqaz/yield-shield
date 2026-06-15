"use client";

import {
  SPLIT_PRESETS,
  bpsToPercent,
  clampVaultBps,
} from "@/lib/split-preference";

type Props = {
  vaultBps: number;
  onChange: (bps: number) => void;
  disabled?: boolean;
};

export function SplitSlider({ vaultBps, onChange, disabled }: Props) {
  const vaultPct = bpsToPercent(vaultBps);
  const liquidPct = 100 - vaultPct;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">Split incoming funds</span>
        <span className="font-mono text-xs text-[var(--muted)]">
          <span className="text-[var(--safe)]">{vaultPct}%</span> vault ·{" "}
          <span className="text-[var(--accent)]">{liquidPct}%</span> wallet
        </span>
      </div>

      <input
        type="range"
        min={50}
        max={95}
        step={5}
        value={vaultPct}
        disabled={disabled}
        onChange={(e) => onChange(clampVaultBps(Number(e.target.value) * 100))}
        className="split-range w-full"
        aria-label="Vault split percentage"
      />

      <div className="flex flex-wrap gap-2">
        {SPLIT_PRESETS.map(({ label, bps }) => (
          <button
            key={bps}
            type="button"
            disabled={disabled}
            onClick={() => onChange(bps)}
            className={`chip ${vaultBps === bps ? "chip-active" : ""}`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
