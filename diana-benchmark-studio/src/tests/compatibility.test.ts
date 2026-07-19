import { describe, expect, it } from "vitest";
import { customDefaultSpec } from "../catalog/hormonbench-v1";
import { lintTaskSpec } from "../linter/scientific-linter";
describe("task component compatibility", () => {
  it("requires one classification target", () => { const value = structuredClone(customDefaultSpec); value.task.type = "binary_classification"; value.data.target_columns = ["a", "b"]; expect(lintTaskSpec(value).blocking.map((item) => item.id)).toContain("classification-target-count"); });
  it("allows all three registered regression models", () => { const value = structuredClone(customDefaultSpec); value.models = [{ id: "dummy_median", parameters: {} }, { id: "ridge", parameters: { alpha: 10 } }, { id: "random_forest_regressor", parameters: { n_estimators: 40 } }]; expect(lintTaskSpec(value).blocking.filter((item) => item.stage === "models")).toHaveLength(0); });
  it("requires a group for participant-macro scoring", () => { const value = structuredClone(customDefaultSpec); value.data.group_column = null; expect(lintTaskSpec(value).blocking.map((item) => item.id)).toContain("macro-group"); });
});
