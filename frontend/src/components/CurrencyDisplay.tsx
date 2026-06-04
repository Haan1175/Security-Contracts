interface Props {
  amount: number | null;
  currency?: string | null;
  amountUsd?: number | null;
}

const fmt = (val: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);

export default function CurrencyDisplay({ amount, currency, amountUsd }: Props) {
  if (amount == null) return <span className="text-gray-400">—</span>;
  const cur = currency || "USD";
  const localFmt = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: cur,
    maximumFractionDigits: 0,
  });
  return (
    <div>
      <div className="font-medium text-gray-900">{localFmt.format(amount)}</div>
      {amountUsd != null && cur !== "USD" && (
        <div className="text-xs text-gray-500">{fmt(amountUsd)} USD</div>
      )}
    </div>
  );
}
