"""
ai/retraining.py
-------------------
AI Self-Evaluation / Retraining Loop.

Periodically (or on-demand from the Admin Panel's "Retrain AI" button)
compares recent model predictions (from PredictionHistory) against what
actually happened (from IncidentHistory / VerifiedReports) to measure
drift, and triggers ml/train.py when accuracy drops below threshold.

This module intentionally only decides *whether* to retrain — the actual
training logic lives in ml/train.py, keeping the "when" and the "how"
independently testable.
"""

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import List, Callable, Optional
import subprocess
import sys
from pathlib import Path


@dataclass
class PredictionRecord:
    model_name: str
    predicted_probability: float   # 0-1
    actual_outcome: bool           # did the incident actually occur
    predicted_at: datetime


@dataclass
class DriftReport:
    model_name: str
    sample_size: int
    accuracy: float             # 0-1
    brier_score: float          # lower is better; measures calibration
    drift_detected: bool
    retrain_triggered: bool


class RetrainingManager:
    def __init__(
        self,
        accuracy_threshold: float = 0.75,
        brier_threshold: float = 0.20,
        min_samples: int = 30,
        train_script: Path = Path(__file__).resolve().parent.parent / "ml" / "train.py",
    ):
        self.accuracy_threshold = accuracy_threshold
        self.brier_threshold = brier_threshold
        self.min_samples = min_samples
        self.train_script = train_script

    @staticmethod
    def _accuracy(records: List[PredictionRecord]) -> float:
        correct = sum(
            1 for r in records
            if (r.predicted_probability >= 0.5) == r.actual_outcome
        )
        return correct / len(records)

    @staticmethod
    def _brier_score(records: List[PredictionRecord]) -> float:
        total = sum((r.predicted_probability - float(r.actual_outcome)) ** 2 for r in records)
        return total / len(records)

    def evaluate(self, model_name: str, records: List[PredictionRecord], auto_retrain: bool = False) -> DriftReport:
        if len(records) < self.min_samples:
            return DriftReport(
                model_name=model_name, sample_size=len(records),
                accuracy=0.0, brier_score=1.0,
                drift_detected=False, retrain_triggered=False,
            )

        accuracy = self._accuracy(records)
        brier = self._brier_score(records)
        drift = accuracy < self.accuracy_threshold or brier > self.brier_threshold

        retrain_triggered = False
        if drift and auto_retrain:
            retrain_triggered = self._trigger_retrain(model_name)

        return DriftReport(
            model_name=model_name,
            sample_size=len(records),
            accuracy=round(accuracy, 3),
            brier_score=round(brier, 3),
            drift_detected=drift,
            retrain_triggered=retrain_triggered,
        )

    def _trigger_retrain(self, model_name: str) -> bool:
        if not self.train_script.exists():
            return False
        try:
            subprocess.run(
                [sys.executable, str(self.train_script), "--model", model_name],
                check=True, capture_output=True, timeout=1800,
            )
            return True
        except Exception:
            return False


if __name__ == "__main__":
    from datetime import timedelta

    now = datetime.now(timezone.utc)
    # Simulate a model that has been drifting — several confident-but-wrong predictions
    records = (
        [PredictionRecord("flood_rf", 0.85, True, now - timedelta(hours=i)) for i in range(15)] +
        [PredictionRecord("flood_rf", 0.80, False, now - timedelta(hours=i)) for i in range(15, 35)]
    )
    manager = RetrainingManager()
    report = manager.evaluate("flood_rf", records, auto_retrain=False)
    print(report)
