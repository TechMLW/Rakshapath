from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text

from database import get_db
from report_schemas import ReportCreate


router = APIRouter(
    prefix="/reports",
    tags=["Safety Reports"]
)


@router.post("/")
def create_report(
    report: ReportCreate,
    db: Session = Depends(get_db)
):

    try:

        query = text("""
            INSERT INTO reports
            (
                user_id,
                report_type,
                description,
                severity,
                location,
                status
            )
            VALUES
            (
                1,
                :report_type,
                :description,
                :severity,
                ST_SetSRID(
                    ST_MakePoint(
                        :longitude,
                        :latitude
                    ),
                    4326
                ),
                'pending'
            )
            RETURNING id
        """)

        result = db.execute(
            query,
            {
                "report_type": report.report_type,
                "description": report.description,
                "severity": report.severity,
                "latitude": report.latitude,
                "longitude": report.longitude
            }
        )

        row = result.fetchone()

        if row is None:
            raise HTTPException(
                status_code=500,
                detail="Report could not be created"
            )

        report_id = row[0]

        db.commit()

        return {
            "message": "Safety report created successfully",
            "report_id": report_id
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
# GET ALL SAFETY REPORTS
# ==========================================

@router.get("/")
def get_reports(
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

        return reports

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
    # ==========================================
# GET REPORTS NEAR A LOCATION
# ==========================================

@router.get("/nearby")
def nearby_reports(
    latitude: float,
    longitude: float,
    radius_km: float = 2,
    db: Session = Depends(get_db)
):

    try:

        query = text("""
            SELECT
                id,
                report_type,
                description,
                severity,
                status,
                ST_Y(location) AS latitude,
                ST_X(location) AS longitude,
                ST_Distance(
                    location::geography,
                    ST_SetSRID(
                        ST_MakePoint(
                            :longitude,
                            :latitude
                        ),
                        4326
                    )::geography
                ) AS distance_meters

            FROM reports

            WHERE ST_DWithin(
                location::geography,
                ST_SetSRID(
                    ST_MakePoint(
                        :longitude,
                        :latitude
                    ),
                    4326
                )::geography,
                :radius_meters
            )

            ORDER BY distance_meters ASC
        """)

        result = db.execute(
            query,
            {
                "latitude": latitude,
                "longitude": longitude,
                "radius_meters": radius_km * 1000
            }
        )

        reports = []

        for row in result:

            reports.append({
                "id": row.id,
                "report_type": row.report_type,
                "description": row.description,
                "severity": row.severity,
                "status": row.status,
                "latitude": row.latitude,
                "longitude": row.longitude,
                "distance_meters": round(
                    row.distance_meters,
                    2
                )
            })

        return {
            "count": len(reports),
            "radius_km": radius_km,
            "reports": reports
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )