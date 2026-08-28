"""
ai/confidence_engine.py
------------------------
Confidence Engine.

Produces a confidence score (0-100%) for any AI output (a prediction, a
safety score, a route recommendation) and powers two of the "Advanced
Differentiator Features":

  * Confidence-aware driving  -> callers can branch on `confidence_band`
  * AI disagreement detection -> `combine_model_outputs` flags disagreement
    between independent models instead of silently averaging them.
"""

from dataclasses import dataclass
from statistics import pstdev, mean
from typing import List


@dataclass
class ModelOutput:
    model_name: str
    prediction: float   # 0-1 probability or normalized score
    base_confidence: float  # 0-1, the model's own reported confidence


@dataclass
class CombinedConfidence:
    final_prediction: float
    confidence: float          # 0-100
    confidence_band: str       # "low" | "medium" | "high"
    disagreement_detected: bool
    disagreement_spread: float
    contributing_models: List[str]


def _band(confidence: float) -> str:
    if confidence >= 85:
        return "high"
    if confidence >= 60:
        return "medium"
    return "low"


class ConfidenceEngine:
    def __init__(self, disagreement_threshold: float = 0.20):
        # If model predictions differ by more than this (on a 0-1 scale),
        # we treat it as a disagreement event rather than just noise.
        self.disagreement_threshold = disagreement_threshold

    def combine_model_outputs(self, outputs: List[ModelOutput]) -> CombinedConfidence:
        if not outputs:
            raise ValueError("combine_model_outputs requires at least one ModelOutput")

        predictions = [o.prediction for o in outputs]
        spread = (max(predictions) - min(predictions)) if len(predictions) > 1 else 0.0
        disagreement = spread > self.disagreement_threshold

        # Weighted average, weighting by each model's own reported confidence
        total_weight = sum(o.base_confidence for o in outputs) or len(outputs)
        final_prediction = sum(o.prediction * o.base_confidence for o in outputs) / total_weight

        avg_base_confidence = mean(o.base_confidence for o in outputs)
        # Disagreement between models should *lower* overall confidence,
        # even if each individual model was confident in isolation.
        penalty = min(spread * 1.5, 0.6)
        combined = max(0.0, avg_base_confidence - penalty)

        confidence_pct = round(combined * 100, 1)

        return CombinedConfidence(
            final_prediction=round(final_prediction, 4),
            confidence=confidence_pct,
            confidence_band=_band(confidence_pct),
            disagreement_detected=disagreement,
            disagreement_spread=round(spread, 4),
            contributing_models=[o.model_name for o in outputs],
        )

    @staticmethod
    def data_freshness_confidence(age_minutes: float, half_life_minutes: float = 30.0) -> float:
        """Exponential decay used by the Data Freshness Engine feature —
        confidence in a signal halves every `half_life_minutes`."""
        import math
        decay = 0.5 ** (age_minutes / half_life_minutes)
        return round(max(1.0, min(99.0, decay * 100)), 1)


if __name__ == "__main__":
    engine = ConfidenceEngine()

    agreeing = [
        ModelOutput("flood_rf", 0.78, 0.9),
        ModelOutput("flood_xgb", 0.81, 0.88),
    ]
    result = engine.combine_model_outputs(agreeing)
    print("Agreeing models:", result)

    disagreeing = [
        ModelOutput("congestion_lstm", 0.35, 0.85),
        ModelOutput("congestion_rf", 0.72, 0.80),
    ]
    result2 = engine.combine_model_outputs(disagreeing)
    print("Disagreeing models:", result2)

    print("Freshness confidence @5 min:", engine.data_freshness_confidence(5))
    print("Freshness confidence @90 min:", engine.data_freshness_confidence(90))
