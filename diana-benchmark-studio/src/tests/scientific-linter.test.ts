import { describe, expect, it } from "vitest";
import { customDefaultSpec } from "../catalog/hormonbench-v1";
import { lintTaskSpec } from "../linter/scientific-linter";
describe("scientific linter", () => {
  it("passes the safe longitudinal default", () => { expect(lintTaskSpec(customDefaultSpec).blocking).toHaveLength(0); });
  it("blocks random-row longitudinal participant leakage", () => { const value = structuredClone(customDefaultSpec); value.split.type = "random_holdout"; const result = lintTaskSpec(value); expect(result.blocking.map((issue) => issue.id)).toContain("random-row-leakage"); expect(result.blocking.find((issue) => issue.id === "random-row-leakage")?.action).toMatch(/group-disjoint/); });
  it("blocks absent group/time fields", () => { const value = structuredClone(customDefaultSpec); value.data.group_column = null; value.data.time_column = null; expect(lintTaskSpec(value).blocking.map((issue) => issue.id)).toEqual(expect.arrayContaining(["missing-group", "missing-time"])); });
  it("blocks incompatible models and metrics", () => { const value = structuredClone(customDefaultSpec); value.models = [{ id: "logistic_regression", parameters: {} }]; value.metrics.primary = "accuracy"; expect(lintTaskSpec(value).blocking.map((issue) => issue.id)).toEqual(expect.arrayContaining(["model-family", "metric-family"])); });
  it("blocks invalid log1p semantics", () => { const value = structuredClone(customDefaultSpec); value.metrics.primary = "normalized_log1p_mae"; value.task.targets_nonnegative = false; expect(lintTaskSpec(value).blocking.map((issue) => issue.id)).toContain("log1p-negative"); });
  it("warns on weak and urinary labels", () => { const value = structuredClone(customDefaultSpec); value.data.target_provenance = "weak"; value.data.target_measurement_context = "urinary_monitor"; expect(lintTaskSpec(value).warnings.map((issue) => issue.id)).toEqual(expect.arrayContaining(["weak-label", "urinary-semantics"])); });
  it("blocks future or target-derived hormonal fields", () => { const value = structuredClone(customDefaultSpec); value.data.numeric_features.push("completed_cycle_length"); expect(lintTaskSpec(value).blocking.map((issue) => issue.id)).toContain("future-domain-feature"); });
  it("requires weights for the exact targets", () => { const value = structuredClone(customDefaultSpec); value.metrics.weights = { wrong_target: 1 }; expect(lintTaskSpec(value).blocking.map((issue) => issue.id)).toContain("metric-weights"); });
});
