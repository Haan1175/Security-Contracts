import csv
import io
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from datetime import date, datetime
from typing import Optional

from ..database import get_db
from ..models import Contract
from ..schemas import ContractCreate, ContractUpdate, ContractOut, ContractListResponse

router = APIRouter(prefix="/api/contracts", tags=["contracts"])


def compute_status(end_date) -> str:
    if end_date is None:
        return "UNKNOWN"
    if isinstance(end_date, str):
        end_date = date.fromisoformat(end_date)
    return "ACTIVE" if end_date >= date.today() else "INACTIVE"


@router.get("", response_model=ContractListResponse)
def list_contracts(
    q: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    security_function: Optional[str] = Query(None),
    security_capability: Optional[str] = Query(None),
    vendor: Optional[str] = Query(None),
    owner: Optional[str] = Query(None),
    currency: Optional[str] = Query(None),
    recurring: Optional[str] = Query(None),
    archived: bool = Query(False),
    end_date_from: Optional[date] = Query(None),
    end_date_to: Optional[date] = Query(None),
    start_date_from: Optional[date] = Query(None),
    start_date_to: Optional[date] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    sort_by: Optional[str] = Query("end_date"),
    sort_dir: Optional[str] = Query("asc"),
    db: Session = Depends(get_db),
):
    query = db.query(Contract).filter(Contract.archived == archived)

    if q:
        search = f"%{q}%"
        query = query.filter(
            or_(
                Contract.po_number.ilike(search),
                Contract.product_or_service.ilike(search),
                Contract.scope.ilike(search),
                Contract.vendor.ilike(search),
                Contract.owner_name.ilike(search),
            )
        )

    if status:
        query = query.filter(Contract.status == status.upper())
    if security_function:
        query = query.filter(Contract.security_function == security_function)
    if security_capability:
        query = query.filter(Contract.security_capability == security_capability)
    if vendor:
        query = query.filter(Contract.vendor.ilike(f"%{vendor}%"))
    if owner:
        query = query.filter(Contract.owner_name.ilike(f"%{owner}%"))
    if currency:
        query = query.filter(Contract.currency == currency)
    if recurring:
        query = query.filter(Contract.recurring == recurring)
    if end_date_from:
        query = query.filter(Contract.end_date >= end_date_from)
    if end_date_to:
        query = query.filter(Contract.end_date <= end_date_to)
    if start_date_from:
        query = query.filter(Contract.start_date >= start_date_from)
    if start_date_to:
        query = query.filter(Contract.start_date <= start_date_to)

    # Sorting
    sort_col = getattr(Contract, sort_by, Contract.end_date)
    if sort_dir == "desc":
        query = query.order_by(sort_col.desc().nullslast())
    else:
        query = query.order_by(sort_col.asc().nullslast())

    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()

    return {"total": total, "page": page, "page_size": page_size, "items": items}


@router.post("", response_model=ContractOut, status_code=201)
def create_contract(payload: ContractCreate, db: Session = Depends(get_db)):
    data = payload.model_dump()
    data["status"] = compute_status(data.get("end_date"))
    contract = Contract(**data)
    db.add(contract)
    db.commit()
    db.refresh(contract)
    return contract


@router.get("/{contract_id}", response_model=ContractOut)
def get_contract(contract_id: int, db: Session = Depends(get_db)):
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    return contract


@router.put("/{contract_id}", response_model=ContractOut)
def update_contract(contract_id: int, payload: ContractUpdate, db: Session = Depends(get_db)):
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(contract, key, value)

    if "end_date" in data:
        contract.status = compute_status(data["end_date"])

    contract.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(contract)
    return contract


@router.delete("/{contract_id}", status_code=204)
def delete_contract(contract_id: int, db: Session = Depends(get_db)):
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    db.delete(contract)
    db.commit()


@router.post("/{contract_id}/archive", response_model=ContractOut)
def archive_contract(contract_id: int, db: Session = Depends(get_db)):
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    contract.archived = True
    contract.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(contract)
    return contract


@router.post("/{contract_id}/unarchive", response_model=ContractOut)
def unarchive_contract(contract_id: int, db: Session = Depends(get_db)):
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    contract.archived = False
    contract.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(contract)
    return contract


_CONTRACT_BOOL_FIELDS = {"nda", "auto_renewal", "amortize", "archived"}
_CONTRACT_INT_FIELDS = {"cost_center", "notification_term_days"}
_CONTRACT_FLOAT_FIELDS = {"contract_amount", "contract_amount_usd"}
_CONTRACT_DATE_FIELDS = {"start_date", "end_date"}


def _parse_contract_row(row: dict) -> dict:
    data = {}
    for k, v in row.items():
        k = k.strip().lower().replace(" ", "_")
        v = v.strip() if isinstance(v, str) else v
        if v == "":
            continue
        if k in _CONTRACT_BOOL_FIELDS:
            data[k] = v.lower() in ("true", "yes", "1")
        elif k in _CONTRACT_INT_FIELDS:
            data[k] = int(v)
        elif k in _CONTRACT_FLOAT_FIELDS:
            data[k] = float(v)
        elif k in _CONTRACT_DATE_FIELDS:
            data[k] = date.fromisoformat(v)
        else:
            data[k] = v
    return data


@router.post("/import-csv")
async def import_contracts_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="File must be a .csv")

    content = await file.read()
    reader = csv.DictReader(io.StringIO(content.decode("utf-8-sig")))

    imported, errors = 0, []
    for i, row in enumerate(reader, start=2):
        try:
            data = _parse_contract_row(row)
            data["status"] = compute_status(data.get("end_date"))
            contract = Contract(**data)
            db.add(contract)
            db.flush()
            imported += 1
        except Exception as e:
            errors.append({"row": i, "error": str(e)})

    db.commit()
    return {"imported": imported, "errors": errors}
