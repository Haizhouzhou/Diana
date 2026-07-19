import type { TaskSpec } from "../contracts/task-spec";

export const HORMONBENCH_PROVENANCE = {
  task_id: "hormonbench_mcphases_interval2_nextday_v1",
  task_version: "1.0.0",
  source_commit: "7d7f0010e852994f658f68753d8556c7636875ce",
  training_code_commit: "67006276d25a1198a9ebf3cfa271c1d2372ebf1b",
  task_spec_hash: "1783561d82980e55ff0a3fa3cb026a2598afcc4f6eec1a6c456d117e70d6c6e5",
  fold_hash: "f4c350c291c060638324c96b694f3af0a811180ba2f182883d5f4746ca37dbf1",
  input_schema_hash: "30b91bb7085bfc2e2efb29824f48f18bc2171b8157a34f4ee080172dad520a82",
  results_inventory_hash: "f563e8fbf0c7543e50bb63fcf6ca1b901f43b5614ca2acf3ed5f4cd1785302fd",
  runner_sha256: "fa3f6204a3d747f230fc2b02ab3ac7b0136e6c522cfebc4982c8f4629f20994d",
  runner_path: "scripts/run_diana_h3p_v1.py",
  participants: 20,
  origins: 1509,
  common_suffix_origins: 1369,
  folds: 5,
  budgets: [0, 3, 7],
  baselines: ["population_median", "wearable_ridge", "catboost"],
  reference_model: "diana_h3p",
} as const;

export const HORMONBENCH_RESULTS = {
  cold_start: [
    { model: "population_median", score: 0.636527 },
    { model: "diana_h3p", score: 0.644181 },
    { model: "catboost", score: 0.651631 },
    { model: "wearable_ridge", score: 0.824231 },
  ],
  few_shot: [
    { budget: 0, leader: "population_median", leaderScore: 0.633978, h3pScore: 0.64225 },
    { budget: 3, leader: "population_median", leaderScore: 0.610852, h3pScore: 0.616188 },
    { budget: 7, leader: "catboost", leaderScore: 0.607195, h3pScore: 0.608918 },
  ],
  intervalCoverage: { min: 0.781, max: 0.796 },
} as const;

export const hormonbenchPreset: TaskSpec = {
  schema_version: 1,
  mode: "hormonbench_preset",
  validation_level: "implementation_validated_preset",
  project: { name: "Hormonbench mcPHASES v1", slug: "hormonbench-mcphases-v1", task_id: HORMONBENCH_PROVENANCE.task_id },
  data: {
    format: "csv", layout: "longitudinal", path: "data/input.csv",
    numeric_features: ["active_minutes", "computed_temperature_end_day", "hrv_daily_aggregate", "respiratory_rate_summary", "sleep_score", "weekend_state"],
    categorical_features: [], target_columns: ["lh", "e3g", "pdg"], id_column: null,
    group_column: "participant_id", time_column: "origin_day", target_provenance: "measured",
    feature_metadata: Object.fromEntries(["active_minutes", "computed_temperature_end_day", "hrv_daily_aggregate", "respiratory_rate_summary", "sleep_score", "weekend_state"].map((feature) => [feature, { availability: "at_or_before_origin" as const, provenance: "derived" as const, derives_from_target: false }])),
    target_measurement_context: "urinary_monitor", target_derived_predictors: false,
  },
  task: { type: "longitudinal_next_step_regression", history_window: 14, forecast_horizon: 1, targets_nonnegative: true },
  split: { type: "group_disjoint_holdout", validation_fraction: 0.2, test_fraction: 0.2, seed: 20260719 },
  preprocessing: { numeric_imputation: "model_specific", scaling: "model_specific", categorical_imputation: "not_applicable", one_hot_encoding: false, lags: [0, 1, 3, 6, 13], rolling_windows: [] },
  models: [
    { id: "population_median", parameters: { participant_equal: true } },
    { id: "wearable_ridge", parameters: { alpha: 25 } },
    { id: "catboost", parameters: { iterations: 250, validation_iterations: 250, depth: 5, learning_rate: 0.04, l2_leaf_reg: 5, early_stopping_rounds: 40, loss_function: "RMSE", eval_metric: "MAE", thread_count: 4 } },
  ],
  metrics: { primary: "normalized_log1p_mae", secondary: ["group_macro_mae", "rmse"], weights: { lh: 1 / 3, e3g: 1 / 3, pdg: 1 / 3 } },
  runtime: { seed: 20260719, workers: 1, execution_mode: "local_data" },
  output: { directory: "results", save_predictions: false, aggregate_only: true },
  official: {
    task_id: HORMONBENCH_PROVENANCE.task_id, task_version: HORMONBENCH_PROVENANCE.task_version,
    source_commit: HORMONBENCH_PROVENANCE.source_commit, training_code_commit: HORMONBENCH_PROVENANCE.training_code_commit, task_spec_hash: HORMONBENCH_PROVENANCE.task_spec_hash,
    fold_hash: HORMONBENCH_PROVENANCE.fold_hash, input_schema_hash: HORMONBENCH_PROVENANCE.input_schema_hash,
    results_inventory_hash: HORMONBENCH_PROVENANCE.results_inventory_hash, runner_sha256: HORMONBENCH_PROVENANCE.runner_sha256,
    runner_path: HORMONBENCH_PROVENANCE.runner_path, run_mode: "preflight", repo_env: "DIANA_REPO_ROOT", data_env: "MCPHASES_DATA_ROOT",
    baseline_ids: ["population_median", "wearable_ridge", "catboost"], reference_model: "diana_h3p",
    eligible_participants: 20, eligible_origins: 1509, common_suffix_origins: 1369, calibration_budgets: [0, 3, 7],
    feature_summaries: ["last", "mean", "std", "min", "max", "slope", "coverage", "time_since", "missing_current"],
  },
};

export const customDefaultSpec: TaskSpec = {
  ...hormonbenchPreset,
  mode: "custom",
  validation_level: "scientifically_linted_draft",
  project: { name: "Example benchmark", slug: "example-benchmark", task_id: "example_benchmark" },
  data: {
    format: "csv", layout: "longitudinal", path: "data/input.csv", numeric_features: ["signal_a", "signal_b"],
    categorical_features: ["site"], target_columns: ["target"], id_column: "row_id", group_column: "participant_id", time_column: "timestamp",
    feature_metadata: {
      signal_a: { availability: "at_or_before_origin", provenance: "measured", derives_from_target: false },
      signal_b: { availability: "at_or_before_origin", provenance: "measured", derives_from_target: false },
      site: { availability: "at_or_before_origin", provenance: "measured", derives_from_target: false },
    },
    target_provenance: "measured", target_measurement_context: "other", target_derived_predictors: false,
  },
  task: { type: "longitudinal_next_step_regression", history_window: 14, forecast_horizon: 1, targets_nonnegative: true },
  split: { type: "group_disjoint_holdout", validation_fraction: 0.2, test_fraction: 0.2, seed: 42 },
  preprocessing: { numeric_imputation: "median", scaling: "standard", categorical_imputation: "most_frequent", one_hot_encoding: true, lags: [1, 3, 7], rolling_windows: [3, 7] },
  models: [{ id: "dummy_median", parameters: {} }, { id: "ridge", parameters: { alpha: 10 } }],
  metrics: { primary: "group_macro_mae", secondary: ["mae", "rmse"], weights: { target: 1 } },
  runtime: { seed: 42, workers: 1, execution_mode: "synthetic" },
  output: { directory: "results", save_predictions: false, aggregate_only: true },
  official: undefined,
};

export function forkHormonbench(): TaskSpec {
  return {
    ...structuredClone(hormonbenchPreset), mode: "custom", validation_level: "scientifically_linted_draft",
    project: { name: "Hormonbench research fork", slug: "hormonbench-research-fork", task_id: "hormonbench_research_fork_v1" },
    preprocessing: { numeric_imputation: "median", scaling: "standard", categorical_imputation: "most_frequent", one_hot_encoding: true, lags: [1, 3, 6, 13], rolling_windows: [14] },
    models: [{ id: "dummy_median", parameters: {} }, { id: "ridge", parameters: { alpha: 25 } }, { id: "random_forest_regressor", parameters: { n_estimators: 120, max_depth: 8 } }],
    official: undefined,
  } as TaskSpec;
}
