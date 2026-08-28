import networkx as nx
from routing.routing_service import (
    set_graph,
    get_route,
    get_ranked_routes,
    get_map_ready_ranked_routes,
    reroute,
)


def _sample_graph():
    graph = nx.MultiDiGraph()
    graph.graph["crs"] = "epsg:4326"
    graph.add_node(1, x=85.80, y=20.20)
    graph.add_node(2, x=85.81, y=20.21)
    graph.add_edge(1, 2, osmid=101, length=100.0)
    return graph


def test_routing_service_workflow():
    graph = _sample_graph()
    set_graph(graph)

    route = get_route(origin=(20.20, 85.80), destination=(20.21, 85.81), profile="fastest")
    assert route["source"] == 1
    assert route["target"] == 2
    assert "analytics" in route

    ranked = get_ranked_routes(origin=(20.20, 85.80), destination=(20.21, 85.81))
    assert "fastest" in ranked
    assert "safest" in ranked
    assert "balanced" in ranked

    map_ready = get_map_ready_ranked_routes(origin=(20.20, 85.80), destination=(20.21, 85.81))
    assert map_ready["geojson"]["type"] == "FeatureCollection"

    re = reroute(current_position=1, destination=2)
    assert re["source"] == 1
    assert re["target"] == 2
