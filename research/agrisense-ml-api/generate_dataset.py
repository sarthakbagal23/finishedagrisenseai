"""Generate a reproducible, explicitly synthetic AgriSense AI trial dataset.

These rows are simulated to test the project pipeline. They are NOT observations
from real crops, laboratories, farms, or transcriptomic assays.
"""
from pathlib import Path
import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "data" / "agrisense_synthetic_trials.csv"
SEED = 20261009
N_ROWS = 1000


def main() -> None:
    rng = np.random.default_rng(SEED)

    # Rainfall is skewed toward drier conditions to represent a drought-prone
    # scenario. It is a synthetic scenario parameter, not local climate data.
    rainfall = np.clip(rng.gamma(shape=2.0, scale=2.1, size=N_ROWS), 0.0, 12.0)

    # Discrete tiers make later comparisons and dashboard controls easier.
    hydrogel_tiers = np.array([0.0, 0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0])
    probabilities = np.array([0.14, 0.09, 0.12, 0.10, 0.16, 0.12, 0.15, 0.12])
    hydrogel = rng.choice(hydrogel_tiers, size=N_ROWS, p=probabilities)

    # Synthetic soil rigidity: generally higher in drier conditions. Hydrogel
    # has a modest modeled association with lower measured rigidity, with noise.
    latent_compaction = rng.uniform(0.0, 1.0, size=N_ROWS)
    rigidity = (
        14.0
        + 3.8 * np.maximum(0.0, 8.0 - rainfall)
        + 24.0 * latent_compaction
        - 1.4 * hydrogel
        + rng.normal(0.0, 5.5, size=N_ROWS)
    )
    rigidity = np.clip(rigidity, 5.0, 100.0)

    # Scenario assumptions, deliberately chosen so higher rigidity lowers
    # growth, rainfall modestly supports growth, and hydrogel partially buffers
    # the rigidity-associated decrease. These are not fitted to real biology.
    root_rate = (
        10.0
        - 0.090 * rigidity
        + 0.22 * rainfall
        + 1.30 * hydrogel
        + 0.010 * rigidity * hydrogel
        - 0.18 * np.maximum(0.0, hydrogel - 1.5) ** 2
        + rng.normal(0.0, 0.75, size=N_ROWS)
    )
    root_rate = np.clip(root_rate, 0.2, 14.0)

    # EXPANSIN/EXPA1-LIKE RESPONSE PROXY: a hypothetical, synthetic response
    # used to build a demonstration gauge. Expansin expression is tissue- and
    # condition-dependent; this formula does not claim a universal EXPA1 response.
    gene_fold_change = (
        1.0
        + 0.034 * rigidity
        + 0.20 * np.maximum(0.0, 5.0 - rainfall)
        - 0.34 * hydrogel
        - 0.0075 * rigidity * hydrogel
        + rng.normal(0.0, 0.30, size=N_ROWS)
    )
    gene_fold_change = np.clip(gene_fold_change, 0.25, 8.0)

    df = pd.DataFrame({
        "Trial_ID": [f"AS-{i:04d}" for i in range(1, N_ROWS + 1)],
        "Hydrogel_Concentration_Percent": hydrogel,
        "Soil_Rigidity_kPa": np.round(rigidity, 2),
        "Average_Daily_Rainfall_mm": np.round(rainfall, 2),
        "Root_Elongation_Rate_mm_day": np.round(root_rate, 2),
        "Stress_Gene_Expression_Fold_Change": np.round(gene_fold_change, 3),
    })

    OUT.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(OUT, index=False)
    print(f"Saved {len(df):,} synthetic trials to: {OUT}")
    print("Columns:", ", ".join(df.columns))
    print("Preview:\n", df.head(5).to_string(index=False))
    print("\nImportant: these are simulated values, not real trial results.")


if __name__ == "__main__":
    main()
