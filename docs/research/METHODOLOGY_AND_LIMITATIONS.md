# Methodology and limitations

## Data status

Every row is synthetic. The dataset should be described as a simulated scenario dataset, not as an experimental dataset. The values are instantiated by `generate_dataset.py` using a deterministic NumPy random generator and seed `20261009`; the language model helped specify/design the scenario but did not individually generate each row.

## Generator assumptions

The script encodes the following equations and constraints for 1,000 rows. Noise terms are random draws from the specified distributions and the seed makes the generated file reproducible in a compatible environment.

- **Rainfall:** a gamma distribution (`shape=2.0`, `scale=2.1`), clipped to 0–12 mm/day, giving more low-rainfall scenarios.
- **Hydrogel:** sampled from the discrete levels 0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, and 2, with probabilities set in `generate_dataset.py`.
- **Rigidity:** `14 + 3.8 × max(0, 8 − rainfall) + 24 × latent_compaction − 1.4 × hydrogel + normal_noise`, clipped to 5–100 kPa.
- **Root-elongation target:** `10 − 0.090 × rigidity + 0.22 × rainfall + 1.30 × hydrogel + 0.010 × rigidity × hydrogel − 0.18 × max(0, hydrogel − 1.5)² + noise`, clipped to 0.2–14 mm/day.
- **EXPA1-like response proxy:** `1 + 0.034 × rigidity + 0.20 × max(0, 5 − rainfall) − 0.34 × hydrogel − 0.0075 × rigidity × hydrogel + noise`, clipped to 0.25–8 fold-change units.

These formulas are programming assumptions, not biological laws. Real expansin expression depends on biological context; this proxy does not estimate actual gene expression. The hydrogel percentage basis is undefined. Soil rigidity is an illustrative input scale and is not linked to a calibrated instrument protocol.

## Phase 1 — Quality control

The pipeline checks schema and column names, required values and types, numeric conversion, valid ranges, documented hydrogel levels, duplicate IDs, exact duplicate rows, and Tukey 1.5×IQR statistical outliers. Integrity errors would be recorded in `removed_rows_audit.csv`; valid statistical outliers are flagged for review, not automatically removed.

For the current seed, the source and cleaned datasets each contain 1,000 rows and six columns. No rows are removed for integrity problems. The IQR method flags 32 values in total: 2 rigidity values, 28 rainfall values, 1 root-growth value, and 1 proxy value. These values are within the schema's allowed ranges and are retained. Many flagged rainfall values are at the generator's 12 mm/day upper clip.

## Phase 2 — Statistical exploration

The project computes count, mean, median, standard deviation, quartiles, min, max, range, a Pearson correlation matrix, explicit relationship-direction checks, rainfall-stratified rigidity/root-growth correlations, and an exploratory rigidity-by-rainfall linear term comparison.

For the current generated file:

- Rigidity and root elongation: Pearson `r ≈ −0.760`.
- Rainfall and root elongation: `r ≈ +0.637`.
- Hydrogel concentration and root elongation: `r ≈ +0.585`.
- Hydrogel concentration and the synthetic proxy: `r ≈ −0.549`.
- Rigidity and rainfall: `r ≈ −0.691`, partly because the generator explicitly links drier scenarios with higher rigidity.

These statistics are descriptive properties of the synthetic dataset. They are not independent causal estimates and should not be described as discoveries from real trials.

## Phase 3 — Model comparison and final API models

Inputs are rigidity, hydrogel concentration, and rainfall. Two target columns are modeled. The candidate families are a training-mean baseline, plain linear regression, a polynomial-feature pipeline with degree 2 (main effects and pairwise interactions), Random Forest, and Gradient Boosting.

The main training script uses a fixed shuffled 80/20 split (`random_state=42`). It chooses a model by the lowest mean RMSE across five-fold cross-validation repeated three times on the 800-row training partition only. This avoids using the 200-row holdout for model selection. It then reports all candidates' metrics on that holdout. After evaluation, the selected candidate is refit on all rows to make the local demo model use all available synthetic examples.

With the current seed, the interaction model is selected for both targets. This is a pragmatic modeling choice for the programmed equations, not evidence that this model is best on real experimental data. The holdout results from the training-partition fit are recorded in `outputs/model_comparison_report.md` and `outputs/model_metrics.json`.

Metrics:

- **R²:** relative fit compared with a test-mean reference; closer to 1 generally indicates a closer fit for the given evaluation data.
- **MAE:** average absolute error in the target's units.
- **RMSE:** square-root mean squared error, which gives larger misses extra weight.

## Phase 4 — Supplemental diagnostics

`advanced_analysis.py` generates a separate repeated 5-fold CV table with five repeats across the whole 1,000-row dataset, prediction/residual plots, a correlation heatmap, Random Forest permutation importance, model-based dose-response and sensitivity curves, a 90% conformal interval diagnostic, an extrapolation test, VIF calculations, and a bootstrap difference between two synthetic subgroups.

Because this supplemental repeated-CV analysis uses all rows, its fold-wise values are an exploratory robustness summary, **not an independent holdout test**. The uncertainty/interval checks are also based only on generated target values and do not imply calibrated uncertainty on real plants. The subgroup contrast is an equation-generated comparison; even a large difference and a narrow bootstrap interval do not establish a real treatment effect.

## Product/API guardrails

The API rejects inputs outside 5–100 kPa, 0–2% hydrogel, and 0–12 mm/day. It separately flags input combinations outside observed training feature ranges. Model predictions are clipped to target display ranges; the response notes when clipping occurred. The low/moderate/high warning bands are illustrative and have not been biologically validated.

## What would be needed for a biological claim

A real research study would need a pre-specified experimental design, species/cultivar and tissue definitions, a defined hydrogel concentration basis, calibrated soil-mechanical measurements, environmental measurements with provenance, actual root-growth measurements, appropriately collected transcriptomic assays, sample-size/replicate rationale, statistical analysis that accounts for experimental structure, and independent validation. The present project does not contain those data.
