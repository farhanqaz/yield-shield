import { SHIELD_STATUS, ShieldStatusCode } from "@/lib/config";

type Props = {
  score: number;
  status: ShieldStatusCode;
};

export function ScoreGauge({ score, status }: Props) {
  const { label, color } = SHIELD_STATUS[status];
  const pct = Math.min(100, Math.max(0, score));

  return (
    <div className="flex flex-col items-center gap-3 py-2">
      <div
        className="relative flex h-32 w-32 items-center justify-center rounded-full"
        style={{
          background: `conic-gradient(${color} ${pct * 3.6}deg, var(--border) 0deg)`,
        }}
      >
        <div className="flex h-[5.5rem] w-[5.5rem] flex-col items-center justify-center rounded-full bg-[var(--surface)]">
          <span className="text-3xl font-bold tabular-nums" style={{ color }}>
            {score}
          </span>
          <span className="text-[10px] uppercase tracking-widest text-[var(--muted)]">
            ShieldScore
          </span>
        </div>
      </div>
      <p className="text-sm font-medium" style={{ color }}>
        {label}
      </p>
    </div>
  );
}
