import type { MetricId } from "../contracts/task-spec";

export const METRIC_CATALOG: Record<MetricId, { label: string; family: "regression" | "classification"; lowerIsBetter: boolean }> = {
  mae: { label: "MAE", family: "regression", lowerIsBetter: true },
  rmse: { label: "RMSE", family: "regression", lowerIsBetter: true },
  pearson_r: { label: "Pearson R", family: "regression", lowerIsBetter: false },
  group_macro_mae: { label: "Group-macro MAE", family: "regression", lowerIsBetter: true },
  normalized_log1p_mae: { label: "Normalized log1p-MAE", family: "regression", lowerIsBetter: true },
  accuracy: { label: "Accuracy", family: "classification", lowerIsBetter: false },
  balanced_accuracy: { label: "Balanced accuracy", family: "classification", lowerIsBetter: false },
  macro_f1: { label: "Macro F1", family: "classification", lowerIsBetter: false },
  binary_roc_auc: { label: "Binary ROC-AUC", family: "classification", lowerIsBetter: false },
  group_macro_f1: { label: "Group-macro F1", family: "classification", lowerIsBetter: false },
};
