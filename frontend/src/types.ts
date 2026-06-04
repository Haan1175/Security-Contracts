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
  recurring: string | null;
  status: string | null;
  archived: boolean;
  created_at: string | null;
  updated_at: string | null;
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
  name: string | null;
  vendor: string | null;
  version: string | null;
  description: string | null;
  security_function: string | null;
  security_capability: string | null;
  owner_name: string | null;
  owner_email: string | null;
  cost_center: number | null;
  deployment_status: string | null;
  license_type: string | null;
  seat_count: number | null;
  effectiveness_score: number | null;
  coverage_score: number | null;
  last_assessed_date: string | null;
  next_review_date: string | null;
  notes: string | null;
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
