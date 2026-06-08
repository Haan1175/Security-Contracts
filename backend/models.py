from sqlalchemy import Column, Integer, String, Float, Boolean, Date, DateTime, Text
from sqlalchemy.sql import func
from .database import Base


class SecurityTool(Base):
    __tablename__ = "security_tools"

    id = Column(Integer, primary_key=True, index=True)
    # Core identity
    name = Column(String, index=True)           # "Product"
    vendor = Column(String, index=True)
    version = Column(String)
    ucf_domain = Column(String)                 # "UCF Domain"
    process_solution = Column(String)           # "Process/Solution"
    component = Column(String)                  # "Component"
    primary_use = Column(Text)                  # "Primary Use"
    # Classification
    security_function = Column(String, index=True)
    nist_csf_alignment = Column(String)         # "Function Alignment NIST CSF 2.0"
    functional_area = Column(String)            # "Functional Area"
    security_capability = Column(String, index=True)   # "Capability"
    deployment_status = Column(String, index=True)     # "Disposition"
    license_type = Column(String)
    seat_count = Column(Integer)
    # Contract / vendor
    support_contact = Column(String)            # "Support Contact"
    support_contact_email = Column(String)      # "Support Contact Email"
    start_date = Column(Date)
    end_date = Column(Date)
    renewal_period = Column(String)             # "Renewal Period"
    contract_cost_usd = Column(Float)           # "Contract Cost (USD)"
    annual_cost = Column(Float)                 # "Annual Cost"
    auto_renewal = Column(Boolean, default=False)
    auto_renewal_notification_term = Column(Integer)   # days
    # Ownership
    budget_owner = Column(String)               # "Budget Owner"
    owner_name = Column(String, index=True)     # "Internal Contact"
    owner_email = Column(String)                # "Internal Contact email"
    cost_center = Column(Integer)
    # Scores (0–5)
    score = Column(Float)                       # "Score (0-5)"
    effectiveness_score = Column(Float)         # "Effectiveness (0-5)"
    coverage_score = Column(Float)              # "Coverage (0-5)"
    # Assessment
    supported_by_sae = Column(Boolean, default=False)
    annual_vendor_review_reqd = Column(Boolean, default=False)
    last_assessed_date = Column(Date)           # "Last Annual Review"
    next_review_date = Column(Date)
    email_sent = Column(Date)                   # "Email Sent"
    # Notes
    notes = Column(Text)
    notes2 = Column(Text)                       # "Notes2"
    roadmap_notes = Column(Text)                # "Roadmap Notes"
    description = Column(Text)
    # Meta
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
    contract_days = Column(Integer)           # "Days"
    contract_months = Column(Integer)         # "Months"
    monthly_amount_usd = Column(Float)        # "Monthly Amount (USD)"
    recurring = Column(String)
    status = Column(String, index=True)
    archived = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    # FY monthly amortization columns (FY25–FY28, Nov–Oct)
    fy25_nov = Column(Float); fy25_dec = Column(Float); fy25_jan = Column(Float)
    fy25_feb = Column(Float); fy25_mar = Column(Float); fy25_apr = Column(Float)
    fy25_may = Column(Float); fy25_jun = Column(Float); fy25_jul = Column(Float)
    fy25_aug = Column(Float); fy25_sep = Column(Float); fy25_oct = Column(Float)
    fy26_nov = Column(Float); fy26_dec = Column(Float); fy26_jan = Column(Float)
    fy26_feb = Column(Float); fy26_mar = Column(Float); fy26_apr = Column(Float)
    fy26_may = Column(Float); fy26_jun = Column(Float); fy26_jul = Column(Float)
    fy26_aug = Column(Float); fy26_sep = Column(Float); fy26_oct = Column(Float)
    fy27_nov = Column(Float); fy27_dec = Column(Float); fy27_jan = Column(Float)
    fy27_feb = Column(Float); fy27_mar = Column(Float); fy27_apr = Column(Float)
    fy27_may = Column(Float); fy27_jun = Column(Float); fy27_jul = Column(Float)
    fy27_aug = Column(Float); fy27_sep = Column(Float); fy27_oct = Column(Float)
    fy28_nov = Column(Float); fy28_dec = Column(Float); fy28_jan = Column(Float)
    fy28_feb = Column(Float); fy28_mar = Column(Float); fy28_apr = Column(Float)
    fy28_may = Column(Float); fy28_jun = Column(Float); fy28_jul = Column(Float)
    fy28_aug = Column(Float); fy28_sep = Column(Float); fy28_oct = Column(Float)
