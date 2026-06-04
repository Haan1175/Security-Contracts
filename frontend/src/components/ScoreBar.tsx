interface Props {
  score: number | null;
  label?: string;
  size?: "sm" | "md";
}

function colorForScore(score: number): string {
  if (score >= 75) return "bg-green-500";
  if (score >= 50) return "bg-yellow-400";
  if (score >= 25) return "bg-orange-400";
  return "bg-red-500";
}

function textColorForScore(score: number): string {
  if (score >= 75) return "text-green-700";
  if (score >= 50) return "text-yellow-700";
  if (score >= 25) return "text-orange-600";
  return "text-red-600";
}

export default function ScoreBar({ score, label, size = "md" }: Props) {
  if (score == null) return <span className="text-gray-300 text-xs">—</span>;
  const barH = size === "sm" ? "h-1.5" : "h-2";
  return (
    <div className={size === "sm" ? "w-20" : "w-full"}>
      {label && (
        <div className="flex justify-between mb-0.5">
          <span className="text-xs text-gray-500">{label}</span>
          <span className={`text-xs font-semibold ${textColorForScore(score)}`}>{score}</span>
        </div>
      )}
      {!label && (
        <div className={`text-xs font-semibold mb-0.5 ${textColorForScore(score)}`}>{score}/100</div>
      )}
      <div className={`w-full ${barH} bg-gray-100 rounded-full overflow-hidden`}>
        <div
          className={`${barH} rounded-full transition-all ${colorForScore(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
