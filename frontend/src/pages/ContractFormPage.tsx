import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save } from "lucide-react";
import { fetchContract, createContract, updateContract, fetchEnums } from "../api/contracts";
import type { Contract } from "../types";

type FormData = Partial<Contract>;

const BOOL_FIELDS = ["nda", "auto_renewal", "amortize"] as const;

export default function ContractFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id && id !== "new");
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: enums } = useQuery({ queryKey: ["enums"], queryFn: fetchEnums });
  const { data: existing } = useQuery({
    queryKey: ["contract", id],
    queryFn: () => fetchContract(Number(id)),
    enabled: isEdit,
  });

  const [form, setForm] = useState<FormData>({
    nda: false,
    auto_renewal: false,
    amortize: false,
    currency: "USD",
    recurring: "NO",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (existing) setForm(existing);
  }, [existing]);

  const saveMut = useMutation({
    mutationFn: (data: FormData) =>
      isEdit ? updateContract(Number(id), data) : createContract(data),
    onSuccess: (saved) => {
      qc.invalidateQueries({ queryKey: ["contracts"] });
      navigate(`/contracts/${saved.id}`);
    },
  });

  const set = (key: keyof FormData, value: unknown) => {
    setForm(f => ({ ...f, [key]: value }));
    setErrors(e => { const n = { ...e }; delete n[key]; return n; });
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.product_or_service?.trim()) errs.product_or_service = "Required";
    if (form.start_date && form.end_date && form.start_date > form.end_date)
      errs.end_date = "End date must be after start date";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) saveMut.mutate(form);
  };

  const Field = ({
    label, name, required, children,
  }: {
    label: string; name: string; required?: boolean; children: React.ReactNode;
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {errors[name] && <p className="text-xs text-red-500 mt-0.5">{errors[name]}</p>}
    </div>
  );

  const inp = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? "Edit Contract" : "New Contract"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identity */}
        <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Identity</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Product or Service" name="product_or_service" required>
              <input className={`${inp} ${errors.product_or_service ? "border-red-400" : ""}`}
                value={form.product_or_service || ""}
                onChange={e => set("product_or_service", e.target.value)} />
            </Field>
            <Field label="PO Number" name="po_number">
              <input className={inp} value={form.po_number || ""} onChange={e => set("po_number", e.target.value)} />
            </Field>
            <Field label="Scope" name="scope">
              <textarea className={`${inp} h-20 resize-none`} value={form.scope || ""}
                onChange={e => set("scope", e.target.value)} />
            </Field>
            <Field label="Anaplan ID" name="anaplan_id">
              <input className={inp} value={form.anaplan_id || ""} onChange={e => set("anaplan_id", e.target.value)} />
            </Field>
          </div>
        </section>

        {/* Vendor / Owner */}
        <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Vendor & Owner</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Vendor" name="vendor">
              <input className={inp} value={form.vendor || ""} onChange={e => set("vendor", e.target.value)} />
            </Field>
            <Field label="Cost Center" name="cost_center">
              <input type="number" className={inp} value={form.cost_center ?? ""}
                onChange={e => set("cost_center", e.target.value ? Number(e.target.value) : null)} />
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
            <Field label="Risk Assessment" name="risk_assessment">
              <input className={inp} value={form.risk_assessment || ""} onChange={e => set("risk_assessment", e.target.value)} />
            </Field>
          </div>
        </section>

        {/* Financials */}
        <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Financials</h2>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Contract Amount" name="contract_amount">
              <input type="number" step="0.01" className={inp} value={form.contract_amount ?? ""}
                onChange={e => set("contract_amount", e.target.value ? Number(e.target.value) : null)} />
            </Field>
            <Field label="Currency" name="currency">
              <select className={inp} value={form.currency || "USD"} onChange={e => set("currency", e.target.value)}>
                {enums?.currencies.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Amount (USD)" name="contract_amount_usd">
              <input type="number" step="0.01" className={inp} value={form.contract_amount_usd ?? ""}
                onChange={e => set("contract_amount_usd", e.target.value ? Number(e.target.value) : null)} />
            </Field>
            <Field label="Payment Term" name="payment_term">
              <input className={inp} value={form.payment_term || ""} onChange={e => set("payment_term", e.target.value)} />
            </Field>
            <Field label="Payment Scheme" name="payment_scheme">
              <input className={inp} value={form.payment_scheme || ""} onChange={e => set("payment_scheme", e.target.value)} />
            </Field>
            <Field label="Recurring" name="recurring">
              <select className={inp} value={form.recurring || ""} onChange={e => set("recurring", e.target.value || null)}>
                <option value="">—</option>
                {enums?.recurring_options.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
          </div>
        </section>

        {/* Lifecycle */}
        <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Lifecycle</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Start Date" name="start_date">
              <input type="date" className={inp} value={form.start_date || ""}
                onChange={e => set("start_date", e.target.value || null)} />
            </Field>
            <Field label="End Date" name="end_date">
              <input type="date" className={`${inp} ${errors.end_date ? "border-red-400" : ""}`}
                value={form.end_date || ""}
                onChange={e => set("end_date", e.target.value || null)} />
            </Field>
            <Field label="Notification Term (days)" name="notification_term_days">
              <input type="number" className={inp} value={form.notification_term_days ?? ""}
                onChange={e => set("notification_term_days", e.target.value ? Number(e.target.value) : null)} />
            </Field>
            <Field label="Renewed" name="renewed">
              <select className={inp} value={form.renewed || ""} onChange={e => set("renewed", e.target.value || null)}>
                <option value="">—</option>
                <option value="Y">Y</option>
                <option value="N">N</option>
              </select>
            </Field>
            <Field label="Do Not Renew" name="do_not_renew">
              <input className={inp} value={form.do_not_renew || ""} onChange={e => set("do_not_renew", e.target.value || null)}
                placeholder="Leave blank or enter note" />
            </Field>
          </div>

          <div className="flex gap-6 mt-4">
            {BOOL_FIELDS.map(field => (
              <label key={field} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  checked={Boolean(form[field])}
                  onChange={e => set(field, e.target.checked)}
                />
                {field.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
              </label>
            ))}
          </div>
        </section>

        <div className="flex gap-3 justify-end">
          <button type="button" onClick={() => navigate(-1)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit" disabled={saveMut.isPending}
            className="flex items-center gap-1.5 px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium disabled:opacity-60">
            <Save size={15} /> {saveMut.isPending ? "Saving…" : "Save Contract"}
          </button>
        </div>

        {saveMut.isError && (
          <p className="text-sm text-red-500 text-right">Failed to save. Please try again.</p>
        )}
      </form>
    </div>
  );
}
