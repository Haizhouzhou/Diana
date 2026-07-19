import type { ModelId } from "../contracts/task-spec";

export const MODEL_CATALOG: Record<ModelId, { label: string; family: "regression" | "classification"; defaults: Record<string, number | boolean | string> }> = {
  dummy_median: { label: "Dummy median", family: "regression", defaults: {} },
  ridge: { label: "Ridge", family: "regression", defaults: { alpha: 10 } },
  random_forest_regressor: { label: "Random Forest Regressor", family: "regression", defaults: { n_estimators: 120, max_depth: 8 } },
  dummy_prior: { label: "Dummy prior", family: "classification", defaults: { strategy: "prior" } },
  logistic_regression: { label: "Logistic Regression", family: "classification", defaults: { C: 1, max_iter: 500 } },
  random_forest_classifier: { label: "Random Forest Classifier", family: "classification", defaults: { n_estimators: 120, max_depth: 8 } },
};
