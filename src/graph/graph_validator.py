import networkx as nx


def validate_graph(graph: nx.MultiDiGraph) -> dict:
    if graph is None:
        raise ValueError("Graph is None.")

    nodes = graph.number_of_nodes()
    edges = graph.number_of_edges()

    if nodes == 0:
        raise ValueError("Graph has no nodes.")

    if edges == 0:
        raise ValueError("Graph has no edges.")

    components = list(nx.weakly_connected_components(graph))

    missing_length = sum(
        1
        for _, _, data in graph.edges(data=True)
        if "length" not in data
    )

    return {
        "nodes": nodes,
        "edges": edges,
        "components": len(components),
        "largest_component": len(max(components, key=len)),
        "missing_length": missing_length,
    }


def print_summary(stats):
    print("\n========== GRAPH SUMMARY ==========")
    print(f"Nodes               : {stats['nodes']}")
    print(f"Edges               : {stats['edges']}")
    print(f"Components          : {stats['components']}")
    print(f"Largest Component   : {stats['largest_component']}")
    print(f"Missing Length Attr : {stats['missing_length']}")
    print("===================================\n")