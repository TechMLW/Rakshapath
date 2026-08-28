from pathlib import Path

import networkx as nx
import osmnx as ox

from .config import (
    GRAPHML_PATH,
    PLACE_NAME,
    NETWORK_TYPE,
    REGIONS,
    DEFAULT_REGION,
)


def get_region_config(region_name: str | None = None) -> dict:
    if region_name is None:
        return REGIONS[DEFAULT_REGION]

    normalized = str(region_name).strip().lower().replace(" ", "_").replace("-", "_")
    if normalized in REGIONS:
        return REGIONS[normalized]
    if normalized in ("seven_sisters", "sevensisters", "north_east", "ne"):
        return REGIONS["northeast"]
    if normalized == "arunachal":
        return REGIONS["arunachal_pradesh"]

    for reg_key, reg_info in REGIONS.items():
        if reg_info["name"].lower() == str(region_name).strip().lower():
            return reg_info

    valid_regions = ", ".join(REGIONS.keys())
    raise KeyError(f"Unknown region '{region_name}'. Available regions: {valid_regions}")


def load_or_build_graph(
    graphml_path: Path | None = None,
    place_name: str | list[str] | None = None,
    region: str | None = None,
    *,
    download: bool = True,
) -> nx.MultiDiGraph:
    if region:
        reg_info = get_region_config(region)
        path = reg_info["path"]
        target_place = reg_info["place_name"]
    else:
        path = GRAPHML_PATH if graphml_path is None else Path(graphml_path)
        target_place = PLACE_NAME if place_name is None else place_name

    if path.exists():
        return ox.io.load_graphml(path)
    if not download:
        raise FileNotFoundError(f"Graph cache not found: {path}")

    path.parent.mkdir(parents=True, exist_ok=True)
    graph = ox.graph.graph_from_place(target_place, network_type=NETWORK_TYPE)
    ox.io.save_graphml(graph, filepath=path)
    return graph


