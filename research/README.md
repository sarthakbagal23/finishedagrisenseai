# AgriSense research package

Everything the Research Lab page is built from: the data generator, quality control, statistics, model training, advanced analysis, the saved final models, and every output table and figure. **All data is formula-generated (synthetic). The "EXPA1-like" variable is a proxy, not a measured gene-expression assay.**

```
research/agrisense-ml-api/
  generate_dataset.py      builds the 1,000-row synthetic dataset
  quality_control.py       audit + cleaning (outputs/dataset_quality_report.*)
  statistical_analysis.py  summary stats, correlations, graphs A-C
  train_models.py          5 model families, repeated CV, 200-row holdout
  advanced_analysis.py     Phase 4: permutation importance, sensitivity, dose response,
                           90% conformal interval, extrapolation stress test
  api.py                   optional FastAPI service (the website runs the same model in-browser)
  data/                    original, source and cleaned CSVs
  outputs/                 every table, report and figure (outputs/advanced = Phase 4, fig1-fig8)
  models/                  the two selected pipelines (degree-2 polynomial + linear regression)
  docs/AI_DATA_GENERATION_LOG.md
docs/research/             plain-English guide, methodology, architecture, changelog, phase reports
```

Run from `research/agrisense-ml-api/` (see `requirements.txt`). The `.joblib` files were saved with scikit-learn 1.8.0; load them with that version or retrain with `train_models.py`.

## Two different validation designs: do not compare scores across them

| Where | Design | Used in the app |
|---|---|---|
| `outputs/cross_validation_metrics.csv` | 5-fold CV x 3 repeats on the 800-row training partition; separate 200-row holdout | Research Lab, Model validation tab |
| `outputs/advanced/advanced_summary.json` (`cv_table`), `cv_model_comparison.csv` | 5-fold CV x 5 repeats on all 1,000 rows | Not shown; Phase 4 supplemental only |

## Checked against the app (`src/data/agrisense-research.ts`)

Checked on 2026-10-17 by script or by running the saved models:

- All 10 rows of the Phase 3 CV table (R2, MAE, RMSE and their SDs) match `cross_validation_metrics.csv` to 1e-6.
- The 9 root and 9 gene polynomial coefficients and both intercepts match the saved `root_elongation_model` and `stress_gene_proxy_model` exactly. At rigidity 55, hydrogel 1, rainfall 3 the saved models give root 7.4719 and proxy 2.5147, the same as the browser.
- Permutation importance, sensitivity (P10/P90 swings), extrapolation stress test, residual SDs, and the 90% interval (half-width 1.2719, coverage 0.908, 250 test rows; split 500/250/250 in `advanced_analysis.py`) match the Phase 4 outputs.
- The five displayed correlations match `correlation_matrix.csv`; the 32 IQR flags equal the sum of the per-column counts in `dataset_quality_report.json` (0+2+28+1+1).

Not checked: the dose-response curves in the app against `dose_response` in `advanced_summary.json`, and the unit tests in `tests/` (need `pytest` and `fastapi`).

An earlier API test recorded a proxy of 2.536 for the 55/1/3 scenario. The current saved model gives 2.5147, so that figure came from an older model version and should not be quoted.

## Not in the app yet

`advanced_summary.json` also contains a harsh-conditions treatment contrast (rigidity > 50 kPa and rainfall < 3 mm/day; hydrogel >= 1% vs 0%: mean difference 2.68 mm/day, 95% CI 2.28 to 3.06, Cohen's d 2.43) and variance inflation factors (about 1.0 to 1.9). These describe the generator's built-in effects, not real biology.
