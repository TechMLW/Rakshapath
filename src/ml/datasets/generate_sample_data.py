"""
ml/datasets/generate_sample_data.py
--------------------------------------
Generates synthetic training data for the flood and congestion models so
train.py has something to run against before real historical data
(TrafficData, WeatherData, IncidentHistory tables) is available.

Run directly to (re)write flood_data.csv and congestion_data.csv in this
folder.
"""

import numpy as np
import pandas as pd
from pathlib import Path

OUT_DIR = Path(__file__).resolve().parent
RNG = np.random.default_rng(42)


def generate_flood_data(n=2000) -> pd.DataFrame:
    rainfall_last_hour = RNG.exponential(scale=8, size=n).clip(0, 80)
    rainfall_forecast = RNG.exponential(scale=8, size=n).clip(0, 80)
    drainage_quality = RNG.uniform(0, 1, n)
    elevation_relative = RNG.uniform(0, 1, n)
    historical_flood_rate = RNG.uniform(0, 1, n)
    water_level = RNG.exponential(scale=5, size=n).clip(0, 40)

    # Ground truth generated from a noisy nonlinear rule so a trained model
    # has real signal to learn (not just memorizing the fallback formula).
    risk_signal = (
        0.03 * rainfall_last_hour + 0.025 * rainfall_forecast
        - 4 * drainage_quality - 3 * elevation_relative
        + 3 * historical_flood_rate + 0.08 * water_level
        + RNG.normal(0, 1.2, n)
    )
    flooded = (risk_signal > np.percentile(risk_signal, 78)).astype(int)

    return pd.DataFrame({
        "rainfall_mm_last_hour": rainfall_last_hour,
        "rainfall_mm_forecast_next_hour": rainfall_forecast,
        "drainage_quality": drainage_quality,
        "elevation_relative": elevation_relative,
        "historical_flood_rate": historical_flood_rate,
        "current_water_level_cm": water_level,
        "flooded": flooded,
    })


def generate_congestion_data(n=2000) -> pd.DataFrame:
    avg_speed_ratio = RNG.uniform(0.2, 1.0, n)
    trend = RNG.uniform(-0.5, 0.5, n)
    is_peak_hour = RNG.integers(0, 2, n)
    event_nearby = RNG.integers(0, 2, n)

    risk_signal = (
        -5 * avg_speed_ratio - 2 * trend
        + 1.2 * is_peak_hour + 0.8 * event_nearby
        + RNG.normal(0, 0.8, n)
    )
    congested = (risk_signal > np.percentile(risk_signal, 70)).astype(int)

    return pd.DataFrame({
        "avg_speed_ratio": avg_speed_ratio,
        "trend": trend,
        "is_peak_hour": is_peak_hour,
        "event_nearby": event_nearby,
        "congested": congested,
    })


def generate_accident_data(n=2000) -> pd.DataFrame:
    historical_accident_rate = RNG.uniform(0, 1, n)
    congestion_probability = RNG.uniform(0, 1, n)
    verified_incident_density = RNG.uniform(0, 1, n)
    road_condition_quality = RNG.uniform(0, 1, n)
    lighting_quality = RNG.uniform(0, 1, n)
    speed_variance_ratio = RNG.uniform(0, 1, n)
    weather_severity = RNG.uniform(0, 1, n)

    risk_signal = (
        3.2 * historical_accident_rate + 1.8 * congestion_probability
        + 1.6 * verified_incident_density
        - 1.5 * road_condition_quality - 1.1 * lighting_quality
        + 1.0 * speed_variance_ratio + 0.9 * weather_severity
        + RNG.normal(0, 1.1, n)
    )
    accident = (risk_signal > np.percentile(risk_signal, 75)).astype(int)

    return pd.DataFrame({
        "historical_accident_rate": historical_accident_rate,
        "congestion_probability": congestion_probability,
        "verified_incident_density": verified_incident_density,
        "road_condition_quality": road_condition_quality,
        "lighting_quality": lighting_quality,
        "speed_variance_ratio": speed_variance_ratio,
        "weather_severity": weather_severity,
        "accident": accident,
    })


if __name__ == "__main__":
    flood_df = generate_flood_data()
    congestion_df = generate_congestion_data()
    accident_df = generate_accident_data()
    flood_df.to_csv(OUT_DIR / "flood_data.csv", index=False)
    congestion_df.to_csv(OUT_DIR / "congestion_data.csv", index=False)
    accident_df.to_csv(OUT_DIR / "accident_data.csv", index=False)
    print(f"Wrote {len(flood_df)} flood rows, {len(congestion_df)} congestion rows, "
          f"and {len(accident_df)} accident rows to {OUT_DIR}")
