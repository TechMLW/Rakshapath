def _get_edge_data_min(data):
    if not data:
        return {}
    return min(
        data.values(),
        key=lambda e: e.get("length", 1.0),
    )


HIGHWAY_DEFAULT_SPEEDS = {
    "motorway": 75.0,
    "motorway_link": 50.0,
    "trunk": 65.0,
    "trunk_link": 45.0,
    "primary": 50.0,
    "primary_link": 35.0,
    "secondary": 40.0,
    "secondary_link": 30.0,
    "tertiary": 35.0,
    "residential": 25.0,
    "living_street": 15.0,
    "service": 15.0,
    "track": 15.0,
}

HIGHWAY_SAFETY_RATINGS = {
    "motorway": 95.0,
    "trunk": 95.0,
    "primary": 96.0,
    "secondary": 92.0,
    "tertiary": 88.0,
    "residential": 84.0,
    "living_street": 82.0,
    "service": 70.0,
    "track": 60.0,
}


def _parse_speed(maxspeed, default=40.0):
    if maxspeed is None:
        return default
    if isinstance(maxspeed, (int, float)):
        return float(maxspeed)
    if isinstance(maxspeed, list):
        maxspeed = maxspeed[0]
    if isinstance(maxspeed, str):
        clean = "".join(ch for ch in maxspeed if ch.isdigit() or ch == ".")
        try:
            return float(clean) if clean else default
        except ValueError:
            return default
    return default


def compute_actual_distance(graph, route):
    if not route or len(route) < 2:
        return 0.0
    distance = 0.0
    for u, v in zip(route[:-1], route[1:]):
        data = graph.get_edge_data(u, v)
        if data:
            edge = _get_edge_data_min(data)
            distance += float(edge.get("length", 1.0))
    return distance


def compute_travel_time(graph, route, dynamic_weights=None):
    if not route or len(route) < 2:
        return 0.0
    total_seconds = 0.0
    for u, v in zip(route[:-1], route[1:]):
        data = graph.get_edge_data(u, v)
        if not data:
            continue
        edge = _get_edge_data_min(data)
        length = float(edge.get("length", 1.0))
        highway = edge.get("highway")
        if isinstance(highway, list):
            highway = highway[0]
        default_speed = HIGHWAY_DEFAULT_SPEEDS.get(str(highway).lower(), 40.0) if highway else 40.0
        speed_kmh = _parse_speed(edge.get("maxspeed"), default=default_speed)
        speed_ms = (speed_kmh * 1000.0) / 3600.0
        if speed_ms <= 0:
            speed_ms = 11.11
        base_time = length / speed_ms
        traffic = 1.0
        if dynamic_weights:
            edge_scores = dynamic_weights.get((u, v))
            if edge_scores is None:
                edge_scores = dynamic_weights.get((str(u), str(v)))
            if isinstance(edge_scores, dict):
                traffic = float(edge_scores.get("traffic", 1.0))
            elif isinstance(edge_scores, (int, float)):
                traffic = float(edge_scores)
        total_seconds += base_time * traffic
    return total_seconds


def compute_safety_score(graph, route, dynamic_weights=None):
    if not route or len(route) < 2:
        return 100.0
    total_rating = 0.0
    total_penalty = 0.0
    edge_count = 0
    for u, v in zip(route[:-1], route[1:]):
        edge_count += 1
        data = graph.get_edge_data(u, v)
        base_rating = 100.0
        if data:
            edge = _get_edge_data_min(data)
            highway = edge.get("highway")
            if isinstance(highway, list):
                highway = highway[0]
            if highway:
                base_rating = HIGHWAY_SAFETY_RATINGS.get(str(highway).lower(), 90.0)
        total_rating += base_rating

        if dynamic_weights:
            edge_scores = dynamic_weights.get((u, v))
            if edge_scores is None:
                edge_scores = dynamic_weights.get((str(u), str(v)))
            if isinstance(edge_scores, dict):
                safety = float(edge_scores.get("safety", 1.0))
                crime = float(edge_scores.get("crime", 1.0))
                flood = float(edge_scores.get("flood", 1.0))
                hazard = float(edge_scores.get("hazard", 1.0))
                factor = (safety * crime * flood * hazard) - 1.0
                total_penalty += max(0.0, factor)
            elif isinstance(edge_scores, (int, float)):
                total_penalty += max(0.0, float(edge_scores) - 1.0)

    if edge_count == 0:
        return 100.0
    avg_base_rating = total_rating / edge_count
    avg_penalty = total_penalty / edge_count
    score = max(0.0, min(100.0, avg_base_rating - (avg_penalty * 25.0)))
    return round(score, 2)



def compute_route_analytics(graph, route_data, dynamic_weights=None):
    route = route_data.get("route", [])
    routing_cost = route_data.get("cost", 0.0)
    actual_distance = compute_actual_distance(graph, route)
    travel_time = compute_travel_time(graph, route, dynamic_weights)
    safety_score = compute_safety_score(graph, route, dynamic_weights)

    analytics = {
        "node_count": len(route),
        "edge_count": max(0, len(route) - 1),
        "actual_distance_meters": round(actual_distance, 2),
        "actual_distance_km": round(actual_distance / 1000.0, 3),
        "estimated_time_seconds": round(travel_time, 2),
        "estimated_time_minutes": round(travel_time / 60.0, 2),
        "routing_cost": round(routing_cost, 2),
        "safety_score": safety_score,
    }

    result = dict(route_data)
    result["analytics"] = analytics
    return result
