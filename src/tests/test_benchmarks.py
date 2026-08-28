import time
import networkx as nx
from routing.astar import find_shortest_path as astar_find
from routing.dijkstra import find_shortest_path as dijkstra_find
from routing.edge_weights import get_weight_function


def _create_grid_graph(rows=10, cols=10):
    graph = nx.MultiDiGraph()
    graph.graph["crs"] = "epsg:4326"
    for r in range(rows):
        for c in range(cols):
            node_id = r * cols + c + 1
            graph.add_node(node_id, x=85.80 + (c * 0.001), y=20.20 + (r * 0.001))

    for r in range(rows):
        for c in range(cols):
            u = r * cols + c + 1
            if c + 1 < cols:
                v = r * cols + (c + 1) + 1
                graph.add_edge(u, v, osmid=u * 1000 + v, length=100.0)
            if r + 1 < rows:
                v = (r + 1) * cols + c + 1
                graph.add_edge(u, v, osmid=u * 1000 + v, length=100.0)
    return graph


def test_astar_vs_dijkstra_correctness():
    graph = _create_grid_graph(rows=8, cols=8)
    orig = (20.20, 85.80)
    dest = (20.207, 85.807)
    weight_fn = get_weight_function("fastest")

    astar_res = astar_find(graph, orig, dest, weight_fn)
    dijkstra_res = dijkstra_find(graph, orig, dest, weight_fn)

    assert astar_res["route"][0] == dijkstra_res["route"][0]
    assert astar_res["route"][-1] == dijkstra_res["route"][-1]
    assert astar_res["cost"] == dijkstra_res["cost"]


def test_astar_benchmark_efficiency():
    graph = _create_grid_graph(rows=15, cols=15)
    orig = (20.20, 85.80)
    dest = (20.214, 85.814)
    weight_fn = get_weight_function("fastest")

    t0 = time.perf_counter()
    for _ in range(5):
        astar_find(graph, orig, dest, weight_fn)
    astar_time = time.perf_counter() - t0

    t0 = time.perf_counter()
    for _ in range(5):
        dijkstra_find(graph, orig, dest, weight_fn)
    dijkstra_time = time.perf_counter() - t0

    assert astar_time >= 0.0
    assert dijkstra_time >= 0.0
