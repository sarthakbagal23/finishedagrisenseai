"""Train and compare candidate regressors for the AgriSense synthetic demo.

Methodology:
- Keep a fixed 80/20 holdout split (seed 42) for a final, untouched check.
- Select model families using repeated cross-validation on the training partition only.
- Report R², MAE, and RMSE on the holdout for every candidate.
- Refit the CV-selected model on all rows for the downloadable/local demo API.

All targets and scores are synthetic-task demonstrations. They are not evidence
of performance on measured crops or laboratory transcriptomic data.
"""
from pathlib import Path
import json
import warnings

import joblib
import numpy as np
import pandas as pd
from sklearn.dummy import DummyRegressor
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.inspection import permutation_importance
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import RepeatedKFold, cross_validate, train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import PolynomialFeatures

ROOT = Path(__file__).resolve().parent
DATA_PATH = ROOT / "data" / "agrisense_synthetic_trials_cleaned.csv"
MODEL_DIR = ROOT / "models"
OUTPUT_DIR = ROOT / "outputs"
FEATURES = ["Soil_Rigidity_kPa", "Hydrogel_Concentration_Percent", "Average_Daily_Rainfall_mm"]
TARGETS = {
    "root_elongation": "Root_Elongation_Rate_mm_day",
    "gene_expression_proxy": "Stress_Gene_Expression_Fold_Change",
}
SEED = 42
TEST_SIZE = 0.20
CV_SPLITS = 5
CV_REPEATS = 3


def build_candidates():
    """Fresh estimator instance per fold; names are persisted in reports/artifacts."""
    return {
        "training_mean_baseline": lambda: DummyRegressor(strategy="mean"),
        "linear_regression": lambda: LinearRegression(),
        "linear_interactions": lambda: make_pipeline(
            PolynomialFeatures(degree=2, include_bias=False), LinearRegression()
        ),
        "random_forest": lambda: RandomForestRegressor(
            n_estimators=200, min_samples_leaf=3, max_features=1.0,
            random_state=SEED, n_jobs=-1,
        ),
        "gradient_boosting": lambda: GradientBoostingRegressor(random_state=SEED),
    }


def metric_values(y_true, y_pred):
    return {
        "R2": float(r2_score(y_true, y_pred)),
        "MAE": float(mean_absolute_error(y_true, y_pred)),
        "RMSE": float(np.sqrt(mean_squared_error(y_true, y_pred))),
    }


def markdown_table(headers, rows):
    out = ["| " + " | ".join(headers) + " |", "|" + "|".join(["---"] * len(headers)) + "|"]
    out.extend("| " + " | ".join(str(value) for value in row) + " |" for row in rows)
    return "\n".join(out)


def main() -> None:
    if not DATA_PATH.exists():
        raise FileNotFoundError("Run `python quality_control.py` first.")
    df = pd.read_csv(DATA_PATH)
    required = ["Trial_ID", *FEATURES, *TARGETS.values()]
    missing = [col for col in required if col not in df.columns]
    if missing:
        raise ValueError(f"Dataset missing required columns: {missing}")
    if df[required[1:]].isna().any().any():
        raise ValueError("Missing numeric values remain after QC.")
    if df["Trial_ID"].duplicated().any():
        raise ValueError("Duplicate Trial_ID remains after QC.")
    if len(df) < 100:
        raise ValueError(f"Expected a useful synthetic dataset; only {len(df)} rows found.")

    X = df[FEATURES].copy()
    train_idx, test_idx = train_test_split(
        np.arange(len(df)), test_size=TEST_SIZE, random_state=SEED, shuffle=True
    )
    X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
    model_factories = build_candidates()
    cv = RepeatedKFold(n_splits=CV_SPLITS, n_repeats=CV_REPEATS, random_state=SEED)
    MODEL_DIR.mkdir(exist_ok=True)
    OUTPUT_DIR.mkdir(exist_ok=True)

    results = {
        "dataset": DATA_PATH.name,
        "data_type": "synthetic only; no measured crop-trial, weather, soil-instrument, or laboratory observations",
        "rows": int(len(df)), "features": FEATURES, "targets": TARGETS,
        "train_rows": int(len(train_idx)), "test_rows": int(len(test_idx)),
        "test_size_fraction": TEST_SIZE, "random_state": SEED,
        "split_method": "Fixed shuffled 80/20 row split. The holdout is not used for model selection.",
        "selection_method": f"Lowest mean RMSE across {CV_REPEATS} repeats of {CV_SPLITS}-fold CV on the training partition only.",
        "metrics_note": "Holdout metrics describe fit to held-out records produced by the same synthetic generation recipe; they do not establish real-world validity.",
        "models": {}, "final_api_model_choice": {},
    }
    cv_rows, feature_importances, coefficient_rows = [], [], []
    test_output = pd.DataFrame({"Trial_ID": df["Trial_ID"].iloc[test_idx].reset_index(drop=True)})

    # Candidate evaluation happens separately for each target, with folds built only from training rows.
    selected_models = {}
    for target_key, target in TARGETS.items():
        y = df[target]
        y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]
        target_cv = {}
        holdout_metrics = {}
        holdout_predictions = {}
        fitted_train_models = {}
        for name, factory in model_factories.items():
            estimator = factory()
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                scores = cross_validate(
                    estimator, X_train, y_train, cv=cv,
                    scoring={"r2": "r2", "mae": "neg_mean_absolute_error", "rmse": "neg_root_mean_squared_error"},
                    n_jobs=1, return_train_score=False,
                )
            cv_metrics = {
                "R2_mean": float(np.mean(scores["test_r2"])),
                "R2_sd": float(np.std(scores["test_r2"], ddof=0)),
                "MAE_mean": float(-np.mean(scores["test_mae"])),
                "MAE_sd": float(np.std(-scores["test_mae"], ddof=0)),
                "RMSE_mean": float(-np.mean(scores["test_rmse"])),
                "RMSE_sd": float(np.std(-scores["test_rmse"], ddof=0)),
            }
            target_cv[name] = cv_metrics
            cv_rows.append({"target": target_key, "model": name, **cv_metrics})

            # Fit a copy only on the training partition to report the untouched holdout metrics.
            fitted = factory().fit(X_train, y_train)
            pred = np.asarray(fitted.predict(X_test), dtype=float)
            fitted_train_models[name] = fitted
            holdout_predictions[name] = pred
            holdout_metrics[name] = metric_values(y_test, pred)
            test_output[f"{target_key}_{name}_prediction"] = pred

        # CV selection only; neither holdout scores nor holdout labels affect this choice.
        chosen = min(target_cv, key=lambda name: (target_cv[name]["RMSE_mean"], target_cv[name]["MAE_mean"]))
        selected_models[target_key] = chosen
        results["models"][target] = {
            "label": "EXPA1-like synthetic response proxy" if target_key == "gene_expression_proxy" else "synthetic root elongation rate",
            "cross_validation_on_training_partition": target_cv,
            "holdout_metrics_by_model": holdout_metrics,
        }
        # Deployment artifact is trained on all available synthetic rows after holdout evaluation.
        full_model = model_factories[chosen]().fit(X, y)
        selected_models[f"{target_key}_model"] = full_model
        api_filename = "root_elongation_model.joblib" if target_key == "root_elongation" else "stress_gene_proxy_model.joblib"
        joblib.dump(full_model, MODEL_DIR / api_filename)
        # Save candidate models on the full dataset for explicit reproducibility/inspection.
        for candidate_name, factory in model_factories.items():
            prefix = "root_elongation" if target_key == "root_elongation" else "stress_gene_proxy"
            filename = f"{prefix}_{candidate_name}.joblib"
            joblib.dump(factory().fit(X, y), MODEL_DIR / filename)

        results["final_api_model_choice"][target] = {
            "chosen_for_api": chosen,
            "selection_basis": f"Lowest mean CV RMSE on the {len(train_idx)} training rows using {CV_REPEATS}x{CV_SPLITS}-fold CV.",
            "training_rows_for_cv": int(len(train_idx)),
            "final_api_refit_rows": int(len(df)),
            "reason_and_limit": "Selected by cross-validation without consulting the holdout scores, then refit on all synthetic rows for the local demo. Not validated on real biological measurements.",
        }

        # Feature importance from the training-only selected model and untouched holdout.
        chosen_train_model = fitted_train_models[chosen]
        pi = permutation_importance(
            chosen_train_model, X_test, y_test, scoring="r2", n_repeats=20,
            random_state=SEED, n_jobs=1,
        )
        for feature, mean, sd in zip(FEATURES, pi.importances_mean, pi.importances_std):
            feature_importances.append({"Target": target, "Selected_Model": chosen, "Feature": feature,
                                        "Permutation_Importance_R2_Drop": float(mean), "SD": float(sd)})

        # Main-effect linear coefficients are included as an interpretable comparator only.
        linear = model_factories["linear_regression"]().fit(X_train, y_train)
        for feature, coefficient in zip(FEATURES, linear.coef_):
            coefficient_rows.append({"Target": target, "Comparison_Model": "linear_regression",
                                     "Feature": feature, "Coefficient": float(coefficient),
                                     "Intercept": float(linear.intercept_)})

    # Actual holdout values, separately recorded once for each target.
    for target_key, target in TARGETS.items():
        test_output[f"{target_key}_actual"] = df[target].iloc[test_idx].to_numpy()
    test_output.to_csv(OUTPUT_DIR / "test_set_predictions.csv", index=False, float_format="%.6f")
    pd.DataFrame(cv_rows).round(6).to_csv(OUTPUT_DIR / "cross_validation_metrics.csv", index=False)
    pd.DataFrame(feature_importances).sort_values(["Target", "Permutation_Importance_R2_Drop"], ascending=[True, False]).to_csv(
        OUTPUT_DIR / "feature_importance_all_targets.csv", index=False, float_format="%.6f"
    )
    root_target = TARGETS["root_elongation"]
    root_imp = pd.DataFrame([r for r in feature_importances if r["Target"] == root_target])
    root_imp = root_imp.sort_values("Permutation_Importance_R2_Drop", ascending=False)
    root_imp.to_csv(OUTPUT_DIR / "root_model_feature_importance.csv", index=False, float_format="%.6f")
    pd.DataFrame(coefficient_rows).to_csv(OUTPUT_DIR / "linear_regression_coefficients.csv", index=False, float_format="%.7f")

    (OUTPUT_DIR / "model_metrics.json").write_text(json.dumps(results, indent=2), encoding="utf-8")
    report = [
        "# Phase 3 — cross-validated model comparison", "",
        "## Evaluation design", "",
        f"- Data: {len(df)} rows of formula-generated synthetic data.",
        f"- Fixed holdout: {len(train_idx)} training rows / {len(test_idx)} holdout rows (`random_state={SEED}`).",
        f"- Model selection: repeated {CV_SPLITS}-fold CV × {CV_REPEATS} repeats using only the training partition; lowest mean RMSE wins.",
        "- The held-out test partition is reserved for the final comparison and is not used to select the model.",
        "- After evaluation, the selected model is refit on all 1,000 synthetic rows for the local demo API.",
        "- R² closer to 1 and lower MAE/RMSE generally indicate better fit to these synthetic records; they do not indicate real-world crop prediction ability.", "",
    ]
    for target, content in results["models"].items():
        target_key = "root_elongation" if target == TARGETS["root_elongation"] else "gene_expression_proxy"
        selected = results["final_api_model_choice"][target]["chosen_for_api"]
        report += [f"## Target: {content['label']}", "", "### Cross-validation on training data", "",
                   markdown_table(["Model", "Mean CV R² ± SD", "Mean CV MAE", "Mean CV RMSE"], [
                       [name, f"{m['R2_mean']:.4f} ± {m['R2_sd']:.4f}", f"{m['MAE_mean']:.4f}", f"{m['RMSE_mean']:.4f}"]
                       for name, m in content["cross_validation_on_training_partition"].items()
                   ]), "", "### Untouched holdout comparison", "",
                   markdown_table(["Model", "Test R²", "Test MAE", "Test RMSE"], [
                       [name, f"{m['R2']:.5f}", f"{m['MAE']:.5f}", f"{m['RMSE']:.5f}"]
                       for name, m in content["holdout_metrics_by_model"].items()
                   ]), "",
                   f"**Selected API model: `{selected}`.** Selection was made from training-fold CV RMSE, not the holdout metrics. The saved API model is refit on all synthetic rows.", ""]
    report += [
        "## Additional outputs", "",
        "- `outputs/cross_validation_metrics.csv`: repeated-fold score means and standard deviations.",
        "- `outputs/test_set_predictions.csv`: held-out actual values and every candidate's predictions.",
        "- `outputs/feature_importance_all_targets.csv`: held-out permutation importance for the CV-selected model (importance is diagnostic, not causal).",
        "- `outputs/linear_regression_coefficients.csv`: coefficients from the plain linear model used as an interpretable comparator, not the interaction model.",
        "- `models/root_elongation_model.joblib` and `models/stress_gene_proxy_model.joblib`: full-data refits selected by training-only CV.", "",
        "## Scientific limitation", "",
        "The target formulas generated these data, so model scores largely measure whether a model can reconstruct a programmed scenario. The proxy is not measured EXPA1 expression, and there are no real plant, field, soil-instrument, or lab assay rows. Do not use the API outputs for agricultural decisions.", "",
    ]
    (OUTPUT_DIR / "model_comparison_report.md").write_text("\n".join(report), encoding="utf-8")
    print((OUTPUT_DIR / "model_comparison_report.md").read_text(encoding="utf-8"))


if __name__ == "__main__":
    main()
