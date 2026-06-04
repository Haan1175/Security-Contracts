import { useNavigate, useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Pencil, Archive, RotateCcw } from "lucide-react";
import { fetchTool, archiveTool, unarchiveTool } from "../api/tools";
import DeploymentBadge from "../components/DeploymentBadge";
import ScoreBar from "../components/ScoreBar";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <span className="w-52 shrink-0 text-sm text-gray-500">{label}</span>
      <span className="text-sm text-gray-900 font-medium">{value ?? <span className="text-gray-300">—</span>}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">{title}</h2>
      <div className="space-y-2.5">{children}</div>
    </section>
  );
}

function fmt(v: number | null | undefined, prefix = ""): string | null {
  if (v == null) return null;
  return prefix + v.toLocaleString();
}

export default function ToolDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: tool, isLoading } = useQuery({
    queryKey: ["tool", id],
    queryFn: () => fetchTool(Number(id)),
  });

  const archiveMut = useMutation({
    mutationFn: (tid: number) => archiveTool(tid),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tools"] }); navigate("/tools"); },
  });

  const unarchiveMut = useMutation({
    mutationFn: (tid: number) => unarchiveTool(tid),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tools"] }); qc.invalidateQueries({ queryKey: ["tool", id] }); },
  });

  if (isLoading) return <div className="p-8 text-gray-400">Loading…</div>;
  if (!tool) return <div className="p-8 text-red-500">Tool not found</div>;

  const daysRemaining = tool.end_date
    ? Math.ceil((new Date(tool.end_date).getTime() - Date.now()) / 86400000)
    : null;
  const contractDuration = tool.start_date && tool.end_date
    ? Math.ceil((new Date(tool.end_date).getTime() - new Date(tool.start_date).getTime()) / 86400000)
    : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{tool.name || "Untitled Tool"}</h1>
            <p className="text-sm text-gray-400">{tool.vendor}{tool.version ? ` · v${tool.version}` : ""}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DeploymentBadge status={tool.deployment_status} />
          <Link
            to={`/tools/${tool.id}/edit`}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
          >
            <Pencil size={14} /> Edit
          </Link>
          {tool.archived ? (
            <button
              onClick={() => unarchiveMut.mutate(tool.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
            >
              <RotateCcw size={14} /> Restore
            </button>
          ) : (
            <button
              onClick={() => { if (confirm("Archive this tool?")) archiveMut.mutate(tool.id); }}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 rounded-lg text-sm text-red-600 hover:bg-red-50"
            >
              <Archive size={14} /> Archive
            </button>
          )}
        </div>
      </div>

      {tool.archived && (
        <div className="mb-4 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
          This tool is archived.
        </div>
      )}

      {/* Score cards */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {(["score", "coverage_score", "effectiveness_score"] as const).map((key, i) => {
          const labels = ["Score (1-5)", "Coverage (1-5)", "Effectiveness (1-5)"];
          return (
            <div key={key} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">{labels[i]}</p>
              <div className="text-3xl font-bold text-gray-900 mb-3">
                {tool[key] ?? "—"}
                {tool[key] != null && <span className="text-lg font-normal text-gray-400">/5</span>}
              </div>
              <ScoreBar score={tool[key]} max={5} />
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Section title="Identity">
          <Row label="Product" value={tool.name} />
          <Row label="Vendor" value={tool.vendor} />
          <Row label="Version" value={tool.version} />
          <Row label="UCF Domain" value={tool.ucf_domain} />
          <Row label="Process/Solution" value={tool.process_solution} />
          <Row label="Component" value={tool.component} />
          <Row label="Primary Use" value={<span className="whitespace-pre-wrap">{tool.primary_use}</span>} />
        </Section>

        <Section title="Classification">
          <Row label="Security Function" value={tool.security_function} />
          <Row label="Function Alignment NIST CSF 2.0" value={tool.nist_csf_alignment} />
          <Row label="Capability" value={tool.security_capability} />
          <Row label="Functional Area" value={tool.functional_area} />
          <Row label="Disposition" value={<DeploymentBadge status={tool.deployment_status} />} />
          <Row label="License Type" value={tool.license_type} />
          <Row label="Seat Count" value={tool.seat_count?.toLocaleString()} />
        </Section>

        <Section title="Contract & Vendor">
          <Row label="Support Contact" value={tool.support_contact} />
          <Row label="Support Contact Email" value={tool.support_contact_email ? <a href={`mailto:${tool.support_contact_email}`} className="text-brand-600 underline">{tool.support_contact_email}</a> : null} />
          <Row label="Start Date" value={tool.start_date} />
          <Row label="End Date" value={tool.end_date} />
          <Row label="Contract Duration" value={contractDuration != null ? `${contractDuration} days` : null} />
          <Row label="Days Remaining" value={daysRemaining != null ? (
            <span className={daysRemaining <= 90 ? "text-red-600 font-semibold" : ""}>{daysRemaining} days{daysRemaining <= 90 ? " ⚠" : ""}</span>
          ) : null} />
          <Row label="Renewal Period" value={tool.renewal_period} />
          <Row label="Contract Cost (USD)" value={fmt(tool.contract_cost_usd, "$")} />
          <Row label="Annual Cost" value={fmt(tool.annual_cost, "$")} />
          <Row label="Auto-renewal (Y/N)" value={tool.auto_renewal ? "Yes" : "No"} />
          {tool.auto_renewal && <Row label="Auto-renewal Notification Term" value={tool.auto_renewal_notification_term != null ? `${tool.auto_renewal_notification_term} days` : null} />}
        </Section>

        <Section title="Ownership">
          <Row label="Budget Owner" value={tool.budget_owner} />
          <Row label="Internal Contact" value={tool.owner_name} />
          <Row label="Internal Contact email" value={tool.owner_email ? <a href={`mailto:${tool.owner_email}`} className="text-brand-600 underline">{tool.owner_email}</a> : null} />
          <Row label="Cost Center" value={tool.cost_center} />
        </Section>

        <Section title="Assessment">
          <Row label="Supported by SA&E" value={tool.supported_by_sae ? "Yes" : "No"} />
          <Row label="Annual Vendor Review Reqd?" value={tool.annual_vendor_review_reqd ? "Yes" : "No"} />
          <Row label="Last Annual Review" value={tool.last_assessed_date} />
          <Row label="Next Review Date" value={tool.next_review_date} />
          <Row label="Email Sent" value={tool.email_sent} />
          <Row label="Last Updated" value={tool.updated_at ? new Date(tool.updated_at).toLocaleDateString() : null} />
          <Row label="Expiring in 90 days?" value={daysRemaining != null && daysRemaining <= 90 ? "Yes" : daysRemaining != null ? "No" : null} />
        </Section>

        <Section title="Notes & Roadmap">
          <Row label="Notes" value={<span className="whitespace-pre-wrap">{tool.notes}</span>} />
          <Row label="Notes2" value={<span className="whitespace-pre-wrap">{tool.notes2}</span>} />
          <Row label="Roadmap Notes" value={<span className="whitespace-pre-wrap">{tool.roadmap_notes}</span>} />
        </Section>
      </div>
    </div>
  );
}
