import pytest
from routing.edge_weights import (
    fastest_cost,
    safest_cost,
    balanced_cost,
    get_weight_function,
)


def test_edge_weights_default():
    edge_data = {0: {"length": 100.0}}
    assert fastest_cost(1, 2, edge_data) == 100.0
    assert safest_cost(1, 2, edge_data) == 100.0
    assert balanced_cost(1, 2, edge_data) == 100.0


def test_edge_weights_dynamic():
    edge_data = {0: {"length": 100.0}}
    dynamic_weights = {
        (1, 2): {"traffic": 2.0, "safety": 1.5, "crime": 1.2, "hazard": 1.1, "flood": 1.0, "weather": 1.0}
    }

    assert fastest_cost(1, 2, edge_data, dynamic_weights) == pytest.approx(220.0)
    assert safest_cost(1, 2, edge_data, dynamic_weights) == pytest.approx(180.0)

    fn = get_weight_function("fastest", dynamic_weights)
    assert fn(1, 2, edge_data) == pytest.approx(220.0)
