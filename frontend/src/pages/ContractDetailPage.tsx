import { useNavigate, useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Pencil, Archive, RotateCcw } from "lucide-react";
import { fetchContract, archiveContract, unarchiveContract } from "../api/contracts";
import StatusBadge from "../components/StatusBadge";
import CurrencyDisplay from "../components/CurrencyDisplay";

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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["contracts"] }); qc.invalidateQueries({ queryKey: ["contract", id] }); },
  });

  if (isLoading) return <div className="p-8 text-gray-400">Loading…</div>;
  if (!contract) return <div className="p-8 text-red-500">Contract not found</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{contract.product_or_service || "Untitled Contract"}</h1>
            <p className="text-sm text-gray-400">{contract.po_number || "No PO number"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={contract.status} />
          <Link
            to={`/contracts/${contract.id}/edit`}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
          >
            <Pencil size={14} /> Edit
          </Link>
          {contract.archived ? (
            <button
              onClick={() => unarchiveMut.mutate(contract.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
            >
              <RotateCcw size={14} /> Restore
            </button>
          ) : (
            <button
              onClick={() => { if (confirm("Archive this contract?")) archiveMut.mutate(contract.id); }}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 rounded-lg text-sm text-red-600 hover:bg-red-50"
            >
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

      <div className="grid grid-cols-1 gap-4">
        <Section title="Identity">
          <Row label="Product / Service" value={contract.product_or_service} />
          <Row label="Scope" value={<span className="whitespace-pre-wrap">{contract.scope}</span>} />
          <Row label="Anaplan ID" value={contract.anaplan_id} />
        </Section>

        <Section title="Vendor & Owner">
          <Row label="Vendor" value={contract.vendor} />
          <Row label="Cost Center" value={contract.cost_center} />
          <Row label="Owner" value={contract.owner_name} />
          <Row label="Owner Email" value={contract.owner_email ? <a href={`mailto:${contract.owner_email}`} className="text-brand-600 underline">{contract.owner_email}</a> : null} />
        </Section>

        <Section title="Classification">
          <Row label="Security Function" value={contract.security_function} />
          <Row label="Security Capability" value={contract.security_capability} />
          <Row label="Risk Assessment" value={contract.risk_assessment} />
        </Section>

        <Section title="Financials">
          <Row label="Contract Amount" value={
            <CurrencyDisplay amount={contract.contract_amount} currency={contract.currency} amountUsd={contract.contract_amount_usd} />
          } />
          <Row label="Payment Term" value={contract.payment_term} />
          <Row label="Payment Scheme" value={contract.payment_scheme} />
          <Row label="Recurring" value={contract.recurring} />
          <Row label="NDA" value={contract.nda ? "Yes" : "No"} />
          <Row label="Amortize" value={contract.amortize ? "Yes" : "No"} />
        </Section>

        <Section title="Lifecycle">
          <Row label="Start Date" value={contract.start_date} />
          <Row label="End Date" value={contract.end_date} />
          <Row label="Auto Renewal" value={contract.auto_renewal ? "Yes" : "No"} />
          <Row label="Notification Term" value={contract.notification_term_days ? `${contract.notification_term_days} days` : null} />
          <Row label="Do Not Renew" value={contract.do_not_renew} />
          <Row label="Renewed" value={contract.renewed} />
        </Section>
      </div>
    </div>
  );
}
