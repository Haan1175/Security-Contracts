import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, SlidersHorizontal, Plus, ChevronLeft, ChevronRight, Archive, Pencil, Eye, X } from "lucide-react";
import { fetchContracts, fetchEnums, archiveContract, importContractsCsv } from "../api/contracts";
import type { ContractFilters } from "../types";
import StatusBadge from "../components/StatusBadge";
import CurrencyDisplay from "../components/CurrencyDisplay";
import CsvImportButton from "../components/CsvImportButton";

const PAGE_SIZE = 50;

function FilterPanel({
  filters,
  enums,
  onChange,
  onClose,
}: {
  filters: ContractFilters;
  enums: { security_functions: string[]; currencies: string[]; statuses: string[]; recurring_options: string[]; security_capabilities: string[] };
  onChange: (f: Partial<ContractFilters>) => void;
  onClose: () => void;
}) {
  return (
    <aside className="w-72 shrink-0 bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-4 h-fit">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-gray-700 text-sm">Filters</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">Status</label>
        <select className="input-sm" value={filters.status || ""} onChange={e => onChange({ status: e.target.value || undefined })}>
          <option value="">All</option>
          {enums.statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">Security Function</label>
        <select className="input-sm" value={filters.security_function || ""} onChange={e => onChange({ security_function: e.target.value || undefined })}>
          <option value="">All</option>
          {enums.security_functions.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">Security Capability</label>
        <select className="input-sm" value={filters.security_capability || ""} onChange={e => onChange({ security_capability: e.target.value || undefined })}>
          <option value="">All</option>
          {enums.security_capabilities.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">Currency</label>
        <select className="input-sm" value={filters.currency || ""} onChange={e => onChange({ currency: e.target.value || undefined })}>
          <option value="">All</option>
          {enums.currencies.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">Recurring</label>
        <select className="input-sm" value={filters.recurring || ""} onChange={e => onChange({ recurring: e.target.value || undefined })}>
          <option value="">All</option>
          {enums.recurring_options.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">End Date From</label>
        <input type="date" className="input-sm" value={filters.end_date_from || ""} onChange={e => onChange({ end_date_from: e.target.value || undefined })} />
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">End Date To</label>
        <input type="date" className="input-sm" value={filters.end_date_to || ""} onChange={e => onChange({ end_date_to: e.target.value || undefined })} />
      </div>

      <button
        className="w-full text-xs text-brand-600 hover:text-brand-700 underline"
        onClick={() => onChange({ status: undefined, security_function: undefined, security_capability: undefined, currency: undefined, recurring: undefined, end_date_from: undefined, end_date_to: undefined })}
      >
        Clear all filters
      </button>
    </aside>
  );
}

export default function ContractListPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<ContractFilters>({ page: 1, page_size: PAGE_SIZE, archived: false });

  const { data, isLoading } = useQuery({
    queryKey: ["contracts", filters],
    queryFn: () => fetchContracts(filters),
  });

  const { data: enums } = useQuery({
    queryKey: ["enums"],
    queryFn: fetchEnums,
  });

  const archiveMut = useMutation({
    mutationFn: archiveContract,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contracts"] }),
  });

  const updateFilter = (patch: Partial<ContractFilters>) => {
    setFilters(f => ({ ...f, ...patch, page: 1 }));
  };

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 1;

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contracts</h1>
          {data && (
            <p className="text-sm text-gray-500 mt-0.5">
              {data.total.toLocaleString()} contracts
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <CsvImportButton
            label="Contracts"
            onImport={importContractsCsv}
            onSuccess={() => qc.invalidateQueries({ queryKey: ["contracts"] })}
          />
          <Link
            to="/contracts/new"
            className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} /> New Contract
          </Link>
        </div>
      </div>

      {/* Search bar */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by PO number, vendor, product, scope…"
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            value={filters.q || ""}
            onChange={e => updateFilter({ q: e.target.value || undefined })}
          />
        </div>
        <button
          onClick={() => setShowFilters(f => !f)}
          className={`flex items-center gap-1.5 px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
            showFilters ? "border-brand-500 text-brand-600 bg-brand-50" : "border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          <SlidersHorizontal size={15} /> Filters
        </button>
      </div>

      <div className="flex gap-4 items-start">
        {/* Filter panel */}
        {showFilters && enums && (
          <FilterPanel
            filters={filters}
            enums={enums}
            onChange={updateFilter}
            onClose={() => setShowFilters(false)}
          />
        )}

        {/* Table */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">PO / Product</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Vendor</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Security Function</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Dates</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {isLoading && (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-gray-400">Loading…</td>
                    </tr>
                  )}
                  {!isLoading && data?.items.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-gray-400">No contracts found</td>
                    </tr>
                  )}
                  {data?.items.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 truncate max-w-xs">
                          {c.product_or_service || "—"}
                        </div>
                        <div className="text-xs text-gray-400">{c.po_number || "No PO"}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{c.vendor || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="text-gray-700">{c.security_function || "—"}</div>
                        {c.security_capability && (
                          <div className="text-xs text-gray-400">{c.security_capability}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">
                        <div>{c.start_date || "—"}</div>
                        <div className="text-gray-400">→ {c.end_date || "—"}</div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <CurrencyDisplay
                          amount={c.contract_amount}
                          currency={c.currency}
                          amountUsd={c.contract_amount_usd}
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={c.status} />
                        {c.do_not_renew && (
                          <div className="text-xs text-red-500 mt-0.5">DNR</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => navigate(`/contracts/${c.id}`)}
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title="View"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => navigate(`/contracts/${c.id}/edit`)}
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title="Edit"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => { if (confirm("Archive this contract?")) archiveMut.mutate(c.id); }}
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title="Archive"
                          >
                            <Archive size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data && data.total > PAGE_SIZE && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50 text-sm">
                <span className="text-gray-500">
                  {((filters.page! - 1) * PAGE_SIZE) + 1}–{Math.min(filters.page! * PAGE_SIZE, data.total)} of {data.total.toLocaleString()}
                </span>
                <div className="flex gap-1">
                  <button
                    disabled={filters.page === 1}
                    onClick={() => setFilters(f => ({ ...f, page: f.page! - 1 }))}
                    className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-40"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="px-2 py-1 text-gray-600">Page {filters.page} of {totalPages}</span>
                  <button
                    disabled={filters.page === totalPages}
                    onClick={() => setFilters(f => ({ ...f, page: f.page! + 1 }))}
                    className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-40"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
