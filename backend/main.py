from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, Base
from .routers import contracts, reports, tools

Base.metadata.create_all(bind=engine)

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
