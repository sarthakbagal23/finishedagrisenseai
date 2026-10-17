# Phase 3 integration guide — existing AgriSense AI Next.js app

This patch adds a standalone App Router page at `/transcriptomic-simulator`. It does not replace the home page or existing Advisor, Sensors, Market, or More sections.

## Files to merge into the repository root

- `src/app/transcriptomic-simulator/page.tsx` — interactive simulator route.
- `src/app/research/page.tsx` — advanced model-analysis gallery route.
- `src/data/advanced_summary.json` — cross-validation summary consumed by the research page.
- `src/components/TranscriptomicDroughtSimulator.tsx` and `.module.css` — slider UI, live predictions, warning proxy, and chart figures.
- `public/agriscience/` — core plots and eight synchronized Phase 4 charts.
- `agrisense-ml-api/` — separate FastAPI service, 1,000-row dataset, trained models, generator, training/evaluation scripts, outputs, and AI data log.
- `render.yaml` — optional Render blueprint for deploying the Python API separately.

Copy/merge these into the current repository; do not replace the existing `src/app/page.tsx`, `src/app/layout.tsx`, `package.json`, `netlify.toml`, or other existing files.

## Local setup

The standalone ZIP starts Next.js on port `3000`. When merging into the existing website, retain that repository’s configured port. Keep the Python API on port `8000`.

1. From the repository root, create `.env.local` with:

   ```env
   NEXT_PUBLIC_AGRISENSE_API_URL=http://127.0.0.1:8000
   ```

2. In one terminal, start the Python service:

   ```powershell
   cd agrisense-ml-api
   python -m venv .venv
   .venv\Scripts\Activate.ps1
   python -m pip install -r requirements.txt
   # Optional: regenerate and retrain (this overwrites the checked-in demo data/models)
   python generate_dataset.py
   python quality_control.py
   python statistical_analysis.py
   python train_models.py
   uvicorn api:app --reload --host 0.0.0.0 --port 8000
   ```

3. In a second terminal, from the repository root, run the existing web app command:

   ```bash
   npm install
   npm run dev
   ```

4. For the standalone ZIP, open `http://localhost:3000/transcriptomic-simulator`; the expanded analysis is at `http://localhost:3000/research`. For the existing site, use the port configured in that repository. The sliders debounce requests to `/predict`; they should update results after the API responds. Check `http://127.0.0.1:8000/health` if the UI reports that the service is unavailable.

## Make the route discoverable

The new page is available at `/transcriptomic-simulator` once deployed, even before the nav item is added. To make it easy to find in the current site, locate the shared navigation/menu that contains “More” and add a link in that menu using the same classes/pattern used by existing links:

```tsx
<Link href="/transcriptomic-simulator">Transcriptomic Simulator</Link>
```

The repository docs identify the main App Router home page as `src/app/page.tsx` and the Advisor page as `src/app/advisor/page.tsx`; search the `src/` tree for the existing nav label “More” rather than rewriting the current header/nav.

## Deployment architecture

Keep Netlify hosting the current Next.js app. Deploy `agrisense-ml-api/` as a separate Python web service (the included `render.yaml` is an optional Render blueprint). The model uses scikit-learn/joblib and should run in a Python environment, not in the browser.

1. Deploy the Python service with build command `pip install -r requirements.txt` and start command `uvicorn api:app --host 0.0.0.0 --port $PORT`.
2. Make sure the API's environment variable `AGRISENSE_FRONTEND_ORIGINS` allows the real site origin and local development origins, for example:

   ```text
   https://agrisenseaindia.netlify.app,http://localhost:9002,http://localhost:3000
   ```

3. In Netlify site environment variables, set `NEXT_PUBLIC_AGRISENSE_API_URL` to the deployed API base URL, without `/predict` and without a trailing slash. Trigger a new deploy because `NEXT_PUBLIC_` values are embedded at build time.
4. Check the API `/health`, then test the live `/transcriptomic-simulator` page.

Do not point a production site at `localhost`; localhost refers to each visitor's own device, not the hosted API.

## Scientific and data-integrity notes

- All 1,000 rows in the CSV are synthetic values created from explicit scenario assumptions, not actual lab trials or regional climate observations.
- The EXPA1-like output is a hypothetical stress-response proxy. The UI calls it a proxy, never a measured gene-expression result.
- The warning thresholds are illustrative UI bands, not validated biological limits or farm recommendations.
- Report model MAE/RMSE/R² as performance on a held-out split from the same synthetic generator only. Do not present them as real-world predictive accuracy.
- If you change the equations, seed, columns, generation platform, or date, update `agrisense-ml-api/docs/AI_DATA_GENERATION_LOG.md` and regenerate the figures/models.


## Updated model selection note

The included training script compares five candidates (mean baseline, plain linear regression, degree-2 polynomial regression with interaction terms, Random Forest, and Gradient Boosting). Model selection uses repeated cross-validation on the training partition only; the untouched 20% holdout is reserved for reporting. The current synthetic run selects the polynomial interaction pipeline for both targets. This is a software/modeling choice for the generated scenario, not validation of a real biological predictor.
