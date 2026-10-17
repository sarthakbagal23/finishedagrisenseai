# AgriSense AI

AgriSense AI is a Next.js agricultural support dashboard with farm/sensor UI, advisor and education tools, market/weather sections, crop-diagnosis workflows, and a research sandbox for a drought-hardening/root-response data-science project.

## Research Lab

Open `/research` in the app, or choose **Research Lab** under the sidebar's Tools section or the More hub.

The Research Lab brings the drought/soil-rigidity study into the existing product rather than replacing the dashboard with a separate demo. It contains:

- A synthetic-dataset quality summary.
- Correlations and scenario dose-response charts.
- An interactive scenario explorer for soil rigidity, hydrogel concentration, and daily rainfall.
- Browser-side predictions for synthetic root elongation and an EXPA1-like response proxy.
- Cross-validation model comparisons, sensitivity analysis, an extrapolation stress test, and CSV export of model-comparison metrics.
- Explicit warnings when a slider value falls outside the feature ranges observed in the generated data.

### Important scientific limitation

The dataset currently contains 1,000 **formula-generated synthetic rows**. The EXPA1-like variable is a hypothetical proxy, not a real transcriptomic assay. The app's research predictions are demonstrations of the data-science pipeline and must not be treated as agricultural recommendations or evidence that hydrogel causes a real biological effect. Real experimental data and external validation are required for those conclusions.

The UI's browser-side prediction coefficients mirror the saved degree-2 polynomial-feature + linear-regression pipelines from the research package at the time of integration. If a model is retrained or its features/coefficients change, update `src/data/agrisense-research.ts` and rerun validation before deploying.

## Development

Requirements: Node.js 20+ and npm.

```bash
npm install
npm run dev
```

The development script starts Next.js on port 9002. Open `http://localhost:9002`.

Before merging a change, run:

```bash
npm run typecheck
npm run build
```

The existing app's Netlify build is configured by `netlify.toml`. Use a branch and preview deployment to check the full app before merging to `main`.

## Research documentation

- [Research Lab methodology and metric provenance](docs/RESEARCH_LAB_METHODOLOGY.md)
- [Research package: data, code, models, tables and Phase 4 figures](research/README.md)
- [Plain-English guide and phase reports](docs/research/START_HERE_PLAIN_ENGLISH.md)
- [Research Lab route](src/app/research/page.tsx)
- [In-browser research model and metric constants](src/data/agrisense-research.ts)

## Existing app

The research module is an additional app route. It does not replace the home dashboard, advisor, sensor pages, diagnosis, prices, weather, or other existing product sections.
