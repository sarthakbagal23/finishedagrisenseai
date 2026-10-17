# Reproducibility, tests, and troubleshooting

## Rebuild order

Run all commands from the `agrisense-ml-api/` directory:

```powershell
python generate_dataset.py
python quality_control.py
python statistical_analysis.py
python train_models.py
python advanced_analysis.py
python sync_website_assets.py
python -m pytest -q
```

The data generator uses seed `20261009`; the model pipeline uses an 80/20 split with seed `42` and training-partition repeated cross-validation; the advanced analysis uses fixed seeds for its folds and diagnostics. Outputs are deterministic given the same source version and compatible dependency versions, though small differences can occur across library/BLAS versions. Each regeneration overwrites outputs and model files, so preserve any manual modifications first.

## Tests

Run `python -m pip install -r requirements-dev.txt` before `python -m pytest -q` in a new environment. Tests cover:

- CSV size/schema, IDs, missingness, and quality-control report output.
- Core statistical and advanced-analysis artifacts.
- Candidate coverage, cross-validation/test metric outputs, and reported API model choices.
- Saved scikit-learn pipeline type and composition.
- API health, valid and bounded predictions, extrapolation flagging, range rejection, and malformed inputs.

Passing tests indicates expected software behavior only. It does not verify biological assumptions or real-world predictive accuracy.

## Local setup checklist

1. Python API terminal: verify `/health` returns `{"status":"ok","data_status":"synthetic_demo_only"}`.
2. Website terminal: verify `npm run dev` reports a local URL.
3. In a browser, open `/transcriptomic-simulator`, move each slider, and check that the result updates.
4. Open `/research` and check the CV tables and eight advanced charts load.
5. Stop neither process while testing the interactive API integration.

## Common issues

**The simulator says the prediction service is unavailable.** Ensure the Python terminal is running at port 8000 and `http://127.0.0.1:8000/health` opens. Check `.env.local` and the `NEXT_PUBLIC_AGRISENSE_API_URL` value, if set.

**`uvicorn` is not recognized.** Activate the virtual environment and reinstall `requirements.txt`, then start with `python -m uvicorn api:app --reload --host 127.0.0.1 --port 8000`.

**`next` is not found.** From the folder containing `package.json`, run `npm install`; make sure Node.js 20+ and npm are installed. If package installation fails, check network/proxy settings for npm registry access and retry locally. This environment could not complete a network-based npm install, so the frontend build/browser check was not verifiable here.

**The research page shows stale charts after rerunning Phase 4.** Run `python sync_website_assets.py` after `python advanced_analysis.py` so current images and summary JSON are copied to the frontend asset folders.

**A prediction is marked extrapolation.** Inputs can be inside the API's broad limits but outside the actual min/max values in the generated training data. The API reports this to discourage overinterpreting edge scenarios.

**An output is bounded.** The model's raw result fell outside the display range used by the synthetic target. The API clips the displayed result and exposes a boolean flag; the clipped number is not a new measurement.
