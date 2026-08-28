from pathlib import Path

import networkx as nx
import osmnx as ox
import pytest

from graph.graph_builder import load_or_build_graph, get_region_config
from graph.config import REGIONS


def _tiny_drive_graph() -> nx.MultiDiGraph:
    graph = nx.MultiDiGraph()
    graph.graph["crs"] = "epsg:4326"
    graph.add_node(1, x=85.8245, y=20.2961)
    graph.add_node(2, x=85.8250, y=20.2965)
    graph.add_edge(1, 2, osmid=1, length=50.0)
    return graph


def test_load_or_build_graph_reads_existing_cache(tmp_path: Path) -> None:
    cache_path = tmp_path / "tiny.graphml"
    ox.io.save_graphml(_tiny_drive_graph(), filepath=cache_path)

    loaded = load_or_build_graph(cache_path, download=False)

    assert loaded.number_of_nodes() == 2
    assert loaded.number_of_edges() == 1
    assert loaded.graph.get("crs") == "epsg:4326"


def test_load_or_build_graph_missing_cache_without_download(tmp_path: Path) -> None:
    missing = tmp_path / "missing.graphml"
    with pytest.raises(FileNotFoundError):
        load_or_build_graph(missing, download=False)


def test_get_region_config_resolves_all_regions():
    for region_key in REGIONS:
        config = get_region_config(region_key)
        assert "name" in config
        assert "place_name" in config
        assert "path" in config
        assert "sample_origin" in config
        assert "sample_destination" in config


def test_get_region_config_aliases():
    assert get_region_config("northeast")["name"] == "North East (Combined)"
    assert get_region_config("seven_sisters")["name"] == "North East (Combined)"
    assert get_region_config("arunachal")["name"] == "Arunachal Pradesh"
    assert get_region_config("Assam")["name"] == "Assam"


def test_get_region_config_unknown_raises():
    with pytest.raises(KeyError):
        get_region_config("unknown_region_xyz")

