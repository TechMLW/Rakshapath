"""
ai/congestion_prediction.py
-----------------------------
Predicts the probability of heavy congestion on a segment within a
forecast horizon (default 25 minutes). In production this wraps a
time-series model (LSTM, see ml/train.py); here it also supports a
simple moving-average fallback so the module works before any model has
been trained.
"""

from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional
import joblib
import numpy as np
import pandas as pd

CONGESTION_FEATURE_ORDER = ["avg_speed_ratio", "trend", "is_peak_hour", "event_nearby"]

MODEL_PATH = Path(__file__).resolve().parent.parent / "ml" / "congestion_model.pkl"


@dataclass
class CongestionPredictionResult:
    segment_id: str
    probability: float
    probability_pct: float
    horizon_minutes: int
    confidence: float
    method: str


class CongestionPredictionModel:
    def __init__(self, model_path: Path = MODEL_PATH, horizon_minutes: int = 25, window: int = 6):
        self.horizon_minutes = horizon_minutes
        self.window = window  # how many recent readings the moving-average fallback uses
        self.model = None
        if model_path.exists():
            self.model = joblib.load(model_path)

    def predict(
        self,
        segment_id: str,
        recent_speed_ratios: List[float],   # each value = current_speed / free_flow_speed, most recent last
        is_peak_hour: bool,
        upcoming_event_nearby: bool = False,
    ) -> CongestionPredictionResult:
        if self.model is not None:
            x = self._featurize(recent_speed_ratios, is_peak_hour, upcoming_event_nearby)
            proba = float(self.model.predict_proba(x)[0][1])
            confidence = 82.0
            method = "model"
        else:
            proba, confidence = self._moving_average_fallback(recent_speed_ratios, is_peak_hour, upcoming_event_nearby)
            method = "moving_average_fallback"

        return CongestionPredictionResult(
            segment_id=segment_id,
            probability=round(proba, 4),
            probability_pct=round(proba * 100, 1),
            horizon_minutes=self.horizon_minutes,
            confidence=confidence,
            method=method,
        )

    def _featurize(self, recent_speed_ratios, is_peak_hour, upcoming_event_nearby):
        recent = (recent_speed_ratios + [1.0] * self.window)[: self.window]
        trend = recent[-1] - recent[0] if len(recent) > 1 else 0.0
        avg = float(np.mean(recent))
        row = [[avg, trend, float(is_peak_hour), float(upcoming_event_nearby)]]
        return pd.DataFrame(row, columns=CONGESTION_FEATURE_ORDER)

    def _moving_average_fallback(self, recent_speed_ratios, is_peak_hour, upcoming_event_nearby):
        if not recent_speed_ratios:
            avg_ratio, trend = 1.0, 0.0
        else:
            recent = recent_speed_ratios[-self.window:]
            avg_ratio = float(np.mean(recent))
            trend = recent[-1] - recent[0] if len(recent) > 1 else 0.0

        slowdown = max(0.0, 1.0 - avg_ratio)          # how much slower than free-flow
        worsening = max(0.0, -trend)                   # speed ratio dropping over time

        score = 0.55 * slowdown + 0.25 * worsening
        score += 0.12 if is_peak_hour else 0.0
        score += 0.08 if upcoming_event_nearby else 0.0
        score = max(0.0, min(1.0, score))

        confidence = 45.0 + min(len(recent_speed_ratios), self.window) * 5  # more history -> more confidence
        return score, round(min(confidence, 80.0), 1)


if __name__ == "__main__":
    model = CongestionPredictionModel()
    # Speeds trending down over the last 6 readings (as a fraction of free-flow speed)
    speeds = [0.95, 0.9, 0.85, 0.75, 0.65, 0.55]
    result = model.predict("SEG-3110", speeds, is_peak_hour=True, upcoming_event_nearby=False)
    print(result)
