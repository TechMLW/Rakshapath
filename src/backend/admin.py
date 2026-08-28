from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text

from database import get_db


router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)


# ==========================================
# GET ALL REPORTS
# ==========================================

@router.get("/reports")
def get_all_reports(
    db: Session = Depends(get_db)
):

    try:

        query = text("""
            SELECT
                id,
                user_id,
                report_type,
                description,
                severity,
                status,
                ST_Y(location) AS latitude,
                ST_X(location) AS longitude,
                created_at
            FROM reports
            ORDER BY created_at DESC
        """)

        result = db.execute(query)

        reports = []

        for row in result:

            reports.append({
                "id": row.id,
                "user_id": row.user_id,
                "report_type": row.report_type,
                "description": row.description,
                "severity": row.severity,
                "status": row.status,
                "latitude": row.latitude,
                "longitude": row.longitude,
                "created_at": row.created_at
            })

        return {
            "count": len(reports),
            "reports": reports
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ==========================================
# UPDATE REPORT STATUS
# ==========================================

@router.patch("/reports/{report_id}/status")
def update_report_status(
    report_id: int,
    status: str,
    db: Session = Depends(get_db)
):

    allowed_statuses = [
        "pending",
        "verified",
        "resolved",
        "rejected"
    ]

    if status not in allowed_statuses:

        raise HTTPException(
            status_code=400,
            detail=f"Status must be one of: {allowed_statuses}"
        )

    try:

        query = text("""
            UPDATE reports
            SET status = :status
            WHERE id = :report_id
            RETURNING id
        """)

        result = db.execute(
            query,
            {
                "status": status,
                "report_id": report_id
            }
        )

        row = result.fetchone()

        if row is None:

            raise HTTPException(
                status_code=404,
                detail="Report not found"
            )

        db.commit()

        return {
            "message": "Report status updated successfully",
            "report_id": report_id,
            "status": status
        }

    except HTTPException:

        raise

    except Exception as e:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ==========================================
# ADMIN STATISTICS
# ==========================================

@router.get("/statistics")
def get_statistics(
    db: Session = Depends(get_db)
):

    try:

        total_query = text("""
            SELECT COUNT(*)
            FROM reports
        """)

        pending_query = text("""
            SELECT COUNT(*)
            FROM reports
            WHERE status = 'pending'
        """)

        verified_query = text("""
            SELECT COUNT(*)
            FROM reports
            WHERE status = 'verified'
        """)

        resolved_query = text("""
            SELECT COUNT(*)
            FROM reports
            WHERE status = 'resolved'
        """)

        total = db.execute(
            total_query
        ).scalar() or 0

        pending = db.execute(
            pending_query
        ).scalar() or 0

        verified = db.execute(
            verified_query
        ).scalar() or 0

        resolved = db.execute(
            resolved_query
        ).scalar() or 0

        return {

            "total_reports": total,

            "pending_reports": pending,

            "verified_reports": verified,

            "resolved_reports": resolved

        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )