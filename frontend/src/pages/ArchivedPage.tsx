import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, RotateCcw, Eye } from "lucide-react";
import { fetchContracts, unarchiveContract } from "../api/contracts";
import StatusBadge from "../components/StatusBadge";
import CurrencyDisplay from "../components/CurrencyDisplay";

export default function ArchivedPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [q, setQ] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["contracts", { archived: true, q }],
    queryFn: () => fetchContracts({ archived: true, q: q || undefined, page_size: 200 }),
  });

  const restoreMut = useMutation({
    mutationFn: unarchiveContract,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contracts"] }),
  });

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-6">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900">Archived Contracts</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {data?.total ?? 0} archived contracts
        </p>
      </div>

      <div className="relative mb-4 max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search archived contracts…"
          className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          value={q}
          onChange={e => setQ(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">PO / Product</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Vendor</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Security Function</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">End Date</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && (
              <tr><td colSpan={7} className="text-center py-12 text-gray-400">Loading…</td></tr>
            )}
            {!isLoading && data?.items.length === 0 && (
              <tr><td colSpan={7} className="text-center py-12 text-gray-400">No archived contracts</td></tr>
            )}
            {data?.items.map(c => (
              <tr key={c.id} className="hover:bg-gray-50 transition-colors opacity-75">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-700 truncate max-w-xs">{c.product_or_service || "—"}</div>
                  <div className="text-xs text-gray-400">{c.po_number || "No PO"}</div>
                </td>
                <td className="px-4 py-3 text-gray-600">{c.vendor || "—"}</td>
                <td className="px-4 py-3 text-gray-600">{c.security_function || "—"}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{c.end_date || "—"}</td>
                <td className="px-4 py-3 text-right">
                  <CurrencyDisplay amount={c.contract_amount} currency={c.currency} amountUsd={c.contract_amount_usd} />
                </td>
                <td className="px-4 py-3 text-center">
                  <StatusBadge status={c.status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => navigate(`/contracts/${c.id}`)}
                      className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title="View">
                      <Eye size={15} />
                    </button>
                    <button
                      onClick={() => restoreMut.mutate(c.id)}
                      className="p-1.5 rounded hover:bg-green-100 text-green-600" title="Restore"
                    >
                      <RotateCcw size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
