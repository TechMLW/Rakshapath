import sys
from .graph_builder import load_or_build_graph
from .graph_validator import validate_graph, print_summary
from .config import REGIONS

from routing.route_ranker import rank_routes


def main(region_name: str = "bhubaneswar"):
    region_info = REGIONS.get(region_name, REGIONS["bhubaneswar"])
    graph = load_or_build_graph(region=region_name)

    stats = validate_graph(graph)
    print(f"\nREGION: {region_name.upper()}")
    print_summary(stats)

    routes = rank_routes(
        graph,
        origin=region_info["sample_origin"],
        destination=region_info["sample_destination"],
    )

    for name, route in routes.items():
        print(f"\n{name.upper()}")
        print(f"Cost          : {route['cost']:.2f}")
        print(f"Nodes         : {len(route['route'])}")
        print(f"Distance (km) : {route['analytics']['actual_distance_km']:.3f}")
        print(f"Time (min)    : {route['analytics']['estimated_time_minutes']:.2f}")
        print(f"Safety Score  : {route['analytics']['safety_score']:.1f}")


if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "bhubaneswar"
    main(target)