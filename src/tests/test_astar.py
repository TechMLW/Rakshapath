import networkx as nx
import pytest

from routing.astar import find_shortest_path
from routing.edge_weights import get_weight_function


def _sample_graph():
    graph = nx.MultiDiGraph()
    graph.graph["crs"] = "epsg:4326"
    graph.add_node(1, x=85.80, y=20.20)
    graph.add_node(2, x=85.81, y=20.21)
    graph.add_node(3, x=85.82, y=20.22)
    graph.add_edge(1, 2, osmid=101, length=100.0)
    graph.add_edge(2, 3, osmid=102, length=150.0)
    graph.add_edge(1, 3, osmid=103, length=300.0)
    return graph


def test_astar_finds_shortest_path():
    graph = _sample_graph()
    weight_fn = get_weight_function("fastest")
    res = find_shortest_path(
        graph,
        origin=(20.20, 85.80),
        destination=(20.22, 85.82),
        weight_function=weight_fn,
    )
    assert res["source"] == 1
    assert res["target"] == 3
    assert res["route"] == [1, 2, 3]
    assert len(res["coordinates"]) == 3
    assert res["cost"] == pytest.approx(250.0)
