"""Copy current advanced-analysis outputs into the Next.js static asset bundle."""
from pathlib import Path
import shutil

API_ROOT = Path(__file__).resolve().parent
PROJECT_ROOT = API_ROOT.parent
SOURCE = API_ROOT / "outputs" / "advanced"
PUBLIC = PROJECT_ROOT / "public" / "agriscience"
DATA = PROJECT_ROOT / "src" / "data"


def main():
    required = [SOURCE / "advanced_summary.json"] + [SOURCE / f"fig{i}_{name}.png" for i, name in [
        (1, "cv_model_comparison"), (2, "pred_vs_actual_residuals"), (3, "correlation_heatmap"),
        (4, "permutation_importance"), (5, "hydrogel_dose_response"), (6, "sensitivity_tornado"),
        (7, "prediction_intervals"), (8, "extrapolation_test"),
    ]]
    missing = [str(p) for p in required if not p.exists()]
    if missing:
        raise FileNotFoundError("Run `python advanced_analysis.py` first. Missing: " + ", ".join(missing))

    PUBLIC.mkdir(parents=True, exist_ok=True)
    DATA.mkdir(parents=True, exist_ok=True)
    copied = []
    for source in required[1:]:
        dest = PUBLIC / f"phase4_{source.name}"
        shutil.copy2(source, dest)
        copied.append(dest.relative_to(PROJECT_ROOT).as_posix())
    summary_dest = DATA / "advanced_summary.json"
    shutil.copy2(required[0], summary_dest)
    copied.append(summary_dest.relative_to(PROJECT_ROOT).as_posix())
    print("Synchronized advanced analysis assets:")
    for path in copied:
        print(f"- {path}")


if __name__ == "__main__":
    main()
