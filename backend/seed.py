"""
One-time import script: reads Security Contracts.xlsx and populates contracts.db.
Run from the project root:
    python -m backend.seed
"""
import sys
import os
from datetime import date

# Allow running as a standalone script
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import openpyxl
from backend.database import engine, SessionLocal, Base
from backend.models import Contract

XLSX_PATH = os.path.join(
    os.path.expanduser("~"), "Downloads", "Security Contracts.xlsx"
)
# Fall back to the .pdf extension (the file is actually xlsx)
if not os.path.exists(XLSX_PATH):
    XLSX_PATH = os.path.join(
        os.path.expanduser("~"), "Downloads", "Security Contracts.pdf"
    )
    # Openpyxl requires .xlsx extension — copy to temp with correct extension
    import shutil
    _tmp = "/tmp/_security_contracts_import.xlsx"
    shutil.copy(XLSX_PATH, _tmp)
    XLSX_PATH = _tmp

# Column index map (0-based) matching row 3 headers
COL = {
    "po_number": 0,
    "product_or_service": 1,
    "scope": 2,
    "anaplan_id": 3,
    "payment_term": 4,
    "nda": 5,
    "risk_assessment": 6,
    "security_function": 7,
    "security_capability": 8,
    "owner_name": 9,
    "vendor": 10,
    "cost_center": 11,
    "auto_renewal": 12,
    "notification_term_days": 13,
    "do_not_renew": 14,
    "amortize": 15,
    "payment_scheme": 16,
    "renewed": 17,
    "start_date": 18,
    "end_date": 19,
    "contract_amount": 20,
    "currency": 21,
    "status": 25,
    "owner_email": 26,
    "contract_amount_usd": 27,
    "recurring": 28,
}


def to_bool(val) -> bool:
    if val is None:
        return False
    if isinstance(val, bool):
        return val
    return str(val).strip().upper() in ("YES", "Y", "TRUE", "1", "X")


def to_float(val) -> float | None:
    if val is None:
        return None
    try:
        return float(val)
    except (ValueError, TypeError):
        return None


def to_int(val) -> int | None:
    if val is None:
        return None
    try:
        return int(float(str(val)))
    except (ValueError, TypeError):
        return None


def to_date(val) -> date | None:
    if val is None:
        return None
    if isinstance(val, date):
        return val
    if hasattr(val, "date"):
        return val.date()
    return None


def compute_status(end_dt: date | None) -> str:
    if end_dt is None:
        return "UNKNOWN"
    return "ACTIVE" if end_dt >= date.today() else "INACTIVE"


def to_str(val) -> str | None:
    if val is None:
        return None
    s = str(val).strip()
    return s if s else None


def main():
    print(f"Loading workbook: {XLSX_PATH}")
    wb = openpyxl.load_workbook(XLSX_PATH, data_only=True)
    ws = wb["contracts"]

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Clear existing data
    db.query(Contract).delete()
    db.commit()

    inserted = 0
    skipped = 0

    for row_idx, row in enumerate(ws.iter_rows(min_row=4, values_only=True), start=4):
        # Skip completely empty rows
        meaningful = [row[i] for i in [COL["po_number"], COL["vendor"], COL["product_or_service"]]]
        if not any(v is not None for v in meaningful):
            skipped += 1
            continue

        end_dt = to_date(row[COL["end_date"]])

        # Use stored status if present and valid, else compute
        raw_status = to_str(row[COL["status"]])
        if raw_status in ("ACTIVE", "INACTIVE"):
            status = raw_status
        else:
            status = compute_status(end_dt)

        contract = Contract(
            po_number=to_str(row[COL["po_number"]]),
            product_or_service=to_str(row[COL["product_or_service"]]),
            scope=to_str(row[COL["scope"]]),
            anaplan_id=to_str(row[COL["anaplan_id"]]),
            payment_term=to_str(row[COL["payment_term"]]),
            nda=to_bool(row[COL["nda"]]),
            risk_assessment=to_str(row[COL["risk_assessment"]]),
            security_function=to_str(row[COL["security_function"]]),
            security_capability=to_str(row[COL["security_capability"]]),
            owner_name=to_str(row[COL["owner_name"]]),
            owner_email=to_str(row[COL["owner_email"]]),
            vendor=to_str(row[COL["vendor"]]),
            cost_center=to_int(row[COL["cost_center"]]),
            auto_renewal=to_bool(row[COL["auto_renewal"]]),
            notification_term_days=to_int(row[COL["notification_term_days"]]),
            do_not_renew=to_str(row[COL["do_not_renew"]]),
            amortize=to_bool(row[COL["amortize"]]),
            payment_scheme=to_str(row[COL["payment_scheme"]]),
            renewed=to_str(row[COL["renewed"]]),
            start_date=to_date(row[COL["start_date"]]),
            end_date=end_dt,
            contract_amount=to_float(row[COL["contract_amount"]]),
            currency=to_str(row[COL["currency"]]) or "USD",
            contract_amount_usd=to_float(row[COL["contract_amount_usd"]]),
            recurring=to_str(row[COL["recurring"]]),
            status=status,
            archived=False,
        )
        db.add(contract)
        inserted += 1

        if inserted % 100 == 0:
            db.commit()
            print(f"  {inserted} rows inserted...")

    db.commit()
    db.close()
    print(f"\nDone. Inserted: {inserted}, Skipped (empty): {skipped}")


if __name__ == "__main__":
    main()
