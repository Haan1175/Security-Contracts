import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, SlidersHorizontal, Plus, ChevronLeft, ChevronRight, Archive, Pencil, X } from "lucide-react";
import { fetchTools, archiveTool, importToolsCsv } from "../api/tools";
import { fetchEnums } from "../api/contracts";
import type { ToolFilters } from "../types";
import DeploymentBadge from "../components/DeploymentBadge";
import ScoreBar from "../components/ScoreBar";
import CsvImportButton from "../components/CsvImportButton";

const PAGE_SIZE = 50;

const DEPLOYMENT_STATUSES = ["Active", "Evaluation", "Deprecated", "Retired"];

function FilterPanel({
  filters,
  enums,
  onChange,
  onClose,
}: {
  filters: ToolFilters;
  enums: { security_functions: string[]; security_capabilities: string[] };
  onChange: (f: Partial<ToolFilters>) => void;
  onClose: () => void;
}) {
  return (
    <aside className="w-64 shrink-0 bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-4 h-fit">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-gray-700 text-sm">Filters</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Disposition</label>
        <select className="input-sm" value={filters.deployment_status || ""} onChange={e => onChange({ deployment_status: e.target.value || undefined })}>
          <option value="">All</option>
          {DEPLOYMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
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
        <label className="block text-xs text-gray-500 mb-1">Capability</label>
        <select className="input-sm" value={filters.security_capability || ""} onChange={e => onChange({ security_capability: e.target.value || undefined })}>
          <option value="">All</option>
          {enums.security_capabilities.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <button
        className="w-full text-xs text-brand-600 hover:text-brand-700 underline"
        onClick={() => onChange({ deployment_status: undefined, security_function: undefined, security_capability: undefined })}
      >
        Clear all filters
      </button>
    </aside>
  );
}

export default function ToolListPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<ToolFilters>({ page: 1, page_size: PAGE_SIZE, archived: false });

  const { data, isLoading } = useQuery({
    queryKey: ["tools", filters],
    queryFn: () => fetchTools(filters),
  });

  const { data: enums } = useQuery({ queryKey: ["enums"], queryFn: fetchEnums });

  const archiveMut = useMutation({
    mutationFn: archiveTool,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tools"] }),
  });

  const updateFilter = (patch: Partial<ToolFilters>) =>
    setFilters(f => ({ ...f, ...patch, page: 1 }));

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 1;

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Security Tools</h1>
          {data && <p className="text-sm text-gray-500 mt-0.5">{data.total} tools</p>}
        </div>
        <div className="flex items-center gap-2">
          <CsvImportButton
            label="Tools"
            onImport={importToolsCsv}
            onSuccess={() => qc.invalidateQueries({ queryKey: ["tools"] })}
          />
          <Link
            to="/tools/new"
            className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} /> New Tool
          </Link>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, vendor, description…"
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
        {showFilters && enums && (
          <FilterPanel filters={filters} enums={enums} onChange={updateFilter} onClose={() => setShowFilters(false)} />
        )}

        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Product / Vendor</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Security Function</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Internal Contact</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-32">Effectiveness (1-5)</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-32">Coverage (1-5)</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Disposition</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {isLoading && (
                    <tr><td colSpan={7} className="text-center py-12 text-gray-400">Loading…</td></tr>
                  )}
                  {!isLoading && data?.items.length === 0 && (
                    <tr><td colSpan={7} className="text-center py-12 text-gray-400">No tools found</td></tr>
                  )}
                  {data?.items.map(t => (
                    <tr key={t.id} className="hover:bg-brand-50 transition-colors cursor-pointer" onClick={() => navigate(`/tools/${t.id}`)}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{t.name || "—"}</div>
                        <div className="text-xs text-gray-400">{t.vendor}{t.version ? ` · v${t.version}` : ""}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-700">{t.security_function || "—"}</div>
                        {t.security_capability && (
                          <div className="text-xs text-gray-400">{t.security_capability}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-sm">{t.owner_name || "—"}</td>
                      <td className="px-4 py-3">
                        <ScoreBar score={t.effectiveness_score} size="sm" />
                      </td>
                      <td className="px-4 py-3">
                        <ScoreBar score={t.coverage_score} size="sm" />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <DeploymentBadge status={t.deployment_status} />
                      </td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={() => navigate(`/tools/${t.id}/edit`)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title="Edit">
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => { if (confirm("Archive this tool?")) archiveMut.mutate(t.id); }}
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

            {data && data.total > PAGE_SIZE && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50 text-sm">
                <span className="text-gray-500">
                  {((filters.page! - 1) * PAGE_SIZE) + 1}–{Math.min(filters.page! * PAGE_SIZE, data.total)} of {data.total}
                </span>
                <div className="flex gap-1">
                  <button disabled={filters.page === 1} onClick={() => setFilters(f => ({ ...f, page: f.page! - 1 }))} className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-40">
                    <ChevronLeft size={16} />
                  </button>
                  <span className="px-2 py-1 text-gray-600">Page {filters.page} of {totalPages}</span>
                  <button disabled={filters.page === totalPages} onClick={() => setFilters(f => ({ ...f, page: f.page! + 1 }))} className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-40">
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
