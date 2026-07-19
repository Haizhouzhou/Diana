import { z } from "zod";

const COLUMN = /^[A-Za-z_][A-Za-z0-9_. -]{0,63}$/;
const SLUG = /^(?!con$|prn$|aux$|nul$|com[1-9]$|lpt[1-9]$)[a-z0-9]+(?:-[a-z0-9]+)*$/i;
const TASK_ID = /^[a-z][a-z0-9_]{2,79}$/;
const SAFE_OUTPUT = /^(?!.*(?:^|\/)(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\/|$))[a-z0-9][a-z0-9_-]*(?:\/[a-z0-9][a-z0-9_-]*)?$/i;

export const dataFormats = ["csv", "parquet"] as const;
export const dataLayouts = ["static", "grouped", "longitudinal"] as const;
export const taskTypes = [
  "single_target_regression",
  "multi_target_regression",
  "binary_classification",
  "multiclass_classification",
  "longitudinal_next_step_regression",
] as const;
export const splitTypes = ["random_holdout", "group_disjoint_holdout", "temporal_holdout"] as const;
export const regressionModels = ["dummy_median", "ridge", "random_forest_regressor"] as const;
export const classificationModels = ["dummy_prior", "logistic_regression", "random_forest_classifier"] as const;
export const customModelIds = [...regressionModels, ...classificationModels] as const;
export const officialModelIds = ["population_median", "wearable_ridge", "catboost"] as const;
export const regressionMetrics = ["mae", "rmse", "pearson_r", "group_macro_mae", "normalized_log1p_mae"] as const;
export const classificationMetrics = ["accuracy", "balanced_accuracy", "macro_f1", "binary_roc_auc", "group_macro_f1"] as const;

const columnName = z.string().trim().min(1).max(64).regex(COLUMN, "Use a plain column name without paths or controls");
const uniqueColumns = (minimum = 0) => z.array(columnName).min(minimum).max(64).superRefine((items, ctx) => {
  if (new Set(items.map((item) => item.toLowerCase())).size !== items.length) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Column names must be unique" });
});

const featureMetadata = z.object({
  availability: z.enum(["at_or_before_origin", "after_origin", "unknown"]),
  provenance: z.enum(["measured", "derived", "unknown"]),
  derives_from_target: z.boolean(),
}).strict();

const modelSchema = z.object({
  id: z.enum([...customModelIds, ...officialModelIds]),
  parameters: z.record(z.union([z.number().finite(), z.boolean(), z.string().max(40)])).default({}),
}).strict();

const officialSchema = z.object({
  task_id: z.literal("hormonbench_mcphases_interval2_nextday_v1"),
  task_version: z.literal("1.0.0"),
  source_commit: z.string().regex(/^[a-f0-9]{40}$/),
  training_code_commit: z.string().regex(/^[a-f0-9]{40}$/),
  task_spec_hash: z.string().regex(/^[a-f0-9]{64}$/),
  fold_hash: z.string().regex(/^[a-f0-9]{64}$/),
  input_schema_hash: z.string().regex(/^[a-f0-9]{64}$/),
  results_inventory_hash: z.string().regex(/^[a-f0-9]{64}$/),
  runner_sha256: z.string().regex(/^[a-f0-9]{64}$/),
  runner_path: z.literal("scripts/run_diana_h3p_v1.py"),
  run_mode: z.enum(["preflight", "synthetic", "full"]),
  repo_env: z.literal("DIANA_REPO_ROOT"),
  data_env: z.literal("MCPHASES_DATA_ROOT"),
  baseline_ids: z.tuple([z.literal("population_median"), z.literal("wearable_ridge"), z.literal("catboost")]),
  reference_model: z.literal("diana_h3p"),
  eligible_participants: z.literal(20),
  eligible_origins: z.literal(1509),
  common_suffix_origins: z.literal(1369),
  calibration_budgets: z.tuple([z.literal(0), z.literal(3), z.literal(7)]),
  feature_summaries: z.tuple([
    z.literal("last"), z.literal("mean"), z.literal("std"), z.literal("min"), z.literal("max"),
    z.literal("slope"), z.literal("coverage"), z.literal("time_since"), z.literal("missing_current"),
  ]),
}).strict();

const baseSchema = z.object({
  schema_version: z.literal(1),
  project: z.object({
    name: z.string().trim().min(1).max(80).refine((value) => !/[<>[\]()#*`\\]/u.test(value) && !Array.from(value).some((character) => { const code = character.charCodeAt(0); return code < 32 || code === 127; }), "Remove controls, markup, path, or template characters"),
    slug: z.string().min(1).max(48).regex(SLUG, "Use a safe lowercase hyphenated slug"),
    task_id: z.string().min(3).max(80).regex(TASK_ID, "Use a lowercase underscore task identifier"),
  }).strict(),
  data: z.object({
    format: z.enum(dataFormats),
    layout: z.enum(dataLayouts),
    path: z.enum(["data/input.csv", "data/input.parquet"]),
    numeric_features: uniqueColumns(),
    categorical_features: uniqueColumns(),
    target_columns: uniqueColumns(1).refine((items) => items.length <= 8, "At most eight targets are supported"),
    id_column: columnName.nullable(),
    group_column: columnName.nullable(),
    time_column: columnName.nullable(),
    feature_metadata: z.record(featureMetadata),
    target_provenance: z.enum(["measured", "derived", "weak", "clinical"]),
    target_measurement_context: z.enum(["urinary_monitor", "serum", "other", "unknown"]),
    target_derived_predictors: z.boolean(),
  }).strict(),
  task: z.object({
    type: z.enum(taskTypes),
    history_window: z.number().int().min(1).max(365),
    forecast_horizon: z.number().int().min(1).max(90),
    targets_nonnegative: z.boolean(),
  }).strict(),
  split: z.object({
    type: z.enum(splitTypes),
    validation_fraction: z.number().min(0.05).max(0.4),
    test_fraction: z.number().min(0.05).max(0.4),
    seed: z.number().int().min(0).max(2_147_483_647),
  }).strict(),
  preprocessing: z.object({
    numeric_imputation: z.enum(["median", "model_specific"]),
    scaling: z.enum(["standard", "robust", "none", "model_specific"]),
    categorical_imputation: z.enum(["most_frequent", "not_applicable"]),
    one_hot_encoding: z.boolean(),
    lags: z.array(z.number().int().min(0).max(365)).max(12),
    rolling_windows: z.array(z.number().int().min(2).max(365)).max(12),
  }).strict(),
  models: z.array(modelSchema).min(1).max(3),
  metrics: z.object({
    primary: z.enum([...regressionMetrics, ...classificationMetrics]),
    secondary: z.array(z.enum([...regressionMetrics, ...classificationMetrics])).max(8),
    weights: z.record(z.number().finite().min(0).max(1)),
  }).strict(),
  runtime: z.object({
    seed: z.number().int().min(0).max(2_147_483_647),
    workers: z.number().int().min(1).max(32),
    execution_mode: z.enum(["synthetic", "local_data"]),
  }).strict(),
  output: z.object({
    directory: z.string().min(1).max(64).regex(SAFE_OUTPUT, "Use a safe relative output directory with at most two segments"),
    save_predictions: z.boolean(),
    aggregate_only: z.boolean(),
  }).strict(),
}).strict();

const customSchema = baseSchema.extend({
  mode: z.literal("custom"),
  validation_level: z.literal("scientifically_linted_draft"),
  official: z.undefined().optional(),
}).strict();

const presetSchema = baseSchema.extend({
  mode: z.literal("hormonbench_preset"),
  validation_level: z.literal("implementation_validated_preset"),
  official: officialSchema,
}).strict();

export const taskSpecSchema = z.discriminatedUnion("mode", [customSchema, presetSchema]).superRefine((spec, ctx) => {
  const features = [...spec.data.numeric_features, ...spec.data.categorical_features];
  const roles = [...features, ...spec.data.target_columns, spec.data.id_column, spec.data.group_column, spec.data.time_column]
    .filter((value): value is string => Boolean(value)).map((value) => value.toLowerCase());
  if (new Set(roles).size !== roles.length) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["data"], message: "A column may have only one role" });
  if (!features.length) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["data"], message: "At least one feature column is required" });
  const metadataKeys = Object.keys(spec.data.feature_metadata).sort();
  const featureKeys = [...features].sort();
  if (JSON.stringify(metadataKeys) !== JSON.stringify(featureKeys)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["data", "feature_metadata"], message: "Feature metadata must describe every configured feature exactly once" });
  if (spec.split.validation_fraction + spec.split.test_fraction >= 0.8) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["split"], message: "Leave at least 20% for training" });
  const modelIds = spec.models.map((model) => model.id);
  if (new Set(modelIds).size !== modelIds.length) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["models"], message: "Select each model once" });
  if (spec.mode === "custom" && modelIds.some((id) => !(customModelIds as readonly string[]).includes(id))) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["models"], message: "Official Hormonbench models are unavailable in custom programs" });
  if (spec.mode === "hormonbench_preset" && JSON.stringify(modelIds) !== JSON.stringify(officialModelIds)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["models"], message: "Official Hormonbench baseline identities are frozen" });
  if (spec.mode === "custom" && (spec.preprocessing.numeric_imputation !== "median" || spec.preprocessing.categorical_imputation !== "most_frequent" || spec.preprocessing.scaling === "model_specific")) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["preprocessing"], message: "Custom preprocessing must use supported executable options" });
  if (spec.mode === "custom" && spec.data.categorical_features.length && !spec.preprocessing.one_hot_encoding) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["preprocessing", "one_hot_encoding"], message: "Categorical custom programs require the supported one-hot encoder" });
  const parameterRules: Record<string, Record<string, (value: unknown) => boolean>> = {
    dummy_median: {}, dummy_prior: { strategy: (value) => value === "prior" || value === "most_frequent" },
    ridge: { alpha: (value) => typeof value === "number" && value > 0 && value <= 1_000_000 },
    logistic_regression: { C: (value) => typeof value === "number" && value > 0 && value <= 1_000_000, max_iter: (value) => typeof value === "number" && Number.isInteger(value) && value >= 100 && value <= 5_000 },
    random_forest_regressor: { n_estimators: (value) => typeof value === "number" && Number.isInteger(value) && value >= 10 && value <= 1_000, max_depth: (value) => typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 100 },
    random_forest_classifier: { n_estimators: (value) => typeof value === "number" && Number.isInteger(value) && value >= 10 && value <= 1_000, max_depth: (value) => typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 100 },
    population_median: { participant_equal: (value) => value === true },
    wearable_ridge: { alpha: (value) => typeof value === "number" && value === 25 },
    catboost: {
      iterations: (value) => value === 250, validation_iterations: (value) => value === 250, depth: (value) => value === 5,
      learning_rate: (value) => value === 0.04, l2_leaf_reg: (value) => value === 5, early_stopping_rounds: (value) => value === 40,
      loss_function: (value) => value === "RMSE", eval_metric: (value) => value === "MAE", thread_count: (value) => value === 4,
    },
  };
  spec.models.forEach((model, modelIndex) => {
    const rules = parameterRules[model.id];
    Object.entries(model.parameters).forEach(([key, value]) => {
      if (!rules[key] || !rules[key](value)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["models", modelIndex, "parameters", key], message: `Invalid or unsupported ${model.id} parameter` });
    });
  });
  const metrics = [spec.metrics.primary, ...spec.metrics.secondary];
  if (new Set(metrics).size !== metrics.length) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["metrics"], message: "Primary and secondary metrics must be unique" });
});

export type TaskSpec = z.infer<typeof taskSpecSchema>;
export type CustomTaskSpec = Extract<TaskSpec, { mode: "custom" }>;
export type TaskType = TaskSpec["task"]["type"];
export type ModelId = typeof customModelIds[number];
export type MetricId = TaskSpec["metrics"]["primary"];
export type FeatureMetadata = z.infer<typeof featureMetadata>;

export function isClassification(type: TaskType): boolean { return type === "binary_classification" || type === "multiclass_classification"; }
export function parseTaskSpec(input: unknown): TaskSpec { return taskSpecSchema.parse(input); }
