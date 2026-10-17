# AgriSense AI — Start Here (Plain English)

## What the project does

AgriSense AI is a research-style software demo. You can change three scenario inputs—soil rigidity, rainfall, and hydrogel concentration—and see two model outputs: a simulated root-growth rate and a hypothetical EXPA1-like stress-response value.

**This is not a real plant experiment.** A Python script created all 1,000 data rows from assumptions we chose. There are no real field observations, soil measurements, weather records, plant growth measurements, or lab gene-expression results in this package.

## What is built

**Phase 1 — Dataset and quality control:** deterministic 1,000-row CSV, preserved original, cleaned copy, schema/range/type checks, missing/duplicate checks, outlier review, data dictionary, and generation log.

**Phase 2 — Statistics:** summary tables, correlation matrix, checks of whether observed synthetic directions match the equations, comparisons across rainfall bands, core figures, and written findings.

**Phase 3 — Machine learning:** five candidate models (average-value baseline, ordinary linear regression, linear regression with interaction terms, Random Forest, and Gradient Boosting). Model selection uses repeated cross-validation on the training data. A separate 20% holdout is used to report final comparison scores. The selected models are then refit on all synthetic rows to run the demo API.

**Phase 4 — Advanced checks:** eight more graphs and tables covering cross-validation, residuals, correlations, permutation importance, dose-response scenarios, sensitivity, prediction intervals, and extrapolation.

**Website:** the main page links to the slider simulator and `/research`, where you can see the expanded analysis gallery.

## How to try it

Follow the Windows steps in the top-level `README.md`. Run the Python API in one terminal and the Next.js website in another. Predictions require both to be running.

## How to reproduce the analysis

From the `agrisense-ml-api/` folder, run:

```powershell
python generate_dataset.py
python quality_control.py
python statistical_analysis.py
python train_models.py
python advanced_analysis.py
python sync_website_assets.py
python -m pytest -q
```

The first six commands rebuild the generated data, reports, models, and website graphics. The last runs the automated checks. Re-running the pipeline overwrites generated outputs; back up any manual changes first.

## How to describe the results honestly

High model scores mean the model can reproduce a scenario generated from our own equations. They do not show that the model is accurate on actual crops. The EXPA1-like field is only a hypothetical proxy, and the UI stress bands are only illustrative categories.

Do not claim measured gene expression, a biological discovery, a proven hydrogel benefit, improved crop yield, or validated field recommendations from this dataset. To make those claims, the project would need properly designed and documented experiments plus appropriate scientific review.
