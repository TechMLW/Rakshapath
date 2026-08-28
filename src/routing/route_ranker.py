from .astar import find_shortest_path
from .edge_weights import get_weight_function
from .route_analytics import compute_route_analytics


def rank_routes(
    graph,
    origin,
    destination,
    dynamic_weights=None,
):
    fastest_path = find_shortest_path(
        graph,
        origin,
        destination,
        get_weight_function("fastest", dynamic_weights),
    )

    safest_path = find_shortest_path(
        graph,
        origin,
        destination,
        get_weight_function("safest", dynamic_weights),
    )

    balanced_path = find_shortest_path(
        graph,
        origin,
        destination,
        get_weight_function("balanced", dynamic_weights),
    )

    return {
        "fastest": compute_route_analytics(graph, fastest_path, dynamic_weights),
        "safest": compute_route_analytics(graph, safest_path, dynamic_weights),
        "balanced": compute_route_analytics(graph, balanced_path, dynamic_weights),
    }