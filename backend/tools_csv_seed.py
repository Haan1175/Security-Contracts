"""
Import real security tool data from the CSV export.
Run from the project root:
    python -m backend.tools_csv_seed
"""
import csv
import os
import sys
from datetime import date, datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import engine, SessionLocal, Base
from backend.models import SecurityTool

_FILENAME = "Security Tool Stack(Security Tools Current).csv"
CSV_PATH = (
    os.environ.get("TOOLS_CSV")
    or (p := os.path.join("/app/data", _FILENAME)) and os.path.exists(p) and p
    or os.path.join(os.path.expanduser("~"), "Downloads", _FILENAME)
)

# CSV column indices (0-based), data starts at row 3
# Row 0: metadata, Row 1: field ownership, Row 2: column headers
COL = {
    "archived":          1,
    "ucf_domain":        2,
    "process_solution":  3,
    "security_capability": 4,
    "component":         5,
    "score":             6,
    "name":              7,
    "auto_renewal":      8,
    "auto_renewal_notification_term": 9,
    "notes":             10,
    "vendor":            11,
    "support_contact":   12,
    "support_contact_email": 13,
    "start_date":        14,
    "end_date":          15,
    # 16: ContractDuration (computed — skip)
    # 17: DaysRemaining (computed — skip)
    "renewal_period":    18,
    "contract_cost_usd": 19,
    "annual_cost":       20,
    "budget_owner":      21,
    "nist_csf_alignment": 22,
    "primary_use":       23,
    "security_function": 24,
    "functional_area":   25,
    "coverage_score":    26,
    "effectiveness_score": 27,
    "supported_by_sae":  28,
    "deployment_status": 29,
    "roadmap_notes":     30,
    "notes2":            31,
    "annual_vendor_review_reqd": 32,
    "last_assessed_date": 33,
    # 34: Last Updated (skip)
    "owner_name":        35,
    "owner_email":       36,
    "email_sent":        37,
    # 38: Expiring in 90 days? (computed — skip)
}

DISPOSITION_MAP = {
    "keep":         "Active",
    "retire":       "Retired",
    "retired":      "Retired",
    "not renewing": "Deprecated",
    "review fy24":  "Evaluation",
    "review fy25":  "Evaluation",
    "review fy26":  "Evaluation",
    "review fy27":  "Evaluation",
    "review fy28":  "Evaluation",
    "evaluation":   "Evaluation",
    "deprecated":   "Deprecated",
    "active":       "Active",
}


def clean(val: str) -> str:
    return val.strip() if val else ""


def to_str(val: str) -> str | None:
    s = clean(val)
    return s if s else None


def to_bool_arch(val: str) -> bool:
    return clean(val).upper() == "Y"


def to_bool(val: str) -> bool:
    s = clean(val).upper()
    return s in ("Y", "YES", "TRUE", "1", "X")


def to_float(val: str) -> float | None:
    s = clean(val)
    # Remove currency symbols, commas, spaces
    s = s.replace("$", "").replace(",", "").replace(" ", "")
    if not s or s in ("-", "--", "---", "N/A", "NA", "Open Source", "n/a"):
        return None
    if all(c in "- " for c in s) or s == "$-":
        return None
    try:
        return float(s)
    except ValueError:
        return None


def to_int(val: str) -> int | None:
    f = to_float(val)
    return int(round(f)) if f is not None else None


def to_score(val: str) -> float | None:
    """Store score as-is on the 0–5 scale."""
    s = clean(val)
    if not s:
        return None
    try:
        return float(s)
    except ValueError:
        return None


def to_date(val: str) -> date | None:
    s = clean(val)
    if not s:
        return None
    skip_phrases = ("past end date", "no end date", "n/a", "na", "tbd", "0", "until ciena")
    if any(p in s.lower() for p in skip_phrases):
        return None
    for fmt in ("%m/%d/%Y", "%m/%d/%y", "%Y-%m-%d"):
        try:
            return datetime.strptime(s, fmt).date()
        except ValueError:
            continue
    # Excel serial number fallback
    try:
        n = int(s)
        if 30000 < n < 60000:
            from datetime import timedelta
            return date(1899, 12, 30) + timedelta(days=n)
    except (ValueError, OverflowError):
        pass
    return None


def map_disposition(raw: str) -> str:
    s = clean(raw).lower()
    return DISPOSITION_MAP.get(s, "Active")


def main():
    print(f"Reading: {CSV_PATH}")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    print("Clearing existing security tool data…")
    db.query(SecurityTool).delete()
    db.commit()

    inserted = 0
    skipped = 0

    with open(CSV_PATH, encoding="cp1252", newline="") as f:
        reader = csv.reader(f)
        rows = list(reader)

    # Rows 0–1: metadata/ownership; Row 2: column headers; Row 3+: data
    for row_idx, row in enumerate(rows[3:], start=4):
        while len(row) < 39:
            row.append("")

        name = to_str(row[COL["name"]])
        vendor = to_str(row[COL["vendor"]])

        if not name and not vendor:
            skipped += 1
            continue

        archived = to_bool_arch(row[COL["archived"]])
        deployment_status = map_disposition(row[COL["deployment_status"]])

        tool = SecurityTool(
            name=name,
            vendor=vendor,
            ucf_domain=to_str(row[COL["ucf_domain"]]),
            process_solution=to_str(row[COL["process_solution"]]),
            security_capability=to_str(row[COL["security_capability"]]),
            component=to_str(row[COL["component"]]),
            score=to_score(row[COL["score"]]),
            auto_renewal=to_bool(row[COL["auto_renewal"]]),
            auto_renewal_notification_term=to_int(row[COL["auto_renewal_notification_term"]]),
            notes=to_str(row[COL["notes"]]),
            support_contact=to_str(row[COL["support_contact"]]),
            support_contact_email=to_str(row[COL["support_contact_email"]]),
            start_date=to_date(row[COL["start_date"]]),
            end_date=to_date(row[COL["end_date"]]),
            renewal_period=to_str(row[COL["renewal_period"]]),
            contract_cost_usd=to_float(row[COL["contract_cost_usd"]]),
            annual_cost=to_float(row[COL["annual_cost"]]),
            budget_owner=to_str(row[COL["budget_owner"]]),
            nist_csf_alignment=to_str(row[COL["nist_csf_alignment"]]),
            primary_use=to_str(row[COL["primary_use"]]),
            security_function=to_str(row[COL["security_function"]]),
            functional_area=to_str(row[COL["functional_area"]]),
            coverage_score=to_score(row[COL["coverage_score"]]),
            effectiveness_score=to_score(row[COL["effectiveness_score"]]),
            supported_by_sae=to_bool(row[COL["supported_by_sae"]]),
            deployment_status=deployment_status,
            roadmap_notes=to_str(row[COL["roadmap_notes"]]),
            notes2=to_str(row[COL["notes2"]]),
            annual_vendor_review_reqd=to_bool(row[COL["annual_vendor_review_reqd"]]),
            last_assessed_date=to_date(row[COL["last_assessed_date"]]),
            owner_name=to_str(row[COL["owner_name"]]),
            owner_email=to_str(row[COL["owner_email"]]),
            email_sent=to_date(row[COL["email_sent"]]),
            archived=archived,
        )
        db.add(tool)
        inserted += 1

        if inserted % 100 == 0:
            db.commit()
            print(f"  {inserted} rows inserted…")

    db.commit()
    db.close()
    print(f"\nDone. Inserted: {inserted}, Skipped (empty): {skipped}")


if __name__ == "__main__":
    main()
