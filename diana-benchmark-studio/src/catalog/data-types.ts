import type { TaskSpec } from "../contracts/task-spec";

export const DATA_FORMAT_CATALOG: ReadonlyArray<{ value: TaskSpec["data"]["format"]; label: string }> = [
  { value: "csv", label: "CSV" },
  { value: "parquet", label: "Parquet" },
];

export const DATA_LAYOUT_CATALOG: ReadonlyArray<{ value: TaskSpec["data"]["layout"]; label: string }> = [
  { value: "static", label: "Static tabular" },
  { value: "grouped", label: "Grouped / participant" },
  { value: "longitudinal", label: "Longitudinal" },
];
