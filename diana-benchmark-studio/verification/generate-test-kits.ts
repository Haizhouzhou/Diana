import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { customDefaultSpec } from "../src/catalog/hormonbench-v1";
import type { MetricId, ModelId, TaskSpec } from "../src/contracts/task-spec";
import { notebookBytes } from "../src/generator/notebook";

const ROOT = join(process.cwd(), "verification", ".generated");
const model = (id: ModelId, parameters: Record<string, number | string | boolean> = {}) => ({ id, parameters });
const base = (): TaskSpec => structuredClone(customDefaultSpec);

const cases: Record<string, TaskSpec> = {};
{
  const spec = base(); spec.project = { task_id: "csv_single_regression_v1", name: "CSV single regression", slug: "csv-single-regression" }; spec.data.layout = "static"; spec.data.group_column = null; spec.data.time_column = null; spec.data.id_column = "row_id"; spec.data.categorical_features = ["site"]; spec.task.type = "single_target_regression"; spec.split.type = "random_holdout"; spec.preprocessing.lags = []; spec.preprocessing.rolling_windows = []; spec.models = [model("dummy_median"), model("ridge", { alpha: 10 }), model("random_forest_regressor", { n_estimators: 32, max_depth: 6 })]; spec.metrics = { primary: "mae", secondary: ["rmse", "pearson_r", "normalized_log1p_mae"], weights: { target: 1 } }; cases.csv_single_regression = spec;
}
{
  const spec = base(); spec.project = { task_id: "csv_multi_regression_v1", name: "CSV multi target regression", slug: "csv-multi-regression" }; spec.data.layout = "static"; spec.data.group_column = null; spec.data.time_column = null; spec.data.target_columns = ["target_a", "target_b"]; spec.task.type = "multi_target_regression"; spec.split.type = "random_holdout"; spec.preprocessing.scaling = "robust"; spec.preprocessing.lags = []; spec.preprocessing.rolling_windows = []; spec.models = [model("dummy_median"), model("ridge", { alpha: 5 }), model("random_forest_regressor", { n_estimators: 24, max_depth: 5 })]; spec.metrics = { primary: "rmse", secondary: ["mae", "normalized_log1p_mae"], weights: { target_a: .5, target_b: .5 } }; cases.csv_multi_regression = spec;
}
{
  const spec = base(); spec.project = { task_id: "parquet_grouped_regression_v1", name: "Parquet grouped regression", slug: "parquet-grouped-regression" }; spec.data.format = "parquet"; spec.data.path = "data/input.parquet"; spec.data.layout = "grouped"; spec.data.time_column = null; spec.task.type = "single_target_regression"; spec.split.type = "group_disjoint_holdout"; spec.preprocessing.scaling = "none"; spec.preprocessing.lags = []; spec.preprocessing.rolling_windows = []; spec.models = [model("ridge", { alpha: 8 })]; spec.metrics = { primary: "group_macro_mae", secondary: ["mae"], weights: { target: 1 } }; cases.parquet_grouped_regression = spec;
}
{
  const spec = base(); spec.project = { task_id: "csv_binary_classification_v1", name: "CSV binary classification", slug: "csv-binary-classification" }; spec.data.layout = "grouped"; spec.data.time_column = null; spec.data.target_columns = ["class_label"]; spec.task.type = "binary_classification"; spec.split.type = "group_disjoint_holdout"; spec.preprocessing.lags = []; spec.preprocessing.rolling_windows = []; spec.models = [model("dummy_prior", { strategy: "prior" }), model("logistic_regression", { C: 1, max_iter: 500 }), model("random_forest_classifier", { n_estimators: 32, max_depth: 6 })]; spec.metrics = { primary: "balanced_accuracy", secondary: ["accuracy", "macro_f1", "binary_roc_auc", "group_macro_f1"], weights: { class_label: 1 } }; cases.csv_binary_classification = spec;
}
{
  const spec = base(); spec.project = { task_id: "csv_multiclass_classification_v1", name: "CSV multiclass classification", slug: "csv-multiclass-classification" }; spec.data.layout = "static"; spec.data.group_column = null; spec.data.time_column = null; spec.data.target_columns = ["class_label"]; spec.task.type = "multiclass_classification"; spec.split.type = "random_holdout"; spec.preprocessing.lags = []; spec.preprocessing.rolling_windows = []; spec.models = [model("dummy_prior", { strategy: "prior" }), model("logistic_regression", { C: 1, max_iter: 500 }), model("random_forest_classifier", { n_estimators: 24, max_depth: 5 })]; spec.metrics = { primary: "macro_f1", secondary: ["accuracy", "balanced_accuracy"], weights: { class_label: 1 } }; cases.csv_multiclass_classification = spec;
}
{
  const spec = base(); spec.project = { task_id: "csv_longitudinal_temporal_v1", name: "CSV longitudinal temporal", slug: "csv-longitudinal-temporal" }; spec.split.type = "temporal_holdout"; spec.models = [model("dummy_median"), model("ridge", { alpha: 10 })]; spec.metrics = { primary: "group_macro_mae", secondary: ["mae", "rmse"], weights: { target: 1 } }; cases.csv_longitudinal_temporal = spec;
}
{
  const spec = base(); spec.project = { task_id: "csv_longitudinal_group_v1", name: "CSV longitudinal group", slug: "csv-longitudinal-group" }; spec.split.type = "group_disjoint_holdout"; spec.models = [model("ridge", { alpha: 10 })]; spec.metrics = { primary: "normalized_log1p_mae", secondary: ["group_macro_mae"], weights: { target: 1 } }; cases.csv_longitudinal_group = spec;
}

await rm(ROOT, { recursive: true, force: true }); await mkdir(ROOT, { recursive: true });
for (const [name, spec] of Object.entries(cases)) {
  const directory = join(ROOT, name); await mkdir(directory, { recursive: true });
  await writeFile(join(directory, "benchmark.ipynb"), await notebookBytes(spec));
  await writeFile(join(directory, "expected.json"), `${JSON.stringify({ name, spec, metrics: [spec.metrics.primary, ...spec.metrics.secondary] as MetricId[] }, null, 2)}\n`);
}
console.log(JSON.stringify({ generated: Object.keys(cases), root: ROOT }));
