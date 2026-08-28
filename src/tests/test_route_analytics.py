import networkx as nx
import pytest

from routing.route_analytics import (
    compute_actual_distance,
    compute_travel_time,
    compute_safety_score,
    compute_route_analytics,
)


def _sample_graph():
    graph = nx.MultiDiGraph()
    graph.graph["crs"] = "epsg:4326"
    graph.add_node(1, x=85.80, y=20.20)
    graph.add_node(2, x=85.81, y=20.21)
    graph.add_edge(1, 2, osmid=101, length=1000.0, maxspeed="60")
    return graph


def test_compute_actual_distance():
    graph = _sample_graph()
    dist = compute_actual_distance(graph, [1, 2])
    assert dist == pytest.approx(1000.0)


def test_compute_travel_time():
    graph = _sample_graph()
    time_sec = compute_travel_time(graph, [1, 2])
    assert time_sec == pytest.approx(60.0)


def test_compute_safety_score():
    graph = _sample_graph()
    score_clean = compute_safety_score(graph, [1, 2])
    assert score_clean == 100.0

    dynamic_weights = {(1, 2): {"safety": 1.5, "crime": 1.5}}
    score_hazard = compute_safety_score(graph, [1, 2], dynamic_weights)
    assert score_hazard < 100.0


def test_compute_route_analytics_structure():
    graph = _sample_graph()
    raw = {"route": [1, 2], "cost": 1000.0, "source": 1, "target": 2}
    analyzed = compute_route_analytics(graph, raw)
    assert "analytics" in analyzed
    assert analyzed["analytics"]["node_count"] == 2
    assert analyzed["analytics"]["actual_distance_km"] == 1.0
