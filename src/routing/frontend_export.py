def route_to_geojson_feature(route_data, profile="route", extra_properties=None):
    coordinates = route_data.get("coordinates", [])
    geojson_coords = [[lon, lat] for lat, lon in coordinates]

    properties = {
        "profile": profile,
        "source": route_data.get("source"),
        "target": route_data.get("target"),
        "analytics": route_data.get("analytics", {}),
    }

    if extra_properties:
        properties.update(extra_properties)

    return {
        "type": "Feature",
        "geometry": {
            "type": "LineString",
            "coordinates": geojson_coords,
        },
        "properties": properties,
    }


def routes_to_geojson_feature_collection(ranked_routes):
    profile_styles = {
        "fastest": {"color": "#3B82F6", "weight": 5, "opacity": 0.8},
        "safest": {"color": "#10B981", "weight": 5, "opacity": 0.8},
        "balanced": {"color": "#8B5CF6", "weight": 5, "opacity": 0.8},
    }

    features = []
    for profile_name, route_data in ranked_routes.items():
        style = profile_styles.get(profile_name, {"color": "#6B7280", "weight": 4, "opacity": 0.7})
        feature = route_to_geojson_feature(
            route_data,
            profile=profile_name,
            extra_properties={"style": style},
        )
        features.append(feature)

    return {
        "type": "FeatureCollection",
        "features": features,
    }


def route_to_leaflet_polyline(route_data):
    coordinates = route_data.get("coordinates", [])
    return [[lat, lon] for lat, lon in coordinates]


def format_frontend_response(ranked_routes, default_recommended="balanced"):
    geojson = routes_to_geojson_feature_collection(ranked_routes)

    routes_summary = {}
    for profile_name, route_data in ranked_routes.items():
        routes_summary[profile_name] = {
            "source": route_data.get("source"),
            "target": route_data.get("target"),
            "polyline": route_to_leaflet_polyline(route_data),
            "analytics": route_data.get("analytics", {}),
        }

    return {
        "recommended": default_recommended,
        "geojson": geojson,
        "routes": routes_summary,
    }
