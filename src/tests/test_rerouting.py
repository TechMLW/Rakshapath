import networkx as nx
import pytest

from routing.rerouting import (
    calculate_path_cost,
    should_reroute,
    dynamic_reroute,
    detect_route_hazards,
)
from routing.edge_weights import get_weight_function


def _sample_graph():
    graph = nx.MultiDiGraph()
    graph.graph["crs"] = "epsg:4326"
    graph.add_node(1, x=85.80, y=20.20)
    graph.add_node(2, x=85.81, y=20.21)
    graph.add_node(3, x=85.82, y=20.22)
    graph.add_node(4, x=85.81, y=20.23)
    graph.add_edge(1, 2, osmid=101, length=100.0)
    graph.add_edge(2, 3, osmid=102, length=100.0)
    graph.add_edge(1, 4, osmid=103, length=120.0)
    graph.add_edge(4, 3, osmid=104, length=120.0)
    return graph


def test_calculate_path_cost():
    graph = _sample_graph()
    weight_fn = get_weight_function("fastest")
    cost = calculate_path_cost(graph, [1, 2, 3], weight_fn)
    assert cost == pytest.approx(200.0)


def test_should_reroute_trigger():
    graph = _sample_graph()
    route = [1, 2, 3]
    dynamic_weights = {(1, 2): {"traffic": 3.0}}

    needs_reroute, base_cost, dynamic_cost = should_reroute(
        graph,
        route,
        profile="fastest",
        dynamic_weights=dynamic_weights,
        cost_increase_threshold=1.15,
    )
    assert needs_reroute is True
    assert dynamic_cost > base_cost


def test_dynamic_reroute_picks_alternate():
    graph = _sample_graph()
    dynamic_weights = {(1, 2): {"traffic": 5.0}}

    res = dynamic_reroute(
        graph,
        current_position=1,
        destination=3,
        current_route=[1, 2, 3],
        current_node_index=0,
        profile="fastest",
        dynamic_weights=dynamic_weights,
    )
    assert res["rerouted"] is True
    assert res["route"] == [1, 4, 3]
