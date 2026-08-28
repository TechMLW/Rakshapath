import math
import networkx as nx
import osmnx as ox



def find_shortest_path(
    graph: nx.MultiDiGraph,
    origin: tuple[float, float],
    destination: tuple[float, float],
    weight_function,
):
    source = ox.distance.nearest_nodes(
        graph,
        origin[1],
        origin[0],
    )

    target = ox.distance.nearest_nodes(
        graph,
        destination[1],
        destination[0],
    )

    def _heuristic(u, v):
        node_u = graph.nodes[u]
        node_v = graph.nodes[v]
        dx = node_u["x"] - node_v["x"]
        dy = node_u["y"] - node_v["y"]
        return (dx * dx + dy * dy) ** 0.5

    route = nx.astar_path(
        graph,
        source,
        target,
        heuristic=_heuristic,
        weight=weight_function,
    )

    distance = 0.0

    for u, v in zip(route[:-1], route[1:]):
        distance += weight_function(
            u,
            v,
            graph.get_edge_data(u, v),
        )

    coordinates = [
        (
            graph.nodes[node]["y"],
            graph.nodes[node]["x"],
        )
        for node in route
    ]

    return {
        "source": source,
        "target": target,
        "route": route,
        "coordinates": coordinates,
        "cost": distance,
    }