from graph.graph_builder import load_or_build_graph
from .astar import find_shortest_path
from .edge_weights import get_weight_function
from .route_analytics import compute_route_analytics
from .route_ranker import rank_routes
from .rerouting import dynamic_reroute
from .frontend_export import (
    format_frontend_response,
    routes_to_geojson_feature_collection,
    route_to_geojson_feature,
    route_to_leaflet_polyline,
)


_GRAPH_CACHES: dict[tuple, object] = {}


def get_graph(graphml_path=None, region=None):
    global _GRAPH_CACHES
    cache_key = (str(region) if region else "default", str(graphml_path) if graphml_path else "default")
    if cache_key not in _GRAPH_CACHES:
        _GRAPH_CACHES[cache_key] = load_or_build_graph(graphml_path=graphml_path, region=region)
    return _GRAPH_CACHES[cache_key]


def set_graph(graph, region=None, graphml_path=None):
    global _GRAPH_CACHES
    cache_key = (str(region) if region else "default", str(graphml_path) if graphml_path else "default")
    _GRAPH_CACHES[cache_key] = graph
    _GRAPH_CACHES[("default", "default")] = graph


def get_route(
    origin: tuple[float, float],
    destination: tuple[float, float],
    profile: str = "balanced",
    dynamic_weights: dict | None = None,
    graph=None,
) -> dict:
    active_graph = graph if graph is not None else get_graph()
    weight_fn = get_weight_function(profile=profile, dynamic_weights=dynamic_weights)
    path_data = find_shortest_path(
        graph=active_graph,
        origin=origin,
        destination=destination,
        weight_function=weight_fn,
    )
    return compute_route_analytics(
        graph=active_graph,
        route_data=path_data,
        dynamic_weights=dynamic_weights,
    )


def get_ranked_routes(
    origin: tuple[float, float],
    destination: tuple[float, float],
    dynamic_weights: dict | None = None,
    graph=None,
) -> dict:
    active_graph = graph if graph is not None else get_graph()
    return rank_routes(
        graph=active_graph,
        origin=origin,
        destination=destination,
        dynamic_weights=dynamic_weights,
    )


def get_map_ready_ranked_routes(
    origin: tuple[float, float],
    destination: tuple[float, float],
    dynamic_weights: dict | None = None,
    default_recommended: str = "balanced",
    graph=None,
) -> dict:
    ranked = get_ranked_routes(
        origin=origin,
        destination=destination,
        dynamic_weights=dynamic_weights,
        graph=graph,
    )
    return format_frontend_response(ranked, default_recommended=default_recommended)


def get_map_ready_route(
    origin: tuple[float, float],
    destination: tuple[float, float],
    profile: str = "balanced",
    dynamic_weights: dict | None = None,
    graph=None,
) -> dict:
    route_data = get_route(
        origin=origin,
        destination=destination,
        profile=profile,
        dynamic_weights=dynamic_weights,
        graph=graph,
    )
    return {
        "geojson": route_to_geojson_feature(route_data, profile=profile),
        "polyline": route_to_leaflet_polyline(route_data),
        "route": route_data,
    }


def reroute(
    current_position: tuple[float, float] | int,
    destination: tuple[float, float] | int,
    current_route: list[int] | None = None,
    current_node_index: int = 0,
    profile: str = "balanced",
    dynamic_weights: dict | None = None,
    cost_increase_threshold: float = 1.15,
    graph=None,
) -> dict:
    active_graph = graph if graph is not None else get_graph()
    reroute_data = dynamic_reroute(
        graph=active_graph,
        current_position=current_position,
        destination=destination,
        current_route=current_route,
        current_node_index=current_node_index,
        profile=profile,
        dynamic_weights=dynamic_weights,
        cost_increase_threshold=cost_increase_threshold,
    )
    res = compute_route_analytics(
        graph=active_graph,
        route_data=reroute_data,
        dynamic_weights=dynamic_weights,
    )
    res["rerouted"] = reroute_data.get("rerouted", False)
    res["hazards_detected"] = reroute_data.get("hazards_detected", [])
    return res

