# Speed factor multipliers (relative travel time inverse to speed)
SPEED_FACTORS = {
    "motorway": 0.50,
    "motorway_link": 0.60,
    "trunk": 0.55,
    "trunk_link": 0.65,
    "primary": 0.70,
    "primary_link": 0.75,
    "secondary": 0.85,
    "secondary_link": 0.90,
    "tertiary": 1.00,
    "tertiary_link": 1.00,
    "residential": 1.40,
    "living_street": 1.50,
    "service": 2.00,
    "track": 2.20,
}

# Safety & illumination vulnerability multipliers (higher = more dangerous/unlit)
SAFETY_FACTORS = {
    "motorway": 0.90,
    "motorway_link": 0.95,
    "trunk": 0.90,
    "trunk_link": 0.95,
    "primary": 0.85,
    "primary_link": 0.90,
    "secondary": 0.90,
    "secondary_link": 0.95,
    "tertiary": 1.00,
    "tertiary_link": 1.00,
    "residential": 1.20,
    "living_street": 1.25,
    "service": 2.00,
    "track": 2.20,
}


def _get_edge_attributes(data):
    if not data:
        return 1.0, None
    if "length" in data:
        edge = data
    else:
        edge = min(data.values(), key=lambda e: e.get("length", 1.0))

    length = float(edge.get("length", 1.0))
    highway = edge.get("highway")
    if isinstance(highway, list):
        highway = highway[0]
    return length, str(highway).lower() if highway else None


def _get_dynamic_factor(u, v, dynamic_weights, factor_key, default=1.0):
    if not dynamic_weights:
        return default
    edge_scores = dynamic_weights.get((u, v))
    if edge_scores is None:
        edge_scores = dynamic_weights.get((str(u), str(v)))
    if edge_scores is None:
        if factor_key in dynamic_weights:
            val = dynamic_weights[factor_key]
            if isinstance(val, (int, float)):
                return float(val)
        if dynamic_weights.get("hazard_type") == factor_key:
            return float(dynamic_weights.get("penalty_factor", default))
        return default
    if isinstance(edge_scores, (int, float)):
        return float(edge_scores)
    if isinstance(edge_scores, dict):
        return float(edge_scores.get(factor_key, default))
    return default


def fastest_cost(u, v, data, dynamic_weights=None):
    length, highway = _get_edge_attributes(data)
    speed_factor = SPEED_FACTORS.get(highway, 1.0)
    traffic = _get_dynamic_factor(u, v, dynamic_weights, "traffic", 1.0)
    hazard = _get_dynamic_factor(u, v, dynamic_weights, "hazard", 1.0)
    return length * speed_factor * traffic * hazard


def safest_cost(u, v, data, dynamic_weights=None):
    length, highway = _get_edge_attributes(data)
    safety_factor = SAFETY_FACTORS.get(highway, 1.0)
    safety = _get_dynamic_factor(u, v, dynamic_weights, "safety", 1.0)
    crime = _get_dynamic_factor(u, v, dynamic_weights, "crime", 1.0)
    flood = _get_dynamic_factor(u, v, dynamic_weights, "flood", 1.0)
    return length * safety_factor * safety * crime * flood


def balanced_cost(u, v, data, dynamic_weights=None):
    f_cost = fastest_cost(u, v, data, dynamic_weights)
    s_cost = safest_cost(u, v, data, dynamic_weights)
    return 0.45 * f_cost + 0.55 * s_cost


def get_weight_function(profile="balanced", dynamic_weights=None):
    if profile == "fastest":
        return lambda u, v, data: fastest_cost(u, v, data, dynamic_weights)
    elif profile == "safest":
        return lambda u, v, data: safest_cost(u, v, data, dynamic_weights)
    elif profile == "balanced":
        return lambda u, v, data: balanced_cost(u, v, data, dynamic_weights)
    else:
        return lambda u, v, data: balanced_cost(u, v, data, dynamic_weights)