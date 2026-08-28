"""
ml/train.py
-------------
Trains the flood and congestion classifiers and writes them to
ml/flood_model.pkl / ml/congestion_model.pkl, where ai/flood_prediction.py
and ai/congestion_prediction.py pick them up automatically.

Usage:
    python ml/train.py                    # trains both models
    python ml/train.py --model flood_rf   # trains a single model
                                           #   (called by ai/retraining.py)
"""

import argparse
from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, roc_auc_score, brier_score_loss

BASE_DIR = Path(__file__).resolve().parent
DATASETS_DIR = BASE_DIR / "datasets"


def train_flood_model():
    df = pd.read_csv(DATASETS_DIR / "flood_data.csv")
    features = [
        "rainfall_mm_last_hour", "rainfall_mm_forecast_next_hour",
        "drainage_quality", "elevation_relative",
        "historical_flood_rate", "current_water_level_cm",
    ]
    X, y = df[features], df["flooded"]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    model = RandomForestClassifier(n_estimators=200, max_depth=8, random_state=42, class_weight="balanced")
    model.fit(X_train, y_train)

    proba = model.predict_proba(X_test)[:, 1]
    preds = (proba >= 0.5).astype(int)
    metrics = {
        "accuracy": round(accuracy_score(y_test, preds), 3),
        "auc": round(roc_auc_score(y_test, proba), 3),
        "brier": round(brier_score_loss(y_test, proba), 3),
    }

    out_path = BASE_DIR / "flood_model.pkl"
    joblib.dump(model, out_path)
    print(f"[flood] saved -> {out_path}  metrics={metrics}")
    return metrics


def train_congestion_model():
    df = pd.read_csv(DATASETS_DIR / "congestion_data.csv")
    features = ["avg_speed_ratio", "trend", "is_peak_hour", "event_nearby"]
    X, y = df[features], df["congested"]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    model = RandomForestClassifier(n_estimators=200, max_depth=8, random_state=42, class_weight="balanced")
    model.fit(X_train, y_train)

    proba = model.predict_proba(X_test)[:, 1]
    preds = (proba >= 0.5).astype(int)
    metrics = {
        "accuracy": round(accuracy_score(y_test, preds), 3),
        "auc": round(roc_auc_score(y_test, proba), 3),
        "brier": round(brier_score_loss(y_test, proba), 3),
    }

    out_path = BASE_DIR / "congestion_model.pkl"
    joblib.dump(model, out_path)
    print(f"[congestion] saved -> {out_path}  metrics={metrics}")
    return metrics


def train_accident_model():
    df = pd.read_csv(DATASETS_DIR / "accident_data.csv")
    features = [
        "historical_accident_rate", "congestion_probability",
        "verified_incident_density", "road_condition_quality",
        "lighting_quality", "speed_variance_ratio", "weather_severity",
    ]
    X, y = df[features], df["accident"]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    model = RandomForestClassifier(n_estimators=200, max_depth=8, random_state=42, class_weight="balanced")
    model.fit(X_train, y_train)

    proba = model.predict_proba(X_test)[:, 1]
    preds = (proba >= 0.5).astype(int)
    metrics = {
        "accuracy": round(accuracy_score(y_test, preds), 3),
        "auc": round(roc_auc_score(y_test, proba), 3),
        "brier": round(brier_score_loss(y_test, proba), 3),
    }

    out_path = BASE_DIR / "accident_model.pkl"
    joblib.dump(model, out_path)
    print(f"[accident] saved -> {out_path}  metrics={metrics}")
    return metrics


MODEL_TRAINERS = {
    "flood": train_flood_model,
    "flood_rf": train_flood_model,
    "congestion": train_congestion_model,
    "congestion_rf": train_congestion_model,
    "accident": train_accident_model,
    "accident_rf": train_accident_model,
}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train Raksha-Path prediction models")
    parser.add_argument("--model", choices=list(MODEL_TRAINERS.keys()), default=None,
                         help="Train a single model (used by ai/retraining.py). Omit to train all.")
    args = parser.parse_args()

    if args.model:
        MODEL_TRAINERS[args.model]()
    else:
        train_flood_model()
        train_congestion_model()
        train_accident_model()
