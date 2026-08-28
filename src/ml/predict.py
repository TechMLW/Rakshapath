"""
ml/predict.py
---------------
Standalone CLI for running a trained model against a single feature row —
handy for debugging a model in isolation without going through the ai/
wrapper modules or the API layer.

Usage:
    python ml/predict.py --model flood --rainfall_mm_last_hour 20 \\
        --rainfall_mm_forecast_next_hour 15 --drainage_quality 0.4 \\
        --elevation_relative 0.3 --historical_flood_rate 0.5 \\
        --current_water_level_cm 10

    python ml/predict.py --model congestion --avg_speed_ratio 0.6 \\
        --trend -0.2 --is_peak_hour 1 --event_nearby 0
"""

import argparse
from pathlib import Path
import joblib
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent

MODEL_FEATURES = {
    "flood": [
        "rainfall_mm_last_hour", "rainfall_mm_forecast_next_hour",
        "drainage_quality", "elevation_relative",
        "historical_flood_rate", "current_water_level_cm",
    ],
    "congestion": ["avg_speed_ratio", "trend", "is_peak_hour", "event_nearby"],
    "accident": [
        "historical_accident_rate", "congestion_probability",
        "verified_incident_density", "road_condition_quality",
        "lighting_quality", "speed_variance_ratio", "weather_severity",
    ],
}

MODEL_FILES = {
    "flood": BASE_DIR / "flood_model.pkl",
    "congestion": BASE_DIR / "congestion_model.pkl",
    "accident": BASE_DIR / "accident_model.pkl",
}


def predict(model_name: str, feature_values: dict) -> float:
    model_path = MODEL_FILES[model_name]
    if not model_path.exists():
        raise FileNotFoundError(f"{model_path} not found — run `python ml/train.py` first")

    model = joblib.load(model_path)
    features = MODEL_FEATURES[model_name]
    row = pd.DataFrame([[feature_values[f] for f in features]], columns=features)
    return float(model.predict_proba(row)[0][1])


def _build_arg_parser():
    parser = argparse.ArgumentParser(description="Run a single prediction against a trained model")
    parser.add_argument("--model", choices=list(MODEL_FEATURES.keys()), required=True)
    all_features = {f for feats in MODEL_FEATURES.values() for f in feats}
    for f in sorted(all_features):
        parser.add_argument(f"--{f}", type=float, default=None)
    return parser


if __name__ == "__main__":
    args = _build_arg_parser().parse_args()
    required = MODEL_FEATURES[args.model]
    values = {f: getattr(args, f) for f in required}
    missing = [f for f, v in values.items() if v is None]
    if missing:
        raise SystemExit(f"Missing required feature(s) for model '{args.model}': {missing}")

    probability = predict(args.model, values)
    print(f"{args.model} probability: {probability:.4f} ({probability * 100:.1f}%)")
