"""
ai/accident_prediction.py
----------------------------
Dedicated accident-probability model — closes the gap flagged in
incident_prediction.py, which previously only *estimated* accident risk
by combining other signals. This module follows the same pattern as
flood_prediction.py and congestion_prediction.py: a trained scikit-learn
model with an automatic, transparent rule-based fallback when no model
has been trained yet.
"""

from dataclasses import dataclass
from pathlib import Path
import joblib
import pandas as pd

MODEL_PATH = Path(__file__).resolve().parent.parent / "ml" / "accident_model.pkl"

FEATURE_ORDER = [
    "historical_accident_rate",
    "congestion_probability",
    "verified_incident_density",
    "road_condition_quality",
    "lighting_quality",
    "speed_variance_ratio",
    "weather_severity",
]


@dataclass
class AccidentPredictionInput:
    historical_accident_rate: float    # 0-1, past accident frequency on this segment
    congestion_probability: float      # 0-1, from ai/congestion_prediction.py
    verified_incident_density: float   # 0-1, verified reports per km recently
    road_condition_quality: float      # 0-1, 1 = excellent surface
    lighting_quality: float            # 0-1, 1 = well lit
    speed_variance_ratio: float        # 0-1, how erratic speeds are (higher = more erratic)
    weather_severity: float            # 0-1, 0 = clear, 1 = severe


@dataclass
class AccidentPredictionResult:
    segment_id: str
    probability: float
    probability_pct: float
    confidence: float
    method: str   # "model" | "rule_based_fallback"


class AccidentPredictionModel:
    def __init__(self, model_path: Path = MODEL_PATH):
        self.model = None
        if model_path.exists():
            self.model = joblib.load(model_path)

    def predict(self, segment_id: str, features: AccidentPredictionInput) -> AccidentPredictionResult:
        if self.model is not None:
            x = pd.DataFrame([[getattr(features, f) for f in FEATURE_ORDER]], columns=FEATURE_ORDER)
            proba = float(self.model.predict_proba(x)[0][1])
            confidence = 83.0
            method = "model"
        else:
            proba, confidence = self._rule_based(features)
            method = "rule_based_fallback"

        return AccidentPredictionResult(
            segment_id=segment_id,
            probability=round(proba, 4),
            probability_pct=round(proba * 100, 1),
            confidence=confidence,
            method=method,
        )

    @staticmethod
    def _rule_based(f: AccidentPredictionInput):
        """Transparent fallback used before a trained model exists."""
        road_risk = 1 - f.road_condition_quality
        lighting_risk = 1 - f.lighting_quality
        score = (
            0.30 * f.historical_accident_rate +
            0.20 * f.congestion_probability +
            0.15 * f.verified_incident_density +
            0.15 * road_risk +
            0.10 * lighting_risk +
            0.05 * f.speed_variance_ratio +
            0.05 * f.weather_severity
        )
        score = max(0.0, min(1.0, score))
        confidence = 52.0
        return score, confidence


if __name__ == "__main__":
    model = AccidentPredictionModel()
    features = AccidentPredictionInput(
        historical_accident_rate=0.3,
        congestion_probability=0.6,
        verified_incident_density=0.25,
        road_condition_quality=0.5,
        lighting_quality=0.4,
        speed_variance_ratio=0.55,
        weather_severity=0.2,
    )
    result = model.predict("SEG-5501", features)
    print(result)
