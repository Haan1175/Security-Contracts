from sqlalchemy import Column, Integer, String, Float, Boolean, Date, DateTime, Text
from sqlalchemy.sql import func
from .database import Base


class SecurityTool(Base):
    __tablename__ = "security_tools"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    vendor = Column(String, index=True)
    version = Column(String)
    description = Column(Text)
    security_function = Column(String, index=True)
    security_capability = Column(String, index=True)
    owner_name = Column(String, index=True)
    owner_email = Column(String)
    cost_center = Column(Integer)
    deployment_status = Column(String, index=True)  # Active, Evaluation, Deprecated, Retired
    license_type = Column(String)
    seat_count = Column(Integer)
    effectiveness_score = Column(Integer)   # 0–100
    coverage_score = Column(Integer)        # 0–100
    last_assessed_date = Column(Date)
    next_review_date = Column(Date)
    notes = Column(Text)
    archived = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class Contract(Base):
    __tablename__ = "contracts"

    id = Column(Integer, primary_key=True, index=True)
    po_number = Column(String, index=True)
    product_or_service = Column(String, index=True)
    scope = Column(Text)
    anaplan_id = Column(String)
    payment_term = Column(String)
    nda = Column(Boolean, default=False)
    risk_assessment = Column(String)
    security_function = Column(String, index=True)
    security_capability = Column(String, index=True)
    owner_name = Column(String, index=True)
    owner_email = Column(String)
    vendor = Column(String, index=True)
    cost_center = Column(Integer)
    auto_renewal = Column(Boolean, default=False)
    notification_term_days = Column(Integer)
    do_not_renew = Column(String)
    amortize = Column(Boolean, default=False)
    payment_scheme = Column(String)
    renewed = Column(String)
    start_date = Column(Date)
    end_date = Column(Date, index=True)
    contract_amount = Column(Float)
    currency = Column(String, default="USD")
    contract_amount_usd = Column(Float)
    recurring = Column(String)
    status = Column(String, index=True)
    archived = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
