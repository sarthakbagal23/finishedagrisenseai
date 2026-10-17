"""Software-behavior checks for the local synthetic AgriSense demo.

Run from agrisense-ml-api/: python -m pytest -q
These tests do not validate biology or real-world prediction quality.
"""
import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from fastapi.testclient import TestClient
from sklearn.pipeline import Pipeline

import api

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
MODEL_DIR = ROOT / "models"
OUTPUT_DIR = ROOT / "outputs"
WEB_ROOT = ROOT.parent
client = TestClient(api.app)


def test_dataset_integrity_and_quality_control_outputs():
    cleaned = pd.read_csv(DATA_DIR / "agrisense_synthetic_trials_cleaned.csv")
    original = pd.read_csv(DATA_DIR / "agrisense_synthetic_trials_original.csv")
    report = json.loads((OUTPUT_DIR / "dataset_quality_report.json").read_text(encoding="utf-8"))
    assert len(original) == len(cleaned) == 1000
    assert original.columns.tolist() == cleaned.columns.tolist()
    assert original["Trial_ID"].is_unique and cleaned["Trial_ID"].is_unique
    assert not original.duplicated().any() and not cleaned.duplicated().any()
    assert not original.isna().any().any() and not cleaned.isna().any().any()
    assert report["row_count_original"] == 1000
    assert report["row_count_cleaned"] == 1000
    assert report["column_count"] == 6
    assert (OUTPUT_DIR / "data_dictionary.csv").exists()
    assert (OUTPUT_DIR / "data_dictionary.md").exists()
    assert (OUTPUT_DIR / "removed_rows_audit.csv").exists()


def test_phase2_statistics_and_advanced_analysis_artifacts_exist():
    required = [
        "summary_statistics.csv", "correlation_matrix.csv", "relationship_direction_checks.csv",
        "graph_a_rigidity_vs_root_growth.png", "graph_b_hydrogel_vs_gene_proxy.png",
        "graph_c_rainfall_stratified_correlation.png", "statistical_findings.md",
        "model_comparison_report.md", "cross_validation_metrics.csv", "test_set_predictions.csv",
    ]
    for name in required:
        assert (OUTPUT_DIR / name).is_file(), name
    advanced = OUTPUT_DIR / "advanced"
    summary = json.loads((advanced / "advanced_summary.json").read_text(encoding="utf-8"))
    for name in [
        "fig1_cv_model_comparison.png", "fig2_pred_vs_actual_residuals.png",
        "fig3_correlation_heatmap.png", "fig4_permutation_importance.png",
        "fig5_hydrogel_dose_response.png", "fig6_sensitivity_tornado.png",
        "fig7_prediction_intervals.png", "fig8_extrapolation_test.png",
        "cv_model_comparison.csv", "permutation_importance.csv", "sensitivity_tornado.csv",
        "extrapolation_stress_test.csv",
    ]:
        assert (advanced / name).is_file(), name
    assert summary["cv_table"]
    assert "synthetic" in (OUTPUT_DIR / "statistical_findings.md").read_text(encoding="utf-8").lower()


def test_cv_selection_uses_interaction_models_and_all_candidates_are_reported():
    metrics = json.loads((OUTPUT_DIR / "model_metrics.json").read_text(encoding="utf-8"))
    assert metrics["train_rows"] == 800 and metrics["test_rows"] == 200
    assert "training partition only" in metrics["selection_method"].lower()
    assert "holdout" in metrics["split_method"].lower()
    candidate_names = {
        "training_mean_baseline", "linear_regression", "linear_interactions",
        "random_forest", "gradient_boosting",
    }
    for target in metrics["models"].values():
        assert set(target["cross_validation_on_training_partition"]) == candidate_names
        assert set(target["holdout_metrics_by_model"]) == candidate_names
        for record in target["holdout_metrics_by_model"].values():
            assert np.isfinite([record["R2"], record["MAE"], record["RMSE"]]).all()
            assert record["MAE"] >= 0 and record["RMSE"] >= 0
    chosen = metrics["final_api_model_choice"]
    assert chosen["Root_Elongation_Rate_mm_day"]["chosen_for_api"] == "linear_interactions"
    assert chosen["Stress_Gene_Expression_Fold_Change"]["chosen_for_api"] == "linear_interactions"


def test_saved_api_models_are_polynomial_interaction_pipelines():
    root_model = joblib.load(MODEL_DIR / "root_elongation_model.joblib")
    gene_model = joblib.load(MODEL_DIR / "stress_gene_proxy_model.joblib")
    assert isinstance(root_model, Pipeline) and isinstance(gene_model, Pipeline)
    assert "polynomialfeatures" in root_model.named_steps
    assert "linearregression" in root_model.named_steps
    assert "polynomialfeatures" in gene_model.named_steps
    assert "linearregression" in gene_model.named_steps


def test_health_endpoint_discloses_synthetic_data():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "data_status": "synthetic_demo_only"}


def test_valid_prediction_returns_finite_bounded_values_and_disclaimer():
    response = client.post("/predict", json={
        "soil_rigidity_kpa": 55,
        "hydrogel_concentration_percent": 1.0,
        "average_daily_rainfall_mm": 3,
    })
    assert response.status_code == 200
    body = response.json()
    assert 0.2 <= body["predicted_root_elongation_mm_day"] <= 14.0
    assert 0.25 <= body["predicted_stress_gene_proxy_fold_change"] <= 8.0
    assert np.isfinite(body["predicted_root_elongation_mm_day"])
    assert np.isfinite(body["predicted_stress_gene_proxy_fold_change"])
    assert "synthetic" in body["notice"].lower()
    assert "not a measured assay" in body["notice"].lower()


def test_boundary_inputs_are_constrained_to_synthetic_target_ranges():
    response = client.post("/predict", json={
        "soil_rigidity_kpa": 5,
        "hydrogel_concentration_percent": 2,
        "average_daily_rainfall_mm": 12,
    })
    assert response.status_code == 200
    body = response.json()
    assert body["predicted_root_elongation_mm_day"] == 14.0
    assert body["output_was_bounded_to_synthetic_range"] is True
    assert body["inputs_within_observed_training_range"] is True


def test_scenarios_outside_observed_range_are_flagged_as_extrapolation():
    response = client.post("/predict", json={
        "soil_rigidity_kpa": 100,
        "hydrogel_concentration_percent": 0,
        "average_daily_rainfall_mm": 0,
    })
    assert response.status_code == 200
    body = response.json()
    assert body["inputs_within_observed_training_range"] is False
    assert "extrapolation" in body["input_range_note"].lower()


def test_out_of_range_inputs_are_rejected():
    cases = [
        {"soil_rigidity_kpa": 101, "hydrogel_concentration_percent": 1, "average_daily_rainfall_mm": 3},
        {"soil_rigidity_kpa": 50, "hydrogel_concentration_percent": 2.1, "average_daily_rainfall_mm": 3},
        {"soil_rigidity_kpa": 50, "hydrogel_concentration_percent": 1, "average_daily_rainfall_mm": 13},
    ]
    for payload in cases:
        assert client.post("/predict", json=payload).status_code == 422


def test_missing_and_nonfinite_inputs_are_rejected():
    missing = client.post("/predict", json={"soil_rigidity_kpa": 50})
    nonfinite = client.post(
        "/predict",
        content=b'{"soil_rigidity_kpa":NaN,"hydrogel_concentration_percent":1,"average_daily_rainfall_mm":3}',
        headers={"content-type": "application/json"},
    )
    assert missing.status_code == 422
    assert nonfinite.status_code == 422


def test_website_research_assets_match_advanced_outputs():
    source_summary = json.loads((OUTPUT_DIR / "advanced" / "advanced_summary.json").read_text(encoding="utf-8"))
    frontend_summary = json.loads((WEB_ROOT / "src" / "data" / "advanced_summary.json").read_text(encoding="utf-8"))
    assert source_summary == frontend_summary
    for number, suffix in [
        (1, "cv_model_comparison"), (2, "pred_vs_actual_residuals"), (3, "correlation_heatmap"),
        (4, "permutation_importance"), (5, "hydrogel_dose_response"), (6, "sensitivity_tornado"),
        (7, "prediction_intervals"), (8, "extrapolation_test"),
    ]:
        source = OUTPUT_DIR / "advanced" / f"fig{number}_{suffix}.png"
        public = WEB_ROOT / "public" / "agriscience" / f"phase4_fig{number}_{suffix}.png"
        assert source.is_file() and public.is_file()
        assert source.stat().st_size == public.stat().st_size
