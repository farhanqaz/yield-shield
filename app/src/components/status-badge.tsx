import { SHIELD_STATUS, ShieldStatusCode } from "@/lib/config";

type Props = {
  status: ShieldStatusCode;
  score: number;
};

export function StatusBadge({ status, score }: Props) {
  const { label, color } = SHIELD_STATUS[status];

  return (
    <div
      className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium"
      style={{ borderColor: color, color }}
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label} · {score}
    </div>
  );
}
