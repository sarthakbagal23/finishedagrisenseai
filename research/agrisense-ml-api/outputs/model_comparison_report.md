# Phase 3 — cross-validated model comparison

## Evaluation design

- Data: 1000 rows of formula-generated synthetic data.
- Fixed holdout: 800 training rows / 200 holdout rows (`random_state=42`).
- Model selection: repeated 5-fold CV × 3 repeats using only the training partition; lowest mean RMSE wins.
- The held-out test partition is reserved for the final comparison and is not used to select the model.
- After evaluation, the selected model is refit on all 1,000 synthetic rows for the local demo API.
- R² closer to 1 and lower MAE/RMSE generally indicate better fit to these synthetic records; they do not indicate real-world crop prediction ability.

## Target: synthetic root elongation rate

### Cross-validation on training data

| Model | Mean CV R² ± SD | Mean CV MAE | Mean CV RMSE |
|---|---|---|---|
| training_mean_baseline | -0.0162 ± 0.0185 | 1.6706 | 2.0676 |
| linear_regression | 0.8686 ± 0.0141 | 0.5917 | 0.7411 |
| linear_interactions | 0.8728 ± 0.0151 | 0.5844 | 0.7287 |
| random_forest | 0.8470 ± 0.0210 | 0.6382 | 0.7989 |
| gradient_boosting | 0.8567 ± 0.0198 | 0.6142 | 0.7730 |

### Untouched holdout comparison

| Model | Test R² | Test MAE | Test RMSE |
|---|---|---|---|
| training_mean_baseline | -0.00276 | 1.66583 | 2.04355 |
| linear_regression | 0.86897 | 0.58975 | 0.73872 |
| linear_interactions | 0.86856 | 0.60415 | 0.73986 |
| random_forest | 0.84807 | 0.66408 | 0.79543 |
| gradient_boosting | 0.86309 | 0.61193 | 0.75510 |

**Selected API model: `linear_interactions`.** Selection was made from training-fold CV RMSE, not the holdout metrics. The saved API model is refit on all synthetic rows.

## Target: EXPA1-like synthetic response proxy

### Cross-validation on training data

| Model | Mean CV R² ± SD | Mean CV MAE | Mean CV RMSE |
|---|---|---|---|
| training_mean_baseline | -0.0104 ± 0.0133 | 0.6528 | 0.7901 |
| linear_regression | 0.8067 ± 0.0210 | 0.2762 | 0.3447 |
| linear_interactions | 0.8369 ± 0.0187 | 0.2518 | 0.3164 |
| random_forest | 0.8101 ± 0.0161 | 0.2708 | 0.3419 |
| gradient_boosting | 0.8153 ± 0.0179 | 0.2700 | 0.3370 |

### Untouched holdout comparison

| Model | Test R² | Test MAE | Test RMSE |
|---|---|---|---|
| training_mean_baseline | -0.00970 | 0.63343 | 0.76397 |
| linear_regression | 0.80746 | 0.26650 | 0.33361 |
| linear_interactions | 0.85659 | 0.23266 | 0.28792 |
| random_forest | 0.83555 | 0.25022 | 0.30832 |
| gradient_boosting | 0.84585 | 0.23957 | 0.29851 |

**Selected API model: `linear_interactions`.** Selection was made from training-fold CV RMSE, not the holdout metrics. The saved API model is refit on all synthetic rows.

## Additional outputs

- `outputs/cross_validation_metrics.csv`: repeated-fold score means and standard deviations.
- `outputs/test_set_predictions.csv`: held-out actual values and every candidate's predictions.
- `outputs/feature_importance_all_targets.csv`: held-out permutation importance for the CV-selected model (importance is diagnostic, not causal).
- `outputs/linear_regression_coefficients.csv`: coefficients from the plain linear model used as an interpretable comparator, not the interaction model.
- `models/root_elongation_model.joblib` and `models/stress_gene_proxy_model.joblib`: full-data refits selected by training-only CV.

## Scientific limitation

The target formulas generated these data, so model scores largely measure whether a model can reconstruct a programmed scenario. The proxy is not measured EXPA1 expression, and there are no real plant, field, soil-instrument, or lab assay rows. Do not use the API outputs for agricultural decisions.
