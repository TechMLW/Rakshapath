"""
demo_end_to_end.py
---------------------
Walks through a full request lifecycle using every module in ai/ and ml/,
end to end, the way api/routes.py would orchestrate them in the real
service:

  1. A community report comes in -> report_verification.py
  2. Hazard predictions for the area -> incident_prediction.py
     (which internally calls the trained flood/congestion models)
  3. Segment safety scores are computed -> safety_score.py
  4. Multiple model outputs are reconciled -> confidence_engine.py
  5. A route is planned across safest/fastest/balanced -> route_optimizer.py
  6. The chosen route is explained in plain language -> explainable_ai.py

Run: python demo_end_to_end.py
"""

from datetime import datetime, timedelta, timezone

from ai.report_verification import ReportVerificationPipeline, IncidentReport, ExistingReport
from ai.incident_prediction import IncidentPredictionService
from ai.flood_prediction import FloodPredictionInput
from ai.safety_score import SafetyScoreEngine, SegmentSignals
from ai.confidence_engine import ConfidenceEngine, ModelOutput
from ai.route_optimizer import RouteOptimizer
from ai.explainable_ai import ExplainableAI, RouteExplanationInput


def main():
    print("=" * 70)
    print("STEP 1 — Community report verification")
    print("=" * 70)
    now = datetime.now(timezone.utc)
    pipeline = ReportVerificationPipeline()
    report = IncidentReport(
        report_id="R-9001", user_id="U-501", incident_type="flood",
        latitude=12.9716, longitude=77.5946, reported_at=now - timedelta(minutes=3),
        has_image=True, image_hash="hash123",
    )
    verification = pipeline.verify(report, existing_reports=[], reporter_reputation=0.87, now=now)
    print(verification)

    print("\n" + "=" * 70)
    print("STEP 2 — Hazard prediction for the affected segment")
    print("=" * 70)
    incident_service = IncidentPredictionService()
    flood_input = FloodPredictionInput(
        rainfall_mm_last_hour=25, rainfall_mm_forecast_next_hour=20,
        drainage_quality=0.35, elevation_relative=0.3,
        historical_flood_rate=0.55, current_water_level_cm=14,
    )
    prediction = incident_service.predict_all(
        segment_id="SEG-7001", flood_input=flood_input,
        recent_speed_ratios=[0.7, 0.6, 0.5], is_peak_hour=True,
        historical_accident_rate=0.2, verified_incident_density=0.3,
    )
    print(prediction)

    print("\n" + "=" * 70)
    print("STEP 3 — Safety score for nearby segments")
    print("=" * 70)
    score_engine = SafetyScoreEngine()
    risky_segment = score_engine.score_segment("SEG-7001", SegmentSignals(
        traffic=0.4, weather=0.3, road_condition=0.7, lighting=0.6,
        verified_reports=1 - verification.confidence / 100, incident_history=0.5,
        emergency_accessibility=0.6, time_of_day=0.7,
        sample_count=9, freshness_minutes=5,
    ))
    safe_segment = score_engine.score_segment("SEG-7020", SegmentSignals(
        traffic=0.85, weather=0.9, road_condition=0.9, lighting=0.85,
        verified_reports=1.0, incident_history=0.95,
        emergency_accessibility=0.7, time_of_day=0.8,
        sample_count=18, freshness_minutes=10,
    ))
    print("Risky segment:", risky_segment.segment_id, risky_segment.score, f"conf={risky_segment.confidence}%")
    print("Safe segment: ", safe_segment.segment_id, safe_segment.score, f"conf={safe_segment.confidence}%")

    print("\n" + "=" * 70)
    print("STEP 4 — Reconciling flood model with a second independent estimate")
    print("=" * 70)
    conf_engine = ConfidenceEngine()
    combined = conf_engine.combine_model_outputs([
        ModelOutput("flood_rf", prediction.flood_probability_pct / 100, 0.85),
        ModelOutput("community_reports_heuristic", 1 - verification.confidence / 100, 0.6),
    ])
    print(combined)

    print("\n" + "=" * 70)
    print("STEP 5 — Route planning avoiding the risky segment")
    print("=" * 70)
    # RouteOptimizer expects `risk` (higher = more dangerous), while
    # SafetyScoreEngine returns `score` (higher = safer) — invert here.
    optimizer = RouteOptimizer()
    optimizer.add_segment("Home", "Junction", time_minutes=6, risk=(100 - risky_segment.score) / 100)
    optimizer.add_segment("Junction", "Hospital", time_minutes=9, risk=0.45)
    optimizer.add_segment("Home", "Bypass", time_minutes=10, risk=(100 - safe_segment.score) / 100)
    optimizer.add_segment("Bypass", "Hospital", time_minutes=12, risk=0.08)

    routes = optimizer.compare_modes("Home", "Hospital")
    for mode, r in routes.items():
        print(f"[{mode}] path={r.path} time={r.total_time_minutes}min risk={r.total_risk_pct}%")

    print("\n" + "=" * 70)
    print("STEP 6 — Explaining the safest route to the user")
    print("=" * 70)
    explainer = ExplainableAI()
    safest = routes["safest"]
    explanation = explainer.explain(RouteExplanationInput(
        route_id="Safest Route",
        eta_minutes=safest.total_time_minutes,
        risk_pct=safest.total_risk_pct,
        confidence_pct=combined.confidence,
        traffic_reduction_pct=15,
        recent_verified_incidents=0 if not verification.is_verified else 1,
        lighting_quality="good",
        flood_probability_pct=prediction.flood_probability_pct,
    ))
    print(explanation.headline)
    for reason in explanation.reasons:
        print(" -", reason)
    if explanation.caveats:
        print("Caveats:", explanation.caveats)


if __name__ == "__main__":
    main()
