import { SHIELD_STATUS, ShieldStatusCode } from "@/lib/config";

type Props = {
  status: ShieldStatusCode;
  score: number;
};

export function StatusBadge({ status, score }: Props) {
  const { label, color } = SHIELD_STATUS[status];

  return (
    <div
      className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold backdrop-blur-sm"
      style={{
        borderColor: `${color}55`,
        color,
        background: `${color}12`,
        boxShadow: `0 0 20px -6px ${color}40`,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }}
      />
      {label} · {score}
    </div>
  );
}
