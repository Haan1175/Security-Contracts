interface Props {
  status: string | null;
}

const styles: Record<string, string> = {
  Active: "bg-green-100 text-green-800",
  Evaluation: "bg-blue-100 text-blue-700",
  Deprecated: "bg-yellow-100 text-yellow-700",
  Retired: "bg-gray-100 text-gray-500",
};

export default function DeploymentBadge({ status }: Props) {
  if (!status) return <span className="text-gray-300 text-xs">—</span>;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${styles[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}
