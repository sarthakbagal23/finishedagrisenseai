# Phase 4 — Advanced analysis report

## Purpose

Phase 4 adds deeper model checks and a visual gallery at `/research`. It builds on the same 1,000-row synthetic dataset used in Phases 1–3. These checks are intended to make the coding and statistical workflow more inspectable, not to create experimental evidence.

## Eight figures and related files

| Figure | Main question | Interpretation limit |
|---|---|---|
| `fig1_cv_model_comparison.png` | How do five model families compare under repeated 5-fold CV? | The supplied supplemental table cross-validates across the synthetic dataset; it is not an independent real-data holdout. |
| `fig2_pred_vs_actual_residuals.png` | Do out-of-fold predictions show large or patterned errors? | Errors are measured against simulated targets. |
| `fig3_correlation_heatmap.png` | How do generated features and targets co-vary? | Several correlations are intentionally encoded by equations; correlation is not causation. |
| `fig4_permutation_importance.png` | Which input shuffles change Random Forest score most? | This is a Random Forest diagnostic, not an explanation of the interaction-regression API model and not causal importance. |
| `fig5_hydrogel_dose_response.png` | How does the interaction model respond over a hydrogel input range in three scenarios? | A maximum at the edge of the tested range does not establish a true optimum or treatment recommendation. |
| `fig6_sensitivity_tornado.png` | How much does one input change the model output from its 10th to 90th percentile? | Other inputs are held at their medians; this is not a randomized intervention or causal effect. |
| `fig7_prediction_intervals.png` | What interval width and empirical coverage result from a synthetic calibration split? | The coverage result applies only to the simulated split; it is not calibrated for real plants. |
| `fig8_extrapolation_test.png` | How do models perform on higher-rigidity samples after fitting lower-rigidity data? | The stress test is within the generated distribution and does not guarantee performance on real unseen conditions. |

The script also writes `advanced_summary.json`, `cv_model_comparison.csv`, `permutation_importance.csv`, `sensitivity_tornado.csv`, and `extrapolation_stress_test.csv` under `agrisense-ml-api/outputs/advanced/`. It calculates variance inflation factors and a bootstrap difference between two scenario-defined subgroups; neither is a validated biological inference.

## Supplemental model comparison

The supplemental repeated CV is 5-fold with five repeats across all 1,000 generated rows. Its mean R² values for the interaction model were:

| Target | Model | Mean R² ± SD | Mean MAE | Mean RMSE |
|---|---|---:|---:|---:|
| Root elongation | Linear + interactions | 0.8731 ± 0.0130 | 0.5865 | 0.7302 |
| EXPA1-like proxy | Linear + interactions | 0.8424 ± 0.0124 | 0.2476 | 0.3102 |

The complete candidate table is included in the CSV and on the research page. Since cross-validation folds reuse the full dataset in this supplemental analysis, these scores are useful for describing repeated resampling behavior but should not be presented as a separate test set.

This supplemental CV has a different design from Phase 3's model-selection CV, which uses the 800-row training partition only and reserves the 200-row holdout for the final comparison. Keeping those results separate avoids blending the model-selection procedure with the final held-out metrics.

## Reproduce and refresh the website

From `agrisense-ml-api/`:

```powershell
python advanced_analysis.py
python sync_website_assets.py
```

The first command writes analysis outputs to `outputs/advanced/`. The second copies the eight plot files to `public/agriscience/phase4_*.png` and the summary to `src/data/advanced_summary.json`. After syncing, restart/rebuild the Next.js app if needed.

## What remains for future research

The next scientific step is not adding more model complexity; it is verifying the biological assumptions and replacing the generated values with well-documented experimental data when available. Any real study would need defined species/tissue, hydrogel formulation and concentration basis, calibrated rigidity measurement, genuine root-growth observations, transcriptomic assays, replication and randomization, and independent validation.
