import type { TaskSpec } from "../contracts/task-spec";

export const SPLITTER_CATALOG: ReadonlyArray<{ value: TaskSpec["split"]["type"]; label: string }> = [
  { value: "random_holdout", label: "Random holdout" },
  { value: "group_disjoint_holdout", label: "Group-disjoint" },
  { value: "temporal_holdout", label: "Temporal holdout" },
];
