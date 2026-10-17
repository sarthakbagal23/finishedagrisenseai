# AgriSense AI — Python API and analysis pipeline

This folder contains the synthetic dataset pipeline, statistical analysis, model training/evaluation, advanced diagnostics, saved models, and FastAPI prediction service. The root project `README.md` explains how to launch the website and API together.

> Every data row and target value in this folder is synthetic. The EXPA1-like field is a hypothetical proxy, not measured gene expression. Neither model scores nor statistical significance in this generated dataset validate biological effects or field predictions.

## Start the API without retraining

From this directory, with Python 3.11+:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
python -m uvicorn api:app --reload --host 127.0.0.1 --port 8000
```

Check `http://127.0.0.1:8000/health` and open `http://127.0.0.1:8000/docs` for the interactive request interface. The `.joblib` files are included, so training is not needed for normal local use.

## Full reproducible pipeline

Run the steps in order from this folder. These commands rewrite the derived outputs and model files:

```powershell
python generate_dataset.py
python quality_control.py
python statistical_analysis.py
python train_models.py
python advanced_analysis.py
python sync_website_assets.py
python -m pytest -q
```

### Model selection design

`train_models.py` compares a training-mean baseline, plain linear regression, degree-2 polynomial regression with interaction terms, Random Forest, and Gradient Boosting. It uses a fixed 80/20 split (`random_state=42`), selects by lowest mean RMSE across five-fold CV repeated three times on the 800-row training partition, and reports all model families on the untouched 200-row holdout. The selected candidate is then refit on all synthetic rows for the API. In this dataset, the degree-2 interaction model is selected for both targets. Detailed outputs are written to `outputs/model_metrics.json`, `outputs/cross_validation_metrics.csv`, `outputs/test_set_predictions.csv`, and `outputs/model_comparison_report.md`.

`advanced_analysis.py` separately generates eight advanced graphs plus CV, permutation-importance, sensitivity, extrapolation, interval, VIF, and bootstrap diagnostics. Its supplemental 5-fold CV repeated five times runs across all 1,000 synthetic rows; it is exploratory and not a separate holdout. Run `sync_website_assets.py` after the advanced analysis to refresh the Next.js assets.

## Request example

`POST /predict`

```json
{
  "soil_rigidity_kpa": 55,
  "hydrogel_concentration_percent": 1.0,
  "average_daily_rainfall_mm": 3
}
```

The response contains the root-elongation model output, EXPA1-like proxy output, illustrative warning band, observed-feature-range flag, whether output bounding occurred, and a warning that the outputs are synthetic. Input values outside the API's declared limits are rejected. Values inside API limits but outside the min/max actually present in the training CSV are flagged as extrapolation.

## Hosted service environment

Set `AGRISENSE_FRONTEND_ORIGINS` to a comma-separated list of allowed origins. When hosting the frontend separately, set `NEXT_PUBLIC_AGRISENSE_API_URL` to the deployed API base URL (without `/predict` and without a trailing slash) and rebuild/redeploy the frontend. Never set the deployed frontend's API variable to `localhost`.

## Model file compatibility

Model files use scikit-learn and joblib serialization. Use the package versions listed in `requirements.txt` when retraining or moving model artifacts. Changing the dataset recipe, seed, column meanings, or target equations should also update `docs/AI_DATA_GENERATION_LOG.md` and the methodology documentation.
