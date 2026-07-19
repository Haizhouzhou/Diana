import { parseTaskSpec, type TaskSpec } from "../contracts/task-spec";

const MODEL_ORDER = ["dummy_median", "ridge", "random_forest_regressor", "dummy_prior", "logistic_regression", "random_forest_classifier"];
const stableCompare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;

export type NormalizedTaskSpec = TaskSpec;

export function normalizeTaskSpec(input: unknown): NormalizedTaskSpec {
  const spec = structuredClone(parseTaskSpec(input));
  spec.project.name = spec.project.name.trim().replace(/\s+/g, " ");
  spec.project.slug = spec.project.slug.toLowerCase();
  spec.data.numeric_features.sort(stableCompare);
  spec.data.categorical_features.sort(stableCompare);
  spec.data.target_columns.sort(stableCompare);
  spec.preprocessing.lags = [...new Set(spec.preprocessing.lags)].sort((a, b) => a - b);
  spec.preprocessing.rolling_windows = [...new Set(spec.preprocessing.rolling_windows)].sort((a, b) => a - b);
  spec.models.sort((a, b) => MODEL_ORDER.indexOf(a.id) - MODEL_ORDER.indexOf(b.id));
  spec.metrics.secondary = [...new Set(spec.metrics.secondary)].sort(stableCompare);
  spec.metrics.weights = Object.fromEntries(Object.entries(spec.metrics.weights).sort(([a], [b]) => stableCompare(a, b)));
  return parseTaskSpec(spec);
}
