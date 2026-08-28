from routing.frontend_export import (
    route_to_geojson_feature,
    routes_to_geojson_feature_collection,
    route_to_leaflet_polyline,
    format_frontend_response,
)


def _sample_route_data():
    return {
        "source": 1,
        "target": 2,
        "route": [1, 2],
        "coordinates": [(20.20, 85.80), (20.21, 85.81)],
        "cost": 100.0,
        "analytics": {"node_count": 2, "actual_distance_km": 0.1},
    }


def test_route_to_geojson_feature():
    data = _sample_route_data()
    feature = route_to_geojson_feature(data, profile="fastest")
    assert feature["type"] == "Feature"
    assert feature["geometry"]["type"] == "LineString"
    assert feature["geometry"]["coordinates"] == [[85.80, 20.20], [85.81, 20.21]]
    assert feature["properties"]["profile"] == "fastest"


def test_routes_to_geojson_feature_collection():
    data = _sample_route_data()
    fc = routes_to_geojson_feature_collection({"fastest": data, "safest": data})
    assert fc["type"] == "FeatureCollection"
    assert len(fc["features"]) == 2


def test_format_frontend_response():
    data = _sample_route_data()
    res = format_frontend_response({"fastest": data, "safest": data, "balanced": data})
    assert "geojson" in res
    assert "routes" in res
    assert res["recommended"] == "balanced"
    assert res["routes"]["fastest"]["polyline"] == [[20.20, 85.80], [20.21, 85.81]]
