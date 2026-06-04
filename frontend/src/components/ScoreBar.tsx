interface Props {
  score: number | null;
  label?: string;
  size?: "sm" | "md";
  max?: number;
}

function colorForScore(pct: number): string {
  if (pct >= 80) return "bg-green-500";
  if (pct >= 60) return "bg-yellow-400";
  if (pct >= 40) return "bg-orange-400";
  return "bg-red-500";
}

function textColorForScore(pct: number): string {
  if (pct >= 80) return "text-green-700";
  if (pct >= 60) return "text-yellow-700";
  if (pct >= 40) return "text-orange-600";
  return "text-red-600";
}

export default function ScoreBar({ score, label, size = "md", max = 5 }: Props) {
  if (score == null) return <span className="text-gray-300 text-xs">—</span>;
  const pct = (score / max) * 100;
  const barH = size === "sm" ? "h-1.5" : "h-2";
  return (
    <div className={size === "sm" ? "w-20" : "w-full"}>
      {label && (
        <div className="flex justify-between mb-0.5">
          <span className="text-xs text-gray-500">{label}</span>
          <span className={`text-xs font-semibold ${textColorForScore(pct)}`}>{score}</span>
        </div>
      )}
      {!label && (
        <div className={`text-xs font-semibold mb-0.5 ${textColorForScore(pct)}`}>{score}/{max}</div>
      )}
      <div className={`w-full ${barH} bg-gray-100 rounded-full overflow-hidden`}>
        <div
          className={`${barH} rounded-full transition-all ${colorForScore(pct)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
