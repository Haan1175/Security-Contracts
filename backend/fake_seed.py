"""
Populates the database with entirely fake contract data.
Run from the project root:
    python -m backend.fake_seed
"""
import sys
import os
import random
from datetime import date, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from faker import Faker
from backend.database import engine, SessionLocal, Base
from backend.models import Contract

fake = Faker()
random.seed(42)
Faker.seed(42)

SECURITY_FUNCTIONS = [
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
]

SECURITY_CAPABILITIES = [
    "SA&E Strategy & Functional Leadership",
    "Cloud Security",
    "Defensible Network Security",
    "Defensible Systems Builds & Configurations",
    "Security Platforms & Automation",
    "Data Security & Privacy Engineering",
    "Identity & Access Management Security",
    None,
]

CURRENCIES = ["USD", "EUR", "CAD", "GBP", "AUD", "INR", "SGD"]
# Rough USD conversion rates
FX = {"USD": 1.0, "EUR": 1.08, "CAD": 0.73, "GBP": 1.27, "AUD": 0.65, "INR": 0.012, "SGD": 0.75}

PRODUCTS = [
    "Endpoint Detection & Response Platform",
    "Cloud Security Posture Management",
    "Identity Threat Detection",
    "Web Application Firewall",
    "Privileged Access Management",
    "Security Information and Event Management",
    "Vulnerability Assessment Service",
    "Penetration Testing Retainer",
    "Threat Intelligence Feed",
    "Network Access Control",
    "Zero Trust Network Access",
    "Email Security Gateway",
    "Data Loss Prevention Suite",
    "Security Awareness Training",
    "Bug Bounty Program",
    "Application Security Testing",
    "Security Operations Retainer",
    "Managed Detection and Response",
    "Cloud Workload Protection",
    "Container Security Platform",
    "API Security Management",
    "Digital Risk Protection",
    "Deception Technology Platform",
    "Security Orchestration & Automation",
    "Certificate Lifecycle Management",
    "DNS Security Service",
    "Multi-Factor Authentication Platform",
    "Secrets Management Service",
    "Security Audit & Compliance Tool",
    "Intrusion Prevention System",
    "Firewall Management Service",
    "Red Team Assessment",
    "Phishing Simulation Platform",
    "Access Review Automation",
    "Third-Party Risk Management",
    "Supply Chain Security Assessment",
    "Cloud Access Security Broker",
    "Mobile Device Management",
    "Endpoint Privilege Management",
    "Threat Hunting Retainer",
]

VENDORS = [
    "Nexum Security Group",
    "CyberVault Technologies",
    "SentinelEdge Inc.",
    "Arctis Defense Systems",
    "Praxis Cyber Solutions",
    "BlazePoint Security",
    "IronClad Infosec",
    "Paragon Threat Labs",
    "VaultShield Corp.",
    "Meridian Cyber Partners",
    "Stormgate Security LLC",
    "Cipher Dynamics",
    "Halcyon Protect Inc.",
    "RedFort Technologies",
    "Ovation Security Group",
    "Titanium Cyber Inc.",
    "Aegis Analytics LLC",
    "Northridge InfoSec",
    "Pinnacle Defense Co.",
    "Solaris Security Consulting",
    "Fortis Cyber Ltd.",
    "Coastline Risk Advisory",
    "Helix Threat Intelligence",
    "Summit Security Services",
    "Cascade Cyber Solutions",
    "Bridgewater SecureOps",
    "Luminary Risk Group",
    "Triton Security Labs",
    "Atlas InfoSec Partners",
    "CoreShield Technologies",
]

PAYMENT_SCHEMES = ["Annual Upfront", "Monthly", "Quarterly", "Semi-Annual", "One-Time"]
PAYMENT_TERMS = ["Net 30", "Net 45", "Net 60", "Immediate", "Net 15"]
COST_CENTERS = [8100, 8110, 8120, 8130, 8140, 8150, 8200, 8210, 8300, 8400, 8451]

FIRST_NAMES = ["Jordan", "Alex", "Morgan", "Taylor", "Casey", "Riley", "Cameron", "Drew",
               "Avery", "Quinn", "Parker", "Blake", "Skyler", "Reese", "Logan", "Finley",
               "Dakota", "Hayden", "Emerson", "Rowan"]
LAST_NAMES = ["Mitchell", "Harrington", "Delgado", "Nguyen", "Okafor", "Svensson", "Petrov",
              "Yamamoto", "Adeyemi", "Kowalski", "Patel", "Lindqvist", "Santos", "Beaumont",
              "Okonkwo", "Reyes", "Fischer", "Nakamura", "Dumont", "Eriksson"]


def random_name():
    return f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"


def random_email(name: str, domain: str) -> str:
    parts = name.lower().split()
    return f"{parts[0][0]}{parts[1]}@{domain}"


def random_po():
    prefix = random.choice(["PO", "SC", "CNT", "VND"])
    return f"{prefix}{random.randint(1000000000, 9999999999)}"


def random_contract():
    func = random.choice(SECURITY_FUNCTIONS)
    cap = random.choice(SECURITY_CAPABILITIES)
    product = random.choice(PRODUCTS)
    vendor = random.choice(VENDORS)
    owner = random_name()
    domain = fake.domain_name()
    currency = random.choices(CURRENCIES, weights=[60, 15, 8, 5, 4, 4, 4])[0]

    # Date range: contracts spanning roughly FY24-FY28
    base_year = random.randint(2023, 2026)
    start = date(base_year, random.randint(1, 12), random.choice([1, 15]))
    duration_months = random.choice([1, 3, 6, 12, 12, 12, 24, 36, 36])
    end = start + timedelta(days=duration_months * 30)

    amount_usd = round(random.choice([
        random.uniform(1_000, 10_000),
        random.uniform(10_000, 100_000),
        random.uniform(100_000, 500_000),
        random.uniform(500_000, 2_000_000),
    ]), 2)
    fx = FX[currency]
    amount_local = round(amount_usd / fx, 2)

    status = "ACTIVE" if end >= date.today() else "INACTIVE"
    recurring = random.choices(["YES", "NO"], weights=[65, 35])[0]
    auto_renewal = random.random() < 0.4
    amortize = amount_usd >= 100_000 and random.random() < 0.7
    nda = random.random() < 0.3
    do_not_renew = None
    if status == "INACTIVE" and random.random() < 0.25:
        do_not_renew = random.choice([
            "Budget constraints",
            "Tool consolidation",
            "Switching vendor",
            "Functionality replaced",
            "Contract not meeting SLA",
        ])

    notify_days = random.choice([30, 45, 60, 90, None])

    return Contract(
        po_number=random_po(),
        product_or_service=product,
        scope=f"{vendor} — {product}. Coverage: {start.isoformat()} to {end.isoformat()}",
        anaplan_id=str(random.randint(1000, 9999)) if random.random() < 0.5 else None,
        payment_term=random.choice(PAYMENT_TERMS),
        nda=nda,
        risk_assessment=random.choice(["Low", "Medium", "High", None, None]),
        security_function=func,
        security_capability=cap,
        owner_name=owner,
        owner_email=random_email(owner, domain),
        vendor=vendor,
        cost_center=random.choice(COST_CENTERS),
        auto_renewal=auto_renewal,
        notification_term_days=notify_days,
        do_not_renew=do_not_renew,
        amortize=amortize,
        payment_scheme=random.choice(PAYMENT_SCHEMES),
        renewed=random.choice(["Y", "N", None]),
        start_date=start,
        end_date=end,
        contract_amount=amount_local,
        currency=currency,
        contract_amount_usd=amount_usd,
        recurring=recurring,
        status=status,
        archived=False,
    )


def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    print("Clearing existing data…")
    db.query(Contract).delete()
    db.commit()

    print("Generating 250 fake contracts…")
    for i in range(250):
        db.add(random_contract())
        if (i + 1) % 50 == 0:
            db.commit()
            print(f"  {i + 1} inserted…")

    db.commit()
    db.close()
    print("Done. 250 fake contracts loaded.")


if __name__ == "__main__":
    main()
