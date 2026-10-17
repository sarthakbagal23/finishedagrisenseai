"""Statistical summary, correlation, rainfall moderation checks, and plots."""
from pathlib import Path
import json
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score

ROOT = Path(__file__).resolve().parent
DATA_PATH = ROOT / "data" / "agrisense_synthetic_trials_cleaned.csv"
OUT = ROOT / "outputs"
FEATURES = ["Soil_Rigidity_kPa", "Hydrogel_Concentration_Percent", "Average_Daily_Rainfall_mm"]
ROOT_TARGET = "Root_Elongation_Rate_mm_day"
GENE_TARGET = "Stress_Gene_Expression_Fold_Change"


def main() -> None:
    if not DATA_PATH.exists():
        raise FileNotFoundError("Run `python quality_control.py` first.")
    OUT.mkdir(exist_ok=True)
    df = pd.read_csv(DATA_PATH)
    numeric = df.select_dtypes(include="number")
    summary = numeric.agg(["count", "mean", "median", "std", "min", "max"]).T
    summary["q1"] = numeric.quantile(0.25)
    summary["q3"] = numeric.quantile(0.75)
    summary["range"] = summary["max"] - summary["min"]
    summary = summary[["count", "mean", "median", "std", "min", "q1", "q3", "max", "range"]]
    summary.round(4).to_csv(OUT / "summary_statistics.csv", index_label="variable")

    corr = numeric.corr(method="pearson")
    corr.round(5).to_csv(OUT / "correlation_matrix.csv", index_label="variable")
    direction_specs = [
        ("Average_Daily_Rainfall_mm", "Soil_Rigidity_kPa", "negative", "less rainfall is encoded to increase rigidity"),
        ("Soil_Rigidity_kPa", ROOT_TARGET, "negative", "root-rate formula contains a negative rigidity term"),
        ("Average_Daily_Rainfall_mm", ROOT_TARGET, "positive", "root-rate formula contains a positive rainfall term"),
        ("Hydrogel_Concentration_Percent", ROOT_TARGET, "positive", "root-rate formula gives hydrogel a positive main effect and buffering interaction"),
        ("Soil_Rigidity_kPa", GENE_TARGET, "positive", "proxy formula contains a positive rigidity term"),
        ("Average_Daily_Rainfall_mm", GENE_TARGET, "negative", "proxy formula includes a drought-stress term"),
        ("Hydrogel_Concentration_Percent", GENE_TARGET, "negative", "proxy formula contains negative hydrogel terms"),
    ]
    direction_checks = []
    for x, y, expected, basis in direction_specs:
        r = float(corr.loc[x, y])
        observed = "positive" if r > 0 else "negative" if r < 0 else "approximately zero"
        direction_checks.append({"variable_x": x, "variable_y": y, "pearson_r": r, "expected_direction_from_generator": expected, "observed_direction": observed, "direction_matches": observed == expected, "basis": basis, "interpretation_limit": "Synthetic correlation check only; not evidence of real-world effect or causation."})
    pd.DataFrame(direction_checks).to_csv(OUT / "relationship_direction_checks.csv", index=False, float_format="%.5f")

    # Distribution overview: histograms help inspect skew and boundaries.
    fig, axes = plt.subplots(2, 3, figsize=(13, 7.5))
    plot_columns = [
        ("Average_Daily_Rainfall_mm", "Rainfall (mm/day)"),
        ("Soil_Rigidity_kPa", "Rigidity (kPa)"),
        ("Hydrogel_Concentration_Percent", "Hydrogel (%)"),
        (ROOT_TARGET, "Root elongation (mm/day)"),
        (GENE_TARGET, "Gene-response proxy (fold change)"),
    ]
    for ax, (column, label) in zip(axes.flat, plot_columns):
        ax.hist(df[column], bins=18, edgecolor="white", alpha=0.9)
        ax.set_title(label, weight="bold")
        ax.set_ylabel("Count")
        ax.grid(axis="y", alpha=0.2)
    axes.flat[-1].axis("off")
    fig.suptitle("Synthetic Dataset Distributions — 1,000 Rows", fontsize=15, weight="bold")
    fig.text(0.5, 0.015, "Synthetic scenario only • Histogram shape reflects the programmed generator and seed.", ha="center", fontsize=9)
    fig.tight_layout(rect=[0, 0.04, 1, 0.95])
    fig.savefig(OUT / "distribution_overview.png", dpi=200, bbox_inches="tight")
    plt.close(fig)

    # Stratify by rainfall. Pearson rigidity/root correlations within bins are a
    # descriptive sensitivity check, not a causal test. Also estimate a basic
    # interaction model and compare in-sample fit as a diagnostic only.
    bins = [-0.001, 2, 4, 6, 8, 12.0001]
    labels = ["0–2", ">2–4", ">4–6", ">6–8", ">8–12"]
    df["Rainfall_Band_mm_day"] = pd.cut(df["Average_Daily_Rainfall_mm"], bins=bins, labels=labels, include_lowest=True)
    band_rows = []
    for label, group in df.groupby("Rainfall_Band_mm_day", observed=False):
        if group.empty:
            continue
        band_rows.append({
            "rainfall_band_mm_day": str(label),
            "n": int(len(group)),
            "mean_rainfall_mm_day": float(group["Average_Daily_Rainfall_mm"].mean()),
            "mean_soil_rigidity_kpa": float(group["Soil_Rigidity_kPa"].mean()),
            "mean_root_elongation_mm_day": float(group[ROOT_TARGET].mean()),
            "pearson_rigidity_root_correlation": float(group["Soil_Rigidity_kPa"].corr(group[ROOT_TARGET])),
        })
    band_df = pd.DataFrame(band_rows)
    band_df.to_csv(OUT / "rainfall_stratified_relationships.csv", index=False, float_format="%.5f")

    base_x = df[["Soil_Rigidity_kPa", "Average_Daily_Rainfall_mm", "Hydrogel_Concentration_Percent"]].copy()
    interaction_x = base_x.copy()
    interaction_x["Rigidity_x_Rainfall"] = interaction_x["Soil_Rigidity_kPa"] * interaction_x["Average_Daily_Rainfall_mm"]
    main_model = LinearRegression().fit(base_x, df[ROOT_TARGET])
    interaction_model = LinearRegression().fit(interaction_x, df[ROOT_TARGET])
    interaction_results = {
        "purpose": "Descriptive sensitivity check for whether a rigidity-by-rainfall interaction improves fit to the synthetic generated target.",
        "main_effects_model_in_sample_r2": round(float(r2_score(df[ROOT_TARGET], main_model.predict(base_x))), 5),
        "with_rigidity_x_rainfall_interaction_in_sample_r2": round(float(r2_score(df[ROOT_TARGET], interaction_model.predict(interaction_x))), 5),
        "interaction_linear_coefficient": round(float(interaction_model.coef_[list(interaction_x.columns).index("Rigidity_x_Rainfall")]), 6),
        "main_effect_model_coefficients": {k: round(float(v), 6) for k, v in zip(base_x.columns, main_model.coef_)},
        "interaction_model_coefficients": {k: round(float(v), 6) for k, v in zip(interaction_x.columns, interaction_model.coef_)},
        "intercept_with_interaction": round(float(interaction_model.intercept_), 6),
        "warning": "This is an exploratory in-sample diagnostic on formula-generated data; it is not evidence of a real biological interaction or causality.",
    }
    (OUT / "rainfall_interaction_analysis.json").write_text(json.dumps(interaction_results, indent=2), encoding="utf-8")

    # Graph A: polished raw synthetic trial scatter, color indicates hydrogel tier.
    fig, ax = plt.subplots(figsize=(9.5, 6.1))
    pts = ax.scatter(df["Soil_Rigidity_kPa"], df[ROOT_TARGET], c=df["Hydrogel_Concentration_Percent"], cmap="viridis", s=24, alpha=0.76, edgecolors="none")
    z = np.polyfit(df["Soil_Rigidity_kPa"], df[ROOT_TARGET], 1)
    xs = np.linspace(df["Soil_Rigidity_kPa"].min(), df["Soil_Rigidity_kPa"].max(), 150)
    ax.plot(xs, np.polyval(z, xs), linewidth=2.4, linestyle="--", label="Overall linear trend")
    ax.set_title("Soil Rigidity and Root Elongation", pad=14, weight="bold")
    ax.set_xlabel("Soil rigidity (kPa; simulated scale)")
    ax.set_ylabel("Root elongation rate (mm/day; simulated)")
    cb = fig.colorbar(pts, ax=ax, pad=0.02)
    cb.set_label("Hydrogel concentration (%)")
    ax.grid(alpha=0.22)
    ax.legend(frameon=False, loc="upper right")
    fig.text(0.5, 0.01, "Synthetic data only • The trend is built from programmed assumptions, not measured crop trials.", ha="center", fontsize=9)
    fig.tight_layout(rect=[0, 0.045, 1, 1])
    fig.savefig(OUT / "graph_a_rigidity_vs_root_growth.png", dpi=220, bbox_inches="tight")
    plt.close(fig)

    # Graph B: group means with standard-error bars, clearly labeled proxy.
    grouped = df.groupby("Hydrogel_Concentration_Percent")[GENE_TARGET]
    stats = grouped.agg(mean="mean", count="count", std="std").reset_index()
    stats["sem"] = stats["std"] / np.sqrt(stats["count"])
    stats.to_csv(OUT / "gene_proxy_by_hydrogel_tier.csv", index=False, float_format="%.5f")
    fig, ax = plt.subplots(figsize=(9.5, 6.1))
    ax.bar(stats["Hydrogel_Concentration_Percent"].map(lambda x: f"{x:g}"), stats["mean"], yerr=stats["sem"], capsize=4, alpha=0.88)
    ax.set_title("Hydrogel Tier and EXPA1-Like Stress Proxy", pad=14, weight="bold")
    ax.set_xlabel("Hydrogel concentration (%)")
    ax.set_ylabel("Mean stress-gene proxy (fold-change units; simulated)")
    ax.grid(axis="y", alpha=0.22)
    fig.text(0.5, 0.01, "Not an EXPA1 assay • Values are hypothetical simulation outputs, not measured gene expression.", ha="center", fontsize=9)
    fig.tight_layout(rect=[0, 0.045, 1, 1])
    fig.savefig(OUT / "graph_b_hydrogel_vs_gene_proxy.png", dpi=220, bbox_inches="tight")
    plt.close(fig)

    # Extra diagnostic plot: within rainfall-band correlation of rigidity and growth.
    fig, ax = plt.subplots(figsize=(9.5, 5.8))
    ax.plot(band_df["rainfall_band_mm_day"], band_df["pearson_rigidity_root_correlation"], marker="o", linewidth=2.3)
    ax.axhline(0, linewidth=1, linestyle="--")
    ax.set_ylim(-1, 1)
    ax.set_title("Rigidity–Growth Correlation Within Rainfall Bands", pad=14, weight="bold")
    ax.set_xlabel("Rainfall band (mm/day)")
    ax.set_ylabel("Pearson correlation (r)")
    ax.grid(alpha=0.22)
    fig.text(0.5, 0.01, "Exploratory subgroup check on synthetic data; correlations do not establish an interaction or cause.", ha="center", fontsize=9)
    fig.tight_layout(rect=[0, 0.045, 1, 1])
    fig.savefig(OUT / "graph_c_rainfall_stratified_correlation.png", dpi=220, bbox_inches="tight")
    plt.close(fig)

    # Three evidence-linked findings; keep wording bounded to this synthetic data.
    r_rig_root = float(corr.loc["Soil_Rigidity_kPa", ROOT_TARGET])
    r_rain_root = float(corr.loc["Average_Daily_Rainfall_mm", ROOT_TARGET])
    r_hydro_gene = float(corr.loc["Hydrogel_Concentration_Percent", GENE_TARGET])
    r_hydro_rain = float(corr.loc["Hydrogel_Concentration_Percent", "Average_Daily_Rainfall_mm"])
    first = band_df.iloc[0]
    last = band_df.iloc[-1]
    findings = f"""# Phase 2 statistical findings

**Scope:** All results below describe only the 1,000-row synthetic scenario. They are not measured plant responses or causal evidence.

1. **Rigidity and root growth have a strong negative linear association in the generated data.** Pearson r = {r_rig_root:.3f}. That is consistent with the formula intentionally reducing root elongation as simulated rigidity rises. The correlation alone cannot prove the same effect size in real soil or crops.

2. **Rainfall has a positive association with simulated root elongation.** Pearson r = {r_rain_root:.3f}. The generated data also encode lower rainfall as a contributor to higher rigidity, so rainfall and rigidity are themselves correlated; their separate apparent relationships should not be treated as independent causal effects.

3. **The gene-expression proxy decreases across the hydrogel tiers under the chosen formula, while hydrogel and rainfall are nearly unrelated in the sampled rows.** Hydrogel–proxy Pearson r = {r_hydro_gene:.3f}; hydrogel–rainfall r = {r_hydro_rain:.3f}. The latter is a weak/unexpected relationship relative to the much stronger designed patterns and suggests the random design did not intentionally tie hydrogel assignment to rainfall. The proxy's direction is a programmed assumption, not an established universal EXPA1 response.

## Does rainfall change the rigidity–growth relationship?

The descriptive within-band rigidity/root-growth correlations run from {first['pearson_rigidity_root_correlation']:.3f} in the {first['rainfall_band_mm_day']} mm/day band to {last['pearson_rigidity_root_correlation']:.3f} in the {last['rainfall_band_mm_day']} mm/day band. See `rainfall_stratified_relationships.csv` and `graph_c_rainfall_stratified_correlation.png`. We also compared an in-sample linear model with and without a rigidity×rainfall term in `rainfall_interaction_analysis.json`. These are exploratory checks on a synthetic equation; they do not establish a biological interaction, because the dataset is formula-generated and other predictors/assumptions can shape subgroup patterns.

## Outputs

- `summary_statistics.csv`: means, medians, standard deviations, quartiles, minima, maxima, and ranges.
- `correlation_matrix.csv`: Pearson correlation matrix for numerical columns.
- `relationship_direction_checks.csv`: explicit check of the intended directions encoded by the generator.
- `distribution_overview.png`: histograms for input and target distributions.
- `gene_proxy_by_hydrogel_tier.csv`: tier-level sample counts, means, standard deviations, and standard errors.
- `rainfall_stratified_relationships.csv`: subgroup summaries/correlations by rainfall band.
- `rainfall_interaction_analysis.json`: exploratory interaction-model comparison.
- `graph_a_rigidity_vs_root_growth.png`, `graph_b_hydrogel_vs_gene_proxy.png`, `graph_c_rainfall_stratified_correlation.png`.
"""
    (OUT / "statistical_findings.md").write_text(findings, encoding="utf-8")
    print("Statistical analysis complete.")
    print("\nCorrelation matrix:\n", corr.round(3).to_string())
    print("\nRainfall bands:\n", band_df.round(3).to_string(index=False))
    print("\n", findings)

if __name__ == "__main__":
    main()
