import type { TaskSpec } from "../contracts/task-spec";

const csvEscape = (value: string | number): string => {
  const text = String(value); return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export function generateSyntheticCsv(spec: TaskSpec): string {
  const headers = [...new Set([
    spec.data.id_column, spec.data.group_column, spec.data.time_column,
    ...spec.data.numeric_features, ...spec.data.categorical_features, ...spec.data.target_columns,
  ].filter((value): value is string => Boolean(value)))];
  const rows: (string | number)[][] = [];
  for (let group = 0; group < 8; group += 1) for (let step = 0; step < 12; step += 1) {
    const record: Record<string, string | number> = {};
    if (spec.data.id_column) record[spec.data.id_column] = `synthetic-${group}-${step}`;
    if (spec.data.group_column) record[spec.data.group_column] = `synthetic-group-${group}`;
    if (spec.data.time_column) record[spec.data.time_column] = `2024-01-${String(step + 1).padStart(2, "0")}`;
    spec.data.numeric_features.forEach((column, index) => { record[column] = Number((group * .2 + step * .1 + index).toFixed(4)); });
    spec.data.categorical_features.forEach((column) => { record[column] = ["site-a", "site-b", "site-c"][(group + step) % 3]; });
    spec.data.target_columns.forEach((column, index) => {
      record[column] = spec.task.type === "binary_classification" ? ((group + step) % 2) : spec.task.type === "multiclass_classification" ? ["low", "mid", "high"][(group + step) % 3] : Number((1 + group * .1 + step * .12 + index * .3).toFixed(4));
    });
    rows.push(headers.map((header) => record[header]));
  }
  return `${headers.map(csvEscape).join(",")}\n${rows.map((row) => row.map(csvEscape).join(",")).join("\n")}\n`;
}
