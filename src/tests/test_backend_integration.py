import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[2] / "src" / "backend"
SRC_DIR = Path(__file__).resolve().parents[2] / "src"
for _p in (SRC_DIR, BACKEND_DIR):
    if str(_p) not in sys.path:
        sys.path.insert(0, str(_p))

from fastapi.testclient import TestClient
from main import app


def test_backend_home_endpoint():
    client = TestClient(app)
    response = client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()


def test_backend_route_optimization_integration():
    client = TestClient(app)
    payload = {
        "start_latitude": 20.2961,
        "start_longitude": 85.8245,
        "destination_latitude": 20.3537,
        "destination_longitude": 85.8195,
        "profile": "balanced",
        "region": "bhubaneswar",
    }
    response = client.post("/routes/optimize", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["message"] == "Route optimization completed"
    assert data["recommended"] == "balanced"
    assert "routes" in data
    assert "fastest" in data["routes"]
    assert "safest" in data["routes"]
    assert "balanced" in data["routes"]
    assert data["distance_km"] > 0
    assert data["estimated_time_minutes"] > 0
    assert data["geojson"]["type"] == "FeatureCollection"
    assert len(data["geojson"]["features"]) == 3


def test_backend_route_reroute_integration():
    client = TestClient(app)
    payload = {
        "current_latitude": 20.2961,
        "current_longitude": 85.8245,
        "destination_latitude": 20.3537,
        "destination_longitude": 85.8195,
        "profile": "fastest",
        "region": "bhubaneswar",
    }
    response = client.post("/routes/reroute", json=payload)
    assert response.status_code == 200
    data = response.json()

def test_backend_cors_headers():
    client = TestClient(app)
    response = client.options(
        "/routes/optimize",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:3000"


def test_backend_invalid_coordinates_validation():
    client = TestClient(app)
    # Latitude > 90 must fail validation with 422
    payload = {
        "start_latitude": 999.0,
        "start_longitude": 85.8245,
        "destination_latitude": 20.3537,
        "destination_longitude": 85.8195,
    }
    response = client.post("/routes/optimize", json=payload)
    assert response.status_code == 422


def test_backend_unsupported_region_rejection():
    client = TestClient(app)
    payload = {
        "start_latitude": 20.2961,
        "start_longitude": 85.8245,
        "destination_latitude": 20.3537,
        "destination_longitude": 85.8195,
        "region": "non_existent_galaxy_region",
    }
    response = client.post("/routes/optimize", json=payload)
    assert response.status_code == 400
    assert "Unsupported region" in response.json()["detail"]


def test_backend_degraded_hazard_status_returned():
    client = TestClient(app)
    payload = {
        "start_latitude": 20.2961,
        "start_longitude": 85.8245,
        "destination_latitude": 20.3537,
        "destination_longitude": 85.8195,
        "region": "bhubaneswar",
    }
    response = client.post("/routes/optimize", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "hazard_data_status" in data
    assert data["hazard_data_status"] in ("active", "degraded")
    assert "hazard_data_message" in data
