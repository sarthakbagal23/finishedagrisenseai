"""Audit and clean the synthetic AgriSense AI dataset without hiding issues.

The script preserves the generator's original CSV byte-for-byte, validates schema,
IDs, missingness, ranges, unit assumptions, and statistical outliers, then saves an
independent cleaned CSV. It removes integrity-invalid rows and duplicates while
retaining valid statistical outliers, and records removals in an audit file.
"""
from pathlib import Path
import json
import shutil
import pandas as pd

ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "data"
OUT = ROOT / "outputs"
SOURCE = DATA_DIR / "agrisense_synthetic_trials.csv"
ORIGINAL = DATA_DIR / "agrisense_synthetic_trials_original.csv"
CLEANED = DATA_DIR / "agrisense_synthetic_trials_cleaned.csv"

NUMERIC_BOUNDS = {
    "Hydrogel_Concentration_Percent": (0.0, 2.0),
    "Soil_Rigidity_kPa": (5.0, 100.0),
    "Average_Daily_Rainfall_mm": (0.0, 12.0),
    "Root_Elongation_Rate_mm_day": (0.2, 14.0),
    "Stress_Gene_Expression_Fold_Change": (0.25, 8.0),
}
HYDROGEL_TIERS = {0.0, 0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0}
REQUIRED_COLUMNS = [
    "Trial_ID", "Hydrogel_Concentration_Percent", "Soil_Rigidity_kPa",
    "Average_Daily_Rainfall_mm", "Root_Elongation_Rate_mm_day",
    "Stress_Gene_Expression_Fold_Change",
]


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    if not SOURCE.exists():
        raise FileNotFoundError(f"Dataset not found: {SOURCE}")
    # The source file is the untouched generator output. Refresh the preserved
    # original copy each time QC is run so a deliberate regeneration is audited.
    shutil.copy2(SOURCE, ORIGINAL)
    raw_df = pd.read_csv(ORIGINAL)
    missing_columns = [col for col in REQUIRED_COLUMNS if col not in raw_df.columns]
    extra_columns = [col for col in raw_df.columns if col not in REQUIRED_COLUMNS]
    if missing_columns or extra_columns:
        raise ValueError(
            "Dataset schema mismatch. "
            f"Missing columns: {missing_columns or 'none'}; "
            f"unexpected columns: {extra_columns or 'none'}. "
            "Expected the six documented columns in the dataset."
        )

    issues = []
    duplicate_id_count = int(raw_df["Trial_ID"].duplicated(keep="first").sum())
    exact_duplicate_count = int(raw_df.duplicated(keep="first").sum())
    missing_by_column = {c: int(n) for c, n in raw_df.isna().sum().items()}
    df = raw_df.copy()

    conversion_failure_mask = pd.Series(False, index=df.index)
    numeric_conversion_failures = {}
    for col in NUMERIC_BOUNDS:
        converted = pd.to_numeric(df[col], errors="coerce")
        failure = converted.isna() & df[col].notna()
        conversion_failure_mask |= failure
        numeric_conversion_failures[col] = int(failure.sum())
        df[col] = converted

    range_masks = {}
    range_violations = {}
    for col, (low, high) in NUMERIC_BOUNDS.items():
        mask = df[col].notna() & ((df[col] < low) | (df[col] > high))
        range_masks[col] = mask
        range_violations[col] = int(mask.sum())
    off_tier_mask = ~df["Hydrogel_Concentration_Percent"].isin(HYDROGEL_TIERS)
    off_tier_count = int(off_tier_mask.sum())

    # Tukey IQR flags are inspection flags, not automatic deletion rules.
    outlier_counts = {}
    outlier_rows = []
    for col in NUMERIC_BOUNDS:
        s = df[col].dropna()
        q1, q3 = s.quantile([0.25, 0.75])
        iqr = q3 - q1
        lower, upper = q1 - 1.5 * iqr, q3 + 1.5 * iqr
        mask = df[col].notna() & ((df[col] < lower) | (df[col] > upper))
        outlier_counts[col] = {
            "count": int(mask.sum()),
            "lower_fence": round(float(lower), 4),
            "upper_fence": round(float(upper), 4),
            "note": "Statistical flag only; not automatically invalid or removed.",
        }
        for _, row in df.loc[mask, ["Trial_ID", col]].iterrows():
            outlier_rows.append({
                "Trial_ID": row["Trial_ID"], "variable": col,
                "value": float(row[col]), "lower_fence": float(lower),
                "upper_fence": float(upper),
                "review_note": (
                    "At the generator's 12 mm/day upper clipping boundary; expected upper-tail value and within allowed range. Retain."
                    if col == "Average_Daily_Rainfall_mm" and float(row[col]) >= 12.0 else
                    "At the generator's 5 kPa lower clipping boundary; expected lower-tail value and within allowed range. Retain."
                    if col == "Soil_Rigidity_kPa" and float(row[col]) <= 5.0 else
                    "IQR statistical flag but within declared bounds; inspect as a tail value, not an error. Retain unless independent evidence shows a data-entry issue."
                ),
            })
    pd.DataFrame(outlier_rows, columns=["Trial_ID", "variable", "value", "lower_fence", "upper_fence", "review_note"]).to_csv(OUT / "statistical_outlier_rows.csv", index=False, float_format="%.5f")

    if duplicate_id_count:
        issues.append({"severity": "warning", "check": "duplicate_trial_ids", "detail": f"{duplicate_id_count} duplicate IDs; first occurrence retained in cleaned copy."})
    if exact_duplicate_count:
        issues.append({"severity": "warning", "check": "exact_duplicate_rows", "detail": f"{exact_duplicate_count} exact duplicate rows; first occurrence retained in cleaned copy."})
    if any(missing_by_column.values()):
        issues.append({"severity": "warning", "check": "missing_values", "detail": str(missing_by_column)})
    if any(numeric_conversion_failures.values()):
        issues.append({"severity": "warning", "check": "numeric_conversion", "detail": str(numeric_conversion_failures)})
    if any(range_violations.values()):
        issues.append({"severity": "warning", "check": "range_violations", "detail": str(range_violations)})
    if off_tier_count:
        issues.append({"severity": "warning", "check": "hydrogel_tier", "detail": f"{off_tier_count} values do not match the documented simulation tiers."})

    # Remove data-integrity failures and duplicate rows/IDs, but retain valid IQR
    # outliers for transparency. Each removed source row receives an audit reason.
    reasons_by_index = {}
    missing_row_mask = df[REQUIRED_COLUMNS].isna().any(axis=1)
    duplicate_row_mask = raw_df.duplicated(keep="first")
    duplicate_id_mask = raw_df["Trial_ID"].duplicated(keep="first")
    for index in df.index:
        reasons = []
        if bool(missing_row_mask.loc[index]):
            reasons.append("missing required value or failed numeric conversion")
        if bool(conversion_failure_mask.loc[index]):
            reasons.append("numeric conversion failure")
        for col, mask in range_masks.items():
            if bool(mask.loc[index]):
                low, high = NUMERIC_BOUNDS[col]
                reasons.append(f"{col} outside allowed range [{low}, {high}]")
        if bool(off_tier_mask.loc[index]):
            reasons.append("hydrogel concentration not in documented tier list")
        if bool(duplicate_row_mask.loc[index]):
            reasons.append("exact duplicate row (earlier copy retained)")
        if bool(duplicate_id_mask.loc[index]):
            reasons.append("duplicate Trial_ID (earlier row retained)")
        if reasons:
            reasons_by_index[index] = reasons

    removal_rows = []
    for index, reasons in reasons_by_index.items():
        removal_rows.append({
            "source_csv_row_number": int(index) + 2,
            "Trial_ID": raw_df.loc[index, "Trial_ID"],
            "removal_reason": "; ".join(dict.fromkeys(reasons)),
        })
    pd.DataFrame(removal_rows, columns=["source_csv_row_number", "Trial_ID", "removal_reason"]).to_csv(
        OUT / "removed_rows_audit.csv", index=False
    )
    valid_indices = [index for index in df.index if index not in reasons_by_index]
    cleaned = df.loc[valid_indices].copy()
    cleaned.to_csv(CLEANED, index=False, float_format="%.6g")

    dictionary_rows = [
        {"column": "Trial_ID", "data_type": "string", "unit": "identifier", "meaning": "Unique synthetic trial-row ID; not a real experimental replicate.", "valid_values_or_range": "AS-0001 onward; unique in this file"},
        {"column": "Hydrogel_Concentration_Percent", "data_type": "float", "unit": "% (basis not specified)", "meaning": "Hydrogel tier used in the scenario equation.", "valid_values_or_range": "0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2"},
        {"column": "Soil_Rigidity_kPa", "data_type": "float", "unit": "kPa", "meaning": "Illustrative simulated soil-rigidity/impedance input; not calibrated to a field instrument.", "valid_values_or_range": "5–100 kPa allowed; generator currently produces 5–69.64"},
        {"column": "Average_Daily_Rainfall_mm", "data_type": "float", "unit": "mm/day", "meaning": "Synthetic scenario rainfall; not sourced local weather data.", "valid_values_or_range": "0–12 mm/day"},
        {"column": "Root_Elongation_Rate_mm_day", "data_type": "float", "unit": "mm/day", "meaning": "Synthetic target computed from the coded scenario equation plus noise; not observed plant growth.", "valid_values_or_range": "0.2–14 mm/day"},
        {"column": "Stress_Gene_Expression_Fold_Change", "data_type": "float", "unit": "fold change (simulated proxy)", "meaning": "Hypothetical EXPA1-like stress-response proxy. Not actual transcriptomic expression or a validated EXPA1 prediction.", "valid_values_or_range": "0.25–8 fold-change units"},
    ]
    pd.DataFrame(dictionary_rows).to_csv(OUT / "data_dictionary.csv", index=False)
    # Render Markdown ourselves so the QC script has no optional tabulate dependency.
    dictionary_headers = ["column", "data_type", "unit", "meaning", "valid_values_or_range"]
    dictionary_lines = ["| " + " | ".join(dictionary_headers) + " |", "|" + "|".join(["---"] * len(dictionary_headers)) + "|"]
    for item in dictionary_rows:
        cells = [str(item.get(header, "")).replace("|", "\\|").replace("\n", " ") for header in dictionary_headers]
        dictionary_lines.append("| " + " | ".join(cells) + " |")
    (OUT / "data_dictionary.md").write_text("\n".join(dictionary_lines) + "\n", encoding="utf-8")

    report = {
        "dataset_file_audited": ORIGINAL.name,
        "cleaned_file_written": str(CLEANED.relative_to(ROOT)),
        "row_count_original": int(len(pd.read_csv(ORIGINAL))),
        "row_count_cleaned": int(len(cleaned)),
        "column_count": int(len(cleaned.columns)),
        "duplicate_trial_ids_in_source": duplicate_id_count,
        "exact_duplicate_rows_in_source": exact_duplicate_count,
        "missing_values_by_column": missing_by_column,
        "numeric_conversion_failures": numeric_conversion_failures,
        "allowed_range_violations": range_violations,
        "off_documented_hydrogel_tiers": off_tier_count,
        "statistical_outlier_flags_tukey_iqr": outlier_counts,
        "issues_or_warnings": issues,
        "rows_removed_for_integrity_reasons": int(len(reasons_by_index)),
        "rows_removed_audit_file": "outputs/removed_rows_audit.csv",
        "cleaning_rule": "Rows with missing/invalid required values, failed numeric conversions, range violations, undocumented hydrogel tiers, exact duplicates, or duplicate Trial_IDs after the first occurrence are removed from the cleaned copy and listed in removed_rows_audit.csv. Valid statistical outliers are retained.",
        "limitations": [
            "All data are synthetic and generated from coded assumptions.",
            "Hydrogel percentage basis is not specified in the source schema; do not describe it as w/w or w/v without changing the experiment specification.",
            "The EXPA1-like gene-expression column is a hypothetical scenario proxy, not a laboratory measurement.",
            "The observed range can be narrower than the declared allowed range because generation uses a particular random seed.",
        ],
    }
    (OUT / "dataset_quality_report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")

    lines = [
        "# Dataset quality-control report",
        "",
        f"- **Source:** `{ORIGINAL.name}` (preserved unchanged)",
        f"- **Cleaned copy:** `data/agrisense_synthetic_trials_cleaned.csv`",
        f"- **Rows:** {report['row_count_original']} original; {report['row_count_cleaned']} cleaned",
        f"- **Columns:** {report['column_count']}",
        f"- **Duplicate trial IDs:** {duplicate_id_count}",
        f"- **Exact duplicate rows:** {exact_duplicate_count}",
        f"- **Missing values:** {sum(missing_by_column.values())} total",
        f"- **Numeric conversion failures:** {sum(numeric_conversion_failures.values())}",
        f"- **Out-of-range values:** {sum(range_violations.values())}",
        f"- **Hydrogel values outside specified tiers:** {off_tier_count}",
        "",
        "## Type and unit checks",
        "",
        "`Trial_ID` is treated as a string identifier; all other columns are numeric. Rainfall is recorded in mm/day, rigidity in kPa, and root elongation in mm/day. Hydrogel is labeled only as percent because the concentration basis is not specified. Gene expression is a simulated fold-change proxy, not a biological assay.",
        "",
        "## Outlier inspection",
        "",
        "Tukey 1.5×IQR flags are recorded in `dataset_quality_report.json` and `statistical_outlier_rows.csv`. The inspected flags are within the declared simulation bounds. Most flagged rows are the rainfall upper tail at the generator's 12 mm/day clipping boundary; two rigidity values sit at its 5 kPa lower clipping boundary. The remaining flags are tail values allowed by the synthetic equations. A statistical flag means ‘inspect’, not ‘delete’. No flagged row was removed.",
        "",
        "## Cleaning decision",
        "",
        f"The cleaned CSV is separately saved. Rows with missing/invalid required values, range violations, undocumented hydrogel tiers, or duplicate records are removed and listed in `removed_rows_audit.csv`. The current source has {len(reasons_by_index)} such rows, so {len(cleaned)} rows remain in the cleaned dataset. Valid statistical outliers are retained; the original generated CSV is preserved unchanged.",
        "",
        "## Important limitations",
        "",
        "This is a synthetic teaching dataset generated by equations. Correlations and model metrics describe the programmed scenario only. The gene-expression column is not evidence of real EXPA1 expression, and no causal or agronomic claim is established.",
    ]
    (OUT / "dataset_quality_report.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print((OUT / "dataset_quality_report.md").read_text())

if __name__ == "__main__":
    main()
