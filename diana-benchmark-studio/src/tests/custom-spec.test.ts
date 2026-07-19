import { describe, expect, it } from "vitest";
import { customDefaultSpec } from "../catalog/hormonbench-v1";
import { parseTaskSpec } from "../contracts/task-spec";
import { normalizeTaskSpec } from "../generator/normalize";
import { parseImportedConfig } from "../generator/import-config";
describe("TaskSpec contract", () => {
  it("parses the versioned custom contract", () => { expect(parseTaskSpec(customDefaultSpec).schema_version).toBe(1); });
  it("rejects unknown keys", () => { expect(() => parseTaskSpec({ ...customDefaultSpec, surprise: true })).toThrow(); });
  it("rejects duplicate roles", () => { const value = structuredClone(customDefaultSpec); value.data.target_columns = [value.data.numeric_features[0]]; expect(() => parseTaskSpec(value)).toThrow(/one role/); });
  it("normalizes unordered scientific sets", () => { const value = structuredClone(customDefaultSpec); value.preprocessing.lags = [7, 1, 3, 1]; expect(normalizeTaskSpec(value).preprocessing.lags).toEqual([1, 3, 7]); });
  it("keeps targets out of feature lists", () => { const value = normalizeTaskSpec(customDefaultSpec); expect(value.data.numeric_features).not.toContain(value.data.target_columns[0]); expect(value.data.categorical_features).not.toContain(value.data.target_columns[0]); });
  it("rejects unsupported or out-of-range model parameters", () => { const value = structuredClone(customDefaultSpec); value.models[1].parameters = { alpha: -1, arbitrary_code: "print(1)" }; expect(() => parseTaskSpec(value)).toThrow(/unsupported ridge parameter|Invalid/); });
  it("rejects YAML anchors and executable tags", () => {
    expect(() => parseImportedConfig("schema_version: &v 1\nmode: *v", "yaml")).toThrow(/aliases/);
    expect(() => parseImportedConfig("value: !!js/function 'x'", "yaml")).toThrow(/tags/);
  });
  it("round-trips an exported custom JSON configuration", () => { expect(parseImportedConfig(`${JSON.stringify(customDefaultSpec)}\n`, "json")).toEqual(customDefaultSpec); });
});
