from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, Base
from .routers import contracts, reports, tools

Base.metadata.create_all(bind=engine)


def _migrate_security_tools():
    """Add missing columns to security_tools without dropping existing data."""
    from sqlalchemy import text
    new_cols = [
        ("ucf_domain", "VARCHAR"),
        ("process_solution", "VARCHAR"),
        ("component", "VARCHAR"),
        ("primary_use", "TEXT"),
        ("nist_csf_alignment", "VARCHAR"),
        ("functional_area", "VARCHAR"),
        ("support_contact", "VARCHAR"),
        ("support_contact_email", "VARCHAR"),
        ("start_date", "DATE"),
        ("end_date", "DATE"),
        ("renewal_period", "VARCHAR"),
        ("contract_cost_usd", "FLOAT"),
        ("annual_cost", "FLOAT"),
        ("auto_renewal", "BOOLEAN DEFAULT 0"),
        ("auto_renewal_notification_term", "INTEGER"),
        ("budget_owner", "VARCHAR"),
        ("score", "INTEGER"),
        ("supported_by_sae", "BOOLEAN DEFAULT 0"),
        ("annual_vendor_review_reqd", "BOOLEAN DEFAULT 0"),
        ("email_sent", "DATE"),
        ("notes2", "TEXT"),
        ("roadmap_notes", "TEXT"),
    ]
    with engine.connect() as conn:
        rows = conn.execute(text("PRAGMA table_info(security_tools)")).fetchall()
        existing = {row[1] for row in rows}
        for col, col_type in new_cols:
            if col not in existing:
                conn.execute(text(f"ALTER TABLE security_tools ADD COLUMN {col} {col_type}"))
        conn.commit()


_migrate_security_tools()


def _migrate_contracts():
    """Add missing columns to contracts table without dropping data."""
    from sqlalchemy import text
    _MONTHS = ["nov", "dec", "jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct"]
    fy_cols = [(f"fy{yr}_{mo}", "FLOAT") for yr in ["25", "26", "27", "28"] for mo in _MONTHS]
    new_cols = [
        ("contract_days", "INTEGER"),
        ("contract_months", "INTEGER"),
        ("monthly_amount_usd", "FLOAT"),
    ] + fy_cols
    with engine.connect() as conn:
        rows = conn.execute(text("PRAGMA table_info(contracts)")).fetchall()
        existing = {row[1] for row in rows}
        for col, col_type in new_cols:
            if col not in existing:
                conn.execute(text(f"ALTER TABLE contracts ADD COLUMN {col} {col_type}"))
        conn.commit()


_migrate_contracts()

app = FastAPI(title="Security Contracts API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(contracts.router)
app.include_router(reports.router)
app.include_router(tools.router)


@app.get("/api/enums")
def get_enums():
    return {
        "security_functions": [
            "Program Management",
            "Security Governance",
            "Compliance Readiness",
            "Security Architecture and Engineering",
            "Security Testing and Assessments",
            "Risk Management",
            "Monitoring and Analysis",
            "Incident Response",
            "Vulnerability Management",
            "Workplace Security",
        ],
        "security_capabilities": [
            "SA&E Strategy & Functional Leadership",
            "Cloud Security",
            "Defensible Network Security",
            "Defensible Systems Builds & Configurations",
            "Security Platforms & Automation",
            "Data Security & Privacy Engineering",
            "Identity & Access Management Security",
        ],
        "currencies": ["USD", "EUR", "CAD", "INR", "GBP", "AUD", "SGD", "JPY"],
        "statuses": ["ACTIVE", "INACTIVE"],
        "recurring_options": ["YES", "NO"],
        "report_group_fields": [
            {"value": "security_function", "label": "Security Function"},
            {"value": "security_capability", "label": "Security Capability"},
            {"value": "vendor", "label": "Vendor"},
            {"value": "owner_name", "label": "Contract Owner"},
            {"value": "currency", "label": "Currency"},
            {"value": "status", "label": "Status"},
            {"value": "recurring", "label": "Recurring"},
            {"value": "cost_center", "label": "Cost Center"},
        ],
    }


@app.get("/api/health")
def health():
    return {"status": "ok"}
