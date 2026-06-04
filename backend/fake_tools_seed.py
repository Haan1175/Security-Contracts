"""
Seed fake security tool data.
Run from the project root:
    python -m backend.fake_tools_seed
"""
import sys
import os
import random
from datetime import date, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from faker import Faker
from backend.database import engine, SessionLocal, Base
from backend.models import SecurityTool

fake = Faker()
random.seed(99)
Faker.seed(99)

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

DEPLOYMENT_STATUSES = ["Active", "Active", "Active", "Evaluation", "Deprecated", "Retired"]

LICENSE_TYPES = ["Perpetual", "Subscription", "SaaS", "Open Source", "Enterprise License", "Per-Seat"]

TOOL_CATALOG = [
    ("NexGuard EDR", "Nexum Security Group", "Endpoint Detection & Response"),
    ("VaultSIEM Pro", "CyberVault Technologies", "Security Information & Event Management"),
    ("SentinelCloud WAF", "SentinelEdge Inc.", "Web Application Firewall"),
    ("ArctisPAM Suite", "Arctis Defense Systems", "Privileged Access Management"),
    ("PraxisVM Scanner", "Praxis Cyber Solutions", "Vulnerability Management"),
    ("BlazeTI Feed", "BlazePoint Security", "Threat Intelligence Platform"),
    ("IronNet NDR", "IronClad Infosec", "Network Detection & Response"),
    ("ParagonASM", "Paragon Threat Labs", "Attack Surface Management"),
    ("VaultDLP Shield", "VaultShield Corp.", "Data Loss Prevention"),
    ("MeridianCAASB", "Meridian Cyber Partners", "Cloud Access Security Broker"),
    ("StormSOAR", "Stormgate Security LLC", "Security Orchestration & Automation"),
    ("CipherIAM", "Cipher Dynamics", "Identity & Access Management"),
    ("HalcyonZTNA", "Halcyon Protect Inc.", "Zero Trust Network Access"),
    ("RedFort DAST", "RedFort Technologies", "Dynamic Application Security Testing"),
    ("OvationGRC", "Ovation Security Group", "Governance, Risk & Compliance"),
    ("TitaniumMFA", "Titanium Cyber Inc.", "Multi-Factor Authentication"),
    ("AegisDeception", "Aegis Analytics LLC", "Deception Technology"),
    ("NorthridgeDNS", "Northridge InfoSec", "DNS Security"),
    ("PinnacleCSPM", "Pinnacle Defense Co.", "Cloud Security Posture Management"),
    ("SolarisAudit", "Solaris Security Consulting", "Audit & Compliance Automation"),
    ("FortisSecrets", "Fortis Cyber Ltd.", "Secrets Management"),
    ("CoastlinePT", "Coastline Risk Advisory", "Penetration Testing Platform"),
    ("HelixBEAT", "Helix Threat Intelligence", "Behavior Analytics"),
    ("SummitSAST", "Summit Security Services", "Static Application Security Testing"),
    ("CascadeCWPP", "Cascade Cyber Solutions", "Cloud Workload Protection"),
    ("BridgewaterEDR", "Bridgewater SecureOps", "Endpoint Detection & Response"),
    ("LuminaryRisk", "Luminary Risk Group", "Risk Quantification Platform"),
    ("TritonCIEM", "Triton Security Labs", "Cloud Infrastructure Entitlement Mgmt"),
    ("AtlasBAS", "Atlas InfoSec Partners", "Breach & Attack Simulation"),
    ("CorePhish", "CoreShield Technologies", "Phishing Simulation Platform"),
    ("NexumAPIShield", "Nexum Security Group", "API Security Gateway"),
    ("CyberVaultCLM", "CyberVault Technologies", "Certificate Lifecycle Management"),
    ("SentinelSSPM", "SentinelEdge Inc.", "SaaS Security Posture Management"),
    ("ArctisDCIM", "Arctis Defense Systems", "Data Center Security Monitor"),
    ("PraxisAWAF", "Praxis Cyber Solutions", "Advanced Web Application Firewall"),
    ("BlazePAX", "BlazePoint Security", "Privileged Access Exchange"),
    ("IronNAC", "IronClad Infosec", "Network Access Control"),
    ("ParagonSWG", "Paragon Threat Labs", "Secure Web Gateway"),
    ("VaultEPM", "VaultShield Corp.", "Endpoint Privilege Management"),
    ("MeridianDDI", "Meridian Cyber Partners", "DNS/DHCP/IPAM Security"),
]

FIRST_NAMES = ["Jordan", "Alex", "Morgan", "Taylor", "Casey", "Riley", "Cameron", "Drew",
               "Avery", "Quinn", "Parker", "Blake", "Skyler", "Reese", "Logan", "Finley"]
LAST_NAMES = ["Mitchell", "Harrington", "Delgado", "Nguyen", "Okafor", "Svensson", "Petrov",
              "Yamamoto", "Adeyemi", "Kowalski", "Patel", "Lindqvist", "Santos", "Beaumont"]

COST_CENTERS = [8100, 8110, 8120, 8130, 8140, 8150, 8200, 8210, 8300, 8400, 8451]


def random_name():
    return f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"


def random_email(name: str, domain: str) -> str:
    parts = name.lower().split()
    return f"{parts[0][0]}{parts[1]}@{domain}"


def score_for_status(status: str) -> tuple[int, int]:
    """Returns (effectiveness, coverage) score range based on deployment status."""
    if status == "Active":
        eff = random.randint(55, 98)
        cov = random.randint(50, 95)
    elif status == "Evaluation":
        eff = random.randint(40, 75)
        cov = random.randint(20, 60)
    elif status == "Deprecated":
        eff = random.randint(20, 55)
        cov = random.randint(15, 50)
    else:  # Retired
        eff = random.randint(10, 40)
        cov = random.randint(5, 30)
    return eff, cov


def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    print("Clearing existing tool data…")
    db.query(SecurityTool).delete()
    db.commit()

    print(f"Generating {len(TOOL_CATALOG)} fake security tools…")
    for name, vendor, description in TOOL_CATALOG:
        status = random.choice(DEPLOYMENT_STATUSES)
        eff, cov = score_for_status(status)
        owner = random_name()
        domain = fake.domain_name()
        func = random.choice(SECURITY_FUNCTIONS)
        cap = random.choice(SECURITY_CAPABILITIES)

        # Dates: last assessed within 0-12 months ago, next review in 6-18 months
        days_ago = random.randint(0, 365)
        last_assessed = date.today() - timedelta(days=days_ago)
        next_review = date.today() + timedelta(days=random.randint(30, 540))

        version = f"{random.randint(1, 12)}.{random.randint(0, 9)}.{random.randint(0, 9)}"

        tool = SecurityTool(
            name=name,
            vendor=vendor,
            version=version,
            description=f"{description} solution providing enterprise-grade protection across {random.choice(['cloud', 'on-premise', 'hybrid', 'multi-cloud'])} environments.",
            security_function=func,
            security_capability=cap,
            owner_name=owner,
            owner_email=random_email(owner, domain),
            cost_center=random.choice(COST_CENTERS),
            deployment_status=status,
            license_type=random.choice(LICENSE_TYPES),
            seat_count=random.choice([None, 50, 100, 250, 500, 1000, 2500, 5000]),
            effectiveness_score=eff,
            coverage_score=cov,
            last_assessed_date=last_assessed,
            next_review_date=next_review,
            notes=random.choice([
                None,
                "Pending renewal assessment.",
                "Fully integrated with SIEM.",
                "Coverage expansion planned for Q3.",
                "Under evaluation for replacement.",
                "Integrated with ticketing system.",
                "License renewal due next quarter.",
            ]),
            archived=False,
        )
        db.add(tool)

    db.commit()
    db.close()
    print(f"Done. {len(TOOL_CATALOG)} tools loaded.")


if __name__ == "__main__":
    main()
