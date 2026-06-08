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


@router.get("/fy-spend")
def get_fy_spend(db: Session = Depends(get_db)):
    """
    Returns summed contract spend by fiscal year and quarter.
    FY runs Nov–Oct; quarters: Q1=Nov/Dec/Jan, Q2=Feb/Mar/Apr, Q3=May/Jun/Jul, Q4=Aug/Sep/Oct.
    """
    from ..models import Contract as C

    FY_QUARTERS = {
        "FY25": {
            "Q1": [C.fy25_nov, C.fy25_dec, C.fy25_jan],
            "Q2": [C.fy25_feb, C.fy25_mar, C.fy25_apr],
            "Q3": [C.fy25_may, C.fy25_jun, C.fy25_jul],
            "Q4": [C.fy25_aug, C.fy25_sep, C.fy25_oct],
        },
        "FY26": {
            "Q1": [C.fy26_nov, C.fy26_dec, C.fy26_jan],
            "Q2": [C.fy26_feb, C.fy26_mar, C.fy26_apr],
            "Q3": [C.fy26_may, C.fy26_jun, C.fy26_jul],
            "Q4": [C.fy26_aug, C.fy26_sep, C.fy26_oct],
        },
        "FY27": {
            "Q1": [C.fy27_nov, C.fy27_dec, C.fy27_jan],
            "Q2": [C.fy27_feb, C.fy27_mar, C.fy27_apr],
            "Q3": [C.fy27_may, C.fy27_jun, C.fy27_jul],
            "Q4": [C.fy27_aug, C.fy27_sep, C.fy27_oct],
        },
        "FY28": {
            "Q1": [C.fy28_nov, C.fy28_dec, C.fy28_jan],
            "Q2": [C.fy28_feb, C.fy28_mar, C.fy28_apr],
            "Q3": [C.fy28_may, C.fy28_jun, C.fy28_jul],
            "Q4": [C.fy28_aug, C.fy28_sep, C.fy28_oct],
        },
    }

    result = []
    for q_label in ["Q1", "Q2", "Q3", "Q4"]:
        row: dict = {"quarter": q_label}
        for fy, quarters in FY_QUARTERS.items():
            cols = quarters[q_label]
            total = db.query(
                func.sum(func.coalesce(cols[0], 0) + func.coalesce(cols[1], 0) + func.coalesce(cols[2], 0))
            ).filter(Contract.archived == False).scalar() or 0
            row[fy] = round(float(total), 2)
        result.append(row)
    return result


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

    # Score distribution buckets (0–5 scale)
    scored = base.filter(SecurityTool.effectiveness_score.isnot(None)).all()
    eff_buckets = {"0-1": 0, "1-2": 0, "2-3": 0, "3-4": 0, "4-5": 0}
    cov_buckets = {"0-1": 0, "1-2": 0, "2-3": 0, "3-4": 0, "4-5": 0}
    for t in scored:
        for buckets, score in [(eff_buckets, t.effectiveness_score), (cov_buckets, t.coverage_score)]:
            if score is None:
                continue
            if score <= 1:
                buckets["0-1"] += 1
            elif score <= 2:
                buckets["1-2"] += 1
            elif score <= 3:
                buckets["2-3"] += 1
            elif score <= 4:
                buckets["3-4"] += 1
            else:
                buckets["4-5"] += 1

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
            "annual_cost": t.annual_cost,
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
