import { isClassification, type TaskSpec } from "../contracts/task-spec";
import { METRIC_CATALOG } from "../catalog/metrics";
import { MODEL_CATALOG } from "../catalog/models";

export type IssueSeverity = "blocking" | "warning" | "passed";
export interface LintIssue {
  id: string;
  severity: IssueSeverity;
  field: string;
  title: string;
  reason: string;
  action: string;
  stage: "data" | "task" | "split" | "preprocessing" | "models" | "metrics" | "review";
}
export interface LintResult {
  blocking: LintIssue[];
  warnings: LintIssue[];
  passed: LintIssue[];
  canGenerate: boolean;
}

const issue = (severity: IssueSeverity, id: string, stage: LintIssue["stage"], field: string, title: string, reason: string, action: string): LintIssue => ({ severity, id, stage, field, title, reason, action });

export function lintTaskSpec(spec: TaskSpec): LintResult {
  const items: LintIssue[] = [];
  const classification = isClassification(spec.task.type);
  const expectedFamily = classification ? "classification" : "regression";
  const groupNeeded = spec.data.layout !== "static" || spec.split.type === "group_disjoint_holdout" || spec.metrics.primary.startsWith("group_macro") || spec.metrics.secondary.some((m) => m.startsWith("group_macro"));
  const temporal = spec.task.type === "longitudinal_next_step_regression";

  if ([...spec.data.numeric_features, ...spec.data.categorical_features].some((column) => spec.data.target_columns.includes(column))) {
    items.push(issue("blocking", "target-as-feature", "data", "data.target_columns", "Target leakage", "A target column is also configured as an input feature.", "Remove every target from the numeric and categorical feature lists."));
  } else items.push(issue("passed", "roles-separated", "data", "data.target_columns", "Column roles are separated", "Targets are not ordinary predictors.", "Keep explicit roles when importing a new schema."));

  const futureDomainPatterns = ["completed_cycle", "cycle_percentage", "future_", "mira_phase", "fertile_window"];
  const suspiciousDomainFeatures = [...spec.data.numeric_features, ...spec.data.categorical_features].filter((column) => futureDomainPatterns.some((pattern) => column.toLowerCase().includes(pattern)));
  if (suspiciousDomainFeatures.length) items.push(issue("blocking", "future-domain-feature", "data", "data.numeric_features", "Future or target-derived hormonal feature", `Potentially noncausal fields were selected: ${suspiciousDomainFeatures.join(", ")}.`, "Remove completed-cycle, future event, Mira phase, fertile-window, and target-derived fields from predictors."));

  if (groupNeeded && !spec.data.group_column) items.push(issue("blocking", "missing-group", "data", "data.group_column", "Group field required", "This layout, split, or participant-macro metric needs a grouping unit.", "Select a participant/group column."));
  else if (spec.data.group_column) items.push(issue("passed", "group-excluded", "data", "data.group_column", "Group identifier excluded", "The generated pipeline uses it only for splitting and macro metrics.", "Keep it outside ordinary predictors."));

  if (temporal && !spec.data.time_column) items.push(issue("blocking", "missing-time", "data", "data.time_column", "Time field required", "Next-step construction requires an ordered within-group time field.", "Select a time column with unique non-null group-time keys."));
  if (temporal && spec.data.layout !== "longitudinal") items.push(issue("blocking", "layout-task", "task", "data.layout", "Longitudinal layout required", "Next-step targets are defined over group-sorted observations.", "Set data structure to longitudinal tabular."));
  if (spec.data.layout !== "static" && spec.split.type === "random_holdout") items.push(issue("blocking", "random-row-leakage", "split", "split.type", "Participant leakage across rows", "Random-row splitting can place the same participant or group in train and test.", "Use a group-disjoint split so every participant remains in exactly one partition, or a target-time-ordered temporal split for an explicitly seen-group track."));
  else if (temporal) items.push(issue("passed", "causal-split", "split", "split.type", "Longitudinal split is explicit", "The generated assertions enforce either zero group overlap or target-time order.", "Retain this split contract."));

  if (spec.split.type === "group_disjoint_holdout" && !spec.data.group_column) items.push(issue("blocking", "group-split-field", "split", "split.type", "Group-disjoint split is incomplete", "A group split cannot verify zero overlap without a group field.", "Select the participant/group column."));
  if (spec.split.type === "temporal_holdout" && !spec.data.time_column) items.push(issue("blocking", "temporal-split-field", "split", "split.type", "Temporal split is incomplete", "Target-time ordering requires a time column.", "Select the time column."));

  if (classification && spec.data.target_columns.length !== 1) items.push(issue("blocking", "classification-target-count", "task", "data.target_columns", "Classification requires one target", "The supported classifiers produce one categorical outcome.", "Keep exactly one classification target."));
  if (spec.task.type === "single_target_regression" && spec.data.target_columns.length !== 1) items.push(issue("blocking", "single-target-count", "task", "data.target_columns", "Single-target regression requires one target", "Multiple targets conflict with the selected task.", "Keep one target or choose multi-target regression."));
  if (spec.task.type === "multi_target_regression" && spec.data.target_columns.length < 2) items.push(issue("blocking", "multi-target-count", "task", "data.target_columns", "Multi-target regression requires two or more targets", "The task currently has fewer than two targets.", "Add targets or choose single-target regression."));

  if (spec.mode === "custom" && spec.models.some((model) => MODEL_CATALOG[model.id as keyof typeof MODEL_CATALOG].family !== expectedFamily)) items.push(issue("blocking", "model-family", "models", "models", "Model/task mismatch", "At least one selected model belongs to the wrong prediction family.", `Select only ${expectedFamily} models.`));
  else items.push(issue("passed", "model-compatible", "models", "models", "Models match the task", "Every selected estimator supports this outcome family.", "Keep model parameters within the typed ranges."));

  const allMetrics = [spec.metrics.primary, ...spec.metrics.secondary];
  if (allMetrics.some((metric) => METRIC_CATALOG[metric].family !== expectedFamily)) items.push(issue("blocking", "metric-family", "metrics", "metrics.primary", "Metric/task mismatch", "A configured metric does not support this outcome family.", `Select only ${expectedFamily} metrics.`));
  if (allMetrics.includes("binary_roc_auc") && spec.task.type !== "binary_classification") items.push(issue("blocking", "roc-compatibility", "metrics", "metrics.secondary", "ROC-AUC requires binary classification", "Multiclass or regression scores are not represented by this contract.", "Remove ROC-AUC or choose binary classification."));
  if (allMetrics.some((metric) => metric.startsWith("group_macro")) && !spec.data.group_column) items.push(issue("blocking", "macro-group", "metrics", "metrics.primary", "Group-macro metric needs a group", "Macro averaging needs a participant/group key.", "Select a group column or a non-group metric."));
  if (allMetrics.includes("normalized_log1p_mae") && !spec.task.targets_nonnegative) items.push(issue("blocking", "log1p-negative", "metrics", "task.targets_nonnegative", "Log1p metric requires nonnegative targets", "The transform is undefined for values below -1 and its interpretation assumes nonnegative outcomes.", "Assert nonnegative targets or choose another metric."));

  const targetWeights = Object.values(spec.metrics.weights);
  const weightSum = targetWeights.reduce((sum, value) => sum + value, 0);
  const weightKeysMatch = Object.keys(spec.metrics.weights).length === spec.data.target_columns.length && spec.data.target_columns.every((target) => Object.hasOwn(spec.metrics.weights, target));
  if (!weightKeysMatch || Math.abs(weightSum - 1) > 1e-8) items.push(issue("blocking", "metric-weights", "metrics", "metrics.weights", "Target weights must sum to one", "Multi-target aggregation must give each target an explicit normalized weight.", "Assign one nonnegative weight per target and make the total exactly 1."));
  else items.push(issue("passed", "weights-normalized", "metrics", "metrics.weights", "Target weights normalized", "Aggregate scoring uses explicit target weights.", "Review weights when target roles change."));

  if (spec.data.target_derived_predictors) items.push(issue("blocking", "target-derived-predictor", "data", "data.target_derived_predictors", "Target-derived predictor risk", "A derived phase/event could encode the target pattern it is meant to predict.", "Remove target-derived labels from predictors or redefine the task transparently."));
  const featureMetadata = Object.entries(spec.data.feature_metadata);
  const unavailable = featureMetadata.filter(([, metadata]) => metadata.availability !== "at_or_before_origin").map(([column]) => column);
  const derivedFromTarget = featureMetadata.filter(([, metadata]) => metadata.derives_from_target).map(([column]) => column);
  if (unavailable.length) items.push(issue("blocking", "feature-availability", "data", "data.feature_metadata", "Feature availability is not causal", `Availability is after-origin or unknown for: ${unavailable.join(", ")}.`, "Declare and use only features known at or before the forecast origin."));
  else items.push(issue("passed", "feature-availability-declared", "data", "data.feature_metadata", "Feature availability declared", "Every feature is explicitly available by the forecast origin.", "Keep availability metadata synchronized with feature roles."));
  if (derivedFromTarget.length) items.push(issue("blocking", "feature-target-derivation", "data", "data.feature_metadata", "Target-derived feature", `Target-derived predictors were declared: ${derivedFromTarget.join(", ")}.`, "Remove target-derived features from the ordinary predictor matrix."));
  if (spec.data.target_provenance === "weak") items.push(issue("warning", "weak-label", "data", "data.target_provenance", "Weak label provenance", "App-generated or heuristic labels are not independent clinical ground truth.", "Describe the generating process and limit claims to weak-label prediction."));
  if (spec.data.target_measurement_context === "urinary_monitor") items.push(issue("warning", "urinary-semantics", "data", "data.target_measurement_context", "Urinary measurement semantics", "Consumer urinary readings are not serum concentrations or clinical gold standards.", "Use urinary-monitor language in task cards and claims."));
  if (temporal && spec.data.target_measurement_context === "urinary_monitor" && spec.split.type !== "group_disjoint_holdout") items.push(issue("warning", "participant-independent-recommendation", "split", "split.type", "Participant-independent evaluation recommended", "Seen-participant forward-time evaluation answers a different and less stringent question for longitudinal hormonal data.", "Prefer group-disjoint evaluation for cold-start claims, or label the temporal track as seen-participant."));
  if (spec.data.target_provenance === "clinical") items.push(issue("warning", "clinical-claims", "review", "data.target_provenance", "Clinical provenance needs external governance", "A field marked clinical does not make this generated benchmark clinically validated.", "Document cohort, acquisition, intended use, and independent validation separately."));

  const outOfWindowLags = spec.preprocessing.lags.filter((lag) => lag >= spec.task.history_window);
  const outOfWindowRolls = spec.preprocessing.rolling_windows.filter((window) => window > spec.task.history_window);
  if (temporal && (outOfWindowLags.length || outOfWindowRolls.length)) items.push(issue("blocking", "history-transform-bound", "preprocessing", "preprocessing.lags", "Causal transform exceeds history", "A lag or rolling window reaches beyond the declared history window.", "Use lags below history_window and rolling windows no larger than history_window."));
  if (!temporal && (spec.preprocessing.lags.length || spec.preprocessing.rolling_windows.length)) items.push(issue("blocking", "irrelevant-causal-transforms", "preprocessing", "preprocessing.lags", "Causal transforms require next-step longitudinal data", "Static and grouped non-next-step programs do not execute lag or rolling transformations.", "Clear lags and rolling windows, or choose longitudinal next-step regression."));
  if (temporal && !outOfWindowLags.length && !outOfWindowRolls.length && (spec.preprocessing.lags.length || spec.preprocessing.rolling_windows.length)) items.push(issue("passed", "causal-transforms", "preprocessing", "preprocessing.lags", "Causal transforms are bounded", "Generated lags and rolling windows shift within group and stop before the target.", "Use the mutation tests before applying to real data."));
  items.push(issue("passed", "train-only-preprocessing", "preprocessing", "preprocessing", "Train-only preprocessing", "Imputation, scaling, encoding, and train target scales are fit inside each model pipeline using training rows only.", "Do not pre-transform the full dataset."));
  if (spec.output.save_predictions) items.push(issue("warning", "private-predictions", "review", "output.save_predictions", "Row predictions are private", "Predictions can contain participant-level information.", "Keep the output local, governed, and excluded from public release."));
  if (spec.mode === "custom") items.push(issue("warning", "validation-level", "review", "validation_level", "Draft validation level", "Scientific linting verifies program contracts, not empirical or clinical validity.", "Run the generated synthetic gates, then document licensed-data validation separately."));
  if (spec.mode === "hormonbench_preset") items.push(issue("passed", "personalization-common-cohort", "review", "official.calibration_budgets", "Personalization cohorts are aligned", "The frozen K=0/3/7 protocol uses the same 1,369-origin scoring suffix.", "Keep calibration rows outside scoring and preserve the common suffix."));

  const blocking = items.filter((item) => item.severity === "blocking");
  return { blocking, warnings: items.filter((item) => item.severity === "warning"), passed: items.filter((item) => item.severity === "passed"), canGenerate: blocking.length === 0 };
}
