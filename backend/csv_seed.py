"""
Import real contract data from the CSV export.
Run from the project root:
    python -m backend.csv_seed
"""
import csv
import os
import sys
from datetime import date, datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import engine, SessionLocal, Base
from backend.models import Contract

CSV_PATH = os.path.join(
    os.path.expanduser("~"), "Downloads", "Security Contracts(contracts).csv"
)

FY_COLS = [
    ("fy25_nov", 29), ("fy25_dec", 30), ("fy25_jan", 31), ("fy25_feb", 32),
    ("fy25_mar", 33), ("fy25_apr", 34), ("fy25_may", 35), ("fy25_jun", 36),
    ("fy25_jul", 37), ("fy25_aug", 38), ("fy25_sep", 39), ("fy25_oct", 40),
    ("fy26_nov", 41), ("fy26_dec", 42), ("fy26_jan", 43), ("fy26_feb", 44),
    ("fy26_mar", 45), ("fy26_apr", 46), ("fy26_may", 47), ("fy26_jun", 48),
    ("fy26_jul", 49), ("fy26_aug", 50), ("fy26_sep", 51), ("fy26_oct", 52),
    ("fy27_nov", 53), ("fy27_dec", 54), ("fy27_jan", 55), ("fy27_feb", 56),
    ("fy27_mar", 57), ("fy27_apr", 58), ("fy27_may", 59), ("fy27_jun", 60),
    ("fy27_jul", 61), ("fy27_aug", 62), ("fy27_sep", 63), ("fy27_oct", 64),
    ("fy28_nov", 65), ("fy28_dec", 66), ("fy28_jan", 67), ("fy28_feb", 68),
    ("fy28_mar", 69), ("fy28_apr", 70), ("fy28_may", 71), ("fy28_jun", 72),
    ("fy28_jul", 73), ("fy28_aug", 74), ("fy28_sep", 75), ("fy28_oct", 76),
]


def clean(val: str) -> str:
    return val.strip() if val else ""


def to_str(val: str) -> str | None:
    s = clean(val)
    return s if s else None


def to_float(val: str) -> float | None:
    s = clean(val).replace(",", "").replace(" ", "")
    if not s or s in ("-", "--", "---", "-   "):
        return None
    # Handle dash-only patterns like '-   '
    if all(c in "- " for c in s):
        return None
    try:
        return float(s)
    except ValueError:
        return None


def to_int(val: str) -> int | None:
    f = to_float(val)
    return int(f) if f is not None else None


def to_bool(val: str) -> bool:
    return clean(val).upper() in ("TRUE", "YES", "Y", "1", "X")


def to_date(val: str) -> date | None:
    s = clean(val)
    if not s:
        return None
    for fmt in ("%m/%d/%Y", "%m/%d/%y", "%Y-%m-%d"):
        try:
            return datetime.strptime(s, fmt).date()
        except ValueError:
            continue
    return None


def to_status(val: str, end_dt: date | None) -> str:
    s = clean(val).upper()
    if s in ("ACTIVE", "INACTIVE"):
        return s
    if end_dt:
        return "ACTIVE" if end_dt >= date.today() else "INACTIVE"
    return "UNKNOWN"


def main():
    print(f"Reading: {CSV_PATH}")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    print("Clearing existing contract data…")
    db.query(Contract).delete()
    db.commit()

    inserted = 0
    skipped = 0

    with open(CSV_PATH, encoding="cp1252", newline="") as f:
        reader = csv.reader(f)
        rows = list(reader)

    # Rows 0–1: year/month headers; Row 2: column headers; Row 3+: data
    for row_idx, row in enumerate(rows[3:], start=4):
        # Pad to 77 columns in case trailing empties were stripped
        while len(row) < 77:
            row.append("")

        po = to_str(row[0])
        vendor = to_str(row[10])
        product = to_str(row[1])

        if not any([po, vendor, product]):
            skipped += 1
            continue

        end_dt = to_date(row[19])
        status = to_status(row[25], end_dt)

        fy_vals = {col: to_float(row[idx]) for col, idx in FY_COLS}

        contract = Contract(
            po_number=po,
            product_or_service=product,
            scope=to_str(row[2]),
            anaplan_id=to_str(row[3]),
            payment_term=to_str(row[4]),
            nda=to_bool(row[5]),
            risk_assessment=to_str(row[6]),
            security_function=to_str(row[7]),
            security_capability=to_str(row[8]),
            owner_name=to_str(row[9]),
            vendor=vendor,
            cost_center=to_int(row[11]),
            auto_renewal=to_bool(row[12]),
            notification_term_days=to_int(row[13]),
            do_not_renew=to_str(row[14]),
            amortize=to_bool(row[15]),
            payment_scheme=to_str(row[16]),
            renewed=to_str(row[17]),
            start_date=to_date(row[18]),
            end_date=end_dt,
            contract_amount=to_float(row[20]),
            currency=to_str(row[21]) or "USD",
            contract_days=to_int(row[22]),
            contract_months=to_int(row[23]),
            monthly_amount_usd=to_float(row[24]),
            status=status,
            owner_email=to_str(row[26]),
            contract_amount_usd=to_float(row[27]),
            recurring=to_str(row[28]),
            archived=False,
            **fy_vals,
        )
        db.add(contract)
        inserted += 1

        if inserted % 100 == 0:
            db.commit()
            print(f"  {inserted} rows inserted…")

    db.commit()
    db.close()
    print(f"\nDone. Inserted: {inserted}, Skipped (empty): {skipped}")


if __name__ == "__main__":
    main()
