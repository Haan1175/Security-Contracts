import { useNavigate, useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Pencil, Archive, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from "recharts";
import { fetchContract, archiveContract, unarchiveContract } from "../api/contracts";
import StatusBadge from "../components/StatusBadge";
import CurrencyDisplay from "../components/CurrencyDisplay";
import type { Contract } from "../types";

const MONTHS = ["nov","dec","jan","feb","mar","apr","may","jun","jul","aug","sep","oct"] as const;
const FYS = ["25","26","27","28"] as const;
type FYKey = `fy${typeof FYS[number]}_${typeof MONTHS[number]}`;

const MONTH_LABELS: Record<string, string> = {
  nov:"Nov",dec:"Dec",jan:"Jan",feb:"Feb",mar:"Mar",apr:"Apr",
  may:"May",jun:"Jun",jul:"Jul",aug:"Aug",sep:"Sep",oct:"Oct",
};

const FY_COLORS: Record<string, string> = {
  "25":"#6366f1","26":"#22c55e","27":"#f59e0b","28":"#ef4444",
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2 py-1 border-b border-gray-50 last:border-0">
      <span className="w-56 shrink-0 text-sm text-gray-500">{label}</span>
      <span className="text-sm text-gray-900 font-medium">{value ?? <span className="text-gray-300">—</span>}</span>
    </div>
  );
}

function Section({
  title, children, defaultOpen = true,
}: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</h2>
        {open ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
      </button>
      {open && <div className="px-5 pb-4 space-y-0.5">{children}</div>}
    </section>
  );
}

function fmtUsd(v: number | null | undefined) {
  if (v == null) return null;
  return "$" + v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function bool(v: boolean | null | undefined) {
  return v ? "Yes" : "No";
}

export default function ContractDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: contract, isLoading } = useQuery({
    queryKey: ["contract", id],
    queryFn: () => fetchContract(Number(id)),
  });

  const archiveMut = useMutation({
    mutationFn: (cid: number) => archiveContract(cid),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["contracts"] }); navigate("/"); },
  });
  const unarchiveMut = useMutation({
    mutationFn: (cid: number) => unarchiveContract(cid),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contracts"] });
      qc.invalidateQueries({ queryKey: ["contract", id] });
    },
  });

  if (isLoading) return <div className="p-8 text-gray-400">Loading…</div>;
  if (!contract) return <div className="p-8 text-red-500">Contract not found</div>;

  const c = contract as unknown as Record<string, unknown>;
  // Build line chart data: one point per month, one line per FY
  const chartData = MONTHS.map(mo => {
    const entry: Record<string, unknown> = { month: MONTH_LABELS[mo] };
    for (const yr of FYS) {
      const val = c[`fy${yr}_${mo}`] as number | null;
      entry[`FY${yr}`] = val ?? null;
    }
    return entry;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{contract.product_or_service || "Untitled Contract"}</h1>
            <p className="text-sm text-gray-400">{contract.po_number || "No PO number"} · {contract.vendor || "No vendor"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={contract.status} />
          <Link to={`/contracts/${contract.id}/edit`}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
            <Pencil size={14} /> Edit
          </Link>
          {contract.archived ? (
            <button onClick={() => unarchiveMut.mutate(contract.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
              <RotateCcw size={14} /> Restore
            </button>
          ) : (
            <button onClick={() => { if (confirm("Archive this contract?")) archiveMut.mutate(contract.id); }}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 rounded-lg text-sm text-red-600 hover:bg-red-50">
              <Archive size={14} /> Archive
            </button>
          )}
        </div>
      </div>

      {contract.archived && (
        <div className="mb-4 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
          This contract is archived.
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: "Contract Amount (USD)", value: fmtUsd(contract.contract_amount_usd) ?? "—" },
          { label: "Monthly Amount (USD)", value: fmtUsd(contract.monthly_amount_usd) ?? "—" },
          { label: "Days Remaining", value: contract.end_date
              ? Math.ceil((new Date(contract.end_date).getTime() - Date.now()) / 86400000).toLocaleString() + " days"
              : "—" },
          { label: "Status", value: <StatusBadge status={contract.status} /> },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <p className="text-xs text-gray-400 font-medium mb-1">{label}</p>
            <p className="text-lg font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">

        {/* Identity */}
        <Section title="Identity">
          <Row label="Product or Service" value={contract.product_or_service} />
          <Row label="Purchase Order Number" value={contract.po_number} />
          <Row label="Scope" value={<span className="whitespace-pre-wrap">{contract.scope}</span>} />
          <Row label="Anaplan unique ID" value={contract.anaplan_id} />
        </Section>

        {/* Vendor & Owner */}
        <Section title="Vendor & Owner">
          <Row label="Vendor" value={contract.vendor} />
          <Row label="Cost Center" value={contract.cost_center} />
          <Row label="Security Contract Owner" value={contract.owner_name} />
          <Row label="Security Contract Owner email" value={contract.owner_email
            ? <a href={`mailto:${contract.owner_email}`} className="text-brand-600 underline">{contract.owner_email}</a>
            : null} />
        </Section>

        {/* Classification */}
        <Section title="Classification">
          <Row label="Security Function" value={contract.security_function} />
          <Row label="Security Capability" value={contract.security_capability} />
          <Row label="Risk Assessment" value={contract.risk_assessment} />
        </Section>

        {/* Financials */}
        <Section title="Financials">
          <Row label="Contract Amount" value={
            <CurrencyDisplay amount={contract.contract_amount} currency={contract.currency} amountUsd={contract.contract_amount_usd} />
          } />
          <Row label="Currency" value={contract.currency} />
          <Row label="Contract Amount (USD)" value={fmtUsd(contract.contract_amount_usd)} />
          <Row label="Monthly Amount (USD)" value={fmtUsd(contract.monthly_amount_usd)} />
          <Row label="Payment Term" value={contract.payment_term} />
          <Row label="Payment Scheme" value={contract.payment_scheme} />
          <Row label="Recurring" value={contract.recurring} />
          <Row label="NDA" value={bool(contract.nda)} />
          <Row label="Amortize" value={bool(contract.amortize)} />
        </Section>

        {/* Lifecycle */}
        <Section title="Lifecycle">
          <Row label="Start Date" value={contract.start_date} />
          <Row label="End Date" value={contract.end_date} />
          <Row label="Days" value={contract.contract_days?.toLocaleString()} />
          <Row label="Months" value={contract.contract_months?.toLocaleString()} />
          <Row label="Status" value={<StatusBadge status={contract.status} />} />
          <Row label="Auto Renewal" value={bool(contract.auto_renewal)} />
          <Row label="Notification Term (days)" value={contract.notification_term_days != null ? `${contract.notification_term_days} days` : null} />
          <Row label="Renewed (Y/N)" value={contract.renewed} />
          <Row label="Do Not Renew" value={contract.do_not_renew} />
        </Section>

        {/* FY Spend Progression */}
        <Section title="FY Spend Progression">
          <p className="text-xs text-gray-400 mb-4">Monthly spend by fiscal year (Nov – Oct)</p>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 8, right: 24, bottom: 0, left: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                tickFormatter={v => v === 0 ? "$0" : "$" + (v >= 1000 ? (v / 1000).toFixed(0) + "k" : v)}
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={60}
              />
              <Tooltip
                formatter={(v: number, name: string) => [
                  v != null ? "$" + v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—",
                  name,
                ]}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {FYS.map(yr => (
                <Line
                  key={yr}
                  type="monotone"
                  dataKey={`FY${yr}`}
                  stroke={FY_COLORS[yr]}
                  strokeWidth={2}
                  dot={{ r: 3, fill: FY_COLORS[yr] }}
                  activeDot={{ r: 5 }}
                  connectNulls={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>

          {/* Numeric table */}
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-3 py-2 font-semibold text-gray-500 w-16">FY</th>
                  {MONTHS.map(m => (
                    <th key={m} className="text-right px-2 py-2 font-semibold text-gray-500">{MONTH_LABELS[m]}</th>
                  ))}
                  <th className="text-right px-3 py-2 font-semibold text-gray-700 border-l border-gray-100">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {FYS.map(yr => {
                  const total = MONTHS.reduce((s, mo) => s + ((c[`fy${yr}_${mo}`] as number) ?? 0), 0);
                  return (
                    <tr key={yr} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-semibold" style={{ color: FY_COLORS[yr] }}>FY{yr}</td>
                      {MONTHS.map(mo => {
                        const val = c[`fy${yr}_${mo}` as FYKey] as number | null;
                        return (
                          <td key={mo} className={`px-2 py-2 text-right ${val ? "text-gray-800" : "text-gray-200"}`}>
                            {val != null && val > 0 ? "$" + val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"}
                          </td>
                        );
                      })}
                      <td className="px-3 py-2 text-right font-semibold text-gray-800 border-l border-gray-100">
                        {total > 0 ? "$" + total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Section>

      </div>
    </div>
  );
}
