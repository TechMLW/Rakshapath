"""
ai/safety_score.py
-------------------
Safety Score Engine.

Combines multiple weighted signals into a single 0-100 safety score for a
road segment, plus a confidence value describing how much data backed the
score.

The weights below are the *default* profile. ai/retraining.py and the
"Adaptive AI Weights" feature are expected to overwrite these at runtime
(see `SafetyScoreEngine.set_weights`), so the engine never hardcodes them
as constants baked into the scoring formula.
"""

from dataclasses import dataclass, field
from typing import Optional


DEFAULT_WEIGHTS = {
    "traffic": 0.15,
    "weather": 0.15,
    "road_condition": 0.15,
    "lighting": 0.10,
    "verified_reports": 0.15,
    "incident_history": 0.15,
    "emergency_accessibility": 0.05,
    "time_of_day": 0.10,
}


@dataclass
class SegmentSignals:
    """Raw, already-normalized (0-1) input signals for one road segment.

    0 = worst / most dangerous, 1 = best / safest, for every field, so the
    weighted sum below can be interpreted consistently regardless of what
    the underlying signal originally measured.
    """
    traffic: float                 # 1 = free-flowing, 0 = gridlock
    weather: float                 # 1 = clear, 0 = severe storm/flood
    road_condition: float          # 1 = excellent surface, 0 = impassable
    lighting: float                # 1 = well lit, 0 = unlit
    verified_reports: float        # 1 = no recent verified incidents nearby
    incident_history: float        # 1 = clean history, 0 = incident-prone
    emergency_accessibility: float  # 1 = hospital/police nearby, 0 = remote
    time_of_day: float             # 1 = low-risk hour, 0 = high-risk hour
    sample_count: int = 0          # how many data points fed each signal
    freshness_minutes: float = 0.0  # age of the most stale input signal


@dataclass
class SafetyScoreResult:
    segment_id: str
    score: float                 # 0-100
    confidence: float            # 0-100 (%)
    breakdown: dict = field(default_factory=dict)
    weights_used: dict = field(default_factory=dict)


class SafetyScoreEngine:
    def __init__(self, weights: Optional[dict] = None):
        self.weights = dict(weights) if weights else dict(DEFAULT_WEIGHTS)
        self._validate_weights()

    def _validate_weights(self):
        total = sum(self.weights.values())
        if not (0.99 <= total <= 1.01):
            raise ValueError(f"Signal weights must sum to 1.0 (got {total:.3f})")

    def set_weights(self, weights: dict):
        """Used by the Adaptive AI Weights feature to update signal
        importance without redeploying the scoring formula itself."""
        self.weights = dict(weights)
        self._validate_weights()

    def score_segment(self, segment_id: str, signals: SegmentSignals) -> SafetyScoreResult:
        breakdown = {}
        weighted_sum = 0.0
        for key, weight in self.weights.items():
            value = getattr(signals, key)
            value = max(0.0, min(1.0, value))  # clamp defensively
            contribution = value * weight
            breakdown[key] = {
                "value": round(value, 3),
                "weight": weight,
                "contribution": round(contribution, 4),
            }
            weighted_sum += contribution

        score = round(weighted_sum * 100, 1)
        confidence = self._estimate_confidence(signals)

        return SafetyScoreResult(
            segment_id=segment_id,
            score=score,
            confidence=confidence,
            breakdown=breakdown,
            weights_used=dict(self.weights),
        )

    @staticmethod
    def _estimate_confidence(signals: SegmentSignals) -> float:
        """Confidence rewards having more independent samples and penalizes
        stale data. This is intentionally simple and separate from the
        Confidence Engine used for predictions (ai/confidence_engine.py),
        which reasons about model-level uncertainty rather than input
        completeness."""
        sample_component = min(signals.sample_count / 20.0, 1.0)  # saturates at 20 samples
        freshness_component = max(0.0, 1.0 - signals.freshness_minutes / 120.0)  # decays over 2h
        confidence = 0.6 * sample_component + 0.4 * freshness_component
        return round(max(5.0, min(99.0, confidence * 100)), 1)


if __name__ == "__main__":
    engine = SafetyScoreEngine()
    signals = SegmentSignals(
        traffic=0.8, weather=0.9, road_condition=0.85, lighting=0.7,
        verified_reports=1.0, incident_history=0.9,
        emergency_accessibility=0.6, time_of_day=0.8,
        sample_count=14, freshness_minutes=15,
    )
    result = engine.score_segment("SEG-1042", signals)
    print(f"Segment {result.segment_id}: score={result.score}, confidence={result.confidence}%")
    for k, v in result.breakdown.items():
        print(f"  {k:24s} value={v['value']:.2f}  weight={v['weight']:.2f}  contrib={v['contribution']:.3f}")
