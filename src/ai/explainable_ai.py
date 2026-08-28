"""
ai/explainable_ai.py
-----------------------
Turns a route's underlying signals into the human-readable explanation
shown in the app's "Why recommended?" panel, plus a comparison summary
across multiple candidate routes.

Every reason string here is derived directly from numbers the rest of the
AI stack produced (safety_score.py, incident_prediction.py) — this module
never invents a justification that isn't backed by an actual signal.
"""

from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class RouteExplanationInput:
    route_id: str
    eta_minutes: float
    risk_pct: float                    # 100 - safety_score, i.e. higher = riskier
    confidence_pct: float
    traffic_reduction_pct: Optional[float] = None   # vs. the fastest alternative
    recent_verified_incidents: int = 0
    lighting_quality: Optional[str] = None           # "good" | "moderate" | "poor"
    flood_probability_pct: Optional[float] = None


@dataclass
class RouteExplanation:
    route_id: str
    headline: str
    reasons: List[str]
    confidence_pct: float
    caveats: List[str] = field(default_factory=list)


class ExplainableAI:
    def explain(self, data: RouteExplanationInput) -> RouteExplanation:
        reasons = []

        if data.traffic_reduction_pct and data.traffic_reduction_pct > 0:
            reasons.append(f"{round(data.traffic_reduction_pct)}% less traffic than the fastest alternative")

        if data.recent_verified_incidents == 0:
            reasons.append("No recent verified incidents")
        else:
            reasons.append(f"{data.recent_verified_incidents} recent verified incident(s) nearby")

        if data.lighting_quality:
            reasons.append(f"{data.lighting_quality.capitalize()} lighting along this route")

        if data.flood_probability_pct is not None:
            reasons.append(f"Flood probability: {data.flood_probability_pct}%")

        reasons.append(f"Overall risk: {data.risk_pct}%")

        caveats = []
        if data.confidence_pct < 60:
            caveats.append("Confidence is lower than usual — based on limited recent data for this route")
        if data.recent_verified_incidents > 0 and data.risk_pct > 30:
            caveats.append("Consider the alternative route if avoiding all recent incident areas is a priority")

        headline = self._headline(data)

        return RouteExplanation(
            route_id=data.route_id,
            headline=headline,
            reasons=reasons,
            confidence_pct=data.confidence_pct,
            caveats=caveats,
        )

    @staticmethod
    def _headline(data: RouteExplanationInput) -> str:
        if data.risk_pct <= 15:
            return "Recommended — low risk"
        if data.risk_pct <= 35:
            return "Reasonable option — moderate risk"
        return "Higher risk — consider an alternative"

    def compare_routes(self, routes: List[RouteExplanationInput]) -> str:
        """Produces the short comparison summary used on the Route
        Comparison screen (Route A / B / C style)."""
        lines = []
        for r in sorted(routes, key=lambda x: x.risk_pct):
            lines.append(
                f"{r.route_id}: {round(r.eta_minutes)} min · Risk {r.risk_pct}% · Confidence {r.confidence_pct}%"
            )
        return "\n".join(lines)


if __name__ == "__main__":
    ai = ExplainableAI()
    route = RouteExplanationInput(
        route_id="Route A",
        eta_minutes=18,
        risk_pct=14,
        confidence_pct=95,
        traffic_reduction_pct=20,
        recent_verified_incidents=0,
        lighting_quality="good",
        flood_probability_pct=4,
    )
    explanation = ai.explain(route)
    print(explanation.headline)
    for r in explanation.reasons:
        print(" -", r)
    if explanation.caveats:
        print("Caveats:", explanation.caveats)

    routes = [
        route,
        RouteExplanationInput("Route B", 15, 37, 81, recent_verified_incidents=2, lighting_quality="moderate"),
        RouteExplanationInput("Route C", 22, 8, 98, recent_verified_incidents=0, lighting_quality="good", flood_probability_pct=1),
    ]
    print()
    print(ai.compare_routes(routes))
