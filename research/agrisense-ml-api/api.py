"""FastAPI inference service for AgriSense AI's synthetic-data demo.

Run locally from this directory with:
    uvicorn api:app --reload --host 0.0.0.0 --port 8000

Model outputs are demonstrations only, not agricultural recommendations or
measured EXPA1 transcriptomic results.
"""
from pathlib import Path
import math
import os
import joblib
import pandas as pd
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

ROOT = Path(__file__).resolve().parent
MODEL_DIR = ROOT / "models"
TRAINING_DATA_PATH = ROOT / "data" / "agrisense_synthetic_trials_cleaned.csv"
FEATURES = [
    "Soil_Rigidity_kPa",
    "Hydrogel_Concentration_Percent",
    "Average_Daily_Rainfall_mm",
]

app = FastAPI(
    title="AgriSense AI Synthetic Research Demo API",
    description=(
        "Predictions from regression models trained on synthetic crop-trial data. "
        "Outputs are for software demonstration only and are not real-world agronomic advice."
    ),
    version="0.2.0",
)

# The standalone Next.js app starts on port 3000. Both 3000 and 9002 are
# allowed to make this API easier to integrate with the existing site.
_default_origins = ["http://localhost:9002", "http://127.0.0.1:9002", "http://localhost:3000", "http://127.0.0.1:3000"]
_multi_origin_setting = os.getenv("AGRISENSE_FRONTEND_ORIGINS", "").strip()
_single_origin_setting = os.getenv("AGRISENSE_FRONTEND_ORIGIN", "").strip()
if _multi_origin_setting:
    allowed_origins = [item.strip().rstrip("/") for item in _multi_origin_setting.split(",") if item.strip()]
    # Keep local origins available when testing a deployed API from localhost.
    allowed_origins = list(dict.fromkeys(allowed_origins + _default_origins))
elif _single_origin_setting:
    allowed_origins = list(dict.fromkeys([_single_origin_setting.rstrip("/")] + _default_origins))
else:
    allowed_origins = _default_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)


def _json_safe(value):
    """Replace non-finite numbers in validation details so error responses stay valid JSON."""
    if isinstance(value, float) and not math.isfinite(value):
        return repr(value)
    if isinstance(value, dict):
        return {str(key): _json_safe(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [_json_safe(item) for item in value]
    return value


@app.exception_handler(RequestValidationError)
async def clean_validation_error(request: Request, exc: RequestValidationError):
    # Some JSON parsers accept the non-standard tokens NaN/Infinity; convert them
    # in the error details so the API still responds with a valid 422 JSON body.
    return JSONResponse(status_code=422, content={"detail": _json_safe(exc.errors())})


def load_models():
    root_path = MODEL_DIR / "root_elongation_model.joblib"
    gene_path = MODEL_DIR / "stress_gene_proxy_model.joblib"
    if not root_path.exists() or not gene_path.exists():
        raise RuntimeError("Models missing. Run `python train_models.py` first.")
    return joblib.load(root_path), joblib.load(gene_path)


root_model, gene_model = load_models()


def load_observed_feature_ranges():
    """Return feature min/max values actually represented in the training CSV."""
    if not TRAINING_DATA_PATH.exists():
        # Fallback keeps the model service deployable if only models are packaged;
        # the full project ZIP includes the dataset and uses observed min/max.
        return {
            FEATURES[0]: (5.0, 100.0),
            FEATURES[1]: (0.0, 2.0),
            FEATURES[2]: (0.0, 12.0),
        }
    training_df = pd.read_csv(TRAINING_DATA_PATH)
    return {
        feature: (float(training_df[feature].min()), float(training_df[feature].max()))
        for feature in FEATURES
    }


OBSERVED_FEATURE_RANGES = load_observed_feature_ranges()


class PredictionInput(BaseModel):
    soil_rigidity_kpa: float = Field(ge=5, le=100, allow_inf_nan=False)
    hydrogel_concentration_percent: float = Field(ge=0, le=2, allow_inf_nan=False)
    average_daily_rainfall_mm: float = Field(ge=0, le=12, allow_inf_nan=False)


@app.get("/")
def root():
    return {"service": "AgriSense AI synthetic research demo", "status": "ok", "health": "/health", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "ok", "data_status": "synthetic_demo_only"}


@app.post("/predict")
def predict(payload: PredictionInput):
    input_values = {
        FEATURES[0]: payload.soil_rigidity_kpa,
        FEATURES[1]: payload.hydrogel_concentration_percent,
        FEATURES[2]: payload.average_daily_rainfall_mm,
    }
    row = pd.DataFrame([input_values])
    within_observed_training_range = all(
        OBSERVED_FEATURE_RANGES[feature][0] <= value <= OBSERVED_FEATURE_RANGES[feature][1]
        for feature, value in input_values.items()
    )
    raw_root_rate = float(root_model.predict(row)[0])
    raw_gene_fold = float(gene_model.predict(row)[0])

    # The sliders can reach corners of the allowed input box that are sparsely
    # represented (or not represented) in the generated data. Bound displayed
    # values to the synthetic target ranges and disclose this guard to users.
    root_rate = float(min(14.0, max(0.2, raw_root_rate)))
    gene_fold = float(min(8.0, max(0.25, raw_gene_fold)))
    output_was_bounded = (root_rate != raw_root_rate) or (gene_fold != raw_gene_fold)

    # These are illustrative UI bands applied to a synthetic proxy, not
    # biologically validated stress thresholds.
    if gene_fold < 2.0:
        warning = "LOW (simulated scale)"
    elif gene_fold < 3.5:
        warning = "MODERATE (simulated scale)"
    else:
        warning = "HIGH (simulated scale)"

    return {
        "predicted_root_elongation_mm_day": round(root_rate, 2),
        "predicted_stress_gene_proxy_fold_change": round(gene_fold, 3),
        "simulated_warning_level": warning,
        "output_was_bounded_to_synthetic_range": output_was_bounded,
        "inputs_within_observed_training_range": within_observed_training_range,
        "input_range_note": (
            "At least one input is outside the minimum-to-maximum values observed in the synthetic training dataset; treat this scenario as extrapolation."
            if not within_observed_training_range else
            "All inputs fall within the feature ranges observed in the synthetic training dataset."
        ),
        "notice": "Synthetic-data demonstration only; the EXPA1-like output is a hypothetical proxy, not a measured assay or validated real-world prediction. Displayed values are constrained to the synthetic target ranges.",
    }
