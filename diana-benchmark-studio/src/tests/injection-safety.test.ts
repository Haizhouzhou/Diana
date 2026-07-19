import { describe, expect, it } from "vitest";
import { customDefaultSpec } from "../catalog/hormonbench-v1";
import { parseTaskSpec } from "../contracts/task-spec";
import { notebookBytes } from "../generator/notebook";
const payloads = ["../escape", "..\\escape", "C:\\Windows\\x", "$(touch pwned)", "x; rm -rf /", "<script>alert(1)</script>", "x\u0000y", "x\nprint('pwn')", "__import__('os')"];
describe("generation safety", () => {
  it.each(payloads)("rejects unsafe column payload %j", (payload) => { const value = structuredClone(customDefaultSpec); value.data.numeric_features = [payload]; expect(() => parseTaskSpec(value)).toThrow(); });
  it("keeps a safe Unicode project name out of Python source", async () => { const value = structuredClone(customDefaultSpec); value.project.name = "Causal study — cohort α"; const text = new TextDecoder().decode(await notebookBytes(value)); const codeSources = JSON.parse(text).cells.filter((cell: any) => cell.cell_type === "code").map((cell: any) => cell.source).join("\n"); expect(codeSources).not.toContain(value.project.name); expect(codeSources).toContain("base64.b64decode"); });
});
