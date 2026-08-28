import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text

from database import get_db
from route_schemas import RouteRequest, RerouteRequest
from route_service import (
    calculate_distance,
    calculate_safety_score,
    get_risk_level,
    compute_optimized_routes,
    compute_reroute,
)

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/routes",
    tags=["Route Optimization"]
)


# ==========================================
# OPTIMIZE ROUTE
# ==========================================

@router.post("/optimize")
def optimize_route(
    route: RouteRequest,
    db: Session = Depends(get_db)
):
    reports = []
    hazard_status = "active"
    hazard_message = "Live community spatial reports retrieved successfully"

    try:
        query = text("""
            SELECT
                id,
                report_type,
                severity,
                description,
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
                5000
            )
            ORDER BY distance_meters ASC
        """)

        result = db.execute(
            query,
            {
                "latitude": route.destination_latitude,
                "longitude": route.destination_longitude
            }
        )

        for row in result:
            reports.append({
                "id": row.id,
                "report_type": row.report_type,
                "severity": row.severity,
                "description": row.description,
                "latitude": row.latitude,
                "longitude": row.longitude,
                "distance_meters": round(row.distance_meters, 2)
            })
    except Exception as db_err:
        logger.warning("PostGIS spatial query failed (running in degraded spatial mode): %s", str(db_err))
        hazard_status = "degraded"
        hazard_message = f"Live PostGIS hazard query unavailable ({type(db_err).__name__}). Using graph network heuristics."
        reports = []

    try:
        map_data = compute_optimized_routes(
            start_lat=route.start_latitude,
            start_lon=route.start_longitude,
            dest_lat=route.destination_latitude,
            dest_lon=route.destination_longitude,
            profile=route.profile,
            region=route.region,
            dynamic_weights=route.dynamic_weights,
        )

        rec_profile = map_data.get("recommended", route.profile)
        rec_route = map_data.get("routes", {}).get(rec_profile, {})
        rec_analytics = rec_route.get("analytics", {})

        safety_score = rec_analytics.get("safety_score", 100.0)
        risk_level = get_risk_level(safety_score)

        return {
            "message": "Route optimization completed",
            "recommended": rec_profile,
            "region": route.region,
            "start": {
                "latitude": route.start_latitude,
                "longitude": route.start_longitude
            },
            "destination": {
                "latitude": route.destination_latitude,
                "longitude": route.destination_longitude
            },
            "distance_km": rec_analytics.get("actual_distance_km", 0.0),
            "estimated_time_minutes": rec_analytics.get("estimated_time_minutes", 0.0),
            "safety_score": safety_score,
            "risk_level": risk_level,
            "routes": map_data.get("routes", {}),
            "geojson": map_data.get("geojson", {}),
            "nearby_hazards": reports,
            "hazard_data_status": hazard_status,
            "hazard_data_message": hazard_message,
        }

    except KeyError as ke:
        logger.error("Unsupported region requested: %s", str(ke))
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported region '{route.region}'. Please select a valid configured region."
        )
    except Exception as e:
        logger.error("Route optimization computation failed: %s", str(e), exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Route calculation error: {str(e)}"
        )


# ==========================================
# REROUTE ROUTE
# ==========================================

@router.post("/reroute")
def reroute_path(
    reroute_req: RerouteRequest,
    db: Session = Depends(get_db)
):
    try:
        reroute_result = compute_reroute(
            current_lat=reroute_req.current_latitude,
            current_lon=reroute_req.current_longitude,
            dest_lat=reroute_req.destination_latitude,
            dest_lon=reroute_req.destination_longitude,
            current_route=reroute_req.current_route,
            current_node_index=reroute_req.current_node_index,
            profile=reroute_req.profile,
            region=reroute_req.region,
            dynamic_weights=reroute_req.dynamic_weights,
            cost_increase_threshold=reroute_req.cost_increase_threshold,
        )

        analytics = reroute_result.get("analytics", {})

        return {
            "message": "Rerouting evaluation completed",
            "rerouted": reroute_result.get("rerouted", False),
            "route": reroute_result.get("route", []),
            "coordinates": reroute_result.get("coordinates", []),
            "distance_km": analytics.get("actual_distance_km", 0.0),
            "estimated_time_minutes": analytics.get("estimated_time_minutes", 0.0),
            "safety_score": analytics.get("safety_score", 100.0),
            "hazards_detected": reroute_result.get("hazards_detected", []),
            "analytics": analytics,
        }

    except KeyError as ke:
        logger.error("Unsupported region requested in reroute: %s", str(ke))
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported region '{reroute_req.region}'."
        )
    except Exception as e:
        logger.error("Dynamic rerouting evaluation failed: %s", str(e), exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Rerouting evaluation error: {str(e)}"
        )