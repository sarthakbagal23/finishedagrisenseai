# Changelog

## October 13, 2026 — integrated Phase 1–4 update

- Reworked the Phase 3 model-selection pipeline to compare five candidates and select with repeated cross-validation on training rows only, leaving a separate holdout for evaluation.
- Re-trained/saved the API models as degree-2 polynomial regression pipelines with interaction terms for both generated targets.
- Regenerated dataset-quality, statistical, model-comparison, prediction, and advanced-analysis artifacts from the included scripts.
- Integrated the eight advanced analysis figures and summary metrics into `public/agriscience/` and `src/data/advanced_summary.json`.
- Added the `/research` page with a supplemental cross-validation table, eight figures, explanations, and limitations; linked it from the home page and simulator.
- Removed the QC script's reliance on the optional `tabulate` package when generating the Markdown data dictionary.
- Expanded test coverage to 11 checks, all passing in the local Python environment.
- Added/update project setup, architecture, methodology/limitations, Phase 1–3 and Phase 4 reports, reproducibility/troubleshooting, and plain-English documentation.

### Verification boundary

The Python data/model/API workflow passes the 11-test suite and an HTTP smoke test. TypeScript/TSX source files pass a syntax-transpilation check. A real Next.js build and browser end-to-end test could not be completed because `next` is not installed in this environment and npm registry access failed during dependency installation. Verify `npm install`, `npm run build`, and the website locally after extracting the package.
