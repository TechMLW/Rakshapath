"""
ai/incident_prediction.py
----------------------------
Thin orchestration layer over the individual hazard predictors
(flood_prediction, congestion_prediction, accident_prediction, plus a
road-blockage estimate) so callers (api/prediction.py) have one entry
point that returns all four probabilities for a segment in a single
call.

Flood, congestion, and accident all have dedicated trained ML models
(see ml/train.py). Road-blockage probability doesn't have its own model
yet — it's estimated here from verified report density + flood
probability, and is clearly labeled as such in the result so the
Explainable AI layer never claims more precision than actually exists.
"""

from dataclasses import dataclass
from typing import Optional

from ai.flood_prediction import FloodPredictionModel, FloodPredictionInput
from ai.congestion_prediction import CongestionPredictionModel
from ai.accident_prediction import AccidentPredictionModel, AccidentPredictionInput


@dataclass
class IncidentPredictionSummary:
    segment_id: str
    flood_probability_pct: float
    congestion_probability_pct: float
    accident_probability_pct: float
    road_blockage_probability_pct: float
    lowest_confidence: float
    notes: list


class IncidentPredictionService:
    def __init__(self):
        self.flood_model = FloodPredictionModel()
        self.congestion_model = CongestionPredictionModel()
        self.accident_model = AccidentPredictionModel()

    def predict_all(
        self,
        segment_id: str,
        flood_input: FloodPredictionInput,
        recent_speed_ratios: list,
        is_peak_hour: bool,
        historical_accident_rate: float,   # 0-1
        verified_incident_density: float,  # 0-1, verified reports per km recently
        road_condition_quality: float = 0.7,   # 0-1, 1 = excellent surface
        lighting_quality: float = 0.7,         # 0-1, 1 = well lit
        speed_variance_ratio: float = 0.3,     # 0-1, how erratic recent speeds are
        weather_severity: float = 0.2,         # 0-1, 0 = clear, 1 = severe
        upcoming_event_nearby: bool = False,
    ) -> IncidentPredictionSummary:
        flood = self.flood_model.predict(segment_id, flood_input)
        congestion = self.congestion_model.predict(
            segment_id, recent_speed_ratios, is_peak_hour, upcoming_event_nearby
        )
        accident = self.accident_model.predict(segment_id, AccidentPredictionInput(
            historical_accident_rate=historical_accident_rate,
            congestion_probability=congestion.probability,
            verified_incident_density=verified_incident_density,
            road_condition_quality=road_condition_quality,
            lighting_quality=lighting_quality,
            speed_variance_ratio=speed_variance_ratio,
            weather_severity=weather_severity,
        ))

        # Road blockage still doesn't have a dedicated model - kept as an
        # explainable heuristic until one is trained.
        blockage_prob = round(
            min(1.0, 0.6 * verified_incident_density + 0.4 * flood.probability) * 100, 1
        )

        confidences = [flood.confidence, congestion.confidence, accident.confidence, 50.0]
        notes = [
            f"Flood: {flood.method}", f"Congestion: {congestion.method}",
            f"Accident: {accident.method}",
            "Road blockage: heuristic estimate (no dedicated trained model yet)",
        ]

        return IncidentPredictionSummary(
            segment_id=segment_id,
            flood_probability_pct=flood.probability_pct,
            congestion_probability_pct=congestion.probability_pct,
            accident_probability_pct=accident.probability_pct,
            road_blockage_probability_pct=blockage_prob,
            lowest_confidence=min(confidences),
            notes=notes,
        )


if __name__ == "__main__":
    service = IncidentPredictionService()
    flood_input = FloodPredictionInput(
        rainfall_mm_last_hour=10, rainfall_mm_forecast_next_hour=8,
        drainage_quality=0.6, elevation_relative=0.5,
        historical_flood_rate=0.2, current_water_level_cm=4,
    )
    summary = service.predict_all(
        segment_id="SEG-4400",
        flood_input=flood_input,
        recent_speed_ratios=[0.9, 0.88, 0.8, 0.7],
        is_peak_hour=True,
        historical_accident_rate=0.15,
        verified_incident_density=0.1,
    )
    print(summary)

