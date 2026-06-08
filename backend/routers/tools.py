import csv
import io
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import or_
from datetime import date, datetime
from typing import Optional

from ..database import get_db
from ..models import SecurityTool
from ..schemas import ToolCreate, ToolUpdate, ToolOut, ToolListResponse

router = APIRouter(prefix="/api/tools", tags=["tools"])


@router.get("", response_model=ToolListResponse)
def list_tools(
    q: Optional[str] = Query(None),
    security_function: Optional[str] = Query(None),
    security_capability: Optional[str] = Query(None),
    deployment_status: Optional[str] = Query(None),
    vendor: Optional[str] = Query(None),
    owner: Optional[str] = Query(None),
    archived: bool = Query(False),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    sort_by: Optional[str] = Query("name"),
    sort_dir: Optional[str] = Query("asc"),
    db: Session = Depends(get_db),
):
    query = db.query(SecurityTool).filter(SecurityTool.archived == archived)

    if q:
        search = f"%{q}%"
        query = query.filter(
            or_(
                SecurityTool.name.ilike(search),
                SecurityTool.vendor.ilike(search),
                SecurityTool.description.ilike(search),
                SecurityTool.owner_name.ilike(search),
            )
        )
    if security_function:
        query = query.filter(SecurityTool.security_function == security_function)
    if security_capability:
        query = query.filter(SecurityTool.security_capability == security_capability)
    if deployment_status:
        query = query.filter(SecurityTool.deployment_status == deployment_status)
    if vendor:
        query = query.filter(SecurityTool.vendor.ilike(f"%{vendor}%"))
    if owner:
        query = query.filter(SecurityTool.owner_name.ilike(f"%{owner}%"))

    sort_col = getattr(SecurityTool, sort_by, SecurityTool.name)
    if sort_dir == "desc":
        query = query.order_by(sort_col.desc().nullslast())
    else:
        query = query.order_by(sort_col.asc().nullslast())

    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return {"total": total, "page": page, "page_size": page_size, "items": items}


@router.post("", response_model=ToolOut, status_code=201)
def create_tool(payload: ToolCreate, db: Session = Depends(get_db)):
    tool = SecurityTool(**payload.model_dump())
    db.add(tool)
    db.commit()
    db.refresh(tool)
    return tool


@router.get("/{tool_id}", response_model=ToolOut)
def get_tool(tool_id: int, db: Session = Depends(get_db)):
    tool = db.query(SecurityTool).filter(SecurityTool.id == tool_id).first()
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    return tool


@router.put("/{tool_id}", response_model=ToolOut)
def update_tool(tool_id: int, payload: ToolUpdate, db: Session = Depends(get_db)):
    tool = db.query(SecurityTool).filter(SecurityTool.id == tool_id).first()
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(tool, key, value)
    tool.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(tool)
    return tool


@router.delete("/{tool_id}", status_code=204)
def delete_tool(tool_id: int, db: Session = Depends(get_db)):
    tool = db.query(SecurityTool).filter(SecurityTool.id == tool_id).first()
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    db.delete(tool)
    db.commit()


@router.post("/{tool_id}/archive", response_model=ToolOut)
def archive_tool(tool_id: int, db: Session = Depends(get_db)):
    tool = db.query(SecurityTool).filter(SecurityTool.id == tool_id).first()
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    tool.archived = True
    tool.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(tool)
    return tool


@router.post("/{tool_id}/unarchive", response_model=ToolOut)
def unarchive_tool(tool_id: int, db: Session = Depends(get_db)):
    tool = db.query(SecurityTool).filter(SecurityTool.id == tool_id).first()
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    tool.archived = False
    tool.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(tool)
    return tool


_TOOL_BOOL_FIELDS = {"archived", "auto_renewal", "supported_by_sae", "annual_vendor_review_reqd"}
_TOOL_INT_FIELDS = {"cost_center", "seat_count", "auto_renewal_notification_term"}
_TOOL_SCORE_FIELDS = {"effectiveness_score", "coverage_score", "score"}
_TOOL_FLOAT_FIELDS = {"contract_cost_usd", "annual_cost"}
_TOOL_DATE_FIELDS = {"last_assessed_date", "next_review_date", "start_date", "end_date", "email_sent"}


_TOOL_COLUMN_MAP = {
    "product": "name",
    "capability": "security_capability",
    "disposition": "deployment_status",
    "function_alignment_nist_csf_2.0": "nist_csf_alignment",
    "internal_contact": "owner_name",
    "internal_contact_email": "owner_email",
    "last_annual_review": "last_assessed_date",
    "auto-renewal_(y/n)": "auto_renewal",
    "auto-renewal_notification_term_(days)": "auto_renewal_notification_term",
    "contract_cost_(usd)": "contract_cost_usd",
    "score_(0-5)": "score",
    "coverage_(0-5)": "coverage_score",
    "effectiveness_(0-5)": "effectiveness_score",
    "annual_vendor_review_reqd?": "annual_vendor_review_reqd",
    "supported_by_sa&e": "supported_by_sae",
}


def _parse_tool_row(row: dict) -> dict:
    data = {}
    for k, v in row.items():
        k = k.strip().lower().replace(" ", "_").replace("/", "_").strip("_")
        k = _TOOL_COLUMN_MAP.get(k, k)
        v = v.strip() if isinstance(v, str) else v
        if v == "" or v is None:
            continue
        if k in _TOOL_BOOL_FIELDS:
            data[k] = str(v).lower() in ("true", "yes", "1", "y")
        elif k in _TOOL_SCORE_FIELDS:
            data[k] = float(str(v))
        elif k in _TOOL_INT_FIELDS:
            data[k] = int(float(str(v)))
        elif k in _TOOL_FLOAT_FIELDS:
            data[k] = float(str(v).replace(",", ""))
        elif k in _TOOL_DATE_FIELDS:
            data[k] = date.fromisoformat(str(v))
        else:
            data[k] = v
    return data


@router.post("/import-csv")
async def import_tools_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="File must be a .csv")

    content = await file.read()
    reader = csv.DictReader(io.StringIO(content.decode("utf-8-sig")))

    imported, errors = 0, []
    for i, row in enumerate(reader, start=2):
        try:
            data = _parse_tool_row(row)
            tool = SecurityTool(**data)
            db.add(tool)
            db.flush()
            imported += 1
        except Exception as e:
            errors.append({"row": i, "error": str(e)})

    db.commit()
    return {"imported": imported, "errors": errors}
