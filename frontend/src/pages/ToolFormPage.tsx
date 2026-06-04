import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save } from "lucide-react";
import { fetchTool, createTool, updateTool } from "../api/tools";
import { fetchEnums } from "../api/contracts";
import type { SecurityTool } from "../types";

const DEPLOYMENT_STATUSES = ["Active", "Evaluation", "Deprecated", "Retired"];
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
    if (form.effectiveness_score != null && (form.effectiveness_score < 0 || form.effectiveness_score > 100))
      errs.effectiveness_score = "Must be 0–100";
    if (form.coverage_score != null && (form.coverage_score < 0 || form.coverage_score > 100))
      errs.coverage_score = "Must be 0–100";
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
            <Field label="Tool Name" name="name" required>
              <input className={`${inp} ${errors.name ? "border-red-400" : ""}`} value={form.name || ""} onChange={e => set("name", e.target.value)} />
            </Field>
            <Field label="Version" name="version">
              <input className={inp} value={form.version || ""} onChange={e => set("version", e.target.value)} placeholder="e.g. 4.2.1" />
            </Field>
            <div className="col-span-2">
              <Field label="Description" name="description">
                <textarea className={`${inp} h-20 resize-none`} value={form.description || ""} onChange={e => set("description", e.target.value)} />
              </Field>
            </div>
            <Field label="License Type" name="license_type">
              <select className={inp} value={form.license_type || ""} onChange={e => set("license_type", e.target.value || null)}>
                <option value="">— Select —</option>
                {LICENSE_TYPES.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </Field>
            <Field label="Seat Count" name="seat_count">
              <input type="number" className={inp} value={form.seat_count ?? ""} onChange={e => set("seat_count", e.target.value ? Number(e.target.value) : null)} />
            </Field>
          </div>
        </section>

        {/* Vendor & Owner */}
        <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Vendor & Owner</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Vendor" name="vendor">
              <input className={inp} value={form.vendor || ""} onChange={e => set("vendor", e.target.value)} />
            </Field>
            <Field label="Cost Center" name="cost_center">
              <input type="number" className={inp} value={form.cost_center ?? ""} onChange={e => set("cost_center", e.target.value ? Number(e.target.value) : null)} />
            </Field>
            <Field label="Owner Name" name="owner_name">
              <input className={inp} value={form.owner_name || ""} onChange={e => set("owner_name", e.target.value)} />
            </Field>
            <Field label="Owner Email" name="owner_email">
              <input type="email" className={inp} value={form.owner_email || ""} onChange={e => set("owner_email", e.target.value)} />
            </Field>
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
            <Field label="Security Capability" name="security_capability">
              <select className={inp} value={form.security_capability || ""} onChange={e => set("security_capability", e.target.value || null)}>
                <option value="">— Select —</option>
                {enums?.security_capabilities.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Deployment Status" name="deployment_status">
              <select className={inp} value={form.deployment_status || "Active"} onChange={e => set("deployment_status", e.target.value)}>
                {DEPLOYMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>
        </section>

        {/* Scores */}
        <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Scores</h2>
          <p className="text-xs text-gray-400 mb-4">Enter a value from 0 to 100</p>
          <div className="grid grid-cols-2 gap-6">
            <Field label="Effectiveness Score" name="effectiveness_score">
              <div className="space-y-2">
                <input
                  type="number" min={0} max={100}
                  className={`${inp} ${errors.effectiveness_score ? "border-red-400" : ""}`}
                  value={form.effectiveness_score ?? ""}
                  onChange={e => set("effectiveness_score", e.target.value !== "" ? Number(e.target.value) : null)}
                />
                {form.effectiveness_score != null && (
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all ${form.effectiveness_score >= 75 ? "bg-green-500" : form.effectiveness_score >= 50 ? "bg-yellow-400" : form.effectiveness_score >= 25 ? "bg-orange-400" : "bg-red-500"}`}
                      style={{ width: `${form.effectiveness_score}%` }}
                    />
                  </div>
                )}
              </div>
            </Field>
            <Field label="Coverage Score" name="coverage_score">
              <div className="space-y-2">
                <input
                  type="number" min={0} max={100}
                  className={`${inp} ${errors.coverage_score ? "border-red-400" : ""}`}
                  value={form.coverage_score ?? ""}
                  onChange={e => set("coverage_score", e.target.value !== "" ? Number(e.target.value) : null)}
                />
                {form.coverage_score != null && (
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all ${form.coverage_score >= 75 ? "bg-green-500" : form.coverage_score >= 50 ? "bg-yellow-400" : form.coverage_score >= 25 ? "bg-orange-400" : "bg-red-500"}`}
                      style={{ width: `${form.coverage_score}%` }}
                    />
                  </div>
                )}
              </div>
            </Field>
          </div>
        </section>

        {/* Assessment */}
        <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Assessment</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Last Assessed Date" name="last_assessed_date">
              <input type="date" className={inp} value={form.last_assessed_date || ""} onChange={e => set("last_assessed_date", e.target.value || null)} />
            </Field>
            <Field label="Next Review Date" name="next_review_date">
              <input type="date" className={inp} value={form.next_review_date || ""} onChange={e => set("next_review_date", e.target.value || null)} />
            </Field>
            <div className="col-span-2">
              <Field label="Notes" name="notes">
                <textarea className={`${inp} h-20 resize-none`} value={form.notes || ""} onChange={e => set("notes", e.target.value || null)} />
              </Field>
            </div>
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
