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
    recurring: Optional[str] = None


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
    name: Optional[str] = None
    vendor: Optional[str] = None
    version: Optional[str] = None
    description: Optional[str] = None
    security_function: Optional[str] = None
    security_capability: Optional[str] = None
    owner_name: Optional[str] = None
    owner_email: Optional[str] = None
    cost_center: Optional[int] = None
    deployment_status: Optional[str] = None
    license_type: Optional[str] = None
    seat_count: Optional[int] = None
    effectiveness_score: Optional[int] = None
    coverage_score: Optional[int] = None
    last_assessed_date: Optional[date] = None
    next_review_date: Optional[date] = None
    notes: Optional[str] = None


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
