"""
ai/flood_prediction.py
------------------------
Predicts flood probability for a road segment over a forecast horizon
(default 30-45 minutes), rather than only detecting an existing flood.

Wraps a trained scikit-learn model (see ml/train.py) but falls back to a
transparent rule-based estimate if no trained model is available yet —
useful during early development / demos before ml/model.pkl exists.
"""

from dataclasses import dataclass
from pathlib import Path
from typing import Optional
import joblib
import numpy as np
import pandas as pd

MODEL_PATH = Path(__file__).resolve().parent.parent / "ml" / "flood_model.pkl"

FEATURE_ORDER = [
    "rainfall_mm_last_hour",
    "rainfall_mm_forecast_next_hour",
    "drainage_quality",       # 0-1, 1 = excellent drainage
    "elevation_relative",     # 0-1, 1 = high ground relative to area
    "historical_flood_rate",  # 0-1, fraction of past years this segment flooded
    "current_water_level_cm",
]


@dataclass
class FloodPredictionInput:
    rainfall_mm_last_hour: float
    rainfall_mm_forecast_next_hour: float
    drainage_quality: float
    elevation_relative: float
    historical_flood_rate: float
    current_water_level_cm: float


@dataclass
class FloodPredictionResult:
    segment_id: str
    probability: float          # 0-1
    probability_pct: float      # 0-100, rounded, for display
    horizon_minutes: int
    confidence: float           # 0-100
    method: str                 # "model" | "rule_based_fallback"


class FloodPredictionModel:
    def __init__(self, model_path: Path = MODEL_PATH, horizon_minutes: int = 40):
        self.horizon_minutes = horizon_minutes
        self.model = None
        if model_path.exists():
            self.model = joblib.load(model_path)

    def predict(self, segment_id: str, features: FloodPredictionInput) -> FloodPredictionResult:
        if self.model is not None:
            x = pd.DataFrame([[getattr(features, f) for f in FEATURE_ORDER]], columns=FEATURE_ORDER)
            proba = float(self.model.predict_proba(x)[0][1])
            confidence = 85.0  # trained model: baseline confidence, refined by ai/confidence_engine.py upstream
            method = "model"
        else:
            proba, confidence = self._rule_based(features)
            method = "rule_based_fallback"

        return FloodPredictionResult(
            segment_id=segment_id,
            probability=round(proba, 4),
            probability_pct=round(proba * 100, 1),
            horizon_minutes=self.horizon_minutes,
            confidence=confidence,
            method=method,
        )

    @staticmethod
    def _rule_based(f: FloodPredictionInput):
        """Transparent, explainable fallback used before a trained model
        exists. Deliberately simple linear combination so it can be
        described plainly in the Explainable AI panel."""
        rain_signal = min((f.rainfall_mm_last_hour + f.rainfall_mm_forecast_next_hour) / 60.0, 1.0)
        drainage_risk = 1 - f.drainage_quality
        elevation_risk = 1 - f.elevation_relative
        water_level_risk = min(f.current_water_level_cm / 30.0, 1.0)

        score = (
            0.35 * rain_signal +
            0.20 * drainage_risk +
            0.15 * elevation_risk +
            0.15 * f.historical_flood_rate +
            0.15 * water_level_risk
        )
        score = max(0.0, min(1.0, score))
        confidence = 55.0  # lower confidence than a trained model, by design
        return score, confidence


if __name__ == "__main__":
    model = FloodPredictionModel()
    features = FloodPredictionInput(
        rainfall_mm_last_hour=22,
        rainfall_mm_forecast_next_hour=18,
        drainage_quality=0.4,
        elevation_relative=0.3,
        historical_flood_rate=0.6,
        current_water_level_cm=12,
    )
    result = model.predict("SEG-2091", features)
    print(result)
