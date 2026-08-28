"""
ml/evaluation.py
-------------------
Evaluates a trained model against a held-out dataset and prints the
metrics shown on the Admin Panel / AI Dashboard ("Average AI Accuracy",
"Prediction Accuracy" charts). Also feeds ai/retraining.py-style drift
checks during manual review.

Usage:
    python ml/evaluation.py --model flood
    python ml/evaluation.py --model congestion
"""

import argparse
from pathlib import Path

import joblib
import pandas as pd
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, brier_score_loss, confusion_matrix,
)

BASE_DIR = Path(__file__).resolve().parent
DATASETS_DIR = BASE_DIR / "datasets"

DATASET_CONFIG = {
    "flood": {
        "csv": DATASETS_DIR / "flood_data.csv",
        "features": [
            "rainfall_mm_last_hour", "rainfall_mm_forecast_next_hour",
            "drainage_quality", "elevation_relative",
            "historical_flood_rate", "current_water_level_cm",
        ],
        "target": "flooded",
        "model_path": BASE_DIR / "flood_model.pkl",
    },
    "congestion": {
        "csv": DATASETS_DIR / "congestion_data.csv",
        "features": ["avg_speed_ratio", "trend", "is_peak_hour", "event_nearby"],
        "target": "congested",
        "model_path": BASE_DIR / "congestion_model.pkl",
    },
    "accident": {
        "csv": DATASETS_DIR / "accident_data.csv",
        "features": [
            "historical_accident_rate", "congestion_probability",
            "verified_incident_density", "road_condition_quality",
            "lighting_quality", "speed_variance_ratio", "weather_severity",
        ],
        "target": "accident",
        "model_path": BASE_DIR / "accident_model.pkl",
    },
}


def evaluate(model_name: str) -> dict:
    config = DATASET_CONFIG[model_name]
    if not config["model_path"].exists():
        raise FileNotFoundError(f"{config['model_path']} not found — run `python ml/train.py` first")

    model = joblib.load(config["model_path"])
    df = pd.read_csv(config["csv"])
    X, y = df[config["features"]], df[config["target"]]

    proba = model.predict_proba(X)[:, 1]
    preds = (proba >= 0.5).astype(int)
    tn, fp, fn, tp = confusion_matrix(y, preds).ravel()

    metrics = {
        "model": model_name,
        "n_samples": len(df),
        "accuracy": round(accuracy_score(y, preds), 4),
        "precision": round(precision_score(y, preds), 4),
        "recall": round(recall_score(y, preds), 4),
        "f1": round(f1_score(y, preds), 4),
        "auc": round(roc_auc_score(y, proba), 4),
        "brier_score": round(brier_score_loss(y, proba), 4),
        "confusion_matrix": {"tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)},
    }
    return metrics


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Evaluate a trained Raksha-Path model")
    parser.add_argument("--model", choices=list(DATASET_CONFIG.keys()), default=None,
                         help="Evaluate a single model. Omit to evaluate all.")
    args = parser.parse_args()

    targets = [args.model] if args.model else list(DATASET_CONFIG.keys())
    for name in targets:
        metrics = evaluate(name)
        print(f"\n=== {name} ===")
        for k, v in metrics.items():
            print(f"  {k}: {v}")
