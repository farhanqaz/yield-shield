import { SHIELD_STATUS, ShieldStatusCode } from "@/lib/config";

type Props = {
  score: number;
  status: ShieldStatusCode;
};

export function ScoreGauge({ score, status }: Props) {
  const { label, color } = SHIELD_STATUS[status];
  const pct = Math.min(100, Math.max(0, score));
  const ringSize = 168;
  const innerSize = 136;

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div
        className={`relative flex items-center justify-center rounded-full ${
          status === 2 ? "score-ring-paused" : ""
        }`}
        style={{
          width: ringSize,
          height: ringSize,
          background: `conic-gradient(${color} ${pct * 3.6}deg, var(--border) 0deg)`,
          boxShadow: `0 0 40px -8px ${color}40`,
        }}
      >
        <div
          className="flex flex-col items-center justify-center rounded-full bg-[var(--surface-solid)]"
          style={{ width: innerSize, height: innerSize }}
        >
          <span
            className="font-mono text-4xl font-bold tabular-nums tracking-tight"
            style={{ color }}
          >
            {score}
          </span>
          <span className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--muted)]">
            ShieldScore
          </span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-base font-semibold" style={{ color }}>
          {label}
        </p>
        <p className="mt-1 max-w-xs text-xs text-[var(--muted)]">
          {status === 0 && "Deposits open — vault conditions are healthy."}
          {status === 1 && "Elevated risk — deposits allowed with caution."}
          {status === 2 && "Circuit breaker active — new deposits paused."}
        </p>
      </div>
    </div>
  );
}
