interface Props {
  status: string | null;
}

export default function StatusBadge({ status }: Props) {
  if (!status) return <span className="text-gray-400 text-xs">—</span>;
  const isActive = status === "ACTIVE";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
        isActive
          ? "bg-green-100 text-green-800"
          : "bg-red-100 text-red-700"
      }`}
    >
      {status}
    </span>
  );
}
