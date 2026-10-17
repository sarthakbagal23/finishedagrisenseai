# Project architecture

## Overview

AgriSense AI has three main software layers:

1. **Dataset and analysis scripts** in `agrisense-ml-api/` generate synthetic rows and write analysis artifacts.
2. **FastAPI inference service** reads saved scikit-learn pipelines and accepts a JSON scenario through `/predict`.
3. **Next.js frontend** renders the landing page, slider simulator, and research-gallery route. The simulator calls the Python API; static charts are served from `public/agriscience/`.

## Prediction request

`POST /predict`

```json
{
  "soil_rigidity_kpa": 55,
  "hydrogel_concentration_percent": 1.0,
  "average_daily_rainfall_mm": 3
}
```

The response contains the predicted synthetic root-elongation target, the EXPA1-like proxy value, a display-only warning band, an observed-input-range flag, whether output clipping occurred, and a limitation notice.

## Input validation

- Soil rigidity: 5–100 kPa allowed by the API.
- Hydrogel concentration: 0–2% (basis unspecified).
- Rainfall: 0–12 mm/day.
- Non-finite, missing, and out-of-range values are rejected by request validation.
- The service separately checks whether each input is within the min/max observed in the synthetic training dataset. Passing the API limits but exceeding observed training data is still flagged as extrapolation.

## Model files

- `models/root_elongation_model.joblib`: a scikit-learn pipeline with degree-2 polynomial features and linear regression.
- `models/stress_gene_proxy_model.joblib`: same model family for the synthetic EXPA1-like target.
- Candidate models for each target are also saved under clearly named filenames for inspection.

The API can therefore be run without retraining, as long as its Python dependencies and model files are present. The files use scikit-learn/joblib serialization; use compatible package versions when moving the project.

## Frontend routes

- `/`: project overview and links.
- `/transcriptomic-simulator`: sliders, model predictions, core plots, and limitations.
- `/research`: supplemental cross-validation table and eight advanced figures.

The frontend defaults to `http://127.0.0.1:8000` for local predictions. Configure `NEXT_PUBLIC_AGRISENSE_API_URL` for a separately deployed API. The API's allowed origins are controlled by `AGRISENSE_FRONTEND_ORIGINS`.
