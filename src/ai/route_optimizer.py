"""
ai/route_optimizer.py
------------------------
Multi-objective route optimizer. Wraps graph/dijkstra.py-equivalent logic
(here implemented directly with networkx) and blends distance/time against
safety risk according to a chosen route "mode": safest, fastest, or
balanced. This is what powers the three buttons on the Home Screen.

Edge weight design (the "Multi-Objective Optimization" feature):
    cost = alpha * normalized_time + beta * normalized_risk

  * mode="fastest" -> alpha=1.0, beta=0.0   (pure shortest time)
  * mode="safest"  -> alpha=0.2, beta=0.8   (heavily risk-averse)
  * mode="balanced"-> alpha=0.5, beta=0.5

Risk per edge comes from ai/safety_score.py (100 - safety_score, normalized
to 0-1) so this module never computes risk itself — it only consumes it.
"""

from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple
import networkx as nx

MODE_WEIGHTS = {
    "fastest": (1.0, 0.0),
    "safest": (0.2, 0.8),
    "balanced": (0.5, 0.5),
}


@dataclass
class RouteResult:
    path: List[str]
    total_time_minutes: float
    total_risk_pct: float          # average risk across edges, 0-100
    mode: str
    edge_details: List[dict]


class RouteOptimizer:
    def __init__(self, graph: Optional[nx.DiGraph] = None):
        # graph edges are expected to carry:
        #   time_minutes: float
        #   risk: float (0-1, from ai/safety_score.py's 100-score, normalized)
        self.graph = graph if graph is not None else nx.DiGraph()

    def add_segment(self, node_a: str, node_b: str, time_minutes: float, risk: float, bidirectional: bool = True):
        self.graph.add_edge(node_a, node_b, time_minutes=time_minutes, risk=max(0.0, min(1.0, risk)))
        if bidirectional:
            self.graph.add_edge(node_b, node_a, time_minutes=time_minutes, risk=max(0.0, min(1.0, risk)))

    def _weighted_cost(self, u, v, data, alpha, beta) -> float:
        # time is normalized against a generous cap so it's comparable to the 0-1 risk scale
        normalized_time = min(data["time_minutes"] / 30.0, 1.0)
        return alpha * normalized_time + beta * data["risk"]

    def find_route(self, source: str, destination: str, mode: str = "balanced") -> RouteResult:
        if mode not in MODE_WEIGHTS:
            raise ValueError(f"mode must be one of {list(MODE_WEIGHTS)}")
        alpha, beta = MODE_WEIGHTS[mode]

        weight_fn = lambda u, v, d: self._weighted_cost(u, v, d, alpha, beta)
        path = nx.shortest_path(self.graph, source, destination, weight=weight_fn)

        total_time = 0.0
        risks = []
        edge_details = []
        for u, v in zip(path[:-1], path[1:]):
            data = self.graph[u][v]
            total_time += data["time_minutes"]
            risks.append(data["risk"])
            edge_details.append({
                "from": u, "to": v,
                "time_minutes": data["time_minutes"],
                "risk_pct": round(data["risk"] * 100, 1),
            })

        avg_risk_pct = round((sum(risks) / len(risks)) * 100, 1) if risks else 0.0

        return RouteResult(
            path=path,
            total_time_minutes=round(total_time, 1),
            total_risk_pct=avg_risk_pct,
            mode=mode,
            edge_details=edge_details,
        )

    def compare_modes(self, source: str, destination: str) -> Dict[str, RouteResult]:
        """Generates the Route A/B/C comparison set in one call."""
        return {mode: self.find_route(source, destination, mode) for mode in MODE_WEIGHTS}


if __name__ == "__main__":
    opt = RouteOptimizer()
    # A small demo network: X -> Y -> Z is fast but risky; X -> W -> Z is slower but safer
    opt.add_segment("X", "Y", time_minutes=6, risk=0.55)
    opt.add_segment("Y", "Z", time_minutes=9, risk=0.45)
    opt.add_segment("X", "W", time_minutes=10, risk=0.10)
    opt.add_segment("W", "Z", time_minutes=12, risk=0.08)

    for mode, result in opt.compare_modes("X", "Z").items():
        print(f"[{mode}] path={result.path} time={result.total_time_minutes}min risk={result.total_risk_pct}%")
