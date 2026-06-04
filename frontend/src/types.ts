export interface Contract {
  id: number;
  po_number: string | null;
  product_or_service: string | null;
  scope: string | null;
  anaplan_id: string | null;
  payment_term: string | null;
  nda: boolean;
  risk_assessment: string | null;
  security_function: string | null;
  security_capability: string | null;
  owner_name: string | null;
  owner_email: string | null;
  vendor: string | null;
  cost_center: number | null;
  auto_renewal: boolean;
  notification_term_days: number | null;
  do_not_renew: string | null;
  amortize: boolean;
  payment_scheme: string | null;
  renewed: string | null;
  start_date: string | null;
  end_date: string | null;
  contract_amount: number | null;
  currency: string | null;
  contract_amount_usd: number | null;
  contract_days: number | null;
  contract_months: number | null;
  monthly_amount_usd: number | null;
  recurring: string | null;
  status: string | null;
  archived: boolean;
  created_at: string | null;
  updated_at: string | null;
  // FY monthly amortization (FY25–FY28, Nov–Oct)
  fy25_nov: number | null; fy25_dec: number | null; fy25_jan: number | null;
  fy25_feb: number | null; fy25_mar: number | null; fy25_apr: number | null;
  fy25_may: number | null; fy25_jun: number | null; fy25_jul: number | null;
  fy25_aug: number | null; fy25_sep: number | null; fy25_oct: number | null;
  fy26_nov: number | null; fy26_dec: number | null; fy26_jan: number | null;
  fy26_feb: number | null; fy26_mar: number | null; fy26_apr: number | null;
  fy26_may: number | null; fy26_jun: number | null; fy26_jul: number | null;
  fy26_aug: number | null; fy26_sep: number | null; fy26_oct: number | null;
  fy27_nov: number | null; fy27_dec: number | null; fy27_jan: number | null;
  fy27_feb: number | null; fy27_mar: number | null; fy27_apr: number | null;
  fy27_may: number | null; fy27_jun: number | null; fy27_jul: number | null;
  fy27_aug: number | null; fy27_sep: number | null; fy27_oct: number | null;
  fy28_nov: number | null; fy28_dec: number | null; fy28_jan: number | null;
  fy28_feb: number | null; fy28_mar: number | null; fy28_apr: number | null;
  fy28_may: number | null; fy28_jun: number | null; fy28_jul: number | null;
  fy28_aug: number | null; fy28_sep: number | null; fy28_oct: number | null;
}

export interface ContractListResponse {
  total: number;
  page: number;
  page_size: number;
  items: Contract[];
}

export interface ContractFilters {
  q?: string;
  status?: string;
  security_function?: string;
  security_capability?: string;
  vendor?: string;
  owner?: string;
  currency?: string;
  recurring?: string;
  archived?: boolean;
  end_date_from?: string;
  end_date_to?: string;
  start_date_from?: string;
  start_date_to?: string;
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_dir?: string;
}

export interface ReportSummary {
  total_active: number;
  total_inactive: number;
  total_all: number;
  annual_spend_usd: number;
  expiring_30_days: number;
  expiring_60_days: number;
  expiring_90_days: number;
  do_not_renew_count: number;
}

export interface ReportGroup {
  group_value: string;
  count: number;
  total_usd: number;
  avg_usd: number;
  active_count: number;
}

export interface EnumsResponse {
  security_functions: string[];
  security_capabilities: string[];
  currencies: string[];
  statuses: string[];
  recurring_options: string[];
  report_group_fields: { value: string; label: string }[];
}

export interface SecurityTool {
  id: number;
  // Identity
  name: string | null;
  vendor: string | null;
  version: string | null;
  ucf_domain: string | null;
  process_solution: string | null;
  component: string | null;
  primary_use: string | null;
  description: string | null;
  // Classification
  security_function: string | null;
  nist_csf_alignment: string | null;
  functional_area: string | null;
  security_capability: string | null;
  deployment_status: string | null;
  license_type: string | null;
  seat_count: number | null;
  // Contract / vendor
  support_contact: string | null;
  support_contact_email: string | null;
  start_date: string | null;
  end_date: string | null;
  renewal_period: string | null;
  contract_cost_usd: number | null;
  annual_cost: number | null;
  auto_renewal: boolean;
  auto_renewal_notification_term: number | null;
  // Ownership
  budget_owner: string | null;
  owner_name: string | null;
  owner_email: string | null;
  cost_center: number | null;
  // Scores (0–5)
  score: number | null;
  effectiveness_score: number | null;
  coverage_score: number | null;
  // Assessment
  supported_by_sae: boolean;
  annual_vendor_review_reqd: boolean;
  last_assessed_date: string | null;
  next_review_date: string | null;
  email_sent: string | null;
  // Notes
  notes: string | null;
  notes2: string | null;
  roadmap_notes: string | null;
  // Meta
  archived: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface ToolListResponse {
  total: number;
  page: number;
  page_size: number;
  items: SecurityTool[];
}

export interface ToolFilters {
  q?: string;
  security_function?: string;
  security_capability?: string;
  deployment_status?: string;
  vendor?: string;
  owner?: string;
  archived?: boolean;
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_dir?: string;
}

export interface ToolSummary {
  total: number;
  by_status: { active: number; evaluation: number; deprecated: number; retired: number };
  avg_effectiveness_score: number;
  avg_coverage_score: number;
  effectiveness_distribution: { range: string; count: number }[];
  coverage_distribution: { range: string; count: number }[];
}

export interface ToolScoreRow {
  id: number;
  name: string;
  vendor: string;
  security_function: string;
  deployment_status: string;
  effectiveness_score: number;
  coverage_score: number;
}

export interface ToolGroupRow {
  group_value: string;
  count: number;
  avg_effectiveness: number;
  avg_coverage: number;
}
