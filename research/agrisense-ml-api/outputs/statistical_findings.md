# Phase 2 statistical findings

**Scope:** All results below describe only the 1,000-row synthetic scenario. They are not measured plant responses or causal evidence.

1. **Rigidity and root growth have a strong negative linear association in the generated data.** Pearson r = -0.760. That is consistent with the formula intentionally reducing root elongation as simulated rigidity rises. The correlation alone cannot prove the same effect size in real soil or crops.

2. **Rainfall has a positive association with simulated root elongation.** Pearson r = 0.637. The generated data also encode lower rainfall as a contributor to higher rigidity, so rainfall and rigidity are themselves correlated; their separate apparent relationships should not be treated as independent causal effects.

3. **The gene-expression proxy decreases across the hydrogel tiers under the chosen formula, while hydrogel and rainfall are nearly unrelated in the sampled rows.** Hydrogel–proxy Pearson r = -0.549; hydrogel–rainfall r = 0.018. The latter is a weak/unexpected relationship relative to the much stronger designed patterns and suggests the random design did not intentionally tie hydrogel assignment to rainfall. The proxy's direction is a programmed assumption, not an established universal EXPA1 response.

## Does rainfall change the rigidity–growth relationship?

The descriptive within-band rigidity/root-growth correlations run from -0.521 in the 0–2 mm/day band to -0.725 in the >8–12 mm/day band. See `rainfall_stratified_relationships.csv` and `graph_c_rainfall_stratified_correlation.png`. We also compared an in-sample linear model with and without a rigidity×rainfall term in `rainfall_interaction_analysis.json`. These are exploratory checks on a synthetic equation; they do not establish a biological interaction, because the dataset is formula-generated and other predictors/assumptions can shape subgroup patterns.

## Outputs

- `summary_statistics.csv`: means, medians, standard deviations, quartiles, minima, maxima, and ranges.
- `correlation_matrix.csv`: Pearson correlation matrix for numerical columns.
- `relationship_direction_checks.csv`: explicit check of the intended directions encoded by the generator.
- `distribution_overview.png`: histograms for input and target distributions.
- `gene_proxy_by_hydrogel_tier.csv`: tier-level sample counts, means, standard deviations, and standard errors.
- `rainfall_stratified_relationships.csv`: subgroup summaries/correlations by rainfall band.
- `rainfall_interaction_analysis.json`: exploratory interaction-model comparison.
- `graph_a_rigidity_vs_root_growth.png`, `graph_b_hydrogel_vs_gene_proxy.png`, `graph_c_rainfall_stratified_correlation.png`.
