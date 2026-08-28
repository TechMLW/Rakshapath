import networkx as nx
import osmnx as ox

from .astar import find_shortest_path
from .edge_weights import get_weight_function


def calculate_path_cost(graph, route, weight_function):
    if not route or len(route) < 2:
        return 0.0
    cost = 0.0
    for u, v in zip(route[:-1], route[1:]):
        edge_data = graph.get_edge_data(u, v)
        if edge_data is not None:
            cost += weight_function(u, v, edge_data)
    return cost


def is_edge_affected(u, v, dynamic_weights, threshold=1.2):
    if not dynamic_weights:
        return False
    edge_scores = dynamic_weights.get((u, v))
    if edge_scores is None:
        edge_scores = dynamic_weights.get((str(u), str(v)))
    if edge_scores is None:
        return False
    if isinstance(edge_scores, (int, float)):
        return edge_scores >= threshold
    if isinstance(edge_scores, dict):
        return any(float(val) >= threshold for val in edge_scores.values())
    return False


def detect_route_hazards(route, dynamic_weights, threshold=1.2):
    if not route or not dynamic_weights or len(route) < 2:
        return []
    affected_edges = []
    for u, v in zip(route[:-1], route[1:]):
        if is_edge_affected(u, v, dynamic_weights, threshold):
            affected_edges.append((u, v))
    return affected_edges


def should_reroute(
    graph,
    remaining_route,
    profile="balanced",
    dynamic_weights=None,
    cost_increase_threshold=1.15,
):
    if not remaining_route or len(remaining_route) < 2 or not dynamic_weights:
        return False, 0.0, 0.0

    base_weight_fn = get_weight_function(profile=profile, dynamic_weights=None)
    dynamic_weight_fn = get_weight_function(profile=profile, dynamic_weights=dynamic_weights)

    base_cost = calculate_path_cost(graph, remaining_route, base_weight_fn)
    dynamic_cost = calculate_path_cost(graph, remaining_route, dynamic_weight_fn)

    if base_cost <= 0:
        return False, base_cost, dynamic_cost

    ratio = dynamic_cost / base_cost
    needs_reroute = ratio >= cost_increase_threshold

    return needs_reroute, base_cost, dynamic_cost


def dynamic_reroute(
    graph,
    current_position,
    destination,
    current_route=None,
    current_node_index=0,
    profile="balanced",
    dynamic_weights=None,
    cost_increase_threshold=1.15,
):
    if isinstance(current_position, (tuple, list)):
        current_node = ox.distance.nearest_nodes(
            graph,
            current_position[1],
            current_position[0],
        )
    else:
        current_node = current_position

    if isinstance(destination, (tuple, list)):
        dest_node = ox.distance.nearest_nodes(
            graph,
            destination[1],
            destination[0],
        )
    else:
        dest_node = destination

    dest_coords = (
        graph.nodes[dest_node]["y"],
        graph.nodes[dest_node]["x"],
    )

    if current_route is not None:
        remaining_route = current_route[current_node_index:]
        needs_reroute, base_cost, dynamic_cost = should_reroute(
            graph,
            remaining_route,
            profile=profile,
            dynamic_weights=dynamic_weights,
            cost_increase_threshold=cost_increase_threshold,
        )

        if not needs_reroute:
            coordinates = [
                (graph.nodes[node]["y"], graph.nodes[node]["x"])
                for node in remaining_route
            ]
            return {
                "rerouted": False,
                "source": current_node,
                "target": dest_node,
                "route": remaining_route,
                "coordinates": coordinates,
                "cost": dynamic_cost,
                "hazards_detected": [],
            }

    curr_coords = (
        graph.nodes[current_node]["y"],
        graph.nodes[current_node]["x"],
    )
    weight_fn = get_weight_function(profile=profile, dynamic_weights=dynamic_weights)
    new_route_data = find_shortest_path(
        graph,
        origin=curr_coords,
        destination=dest_coords,
        weight_function=weight_fn,
    )

    hazards = detect_route_hazards(new_route_data["route"], dynamic_weights)

    return {
        "rerouted": True,
        "source": new_route_data["source"],
        "target": new_route_data["target"],
        "route": new_route_data["route"],
        "coordinates": new_route_data["coordinates"],
        "cost": new_route_data["cost"],
        "hazards_detected": hazards,
    }
