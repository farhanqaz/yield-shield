"use client";

import { SHIELD_STATUS, ShieldStatusCode } from "@/lib/config";

type Props = {
  score: number;
  status: ShieldStatusCode;
  compact?: boolean;
};

export function ShieldScoreChart({ score, status, compact }: Props) {
  const { label, color } = SHIELD_STATUS[status];
  const pct = Math.min(100, Math.max(0, score));
  const size = compact ? 72 : 120;
  const inner = compact ? 56 : 92;

  return (
    <div className={`flex items-center gap-3 ${compact ? "" : "flex-col py-2"}`}>
      <div
        className={`relative shrink-0 rounded-full ${status === 2 ? "score-ring-paused" : ""}`}
        style={{
          width: size,
          height: size,
          background: `conic-gradient(${color} ${pct * 3.6}deg, var(--border) 0deg)`,
        }}
      >
        <div
          className="absolute flex flex-col items-center justify-center rounded-full bg-[var(--surface-solid)]"
          style={{
            width: inner,
            height: inner,
            top: (size - inner) / 2,
            left: (size - inner) / 2,
          }}
        >
          <span
            className={`font-mono font-bold tabular-nums ${compact ? "text-lg" : "text-3xl"}`}
            style={{ color }}
          >
            {score}
          </span>
        </div>
      </div>
      <div className={compact ? "min-w-0" : "text-center"}>
        <p className={`font-semibold ${compact ? "text-sm" : "text-base"}`} style={{ color }}>
          {label}
        </p>
        {!compact && (
          <p className="mt-1 max-w-[200px] text-xs text-[var(--muted)]">
            {status === 0 && "Healthy — deposits open"}
            {status === 1 && "Caution — deposits open"}
            {status === 2 && "Paused — withdraw only"}
          </p>
        )}
        {compact && (
          <div className="mt-1.5 h-1.5 w-full max-w-[120px] overflow-hidden rounded-full bg-[var(--border)]">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, backgroundColor: color }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
