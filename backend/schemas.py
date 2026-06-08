from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


class ContractBase(BaseModel):
    po_number: Optional[str] = None
    product_or_service: Optional[str] = None
    scope: Optional[str] = None
    anaplan_id: Optional[str] = None
    payment_term: Optional[str] = None
    nda: Optional[bool] = False
    risk_assessment: Optional[str] = None
    security_function: Optional[str] = None
    security_capability: Optional[str] = None
    owner_name: Optional[str] = None
    owner_email: Optional[str] = None
    vendor: Optional[str] = None
    cost_center: Optional[int] = None
    auto_renewal: Optional[bool] = False
    notification_term_days: Optional[int] = None
    do_not_renew: Optional[str] = None
    amortize: Optional[bool] = False
    payment_scheme: Optional[str] = None
    renewed: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    contract_amount: Optional[float] = None
    currency: Optional[str] = "USD"
    contract_amount_usd: Optional[float] = None
    contract_days: Optional[int] = None
    contract_months: Optional[int] = None
    monthly_amount_usd: Optional[float] = None
    recurring: Optional[str] = None
    # FY monthly amortization (FY25–FY28, Nov–Oct)
    fy25_nov: Optional[float] = None; fy25_dec: Optional[float] = None; fy25_jan: Optional[float] = None
    fy25_feb: Optional[float] = None; fy25_mar: Optional[float] = None; fy25_apr: Optional[float] = None
    fy25_may: Optional[float] = None; fy25_jun: Optional[float] = None; fy25_jul: Optional[float] = None
    fy25_aug: Optional[float] = None; fy25_sep: Optional[float] = None; fy25_oct: Optional[float] = None
    fy26_nov: Optional[float] = None; fy26_dec: Optional[float] = None; fy26_jan: Optional[float] = None
    fy26_feb: Optional[float] = None; fy26_mar: Optional[float] = None; fy26_apr: Optional[float] = None
    fy26_may: Optional[float] = None; fy26_jun: Optional[float] = None; fy26_jul: Optional[float] = None
    fy26_aug: Optional[float] = None; fy26_sep: Optional[float] = None; fy26_oct: Optional[float] = None
    fy27_nov: Optional[float] = None; fy27_dec: Optional[float] = None; fy27_jan: Optional[float] = None
    fy27_feb: Optional[float] = None; fy27_mar: Optional[float] = None; fy27_apr: Optional[float] = None
    fy27_may: Optional[float] = None; fy27_jun: Optional[float] = None; fy27_jul: Optional[float] = None
    fy27_aug: Optional[float] = None; fy27_sep: Optional[float] = None; fy27_oct: Optional[float] = None
    fy28_nov: Optional[float] = None; fy28_dec: Optional[float] = None; fy28_jan: Optional[float] = None
    fy28_feb: Optional[float] = None; fy28_mar: Optional[float] = None; fy28_apr: Optional[float] = None
    fy28_may: Optional[float] = None; fy28_jun: Optional[float] = None; fy28_jul: Optional[float] = None
    fy28_aug: Optional[float] = None; fy28_sep: Optional[float] = None; fy28_oct: Optional[float] = None


class ContractCreate(ContractBase):
    pass


class ContractUpdate(ContractBase):
    pass


class ContractOut(ContractBase):
    id: int
    status: Optional[str] = None
    archived: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ContractListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: list[ContractOut]


class ToolBase(BaseModel):
    # Identity
    name: Optional[str] = None
    vendor: Optional[str] = None
    version: Optional[str] = None
    ucf_domain: Optional[str] = None
    process_solution: Optional[str] = None
    component: Optional[str] = None
    primary_use: Optional[str] = None
    description: Optional[str] = None
    # Classification
    security_function: Optional[str] = None
    nist_csf_alignment: Optional[str] = None
    functional_area: Optional[str] = None
    security_capability: Optional[str] = None
    deployment_status: Optional[str] = None
    license_type: Optional[str] = None
    seat_count: Optional[int] = None
    # Contract / vendor
    support_contact: Optional[str] = None
    support_contact_email: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    renewal_period: Optional[str] = None
    contract_cost_usd: Optional[float] = None
    annual_cost: Optional[float] = None
    auto_renewal: Optional[bool] = False
    auto_renewal_notification_term: Optional[int] = None
    # Ownership
    budget_owner: Optional[str] = None
    owner_name: Optional[str] = None
    owner_email: Optional[str] = None
    cost_center: Optional[int] = None
    # Scores (0–5)
    score: Optional[float] = None
    effectiveness_score: Optional[float] = None
    coverage_score: Optional[float] = None
    # Assessment
    supported_by_sae: Optional[bool] = False
    annual_vendor_review_reqd: Optional[bool] = False
    last_assessed_date: Optional[date] = None
    next_review_date: Optional[date] = None
    email_sent: Optional[date] = None
    # Notes
    notes: Optional[str] = None
    notes2: Optional[str] = None
    roadmap_notes: Optional[str] = None


class ToolCreate(ToolBase):
    pass


class ToolUpdate(ToolBase):
    pass


class ToolOut(ToolBase):
    id: int
    archived: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ToolListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: list[ToolOut]
