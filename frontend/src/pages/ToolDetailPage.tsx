import { useNavigate, useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Pencil, Archive, RotateCcw } from "lucide-react";
import { fetchTool, archiveTool, unarchiveTool } from "../api/tools";
import DeploymentBadge from "../components/DeploymentBadge";
import ScoreBar from "../components/ScoreBar";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <span className="w-48 shrink-0 text-sm text-gray-500">{label}</span>
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
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Effectiveness Score</p>
          <div className="text-3xl font-bold text-gray-900 mb-3">
            {tool.effectiveness_score ?? "—"}
            {tool.effectiveness_score != null && <span className="text-lg font-normal text-gray-400">/100</span>}
          </div>
          <ScoreBar score={tool.effectiveness_score} />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Coverage Score</p>
          <div className="text-3xl font-bold text-gray-900 mb-3">
            {tool.coverage_score ?? "—"}
            {tool.coverage_score != null && <span className="text-lg font-normal text-gray-400">/100</span>}
          </div>
          <ScoreBar score={tool.coverage_score} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Section title="Identity">
          <Row label="Tool Name" value={tool.name} />
          <Row label="Description" value={<span className="whitespace-pre-wrap">{tool.description}</span>} />
          <Row label="Version" value={tool.version} />
          <Row label="License Type" value={tool.license_type} />
          <Row label="Seat Count" value={tool.seat_count?.toLocaleString()} />
        </Section>

        <Section title="Vendor & Owner">
          <Row label="Vendor" value={tool.vendor} />
          <Row label="Owner" value={tool.owner_name} />
          <Row label="Owner Email" value={tool.owner_email ? <a href={`mailto:${tool.owner_email}`} className="text-brand-600 underline">{tool.owner_email}</a> : null} />
          <Row label="Cost Center" value={tool.cost_center} />
        </Section>

        <Section title="Classification">
          <Row label="Security Function" value={tool.security_function} />
          <Row label="Security Capability" value={tool.security_capability} />
          <Row label="Deployment Status" value={<DeploymentBadge status={tool.deployment_status} />} />
        </Section>

        <Section title="Assessment">
          <Row label="Last Assessed" value={tool.last_assessed_date} />
          <Row label="Next Review" value={tool.next_review_date} />
          <Row label="Notes" value={<span className="whitespace-pre-wrap">{tool.notes}</span>} />
        </Section>
      </div>
    </div>
  );
}
