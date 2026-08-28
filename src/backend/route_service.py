import math

from routing.routing_service import (
    get_map_ready_ranked_routes,
    get_map_ready_route,
    reroute as service_reroute,
    get_graph,
)


def calculate_distance(
    lat1,
    lon1,
    lat2,
    lon2
):
    R = 6371

    lat1 = math.radians(lat1)
    lat2 = math.radians(lat2)

    dlat = lat2 - lat1
    dlon = math.radians(lon2 - lon1)

    a = (
        math.sin(dlat / 2) ** 2
        +
        math.cos(lat1)
        * math.cos(lat2)
        * math.sin(dlon / 2) ** 2
    )

    c = 2 * math.atan2(
        math.sqrt(a),
        math.sqrt(1 - a)
    )

    return R * c


def calculate_safety_score(
    reports
):
    risk_score = 0

    for report in reports:
        severity = str(report.get("severity", "medium")).lower()

        if severity == "low":
            risk_score += 5
        elif severity == "medium":
            risk_score += 15
        elif severity == "high":
            risk_score += 30
        elif severity == "critical":
            risk_score += 50
        else:
            risk_score += 10

    safety_score = max(
        0,
        100 - risk_score
    )

    return safety_score


def get_risk_level(
    safety_score
):
    if safety_score >= 80:
        return "LOW"
    elif safety_score >= 60:
        return "MEDIUM"
    elif safety_score >= 40:
        return "HIGH"
    else:
        return "CRITICAL"


def compute_optimized_routes(
    start_lat: float,
    start_lon: float,
    dest_lat: float,
    dest_lon: float,
    profile: str = "balanced",
    region: str = "bhubaneswar",
    dynamic_weights: dict | None = None,
):
    origin = (start_lat, start_lon)
    destination = (dest_lat, dest_lon)
    graph = get_graph(region=region)
    return get_map_ready_ranked_routes(
        origin=origin,
        destination=destination,
        dynamic_weights=dynamic_weights,
        default_recommended=profile,
        graph=graph,
    )


def compute_reroute(
    current_lat: float,
    current_lon: float,
    dest_lat: float,
    dest_lon: float,
    current_route: list[int] | None = None,
    current_node_index: int = 0,
    profile: str = "balanced",
    region: str = "bhubaneswar",
    dynamic_weights: dict | None = None,
    cost_increase_threshold: float = 1.15,
):
    current_pos = (current_lat, current_lon)
    destination = (dest_lat, dest_lon)
    graph = get_graph(region=region)
    return service_reroute(
        current_position=current_pos,
        destination=destination,
        current_route=current_route,
        current_node_index=current_node_index,
        profile=profile,
        dynamic_weights=dynamic_weights,
        cost_increase_threshold=cost_increase_threshold,
        graph=graph,
    )