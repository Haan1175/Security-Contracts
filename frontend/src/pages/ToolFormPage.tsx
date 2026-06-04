import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save } from "lucide-react";
import { fetchTool, createTool, updateTool } from "../api/tools";
import { fetchEnums } from "../api/contracts";
import type { SecurityTool } from "../types";

const DISPOSITION_OPTIONS = ["Active", "Evaluation", "Deprecated", "Retired"];
const LICENSE_TYPES = ["Perpetual", "Subscription", "SaaS", "Open Source", "Enterprise License", "Per-Seat"];

export default function ToolFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id && id !== "new");
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: enums } = useQuery({ queryKey: ["enums"], queryFn: fetchEnums });
  const { data: existing } = useQuery({
    queryKey: ["tool", id],
    queryFn: () => fetchTool(Number(id)),
    enabled: isEdit,
  });

  const [form, setForm] = useState<Partial<SecurityTool>>({ deployment_status: "Active" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => { if (existing) setForm(existing); }, [existing]);

  const saveMut = useMutation({
    mutationFn: (data: Partial<SecurityTool>) =>
      isEdit ? updateTool(Number(id), data) : createTool(data),
    onSuccess: (saved) => {
      qc.invalidateQueries({ queryKey: ["tools"] });
      navigate(`/tools/${saved.id}`);
    },
  });

  const set = (key: keyof SecurityTool, value: unknown) => {
    setForm(f => ({ ...f, [key]: value }));
    setErrors(e => { const n = { ...e }; delete n[key]; return n; });
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name?.trim()) errs.name = "Required";
    for (const f of ["score", "effectiveness_score", "coverage_score"] as const) {
      const v = form[f];
      if (v != null && (v < 1 || v > 5)) errs[f] = "Must be 1–5";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) saveMut.mutate(form);
  };

  const inp = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";

  const Field = ({ label, name, required, children }: { label: string; name: string; required?: boolean; children: React.ReactNode }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {errors[name] && <p className="text-xs text-red-500 mt-0.5">{errors[name]}</p>}
    </div>
  );

  const ScoreInput = ({ fieldKey, label }: { fieldKey: "score" | "effectiveness_score" | "coverage_score"; label: string }) => {
    const val = form[fieldKey];
    const pct = val != null ? (val / 5) * 100 : null;
    const barColor = pct == null ? "" : pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-yellow-400" : pct >= 40 ? "bg-orange-400" : "bg-red-500";
    return (
      <Field label={label} name={fieldKey}>
        <div className="space-y-2">
          <input
            type="number" min={1} max={5} step={1}
            className={`${inp} ${errors[fieldKey] ? "border-red-400" : ""}`}
            value={val ?? ""}
            onChange={e => set(fieldKey, e.target.value !== "" ? Number(e.target.value) : null)}
          />
          {val != null && (
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-2 rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
            </div>
          )}
        </div>
      </Field>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{isEdit ? "Edit Tool" : "New Security Tool"}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Identity */}
        <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Identity</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Product" name="name" required>
              <input className={`${inp} ${errors.name ? "border-red-400" : ""}`} value={form.name || ""} onChange={e => set("name", e.target.value)} />
            </Field>
            <Field label="Vendor" name="vendor">
              <input className={inp} value={form.vendor || ""} onChange={e => set("vendor", e.target.value)} />
            </Field>
            <Field label="UCF Domain" name="ucf_domain">
              <input className={inp} value={form.ucf_domain || ""} onChange={e => set("ucf_domain", e.target.value)} />
            </Field>
            <Field label="Process/Solution" name="process_solution">
              <input className={inp} value={form.process_solution || ""} onChange={e => set("process_solution", e.target.value)} />
            </Field>
            <Field label="Component" name="component">
              <input className={inp} value={form.component || ""} onChange={e => set("component", e.target.value)} />
            </Field>
            <Field label="Version" name="version">
              <input className={inp} value={form.version || ""} onChange={e => set("version", e.target.value)} placeholder="e.g. 4.2.1" />
            </Field>
            <div className="col-span-2">
              <Field label="Primary Use" name="primary_use">
                <textarea className={`${inp} h-16 resize-none`} value={form.primary_use || ""} onChange={e => set("primary_use", e.target.value)} />
              </Field>
            </div>
          </div>
        </section>

        {/* Classification */}
        <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Classification</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Security Function" name="security_function">
              <select className={inp} value={form.security_function || ""} onChange={e => set("security_function", e.target.value || null)}>
                <option value="">— Select —</option>
                {enums?.security_functions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Function Alignment NIST CSF 2.0" name="nist_csf_alignment">
              <input className={inp} value={form.nist_csf_alignment || ""} onChange={e => set("nist_csf_alignment", e.target.value)} />
            </Field>
            <Field label="Capability" name="security_capability">
              <select className={inp} value={form.security_capability || ""} onChange={e => set("security_capability", e.target.value || null)}>
                <option value="">— Select —</option>
                {enums?.security_capabilities.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Functional Area" name="functional_area">
              <input className={inp} value={form.functional_area || ""} onChange={e => set("functional_area", e.target.value)} />
            </Field>
            <Field label="Disposition" name="deployment_status">
              <select className={inp} value={form.deployment_status || "Active"} onChange={e => set("deployment_status", e.target.value)}>
                {DISPOSITION_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="License Type" name="license_type">
              <select className={inp} value={form.license_type || ""} onChange={e => set("license_type", e.target.value || null)}>
                <option value="">— Select —</option>
                {LICENSE_TYPES.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </Field>
          </div>
        </section>

        {/* Contract & Vendor */}
        <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Contract & Vendor</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Support Contact" name="support_contact">
              <input className={inp} value={form.support_contact || ""} onChange={e => set("support_contact", e.target.value)} />
            </Field>
            <Field label="Support Contact Email" name="support_contact_email">
              <input type="email" className={inp} value={form.support_contact_email || ""} onChange={e => set("support_contact_email", e.target.value)} />
            </Field>
            <Field label="Start Date" name="start_date">
              <input type="date" className={inp} value={form.start_date || ""} onChange={e => set("start_date", e.target.value || null)} />
            </Field>
            <Field label="End Date" name="end_date">
              <input type="date" className={inp} value={form.end_date || ""} onChange={e => set("end_date", e.target.value || null)} />
            </Field>
            <Field label="Renewal Period" name="renewal_period">
              <input className={inp} value={form.renewal_period || ""} onChange={e => set("renewal_period", e.target.value)} placeholder="e.g. Annual" />
            </Field>
            <Field label="Contract Cost (USD)" name="contract_cost_usd">
              <input type="number" min={0} step={0.01} className={inp} value={form.contract_cost_usd ?? ""} onChange={e => set("contract_cost_usd", e.target.value ? Number(e.target.value) : null)} />
            </Field>
            <Field label="Annual Cost" name="annual_cost">
              <input type="number" min={0} step={0.01} className={inp} value={form.annual_cost ?? ""} onChange={e => set("annual_cost", e.target.value ? Number(e.target.value) : null)} />
            </Field>
            <div className="flex flex-col gap-3">
              <Field label="Auto-renewal (Y/N)" name="auto_renewal">
                <select className={inp} value={form.auto_renewal ? "yes" : "no"} onChange={e => set("auto_renewal", e.target.value === "yes")}>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </Field>
              {form.auto_renewal && (
                <Field label="Auto-renewal Notification Term (Days)" name="auto_renewal_notification_term">
                  <input type="number" min={0} className={inp} value={form.auto_renewal_notification_term ?? ""} onChange={e => set("auto_renewal_notification_term", e.target.value ? Number(e.target.value) : null)} />
                </Field>
              )}
            </div>
          </div>
        </section>

        {/* Ownership */}
        <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Ownership</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Budget Owner" name="budget_owner">
              <input className={inp} value={form.budget_owner || ""} onChange={e => set("budget_owner", e.target.value)} />
            </Field>
            <Field label="Cost Center" name="cost_center">
              <input type="number" className={inp} value={form.cost_center ?? ""} onChange={e => set("cost_center", e.target.value ? Number(e.target.value) : null)} />
            </Field>
            <Field label="Internal Contact" name="owner_name">
              <input className={inp} value={form.owner_name || ""} onChange={e => set("owner_name", e.target.value)} />
            </Field>
            <Field label="Internal Contact Email" name="owner_email">
              <input type="email" className={inp} value={form.owner_email || ""} onChange={e => set("owner_email", e.target.value)} />
            </Field>
            <Field label="Seat Count" name="seat_count">
              <input type="number" className={inp} value={form.seat_count ?? ""} onChange={e => set("seat_count", e.target.value ? Number(e.target.value) : null)} />
            </Field>
          </div>
        </section>

        {/* Scores */}
        <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Scores</h2>
          <p className="text-xs text-gray-400 mb-4">Enter a value from 1 to 5</p>
          <div className="grid grid-cols-3 gap-6">
            <ScoreInput fieldKey="score" label="Score (1-5)" />
            <ScoreInput fieldKey="coverage_score" label="Coverage (1-5)" />
            <ScoreInput fieldKey="effectiveness_score" label="Effectiveness (1-5)" />
          </div>
        </section>

        {/* Assessment */}
        <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Assessment</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Last Annual Review" name="last_assessed_date">
              <input type="date" className={inp} value={form.last_assessed_date || ""} onChange={e => set("last_assessed_date", e.target.value || null)} />
            </Field>
            <Field label="Next Review Date" name="next_review_date">
              <input type="date" className={inp} value={form.next_review_date || ""} onChange={e => set("next_review_date", e.target.value || null)} />
            </Field>
            <Field label="Email Sent" name="email_sent">
              <input type="date" className={inp} value={form.email_sent || ""} onChange={e => set("email_sent", e.target.value || null)} />
            </Field>
            <div className="flex flex-col gap-3">
              <Field label="Supported by SA&E" name="supported_by_sae">
                <select className={inp} value={form.supported_by_sae ? "yes" : "no"} onChange={e => set("supported_by_sae", e.target.value === "yes")}>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </Field>
              <Field label="Annual Vendor Review Reqd?" name="annual_vendor_review_reqd">
                <select className={inp} value={form.annual_vendor_review_reqd ? "yes" : "no"} onChange={e => set("annual_vendor_review_reqd", e.target.value === "yes")}>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </Field>
            </div>
          </div>
        </section>

        {/* Notes & Roadmap */}
        <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Notes & Roadmap</h2>
          <div className="space-y-4">
            <Field label="Notes" name="notes">
              <textarea className={`${inp} h-16 resize-none`} value={form.notes || ""} onChange={e => set("notes", e.target.value || null)} />
            </Field>
            <Field label="Notes2" name="notes2">
              <textarea className={`${inp} h-16 resize-none`} value={form.notes2 || ""} onChange={e => set("notes2", e.target.value || null)} />
            </Field>
            <Field label="Roadmap Notes" name="roadmap_notes">
              <textarea className={`${inp} h-16 resize-none`} value={form.roadmap_notes || ""} onChange={e => set("roadmap_notes", e.target.value || null)} />
            </Field>
          </div>
        </section>

        <div className="flex gap-3 justify-end">
          <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit" disabled={saveMut.isPending}
            className="flex items-center gap-1.5 px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium disabled:opacity-60">
            <Save size={15} /> {saveMut.isPending ? "Saving…" : "Save Tool"}
          </button>
        </div>
        {saveMut.isError && <p className="text-sm text-red-500 text-right">Failed to save. Please try again.</p>}
      </form>
    </div>
  );
}
