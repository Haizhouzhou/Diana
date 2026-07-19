import type { TaskType } from "../contracts/task-spec";

export const TASK_TYPE_CATALOG: ReadonlyArray<{ value: TaskType; label: string }> = [
  { value: "single_target_regression", label: "Single regression" },
  { value: "multi_target_regression", label: "Multi regression" },
  { value: "binary_classification", label: "Binary class" },
  { value: "multiclass_classification", label: "Multiclass" },
  { value: "longitudinal_next_step_regression", label: "Next-step" },
];
