"""Phase 4 advanced analysis for AgriSense AI (synthetic data only).

Adds: repeated k-fold CV, predicted-vs-actual and residual plots, permutation
importance, correlation heatmap, hydrogel dose-response, sensitivity (tornado),
conformal prediction intervals with coverage check, an extrapolation stress test
(why linear beats Random Forest here), multicollinearity (VIF), and bootstrap
effect sizes. Everything is labeled synthetic.
"""
from pathlib import Path
import json
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from sklearn.dummy import DummyRegressor
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.inspection import permutation_importance
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, r2_score, root_mean_squared_error
from sklearn.model_selection import RepeatedKFold, cross_val_predict, train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import PolynomialFeatures

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "outputs" / "advanced"
OUT.mkdir(parents=True, exist_ok=True)
df = pd.read_csv(ROOT / "data" / "agrisense_synthetic_trials_cleaned.csv")

RIG, HYD, RAIN = "Soil_Rigidity_kPa", "Hydrogel_Concentration_Percent", "Average_Daily_Rainfall_mm"
ROOTG, GENE = "Root_Elongation_Rate_mm_day", "Stress_Gene_Expression_Fold_Change"
FEATS = [RIG, HYD, RAIN]
LABEL = {RIG: "Soil rigidity (kPa)", HYD: "Hydrogel (%)", RAIN: "Rainfall (mm/day)",
         ROOTG: "Root elongation (mm/day)", GENE: "EXPA1-like proxy (fold change)"}
TAG = "SYNTHETIC DATA"
plt.rcParams.update({"figure.dpi": 130, "axes.spines.top": False, "axes.spines.right": False,
                     "font.size": 10})
C = {"lin": "#2b7a4b", "int": "#1f77b4", "rf": "#d9822b", "gb": "#8e44ad", "base": "#888"}

MODELS = {
    "Mean baseline": lambda: DummyRegressor(),
    "Linear": lambda: LinearRegression(),
    "Linear + interactions": lambda: make_pipeline(PolynomialFeatures(2, include_bias=False), LinearRegression()),
    "Random Forest": lambda: RandomForestRegressor(n_estimators=200, min_samples_leaf=3, random_state=0, n_jobs=-1),
    "Gradient Boosting": lambda: GradientBoostingRegressor(random_state=0),
}
summary = {}

# ---------------------------------------------------------------- 1. repeated CV
rkf = RepeatedKFold(n_splits=5, n_repeats=5, random_state=7)
rows = []
for tname, target in [("root", ROOTG), ("gene", GENE)]:
    X, y = df[FEATS].values, df[target].values
    for mname, mk in MODELS.items():
        r2s, maes, rmses = [], [], []
        for tr, te in rkf.split(X):
            m = mk().fit(X[tr], y[tr]); p = m.predict(X[te])
            r2s.append(r2_score(y[te], p)); maes.append(mean_absolute_error(y[te], p))
            rmses.append(root_mean_squared_error(y[te], p))
        rows.append(dict(target=tname, model=mname, R2_mean=np.mean(r2s), R2_sd=np.std(r2s),
                         MAE_mean=np.mean(maes), MAE_sd=np.std(maes),
                         RMSE_mean=np.mean(rmses), RMSE_sd=np.std(rmses)))
cv = pd.DataFrame(rows).round(4)
cv.to_csv(OUT / "cv_model_comparison.csv", index=False)

fig, axes = plt.subplots(1, 2, figsize=(10, 4))
for ax, (tname, ttl) in zip(axes, [("root", "Root elongation"), ("gene", "EXPA1-like proxy")]):
    d = cv[(cv.target == tname) & (cv.model != "Mean baseline")]
    cols = [C["lin"], C["int"], C["rf"], C["gb"]]
    ax.bar(d.model, d.R2_mean, yerr=d.R2_sd, color=cols, capsize=4)
    lo = max(0, d.R2_mean.min() - 0.06)
    ax.set_ylim(lo, min(1, d.R2_mean.max() + 0.04)); ax.set_ylabel("R² (5×5-fold CV, mean ± SD)")
    ax.set_title(ttl); ax.tick_params(axis="x", rotation=25)
fig.suptitle(f"Cross-validated model comparison — {TAG}", fontweight="bold")
fig.tight_layout(); fig.savefig(OUT / "fig1_cv_model_comparison.png"); plt.close(fig)

# ---------------------------------------------------------------- 2. pred vs actual + residuals
fig, axes = plt.subplots(2, 2, figsize=(10, 8))
for j, (tname, target) in enumerate([("root", ROOTG), ("gene", GENE)]):
    X, y = df[FEATS].values, df[target].values
    best = make_pipeline(PolynomialFeatures(2, include_bias=False), LinearRegression())
    p = cross_val_predict(best, X, y, cv=5)
    axes[0, j].scatter(y, p, s=8, alpha=.45, color=C["lin"] if tname == "root" else C["rf"])
    lim = [min(y.min(), p.min()), max(y.max(), p.max())]
    axes[0, j].plot(lim, lim, "k--", lw=1)
    axes[0, j].set_xlabel("Actual"); axes[0, j].set_ylabel("Predicted (out-of-fold)")
    axes[0, j].set_title(f"{LABEL[target]}\nR²={r2_score(y,p):.3f}")
    res = y - p
    axes[1, j].scatter(p, res, s=8, alpha=.45, color="#555"); axes[1, j].axhline(0, color="k", lw=1)
    axes[1, j].set_xlabel("Predicted"); axes[1, j].set_ylabel("Residual")
    axes[1, j].set_title(f"Residuals (SD={res.std():.2f})")
    summary[f"{tname}_residual_sd"] = float(res.std())
fig.suptitle(f"Out-of-fold predictions and residuals — {TAG}", fontweight="bold")
fig.tight_layout(); fig.savefig(OUT / "fig2_pred_vs_actual_residuals.png"); plt.close(fig)

# ---------------------------------------------------------------- 3. correlation heatmap
cols = [HYD, RIG, RAIN, ROOTG, GENE]
corr = df[cols].corr()
fig, ax = plt.subplots(figsize=(6.4, 5.4))
im = ax.imshow(corr, cmap="RdBu_r", vmin=-1, vmax=1)
short = ["Hydrogel", "Rigidity", "Rainfall", "Root growth", "Gene proxy"]
ax.set_xticks(range(5), short, rotation=30, ha="right"); ax.set_yticks(range(5), short)
for i in range(5):
    for k in range(5):
        ax.text(k, i, f"{corr.iloc[i,k]:.2f}", ha="center", va="center",
                color="white" if abs(corr.iloc[i, k]) > .6 else "black")
ax.spines[:].set_visible(False); fig.colorbar(im, shrink=.8)
ax.set_title(f"Pearson correlation — {TAG}", fontweight="bold")
fig.tight_layout(); fig.savefig(OUT / "fig3_correlation_heatmap.png"); plt.close(fig)

# ---------------------------------------------------------------- 4. permutation importance
fig, axes = plt.subplots(1, 2, figsize=(10, 3.6))
imp_rows = []
for ax, (tname, target) in zip(axes, [("root", ROOTG), ("gene", GENE)]):
    Xtr, Xte, ytr, yte = train_test_split(df[FEATS], df[target], test_size=.25, random_state=3)
    m = RandomForestRegressor(200, min_samples_leaf=3, random_state=0, n_jobs=-1).fit(Xtr, ytr)
    pi = permutation_importance(m, Xte, yte, n_repeats=50, random_state=0)
    order = np.argsort(pi.importances_mean)
    ax.barh([LABEL[FEATS[i]] for i in order], pi.importances_mean[order],
            xerr=pi.importances_std[order], color=C["rf"], capsize=3)
    ax.set_xlabel("Drop in R² when shuffled (mean ± SD, 50 repeats)"); ax.set_title(LABEL[target])
    for i, f in enumerate(FEATS):
        imp_rows.append(dict(target=tname, feature=f, importance=pi.importances_mean[i], sd=pi.importances_std[i]))
fig.suptitle(f"Permutation importance (held-out) — {TAG}", fontweight="bold")
fig.tight_layout(); fig.savefig(OUT / "fig4_permutation_importance.png"); plt.close(fig)
pd.DataFrame(imp_rows).round(4).to_csv(OUT / "permutation_importance.csv", index=False)

# ---------------------------------------------------------------- 5. hydrogel dose-response
interact = make_pipeline(PolynomialFeatures(2, include_bias=False), LinearRegression()).fit(df[FEATS].values, df[ROOTG].values)
grid = np.linspace(0, 2, 81)
scen = {"Harsh: 60 kPa, 2 mm/day": (60, 2), "Moderate: 40 kPa, 4 mm/day": (40, 4), "Mild: 25 kPa, 7 mm/day": (25, 7)}
fig, ax = plt.subplots(figsize=(7.5, 4.6))
dose = {}
for (name, (rg, rn)), col in zip(scen.items(), ["#c0392b", "#d9822b", "#2b7a4b"]):
    pred = interact.predict(np.c_[np.full_like(grid, rg), grid, np.full_like(grid, rn)])
    ax.plot(grid, pred, color=col, lw=2.2, label=name)
    dose[name] = dict(root_at_0=float(pred[0]), root_at_1_5=float(pred[60]), root_at_2=float(pred[-1]),
                      gain_0_to_1_5=float(pred[60] - pred[0]), best_dose=float(grid[pred.argmax()]))
tiers = df.groupby(HYD)[ROOTG].agg(["mean", "sem"]).reset_index()
ax.errorbar(tiers[HYD], tiers["mean"], yerr=1.96 * tiers["sem"], fmt="o", color="k", ms=4, capsize=3,
            label="Observed tier mean ±95% CI (all conditions)")
ax.set_xlabel("Hydrogel concentration (%)"); ax.set_ylabel("Root elongation (mm/day)")
ax.set_title(f"Hydrogel dose-response — {TAG}", fontweight="bold"); ax.legend(frameon=False, fontsize=8)
fig.tight_layout(); fig.savefig(OUT / "fig5_hydrogel_dose_response.png"); plt.close(fig)
summary["dose_response"] = dose

# ---------------------------------------------------------------- 6. sensitivity tornado
med = df[FEATS].median()
base = float(interact.predict(med.values.reshape(1, -1))[0])
tor = []
for f in FEATS:
    lo, hi = df[f].quantile(.10), df[f].quantile(.90)
    v = []
    for val in (lo, hi):
        x = med.copy(); x[f] = val; v.append(float(interact.predict(x.values.reshape(1, -1))[0]))
    tor.append(dict(feature=f, p10=lo, p90=hi, root_at_p10=v[0], root_at_p90=v[1], swing=v[1] - v[0]))
tor = pd.DataFrame(tor).sort_values("swing", key=abs)
tor.round(3).to_csv(OUT / "sensitivity_tornado.csv", index=False)
fig, ax = plt.subplots(figsize=(7.5, 3.6))
for i, r in enumerate(tor.itertuples()):
    ax.barh(i, r.root_at_p10 - base, left=base, color="#c0392b" if r.root_at_p10 < base else "#2b7a4b", alpha=.85)
    ax.barh(i, r.root_at_p90 - base, left=base, color="#c0392b" if r.root_at_p90 < base else "#2b7a4b", alpha=.55)
    ax.text(max(r.root_at_p10, r.root_at_p90) + .08, i, f"{r.swing:+.2f} mm/day", va="center", fontsize=9)
ax.set_yticks(range(len(tor)), [f"{LABEL[f]}\n(P10→P90)" for f in tor.feature]); ax.axvline(base, color="k", lw=1)
ax.set_xlabel("Predicted root elongation (mm/day); others held at median")
ax.set_title(f"One-at-a-time sensitivity — {TAG}", fontweight="bold")
fig.tight_layout(); fig.savefig(OUT / "fig6_sensitivity_tornado.png"); plt.close(fig)

# ---------------------------------------------------------------- 7. conformal intervals
Xtr, Xtemp, ytr, ytemp = train_test_split(df[FEATS].values, df[ROOTG].values, test_size=.5, random_state=11)
Xcal, Xte, ycal, yte = train_test_split(Xtemp, ytemp, test_size=.5, random_state=12)
m = make_pipeline(PolynomialFeatures(2, include_bias=False), LinearRegression()).fit(Xtr, ytr)
q = np.quantile(np.abs(ycal - m.predict(Xcal)), np.ceil((len(ycal) + 1) * .90) / len(ycal))
cover = float(np.mean(np.abs(yte - m.predict(Xte)) <= q))
summary["conformal_90"] = dict(half_width_mm_day=float(q), empirical_coverage=cover, n_test=int(len(yte)))
order = np.argsort(m.predict(Xte)); pp = m.predict(Xte)[order]
fig, ax = plt.subplots(figsize=(7, 4.4))
ax.fill_between(range(len(pp)), pp - q, pp + q, color=C["lin"], alpha=.2, label=f"90% interval (±{q:.2f})")
ax.plot(pp, color=C["lin"], lw=2, label="Prediction"); ax.scatter(range(len(pp)), yte[order], s=10, color="k", label="Actual")
ax.set_xlabel("Held-out samples sorted by prediction"); ax.set_ylabel("Root elongation (mm/day)")
ax.set_title(f"Conformal 90% prediction interval — coverage {cover:.1%} — {TAG}", fontweight="bold", fontsize=10)
ax.legend(frameon=False); fig.tight_layout(); fig.savefig(OUT / "fig7_prediction_intervals.png"); plt.close(fig)

# ---------------------------------------------------------------- 8. extrapolation stress test
thr = df[RIG].quantile(.70)
tr, te = df[df[RIG] <= thr], df[df[RIG] > thr]
ext = []
for mname in ["Linear", "Linear + interactions", "Random Forest", "Gradient Boosting"]:
    mm = MODELS[mname]().fit(tr[FEATS].values, tr[ROOTG].values); p = mm.predict(te[FEATS].values)
    ext.append(dict(model=mname, R2_extrapolation=r2_score(te[ROOTG], p), MAE=mean_absolute_error(te[ROOTG], p),
                    bias=float(np.mean(p - te[ROOTG]))))
ext = pd.DataFrame(ext).round(4); ext.to_csv(OUT / "extrapolation_stress_test.csv", index=False)
fig, ax = plt.subplots(figsize=(6.5, 3.8))
ax.bar(ext.model, ext.MAE, color=[C["lin"], C["int"], C["rf"], C["gb"]]); ax.tick_params(axis="x", rotation=20)
ax.set_ylabel("MAE on unseen high-rigidity soils (mm/day)")
ax.set_title(f"Trained on rigidity ≤ {thr:.0f} kPa, tested above — {TAG}", fontweight="bold", fontsize=10)
fig.tight_layout(); fig.savefig(OUT / "fig8_extrapolation_test.png"); plt.close(fig)
summary["extrapolation_threshold_kpa"] = float(thr)

# ---------------------------------------------------------------- 9. VIF
Z = df[FEATS].copy()
vif = {}
for f in FEATS:
    others = [c for c in FEATS if c != f]
    r2 = LinearRegression().fit(Z[others], Z[f]).score(Z[others], Z[f]); vif[f] = 1 / (1 - r2)
summary["VIF"] = vif

# ---------------------------------------------------------------- 10. bootstrap effect size
rng = np.random.default_rng(5)
harsh = df[(df[RIG] > 50) & (df[RAIN] < 3)]
ctrl, trt = harsh[harsh[HYD] == 0][ROOTG].values, harsh[harsh[HYD] >= 1.0][ROOTG].values
diffs = [rng.choice(trt, len(trt)).mean() - rng.choice(ctrl, len(ctrl)).mean() for _ in range(5000)]
pooled = np.sqrt(((len(ctrl) - 1) * ctrl.var(ddof=1) + (len(trt) - 1) * trt.var(ddof=1)) / (len(ctrl) + len(trt) - 2))
summary["harsh_conditions_effect"] = dict(
    definition="rigidity > 50 kPa AND rainfall < 3 mm/day; control = 0% hydrogel, treated = >= 1% hydrogel",
    n_control=int(len(ctrl)), n_treated=int(len(trt)), mean_control=float(ctrl.mean()), mean_treated=float(trt.mean()),
    mean_diff=float(np.mean(diffs)), ci95=[float(np.percentile(diffs, 2.5)), float(np.percentile(diffs, 97.5))],
    cohens_d=float((trt.mean() - ctrl.mean()) / pooled))

summary["cv_table"] = cv.to_dict("records")
summary["extrapolation"] = ext.to_dict("records")
summary["sensitivity"] = tor.round(3).to_dict("records")
(OUT / "advanced_summary.json").write_text(json.dumps(summary, indent=2, default=float))
print(json.dumps({k: v for k, v in summary.items() if k not in ("cv_table",)}, indent=1, default=float))
print(cv.to_string())
