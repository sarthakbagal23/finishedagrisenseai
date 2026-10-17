"""Build src/data/dataset-site.json for the website from the canonical CSV.

Run from the repo root:  python3 research/export_site_data.py
Every number the Findings page shows comes from this file, which is computed
directly from public/data/agrisense_synthetic_trials.csv (no model involved).
"""
import json
from pathlib import Path
import pandas as pd

root = Path(__file__).resolve().parents[1]
df = pd.read_csv(root / "public/data/agrisense_synthetic_trials.csv")
H, R, F = "Hydrogel_Concentration_Percent", "Soil_Rigidity_kPa", "Average_Daily_Rainfall_mm"
Y, G = "Root_Elongation_Rate_mm_day", "Stress_Gene_Expression_Fold_Change"

tiers = (df.groupby(H).agg(n=(H, "size"), root=(Y, "mean"), root_sd=(Y, "std"), gene=(G, "mean"), gene_sd=(G, "std")).round(3).reset_index())
bins = [-0.001, 2, 4, 6, 8, 12]
labels = ["0 to 2", "2 to 4", "4 to 6", "6 to 8", "8 to 12"]
df["band"] = pd.cut(df[F], bins=bins, labels=labels)
bands = []
for lab, g in df.groupby("band", observed=True):
    bands.append(dict(band=str(lab), n=int(len(g)), rainfall=round(float(g[F].mean()), 3), rigidity=round(float(g[R].mean()), 3),
                      root=round(float(g[Y].mean()), 3), r=round(float(g[R].corr(g[Y])), 3)))
out = dict(
    n=int(len(df)),
    columns=list(df.columns[:6]),
    points=[[round(float(a), 2), round(float(b), 2), round(float(c), 2)] for a, b, c in zip(df[R], df[Y], df[H])],
    tiers=tiers.rename(columns={H: "hydrogel"}).to_dict("records"),
    bands=bands,
    r_rigidity_root=round(float(df[R].corr(df[Y])), 3),
    preview=df.iloc[:8, :6].to_dict("records"),
    dictionary=pd.read_csv(root / "public/data/agrisense_data_dictionary.csv").fillna("").to_dict("records"),
    ranges={c: [float(df[c].min()), float(df[c].max())] for c in [H, R, F, Y, G]},
)
(root / "src/data/dataset-site.json").write_text(json.dumps(out, separators=(",", ":")))
print("wrote", out["n"], "rows;", len(out["points"]), "points; r(rigidity,root) =", out["r_rigidity_root"])
