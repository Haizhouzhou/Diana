import type { TaskSpec } from "../contracts/task-spec";

export const SCALER_CATALOG: ReadonlyArray<{ value: TaskSpec["preprocessing"]["scaling"]; label: string }> = [
  { value: "standard", label: "Standard" },
  { value: "robust", label: "Robust" },
  { value: "none", label: "None" },
];

export const FIXED_PREPROCESSORS = Object.freeze({
  numeric_imputation: "median",
  categorical_imputation: "most_frequent",
  categorical_encoding: "one_hot",
});
