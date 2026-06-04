from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from datetime import date, timedelta
from typing import Optional

from ..database import get_db
from ..models import Contract, SecurityTool

router = APIRouter(prefix="/api/reports", tags=["reports"])

GROUPABLE_FIELDS = {
    "security_function": Contract.security_function,
    "security_capability": Contract.security_capability,
    "vendor": Contract.vendor,
    "owner_name": Contract.owner_name,
    "currency": Contract.currency,
    "status": Contract.status,
    "recurring": Contract.recurring,
    "cost_center": Contract.cost_center,
}


@router.get("/summary")
def get_summary(db: Session = Depends(get_db)):
    today = date.today()
    in30 = today + timedelta(days=30)
    in60 = today + timedelta(days=60)
    in90 = today + timedelta(days=90)

    base = db.query(Contract).filter(Contract.archived == False)

    total_active = base.filter(Contract.status == "ACTIVE").count()
    total_inactive = base.filter(Contract.status == "INACTIVE").count()
    total_all = base.count()

    annual_spend = (
        db.query(func.sum(Contract.contract_amount_usd))
        .filter(Contract.archived == False, Contract.status == "ACTIVE")
        .scalar()
        or 0
    )

    expiring_30 = base.filter(
        Contract.status == "ACTIVE",
        Contract.end_date >= today,
        Contract.end_date <= in30,
    ).count()

    expiring_60 = base.filter(
        Contract.status == "ACTIVE",
        Contract.end_date >= today,
        Contract.end_date <= in60,
    ).count()

    expiring_90 = base.filter(
        Contract.status == "ACTIVE",
        Contract.end_date >= today,
        Contract.end_date <= in90,
    ).count()

    do_not_renew = base.filter(
        Contract.do_not_renew.isnot(None),
        Contract.do_not_renew != "",
    ).count()

    return {
        "total_active": total_active,
        "total_inactive": total_inactive,
        "total_all": total_all,
        "annual_spend_usd": round(annual_spend, 2),
        "expiring_30_days": expiring_30,
        "expiring_60_days": expiring_60,
        "expiring_90_days": expiring_90,
        "do_not_renew_count": do_not_renew,
    }


@router.get("/group")
def get_grouped_report(
    group_by: str = Query("security_function"),
    db: Session = Depends(get_db),
):
    if group_by not in GROUPABLE_FIELDS:
        return {"error": f"group_by must be one of: {list(GROUPABLE_FIELDS.keys())}"}

    col = GROUPABLE_FIELDS[group_by]

    rows = (
        db.query(
            col.label("group_value"),
            func.count(Contract.id).label("count"),
            func.sum(Contract.contract_amount_usd).label("total_usd"),
            func.avg(Contract.contract_amount_usd).label("avg_usd"),
            func.sum(
                case((Contract.status == "ACTIVE", 1), else_=0)
            ).label("active_count"),
        )
        .filter(Contract.archived == False)
        .group_by(col)
        .order_by(func.sum(Contract.contract_amount_usd).desc().nullslast())
        .all()
    )

    return [
        {
            "group_value": r.group_value or "Unassigned",
            "count": r.count,
            "total_usd": round(r.total_usd or 0, 2),
            "avg_usd": round(r.avg_usd or 0, 2),
            "active_count": r.active_count,
        }
        for r in rows
    ]


@router.get("/expiring")
def get_expiring_contracts(
    days: int = Query(90),
    db: Session = Depends(get_db),
):
    today = date.today()
    cutoff = today + timedelta(days=days)
    contracts = (
        db.query(Contract)
        .filter(
            Contract.archived == False,
            Contract.status == "ACTIVE",
            Contract.end_date >= today,
            Contract.end_date <= cutoff,
        )
        .order_by(Contract.end_date.asc())
        .all()
    )
    return contracts


# ── Tool Reporting ──────────────────────────────────────────────

TOOL_GROUPABLE = {
    "security_function": SecurityTool.security_function,
    "security_capability": SecurityTool.security_capability,
    "vendor": SecurityTool.vendor,
    "deployment_status": SecurityTool.deployment_status,
    "owner_name": SecurityTool.owner_name,
}


@router.get("/tools/summary")
def get_tool_summary(db: Session = Depends(get_db)):
    base = db.query(SecurityTool).filter(SecurityTool.archived == False)
    total = base.count()
    active = base.filter(SecurityTool.deployment_status == "Active").count()
    evaluation = base.filter(SecurityTool.deployment_status == "Evaluation").count()
    deprecated = base.filter(SecurityTool.deployment_status == "Deprecated").count()
    retired = base.filter(SecurityTool.deployment_status == "Retired").count()

    avg_eff = db.query(func.avg(SecurityTool.effectiveness_score)).filter(
        SecurityTool.archived == False,
        SecurityTool.effectiveness_score.isnot(None),
    ).scalar() or 0

    avg_cov = db.query(func.avg(SecurityTool.coverage_score)).filter(
        SecurityTool.archived == False,
        SecurityTool.coverage_score.isnot(None),
    ).scalar() or 0

    # Score distribution buckets
    scored = base.filter(SecurityTool.effectiveness_score.isnot(None)).all()
    eff_buckets = {"0-25": 0, "26-50": 0, "51-75": 0, "76-100": 0}
    cov_buckets = {"0-25": 0, "26-50": 0, "51-75": 0, "76-100": 0}
    for t in scored:
        for buckets, score in [(eff_buckets, t.effectiveness_score), (cov_buckets, t.coverage_score)]:
            if score is None:
                continue
            if score <= 25:
                buckets["0-25"] += 1
            elif score <= 50:
                buckets["26-50"] += 1
            elif score <= 75:
                buckets["51-75"] += 1
            else:
                buckets["76-100"] += 1

    return {
        "total": total,
        "by_status": {"active": active, "evaluation": evaluation, "deprecated": deprecated, "retired": retired},
        "avg_effectiveness_score": round(avg_eff, 1),
        "avg_coverage_score": round(avg_cov, 1),
        "effectiveness_distribution": [
            {"range": k, "count": v} for k, v in eff_buckets.items()
        ],
        "coverage_distribution": [
            {"range": k, "count": v} for k, v in cov_buckets.items()
        ],
    }


@router.get("/tools/scores")
def get_tool_scores(db: Session = Depends(get_db)):
    tools = (
        db.query(SecurityTool)
        .filter(
            SecurityTool.archived == False,
            SecurityTool.effectiveness_score.isnot(None),
            SecurityTool.coverage_score.isnot(None),
        )
        .order_by(SecurityTool.effectiveness_score.desc())
        .all()
    )
    return [
        {
            "id": t.id,
            "name": t.name,
            "vendor": t.vendor,
            "security_function": t.security_function,
            "deployment_status": t.deployment_status,
            "effectiveness_score": t.effectiveness_score,
            "coverage_score": t.coverage_score,
        }
        for t in tools
    ]


@router.get("/tools/group")
def get_tool_group(
    group_by: str = Query("security_function"),
    db: Session = Depends(get_db),
):
    if group_by not in TOOL_GROUPABLE:
        return {"error": f"group_by must be one of: {list(TOOL_GROUPABLE.keys())}"}

    col = TOOL_GROUPABLE[group_by]
    rows = (
        db.query(
            col.label("group_value"),
            func.count(SecurityTool.id).label("count"),
            func.avg(SecurityTool.effectiveness_score).label("avg_effectiveness"),
            func.avg(SecurityTool.coverage_score).label("avg_coverage"),
        )
        .filter(SecurityTool.archived == False)
        .group_by(col)
        .order_by(func.avg(SecurityTool.effectiveness_score).desc().nullslast())
        .all()
    )
    return [
        {
            "group_value": r.group_value or "Unassigned",
            "count": r.count,
            "avg_effectiveness": round(r.avg_effectiveness or 0, 1),
            "avg_coverage": round(r.avg_coverage or 0, 1),
        }
        for r in rows
    ]
