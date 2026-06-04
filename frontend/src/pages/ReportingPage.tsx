import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ScatterChart, Scatter, ZAxis,
} from "recharts";
import { fetchSummary, fetchGroupReport, fetchExpiringContracts, fetchEnums } from "../api/contracts";
import { fetchToolSummary, fetchToolScores, fetchToolGroup } from "../api/tools";
import StatusBadge from "../components/StatusBadge";
import DeploymentBadge from "../components/DeploymentBadge";
import ScoreBar from "../components/ScoreBar";

const COLORS = [
  "#4c6ef5", "#7950f2", "#2f9e44", "#e67700", "#c92a2a",
  "#1098ad", "#862e9c", "#5c7cfa", "#f59f00", "#087f5b",
];

const STATUS_COLORS: Record<string, string> = {
  Active: "#2f9e44",
  Evaluation: "#1098ad",
  Deprecated: "#e67700",
  Retired: "#868e96",
};

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(n);
const fmtFull = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const truncate = (s: string, n = 18) => (s.length > n ? s.slice(0, n) + "…" : s);

function SummaryCard({ label, value, sub, color }: { label: string; value: React.ReactNode; sub?: string; color?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="text-sm text-gray-500 mb-1">{label}</div>
      <div className={`text-2xl font-bold ${color || "text-gray-900"}`}>{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-medium text-gray-700 mb-1 max-w-48 truncate">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-gray-600">
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

const TOOL_GROUP_FIELDS = [
  { value: "security_function", label: "Security Function" },
  { value: "security_capability", label: "Security Capability" },
  { value: "vendor", label: "Vendor" },
  { value: "deployment_status", label: "Deployment Status" },
  { value: "owner_name", label: "Owner" },
];

// Section tab switcher
type Tab = "contracts" | "tools";

export default function ReportingPage() {
  const [tab, setTab] = useState<Tab>("contracts");
  const [groupBy, setGroupBy] = useState("security_function");
  const [toolGroupBy, setToolGroupBy] = useState("security_function");
  const [expiringDays, setExpiringDays] = useState(90);

  // Contract data
  const { data: summary } = useQuery({ queryKey: ["summary"], queryFn: fetchSummary });
  const { data: groupData } = useQuery({ queryKey: ["group", groupBy], queryFn: () => fetchGroupReport(groupBy) });
  const { data: expiring } = useQuery({ queryKey: ["expiring", expiringDays], queryFn: () => fetchExpiringContracts(expiringDays) });
  const { data: enums } = useQuery({ queryKey: ["enums"], queryFn: fetchEnums });

  // Tool data
  const { data: toolSummary } = useQuery({ queryKey: ["toolSummary"], queryFn: fetchToolSummary });
  const { data: toolScores } = useQuery({ queryKey: ["toolScores"], queryFn: fetchToolScores });
  const { data: toolGroupData } = useQuery({ queryKey: ["toolGroup", toolGroupBy], queryFn: () => fetchToolGroup(toolGroupBy) });

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reports</h1>

      {/* Tab switcher */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {(["contracts", "tools"] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
              tab === t ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "tools" ? "Security Tools" : "Contracts"}
          </button>
        ))}
      </div>

      {/* ── CONTRACTS TAB ── */}
      {tab === "contracts" && (
        <>
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <SummaryCard label="Active Contracts" value={summary.total_active.toLocaleString()} sub={`${summary.total_inactive} inactive`} color="text-green-700" />
              <SummaryCard label="Annual Spend (USD)" value={fmt(summary.annual_spend_usd)} sub="Active contracts only" color="text-brand-700" />
              <SummaryCard label="Expiring in 90 Days" value={summary.expiring_90_days} sub={`${summary.expiring_30_days} in 30d · ${summary.expiring_60_days} in 60d`} color={summary.expiring_30_days > 0 ? "text-orange-600" : "text-gray-900"} />
              <SummaryCard label="Do Not Renew" value={summary.do_not_renew_count} sub="Flagged contracts" color={summary.do_not_renew_count > 0 ? "text-red-600" : "text-gray-900"} />
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-gray-800">Contract Breakdown</h2>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-500">Group by:</label>
                <select className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={groupBy} onChange={e => setGroupBy(e.target.value)}>
                  {enums?.report_group_fields.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>
            </div>

            {groupData && groupData.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Total Spend (USD)</p>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={groupData.slice(0, 12)} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tickFormatter={v => fmt(v)} tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="group_value" width={140} tick={{ fontSize: 11 }} tickFormatter={s => truncate(String(s))} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="total_usd" name="Total $" radius={[0, 4, 4, 0]}>
                        {groupData.slice(0, 12).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Contract Count</p>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={groupData.slice(0, 12)} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="group_value" width={140} tick={{ fontSize: 11 }} tickFormatter={s => truncate(String(s))} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" name="Contracts" radius={[0, 4, 4, 0]}>
                        {groupData.slice(0, 12).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} opacity={0.7} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {groupData && (
              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">{enums?.report_group_fields.find(f => f.value === groupBy)?.label}</th>
                      <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase">Contracts</th>
                      <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase">Active</th>
                      <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase">Total (USD)</th>
                      <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase">Avg (USD)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {groupData.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="py-2.5 text-gray-800 font-medium">{row.group_value}</td>
                        <td className="py-2.5 text-right text-gray-600">{row.count}</td>
                        <td className="py-2.5 text-right text-green-700">{row.active_count}</td>
                        <td className="py-2.5 text-right text-gray-900 font-medium">{fmtFull(row.total_usd)}</td>
                        <td className="py-2.5 text-right text-gray-500">{fmtFull(row.avg_usd)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Expiring contracts */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-800">Upcoming Renewals</h2>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-500">Expiring in:</label>
                <select className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={expiringDays} onChange={e => setExpiringDays(Number(e.target.value))}>
                  <option value={30}>30 days</option>
                  <option value={60}>60 days</option>
                  <option value={90}>90 days</option>
                  <option value={180}>180 days</option>
                </select>
              </div>
            </div>
            {expiring?.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">No contracts expiring in this window.</p>}
            {expiring && expiring.length > 0 && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">Product</th>
                    <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">Vendor</th>
                    <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">Owner</th>
                    <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase">End Date</th>
                    <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase">Amount (USD)</th>
                    <th className="text-center py-2 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {expiring.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="py-2.5 text-gray-800 font-medium max-w-xs truncate">{c.product_or_service || "—"}</td>
                      <td className="py-2.5 text-gray-600">{c.vendor || "—"}</td>
                      <td className="py-2.5 text-gray-500">{c.owner_name || "—"}</td>
                      <td className="py-2.5 text-right font-medium text-orange-700">{c.end_date}</td>
                      <td className="py-2.5 text-right text-gray-700">{c.contract_amount_usd != null ? fmtFull(c.contract_amount_usd) : "—"}</td>
                      <td className="py-2.5 text-center"><StatusBadge status={c.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* ── TOOLS TAB ── */}
      {tab === "tools" && (
        <>
          {/* Tool summary cards */}
          {toolSummary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <SummaryCard label="Total Tools" value={toolSummary.total} sub={`${toolSummary.by_status.active} active · ${toolSummary.by_status.evaluation} in eval`} />
              <SummaryCard
                label="Avg Effectiveness"
                value={`${toolSummary.avg_effectiveness_score}`}
                sub="out of 100"
                color={toolSummary.avg_effectiveness_score >= 75 ? "text-green-700" : toolSummary.avg_effectiveness_score >= 50 ? "text-yellow-700" : "text-orange-600"}
              />
              <SummaryCard
                label="Avg Coverage"
                value={`${toolSummary.avg_coverage_score}`}
                sub="out of 100"
                color={toolSummary.avg_coverage_score >= 75 ? "text-green-700" : toolSummary.avg_coverage_score >= 50 ? "text-yellow-700" : "text-orange-600"}
              />
              <SummaryCard
                label="Deprecated / Retired"
                value={toolSummary.by_status.deprecated + toolSummary.by_status.retired}
                sub={`${toolSummary.by_status.deprecated} deprecated · ${toolSummary.by_status.retired} retired`}
                color={toolSummary.by_status.deprecated + toolSummary.by_status.retired > 0 ? "text-red-600" : "text-gray-900"}
              />
            </div>
          )}

          {/* Score distributions */}
          {toolSummary && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <h2 className="text-sm font-semibold text-gray-700 mb-4">Effectiveness Score Distribution</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={toolSummary.effectiveness_distribution} margin={{ left: 0, right: 10, top: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Tools" radius={[4, 4, 0, 0]}>
                      {toolSummary.effectiveness_distribution.map((entry, i) => {
                        const colors = ["#fa5252", "#fd7e14", "#fab005", "#2f9e44"];
                        return <Cell key={i} fill={colors[i]} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <h2 className="text-sm font-semibold text-gray-700 mb-4">Coverage Score Distribution</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={toolSummary.coverage_distribution} margin={{ left: 0, right: 10, top: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Tools" radius={[4, 4, 0, 0]}>
                      {toolSummary.coverage_distribution.map((entry, i) => {
                        const colors = ["#fa5252", "#fd7e14", "#fab005", "#2f9e44"];
                        return <Cell key={i} fill={colors[i]} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ── Effectiveness vs Coverage correlation chart ── */}
          {toolScores && toolScores.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-gray-900">Effectiveness vs. Coverage Correlation</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Effectiveness (x-axis) measures how well a tool performs its function. Coverage (y-axis) measures the breadth of environment it protects. Ideal tools land in the top-right quadrant.
                </p>
              </div>

              {/* Quadrant legend */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
                {[
                  { label: "High Effectiveness · High Coverage", desc: "Top performers — maintain & scale", color: "bg-green-50 border-green-200 text-green-700" },
                  { label: "Low Effectiveness · High Coverage", desc: "Wide reach but underperforming — tune or replace", color: "bg-yellow-50 border-yellow-200 text-yellow-700" },
                  { label: "High Effectiveness · Low Coverage", desc: "Performing well but limited scope — expand", color: "bg-blue-50 border-blue-200 text-blue-700" },
                  { label: "Low Effectiveness · Low Coverage", desc: "Weak tools — review for removal", color: "bg-red-50 border-red-200 text-red-700" },
                ].map(q => (
                  <div key={q.label} className={`border rounded-lg px-3 py-2 ${q.color}`}>
                    <div className="text-xs font-semibold">{q.label}</div>
                    <div className="text-xs opacity-80 mt-0.5">{q.desc}</div>
                  </div>
                ))}
              </div>

              <div className="relative">
                <ResponsiveContainer width="100%" height={460}>
                  <ScatterChart margin={{ left: 20, right: 40, top: 20, bottom: 40 }}>
                    {/* Quadrant background regions rendered as reference areas */}
                    <defs>
                      <pattern id="q-tr" patternUnits="userSpaceOnUse" width="8" height="8">
                        <rect width="8" height="8" fill="#f0fdf4" />
                      </pattern>
                      <pattern id="q-tl" patternUnits="userSpaceOnUse" width="8" height="8">
                        <rect width="8" height="8" fill="#fefce8" />
                      </pattern>
                      <pattern id="q-br" patternUnits="userSpaceOnUse" width="8" height="8">
                        <rect width="8" height="8" fill="#eff6ff" />
                      </pattern>
                      <pattern id="q-bl" patternUnits="userSpaceOnUse" width="8" height="8">
                        <rect width="8" height="8" fill="#fff1f2" />
                      </pattern>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" stroke="#e5e7eb" />
                    <XAxis
                      type="number"
                      dataKey="effectiveness_score"
                      name="Effectiveness"
                      domain={[0, 100]}
                      ticks={[0, 25, 50, 75, 100]}
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      label={{ value: "← Lower Effectiveness   Effectiveness Score   Higher Effectiveness →", position: "insideBottom", offset: -28, fontSize: 12, fill: "#6b7280" }}
                    />
                    <YAxis
                      type="number"
                      dataKey="coverage_score"
                      name="Coverage"
                      domain={[0, 100]}
                      ticks={[0, 25, 50, 75, 100]}
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      label={{ value: "Coverage Score", angle: -90, position: "insideLeft", offset: -5, fontSize: 12, fill: "#6b7280" }}
                    />
                    <ZAxis range={[80, 80]} />
                    <Tooltip
                      cursor={{ stroke: "#d1d5db", strokeDasharray: "4 4" }}
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload;
                        const eff = d.effectiveness_score;
                        const cov = d.coverage_score;
                        const quadrant =
                          eff >= 50 && cov >= 50 ? { label: "Top Performer", color: "text-green-700" }
                          : eff < 50 && cov >= 50 ? { label: "Wide but Weak", color: "text-yellow-700" }
                          : eff >= 50 && cov < 50 ? { label: "Effective but Narrow", color: "text-blue-700" }
                          : { label: "Needs Review", color: "text-red-600" };
                        return (
                          <div className="bg-white border border-gray-200 rounded-xl shadow-xl p-4 text-sm w-52">
                            <p className="font-bold text-gray-900 truncate">{d.name}</p>
                            <p className="text-gray-400 text-xs mb-2">{d.vendor}</p>
                            <div className="space-y-1.5">
                              <div className="flex justify-between">
                                <span className="text-gray-500">Effectiveness</span>
                                <span className="font-semibold text-gray-800">{eff}/100</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Coverage</span>
                                <span className="font-semibold text-gray-800">{cov}/100</span>
                              </div>
                              <div className="flex justify-between items-center pt-1 border-t border-gray-100">
                                <span className="text-gray-500">Quadrant</span>
                                <span className={`text-xs font-semibold ${quadrant.color}`}>{quadrant.label}</span>
                              </div>
                            </div>
                            <div className="mt-2">
                              <DeploymentBadge status={d.deployment_status} />
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Scatter
                      data={toolScores}
                      shape={(props: { cx?: number; cy?: number; payload?: { deployment_status?: string; effectiveness_score?: number; coverage_score?: number } }) => {
                        const { cx = 0, cy = 0, payload } = props;
                        const eff = payload?.effectiveness_score ?? 0;
                        const cov = payload?.coverage_score ?? 0;
                        // Color by quadrant position, with status influencing opacity
                        let fill =
                          eff >= 50 && cov >= 50 ? "#2f9e44"   // top-right: green
                          : eff < 50 && cov >= 50 ? "#e67700"   // top-left: orange
                          : eff >= 50 && cov < 50 ? "#1c7ed6"   // bottom-right: blue
                          : "#f03e3e";                           // bottom-left: red
                        const isRetiredOrDeprecated = payload?.deployment_status === "Retired" || payload?.deployment_status === "Deprecated";
                        return (
                          <g>
                            <circle cx={cx} cy={cy} r={isRetiredOrDeprecated ? 6 : 9} fill={fill} opacity={isRetiredOrDeprecated ? 0.35 : 0.82} stroke="white" strokeWidth={2} />
                            {isRetiredOrDeprecated && (
                              <circle cx={cx} cy={cy} r={9} fill="none" stroke={fill} strokeWidth={1} opacity={0.4} strokeDasharray="3 2" />
                            )}
                          </g>
                        );
                      }}
                    />
                  </ScatterChart>
                </ResponsiveContainer>

                {/* Midpoint reference line labels — positioned as overlay */}
                <div className="absolute inset-0 pointer-events-none" style={{ left: 44, right: 40, top: 20, bottom: 40 }}>
                  <div className="absolute text-xs font-semibold text-green-600 opacity-40" style={{ right: "4%", top: "4%" }}>HIGH / HIGH</div>
                  <div className="absolute text-xs font-semibold text-yellow-600 opacity-40" style={{ left: "2%", top: "4%" }}>LOW / HIGH</div>
                  <div className="absolute text-xs font-semibold text-blue-600 opacity-40" style={{ right: "4%", bottom: "6%" }}>HIGH / LOW</div>
                  <div className="absolute text-xs font-semibold text-red-500 opacity-40" style={{ left: "2%", bottom: "6%" }}>LOW / LOW</div>
                </div>
              </div>

              {/* Legend row */}
              <div className="flex flex-wrap gap-5 mt-4 justify-center text-xs text-gray-500">
                <div className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded-full inline-block bg-green-600 opacity-80" /> High Effectiveness + High Coverage</div>
                <div className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded-full inline-block bg-blue-600 opacity-80" /> High Effectiveness + Low Coverage</div>
                <div className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded-full inline-block bg-orange-500 opacity-80" /> Low Effectiveness + High Coverage</div>
                <div className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded-full inline-block bg-red-500 opacity-80" /> Low Effectiveness + Low Coverage</div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-3.5 h-3.5 rounded-full border border-gray-400 opacity-50" style={{ borderStyle: "dashed" }} />
                  Deprecated / Retired (faded)
                </div>
              </div>
            </div>
          )}

          {/* Tool group breakdown */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-gray-800">Tool Breakdown</h2>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-500">Group by:</label>
                <select className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={toolGroupBy} onChange={e => setToolGroupBy(e.target.value)}>
                  {TOOL_GROUP_FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>
            </div>

            {toolGroupData && toolGroupData.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Avg Effectiveness Score</p>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={toolGroupData} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="group_value" width={150} tick={{ fontSize: 11 }} tickFormatter={s => truncate(String(s))} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="avg_effectiveness" name="Avg Effectiveness" radius={[0, 4, 4, 0]}>
                        {toolGroupData.map((row, i) => {
                          const c = row.avg_effectiveness >= 75 ? "#2f9e44" : row.avg_effectiveness >= 50 ? "#fab005" : "#fa5252";
                          return <Cell key={i} fill={c} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Avg Coverage Score</p>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={toolGroupData} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="group_value" width={150} tick={{ fontSize: 11 }} tickFormatter={s => truncate(String(s))} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="avg_coverage" name="Avg Coverage" radius={[0, 4, 4, 0]}>
                        {toolGroupData.map((row, i) => {
                          const c = row.avg_coverage >= 75 ? "#1098ad" : row.avg_coverage >= 50 ? "#7950f2" : "#e67700";
                          return <Cell key={i} fill={c} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {toolGroupData && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">{TOOL_GROUP_FIELDS.find(f => f.value === toolGroupBy)?.label}</th>
                      <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase">Tools</th>
                      <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase w-48">Avg Effectiveness</th>
                      <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase w-48">Avg Coverage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {toolGroupData.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="py-3 text-gray-800 font-medium">{row.group_value}</td>
                        <td className="py-3 text-right text-gray-600">{row.count}</td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center justify-end gap-3">
                            <span className="text-sm font-medium w-8 text-right">{row.avg_effectiveness}</span>
                            <div className="w-24">
                              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-2 rounded-full ${row.avg_effectiveness >= 75 ? "bg-green-500" : row.avg_effectiveness >= 50 ? "bg-yellow-400" : "bg-red-400"}`}
                                  style={{ width: `${row.avg_effectiveness}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center justify-end gap-3">
                            <span className="text-sm font-medium w-8 text-right">{row.avg_coverage}</span>
                            <div className="w-24">
                              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-2 rounded-full ${row.avg_coverage >= 75 ? "bg-blue-500" : row.avg_coverage >= 50 ? "bg-purple-400" : "bg-orange-400"}`}
                                  style={{ width: `${row.avg_coverage}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Per-tool score table */}
          {toolScores && toolScores.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h2 className="text-base font-semibold text-gray-800 mb-4">All Tool Scores</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">Tool</th>
                      <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">Function</th>
                      <th className="text-center py-2 text-xs font-semibold text-gray-500 uppercase">Status</th>
                      <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase w-44">Effectiveness</th>
                      <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase w-44">Coverage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {toolScores.map(t => (
                      <tr key={t.id} className="hover:bg-gray-50">
                        <td className="py-2.5">
                          <div className="font-medium text-gray-900">{t.name}</div>
                          <div className="text-xs text-gray-400">{t.vendor}</div>
                        </td>
                        <td className="py-2.5 text-gray-600 text-xs">{t.security_function || "—"}</td>
                        <td className="py-2.5 text-center"><DeploymentBadge status={t.deployment_status} /></td>
                        <td className="py-2.5 pr-4"><ScoreBar score={t.effectiveness_score} size="sm" /></td>
                        <td className="py-2.5 pr-4"><ScoreBar score={t.coverage_score} size="sm" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
