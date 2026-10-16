export type ResearchScenario = {
  rigidity: number;
  hydrogel: number;
  rainfall: number;
};

export type ResearchPrediction = {
  rootRaw: number;
  geneRaw: number;
  root: number;
  geneProxy: number;
  rootWasBounded: boolean;
  geneWasBounded: boolean;
  inObservedTrainingRange: boolean;
  outOfRangeFeatures: string[];
  warningBand: "LOW (simulated scale)" | "MODERATE (simulated scale)" | "HIGH (simulated scale)";
};

export type ModelMetric = {
  target: "root" | "gene";
  model: string;
  r2: number;
  r2Sd: number;
  mae: number;
  maeSd: number;
  rmse: number;
  rmseSd: number;
};

export const DATASET_AUDIT = {
  rowsOriginal: 1000,
  rowsCleaned: 1000,
  columns: 6,
  duplicateTrialIds: 0,
  exactDuplicateRows: 0,
  missingValues: 0,
  numericConversionFailures: 0,
  rangeViolations: 0,
  rowsRemoved: 0,
  featureLevelOutlierFlags: 32,
  dataType: "Formula-generated synthetic dataset",
};

export const OBSERVED_RANGES = {
  rigidity: { min: 5, max: 69.64 },
  hydrogel: { min: 0, max: 2 },
  rainfall: { min: 0.04, max: 12 },
};

export const MODEL_METRICS: ModelMetric[] = [
  { target: "root", model: "Mean baseline", r2: -0.016166, r2Sd: 0.018466, mae: 1.670556, maeSd: 0.083742, rmse: 2.067617, rmseSd: 0.092429 },
  { target: "root", model: "Linear regression", r2: 0.868634, r2Sd: 0.0141, mae: 0.591719, maeSd: 0.029084, rmse: 0.741149, rmseSd: 0.029432 },
  { target: "root", model: "Linear + interactions", r2: 0.87284, r2Sd: 0.015119, mae: 0.58445, maeSd: 0.029553, rmse: 0.728719, rmseSd: 0.028576 },
  { target: "root", model: "Random Forest", r2: 0.847005, r2Sd: 0.020957, mae: 0.638168, maeSd: 0.03726, rmse: 0.798936, rmseSd: 0.043237 },
  { target: "root", model: "Gradient Boosting", r2: 0.856683, r2Sd: 0.019848, mae: 0.614183, maeSd: 0.035125, rmse: 0.772955, rmseSd: 0.038525 },
  { target: "gene", model: "Mean baseline", r2: -0.010427, r2Sd: 0.013322, mae: 0.652822, maeSd: 0.026334, rmse: 0.790132, rmseSd: 0.030764 },
  { target: "gene", model: "Linear regression", r2: 0.80669, r2Sd: 0.020961, mae: 0.276156, maeSd: 0.014214, rmse: 0.344681, rmseSd: 0.016626 },
  { target: "gene", model: "Linear + interactions", r2: 0.836892, r2Sd: 0.018669, mae: 0.25184, maeSd: 0.009831, rmse: 0.316421, rmseSd: 0.013392 },
  { target: "gene", model: "Random Forest", r2: 0.810132, r2Sd: 0.016139, mae: 0.270798, maeSd: 0.011238, rmse: 0.341912, rmseSd: 0.013806 },
  { target: "gene", model: "Gradient Boosting", r2: 0.815333, r2Sd: 0.017925, mae: 0.27, maeSd: 0.00994, rmse: 0.336953, rmseSd: 0.012087 },
];

export const CORRELATIONS = [
  { pair: "Soil rigidity / root growth", r: -0.75994 },
  { pair: "Rainfall / root growth", r: 0.63749 },
  { pair: "Hydrogel / root growth", r: 0.58478 },
  { pair: "Hydrogel / gene proxy", r: -0.54927 },
  { pair: "Rigidity / gene proxy", r: 0.7374 },
];


export const PERMUTATION_IMPORTANCE = [
  { feature: "Soil rigidity", root: 0.6789, rootSd: 0.0504, gene: 0.4123, geneSd: 0.0333 },
  { feature: "Hydrogel concentration", root: 0.5547, rootSd: 0.0462, gene: 0.4812, geneSd: 0.0375 },
  { feature: "Daily rainfall", root: 0.0740, rootSd: 0.0097, gene: 0.2566, geneSd: 0.0279 },
];

export const SENSITIVITY = [
  { feature: "Hydrogel concentration", swing: 3.46, p10: 0, p90: 2 },
  { feature: "Soil rigidity", swing: -2.731, p10: 23.06, p90: 56.176 },
  { feature: "Daily rainfall", swing: 1.387, p10: 1.099, p90: 7.774 },
];

export const EXTRAPOLATION_STRESS_TEST = [
  { model: "Linear", r2: 0.7619, mae: 0.6028, bias: 0.0762 },
  { model: "Linear + interactions", r2: 0.783, mae: 0.5732, bias: -0.1113 },
  { model: "Random Forest", r2: 0.4852, mae: 0.8898, bias: 0.6521 },
  { model: "Gradient Boosting", r2: 0.5598, mae: 0.8167, bias: 0.56 },
];

export const INTERVAL_CALIBRATION = {
  nominalCoverage: 0.9,
  empiricalCoverage: 0.908,
  halfWidth: 1.2718804401649857,
  testRows: 250,
  calibrationRows: 250,
  trainingRows: 500,
};

export const RESIDUAL_STANDARD_DEVIATIONS = {
  root: 0.7341856607593917,
  geneProxy: 0.31032585049384276,
};

/**
 * Coefficients exported from the selected degree-2 PolynomialFeatures +
 * LinearRegression pipelines. Feature order matches sklearn:
 * x1, x2, x3, x1², x1*x2, x1*x3, x2², x2*x3, x3².
 *
 * Regenerate this file whenever train_models.py is rerun and model artifacts change.
 */
const ROOT_INTERCEPT = 9.122305664449915;
const ROOT_COEFFICIENTS = [
  -0.05275565394965698,
  1.1365852070847475,
  0.38534156075401127,
  -0.0004320399589350931,
  0.013410369797752284,
  -0.002522368215853523,
  0.04619317074281653,
  -0.013400299366833531,
  -0.006882092140193531,
];

const GENE_INTERCEPT = 1.8870479729127678;
const GENE_COEFFICIENTS = [
  0.03565391459808561,
  -0.3725767501069611,
  -0.21882329581595197,
  0.000009138821714271496,
  -0.00723360724288129,
  -0.0004664438679533268,
  0.01851478393771132,
  0.0022251099154086897,
  0.013080242168558628,
];

function polynomialFeatures(rigidity: number, hydrogel: number, rainfall: number): number[] {
  return [
    rigidity,
    hydrogel,
    rainfall,
    rigidity * rigidity,
    rigidity * hydrogel,
    rigidity * rainfall,
    hydrogel * hydrogel,
    hydrogel * rainfall,
    rainfall * rainfall,
  ];
}

function linearPrediction(intercept: number, coefficients: number[], values: number[]): number {
  return intercept + coefficients.reduce((sum, coefficient, index) => sum + coefficient * values[index], 0);
}

/**
 * Local browser inference mirrors the current saved sklearn pipelines, keeping
 * the Netlify app functional without requiring a separately hosted Python API.
 * These remain predictions of formula-generated data—not real crop measurements.
 */
export function predictSyntheticScenario(scenario: ResearchScenario): ResearchPrediction {
  const { rigidity, hydrogel, rainfall } = scenario;
  const features = polynomialFeatures(rigidity, hydrogel, rainfall);
  const rootRaw = linearPrediction(ROOT_INTERCEPT, ROOT_COEFFICIENTS, features);
  const geneRaw = linearPrediction(GENE_INTERCEPT, GENE_COEFFICIENTS, features);
  const root = Math.min(14, Math.max(0.2, rootRaw));
  const geneProxy = Math.min(8, Math.max(0.25, geneRaw));
  const outOfRangeFeatures: string[] = [];

  if (rigidity < OBSERVED_RANGES.rigidity.min || rigidity > OBSERVED_RANGES.rigidity.max) {
    outOfRangeFeatures.push("Soil rigidity");
  }
  if (hydrogel < OBSERVED_RANGES.hydrogel.min || hydrogel > OBSERVED_RANGES.hydrogel.max) {
    outOfRangeFeatures.push("Hydrogel concentration");
  }
  if (rainfall < OBSERVED_RANGES.rainfall.min || rainfall > OBSERVED_RANGES.rainfall.max) {
    outOfRangeFeatures.push("Daily rainfall");
  }

  let warningBand: ResearchPrediction["warningBand"] = "HIGH (simulated scale)";
  if (geneProxy < 2) warningBand = "LOW (simulated scale)";
  else if (geneProxy < 3.5) warningBand = "MODERATE (simulated scale)";

  return {
    rootRaw,
    geneRaw,
    root,
    geneProxy,
    rootWasBounded: root !== rootRaw,
    geneWasBounded: geneProxy !== geneRaw,
    inObservedTrainingRange: outOfRangeFeatures.length === 0,
    outOfRangeFeatures,
    warningBand,
  };
}
