import networkx as nx
import osmnx as ox


def _default_weight(u, v, data):
    if not data:
        return 1.0
    edge = min(
        data.values(),
        key=lambda e: e.get("length", 1.0),
    )
    return edge.get("length", 1.0)


def find_shortest_path(
    graph: nx.MultiDiGraph,
    origin: tuple[float, float],
    destination: tuple[float, float],
    weight_function=None,
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

    weight_fn = weight_function if weight_function is not None else _default_weight

    route = nx.shortest_path(
        graph,
        source,
        target,
        weight=weight_fn,
    )

    distance = 0.0
    for u, v in zip(route[:-1], route[1:]):
        edge_data = graph.get_edge_data(u, v)
        if edge_data:
            distance += weight_fn(u, v, edge_data)

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
        "distance": distance,
        "cost": distance,
    }